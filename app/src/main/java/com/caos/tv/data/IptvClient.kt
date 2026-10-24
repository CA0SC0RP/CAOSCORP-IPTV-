package com.caos.tv.data

import android.net.Uri
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLException

/** Descarga y lee cuentas Xtream Codes y listas M3U. Todo es bloqueante: llamar desde IO. */
object IptvClient {

    const val USER_AGENT = "CAOS-TV/0.1 (Android TV)"

    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    private fun request(url: String): Request =
        Request.Builder().url(url).header("User-Agent", USER_AGENT).build()

    private fun getText(url: String): String {
        http.newCall(request(url)).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("El servidor respondió HTTP ${resp.code}")
            return resp.body?.string() ?: throw IOException("El servidor respondió vacío")
        }
    }

    // ---------- Xtream Codes ----------

    fun loadXtream(account: Account): Pair<List<Category>, List<Channel>> {
        val base = normalizeHost(account.host)
        val user = Uri.encode(account.username)
        val pass = Uri.encode(account.password)
        val api = "$base/player_api.php?username=$user&password=$pass"

        val auth = JSONObject(getText(api))
        val info = auth.optJSONObject("user_info")
        if (info == null || info.optInt("auth", 0) != 1) {
            throw IOException("Usuario o contraseña incorrectos")
        }
        val status = info.str("status")
        if (status.isNotEmpty() && !status.equals("Active", ignoreCase = true)) {
            throw IOException("La cuenta no está activa (estado: $status)")
        }

        val categories = ArrayList<Category>()
        val catArr = JSONArray(getText("$api&action=get_live_categories"))
        for (i in 0 until catArr.length()) {
            val o = catArr.optJSONObject(i) ?: continue
            categories += Category(
                id = o.str("category_id"),
                name = o.str("category_name").ifBlank { "Sin nombre" }
            )
        }

        val channels = ArrayList<Channel>()
        val streamArr = JSONArray(getText("$api&action=get_live_streams"))
        for (i in 0 until streamArr.length()) {
            val o = streamArr.optJSONObject(i) ?: continue
            val streamId = o.str("stream_id")
            if (streamId.isEmpty()) continue
            val streamBase = "$base/live/$user/$pass/$streamId"
            channels += Channel(
                id = streamId,
                name = o.str("name").ifBlank { "Canal $streamId" },
                logo = o.str("stream_icon").ifBlank { null },
                categoryId = o.str("category_id"),
                url = "$streamBase.m3u8",
                altUrl = "$streamBase.ts"
            )
        }
        return Pair(categories, channels)
    }

    // ---------- M3U ----------

    fun loadM3u(url: String): Pair<List<Category>, List<Channel>> {
        http.newCall(request(url.trim())).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("El servidor respondió HTTP ${resp.code}")
            val source = resp.body?.source() ?: throw IOException("El servidor respondió vacío")
            return M3uParser.parse(generateSequence { source.readUtf8Line() })
        }
    }

    // ---------- Utilidades ----------

    fun normalizeHost(host: String): String {
        var h = host.trim()
        if (!h.startsWith("http://", ignoreCase = true) && !h.startsWith("https://", ignoreCase = true)) {
            h = "http://$h"
        }
        return h.trimEnd('/')
    }

    private fun JSONObject.str(key: String): String =
        if (isNull(key)) "" else optString(key, "")

    fun friendlyError(e: Throwable): String = when (e) {
        is UnknownHostException -> "No se encontró el servidor. Revisa la dirección y tu conexión a internet."
        is SocketTimeoutException -> "El servidor tardó demasiado en responder."
        is ConnectException -> "No se pudo conectar al servidor. Revisa la dirección y el puerto."
        is SSLException -> "Error de conexión segura (HTTPS) con el servidor."
        is JSONException -> "El servidor respondió algo inesperado. ¿La dirección es correcta?"
        is IOException -> e.message ?: "Error de red."
        else -> e.message ?: e.javaClass.simpleName
    }
}
