package com.chaoscorp.iptv

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

data class XtreamAccountStatus(
    val username: String,
    val status: String?,
    val expirationEpochSeconds: Long?,
    val activeConnections: Int?,
    val maximumConnections: Int?
)

sealed interface XtreamAuthResult {
    data class Success(val account: XtreamAccountStatus) : XtreamAuthResult
    data class Failure(val message: String) : XtreamAuthResult
}

/**
 * Minimal Xtream Codes authentication client.
 *
 * Credentials and request URLs are deliberately never logged. This class does
 * not persist credentials; secure account storage will be implemented separately.
 */
class XtreamClient(
    private val server: String,
    private val username: String,
    private val password: String,
    private val connectTimeoutMs: Int = 10_000,
    private val readTimeoutMs: Int = 15_000
) {
    suspend fun authenticate(): XtreamAuthResult = withContext(Dispatchers.IO) {
        val normalizedBase = normalizeBaseUrl(server)
            ?: return@withContext XtreamAuthResult.Failure(
                "La dirección del servidor no es válida. Usa una URL HTTP o HTTPS."
            )

        try {
            val query = "username=${encode(username)}&password=${encode(password)}"
            val endpoint = URL("$normalizedBase/player_api.php?$query")
            val body = request(endpoint)
            val root = JSONObject(body)
            val userInfo = root.optJSONObject("user_info")
                ?: return@withContext XtreamAuthResult.Failure(
                    "El servidor respondió, pero no devolvió información de la cuenta."
                )

            val authenticated = when (val auth = userInfo.opt("auth")) {
                is Boolean -> auth
                is Number -> auth.toInt() == 1
                is String -> auth == "1" || auth.equals("true", ignoreCase = true)
                else -> false
            }
            if (!authenticated) {
                return@withContext XtreamAuthResult.Failure(
                    "El proveedor no aceptó las credenciales. Revisa servidor, usuario y contraseña."
                )
            }

            val status = userInfo.optString("status").takeIf { it.isNotBlank() }
            if (status != null && !status.equals("Active", ignoreCase = true)) {
                return@withContext XtreamAuthResult.Failure(
                    "La cuenta fue reconocida, pero su estado es: $status."
                )
            }

            XtreamAuthResult.Success(
                XtreamAccountStatus(
                    username = userInfo.optString("username").ifBlank { username },
                    status = status,
                    expirationEpochSeconds = userInfo.optString("exp_date")
                        .toLongOrNull()?.takeIf { it > 0L },
                    activeConnections = userInfo.optString("active_cons").toIntOrNull(),
                    maximumConnections = userInfo.optString("max_connections").toIntOrNull()
                )
            )
        } catch (_: java.net.SocketTimeoutException) {
            XtreamAuthResult.Failure("El servidor tardó demasiado en responder. Inténtalo de nuevo.")
        } catch (_: java.io.IOException) {
            XtreamAuthResult.Failure("No fue posible conectar con el servidor. Revisa la dirección y tu conexión.")
        } catch (_: Exception) {
            XtreamAuthResult.Failure("La respuesta del proveedor no se pudo validar.")
        }
    }

    private fun request(url: URL): String {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "ChaosCorpIPTV/0.1")
        }
        try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(StandardCharsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                throw java.io.IOException("HTTP error")
            }
            return body
        } finally {
            connection.disconnect()
        }
    }

    private fun normalizeBaseUrl(input: String): String? {
        val trimmed = input.trim().trimEnd('/')
        if (trimmed.isBlank()) return null
        return try {
            val url = URL(trimmed)
            if (url.protocol !in setOf("http", "https") || url.host.isBlank()) return null
            if (url.query != null || url.ref != null) return null
            // Xtream servers are normally a base host/port; preserve an explicit path if supplied.
            url.toExternalForm().trimEnd('/')
        } catch (_: Exception) {
            null
        }
    }

    private fun encode(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.name())
}
