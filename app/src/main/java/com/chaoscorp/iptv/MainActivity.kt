package com.chaoscorp.iptv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

private val Background = Color(0xFF070A12)
private val Panel = Color(0xFF111827)
private val Accent = Color(0xFF64D9E8)
private val Muted = Color(0xFFA5B0C3)
private val FocusPanel = Color(0xFF203746)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(
                primary = Accent,
                background = Background,
                surface = Panel,
                onBackground = Color.White,
                onSurface = Color.White
            )) { ChaosCorpApp() }
        }
    }
}

private enum class AppSection(val label: String, val subtitle: String) {
    LIVE("TV en vivo", "Canales y programación"),
    MOVIES("Películas", "Parrilla viva de películas"),
    SERIES("Series", "Series, temporadas y episodios"),
    SETTINGS("Ajustes", "Cuenta, reproducción y privacidad")
}

@Composable
private fun ChaosCorpApp() {
    var section by rememberSaveable { mutableStateOf<AppSection?>(null) }
    var showConnection by rememberSaveable { mutableStateOf(false) }
    var server by rememberSaveable { mutableStateOf("") }
    var username by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var connecting by rememberSaveable { mutableStateOf(false) }
    var notice by rememberSaveable { mutableStateOf("Todavía no hay una cuenta conectada.") }
    var accountConnected by rememberSaveable { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().background(Background).padding(horizontal = 42.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("CHAOS CORP", color = Accent, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text("IPTV", color = Muted, fontSize = 12.sp)
            }
            Button(
                onClick = { showConnection = true; section = null },
                colors = ButtonDefaults.buttonColors(containerColor = Panel)
            ) { Text(if (accountConnected) "Administrar cuenta" else "Agregar cuenta") }
        }

        when {
            showConnection -> ConnectionPanel(
                server = server,
                onServerChange = { server = it },
                username = username,
                onUsernameChange = { username = it },
                password = password,
                onPasswordChange = { password = it },
                notice = notice,
                connecting = connecting,
                onConnect = {
                    if (server.isBlank() || username.isBlank() || password.isBlank()) {
                        notice = "Completa servidor, usuario y contraseña."
                    } else if (!connecting) {
                        connecting = true
                        notice = "Conectando con el proveedor..."
                        coroutineScope.launch {
                            when (val result = XtreamClient(server, username, password).authenticate()) {
                                is XtreamAuthResult.Success -> {
                                    accountConnected = true
                                    notice = "Conexión verificada. La carga del catálogo aún está pendiente."
                                    password = ""
                                }
                                is XtreamAuthResult.Failure -> notice = result.message
                            }
                            connecting = false
                        }
                    }
                },
                onCancel = { showConnection = false }
            )
            section == null -> HomePanel(
                accountConnected = accountConnected,
                onOpenSection = { section = it },
                onAddAccount = { showConnection = true }
            )
            else -> SectionPanel(
                section = section!!,
                accountConnected = accountConnected,
                onBack = { section = null },
                onConnect = { showConnection = true; section = null }
            )
        }
    }
}

@Composable
private fun HomePanel(
    accountConnected: Boolean,
    onOpenSection: (AppSection) -> Unit,
    onAddAccount: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Spacer(Modifier.height(10.dp))
        Text("Todo tu entretenimiento", fontSize = 34.sp, fontWeight = FontWeight.Bold)
        Text(
            if (accountConnected) "Cuenta verificada. La integración del catálogo continúa en desarrollo."
            else "Conecta tu cuenta Xtream para acceder a tu contenido.",
            color = Muted,
            fontSize = 17.sp
        )
        Row(
            modifier = Modifier.fillMaxWidth().weight(1f),
            horizontalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            AppSection.entries.take(2).forEach { item ->
                SectionTile(item, Modifier.weight(1f).fillMaxHeight()) { onOpenSection(item) }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().weight(1f),
            horizontalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            AppSection.entries.drop(2).forEach { item ->
                SectionTile(item, Modifier.weight(1f).fillMaxHeight()) { onOpenSection(item) }
            }
        }
        Text("Diseñada para control remoto · Sin programación ni catálogos ficticios", color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun SectionTile(item: AppSection, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        color = Panel,
        shape = RoundedCornerShape(18.dp),
        tonalElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(item.label, fontSize = 26.sp, fontWeight = FontWeight.SemiBold)
            Text(item.subtitle, color = Muted, fontSize = 15.sp)
        }
    }
}

@Composable
private fun SectionPanel(
    section: AppSection,
    accountConnected: Boolean,
    onBack: () -> Unit,
    onConnect: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(section.label, fontSize = 30.sp, fontWeight = FontWeight.Bold)
            Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Panel)) {
                Text("Volver")
            }
        }
        when (section) {
            AppSection.LIVE -> EmptySection(
                title = "TV en vivo",
                detail = "Aquí aparecerán los canales y la guía de programación real del proveedor.",
                accountConnected = accountConnected,
                onConnect = onConnect
            )
            AppSection.MOVIES -> EmptySection(
                title = "Parrilla viva",
                detail = "La parrilla mostrará portadas reales en 4–5 filas visibles. Cada fila se moverá como una sola franja; la portada seleccionada resaltará con el mando.",
                accountConnected = accountConnected,
                onConnect = onConnect
            )
            AppSection.SERIES -> EmptySection(
                title = "Parrilla de series",
                detail = "Las portadas reales abrirán fichas con temporadas y episodios disponibles en la cuenta.",
                accountConnected = accountConnected,
                onConnect = onConnect
            )
            AppSection.SETTINGS -> EmptySection(
                title = "Ajustes y privacidad",
                detail = "Aquí se configurarán las cuentas, las opciones de reproducción y las preferencias de privacidad.",
                accountConnected = accountConnected,
                onConnect = onConnect
            )
        }
    }
}

@Composable
private fun EmptySection(
    title: String,
    detail: String,
    accountConnected: Boolean,
    onConnect: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Panel,
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(
            modifier = Modifier.padding(28.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(title, fontSize = 23.sp, fontWeight = FontWeight.SemiBold)
            Text(detail, color = Muted, fontSize = 16.sp)
            Text(
                if (accountConnected) "La conexión se verificó, pero el catálogo aún no está integrado."
                else "No hay una cuenta conectada. No se mostrarán datos de demostración.",
                color = Accent,
                fontSize = 14.sp
            )
            if (!accountConnected) {
                Button(onClick = onConnect) { Text("Agregar cuenta Xtream") }
            }
        }
    }
}

@Composable
private fun ConnectionPanel(
    server: String,
    onServerChange: (String) -> Unit,
    username: String,
    onUsernameChange: (String) -> Unit,
    password: String,
    onPasswordChange: (String) -> Unit,
    notice: String,
    connecting: Boolean,
    onConnect: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(top = 4.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Cuenta Xtream Codes", fontSize = 29.sp, fontWeight = FontWeight.Bold)
        Text("Introduce los datos proporcionados por tu servicio IPTV.", color = Muted, fontSize = 15.sp)
        OutlinedTextField(
            value = server, onValueChange = onServerChange, label = { Text("Servidor (URL)") },
            singleLine = true, modifier = Modifier.fillMaxWidth(0.72f)
        )
        OutlinedTextField(
            value = username, onValueChange = onUsernameChange, label = { Text("Usuario") },
            singleLine = true, modifier = Modifier.fillMaxWidth(0.72f)
        )
        OutlinedTextField(
            value = password, onValueChange = onPasswordChange, label = { Text("Contraseña") },
            singleLine = true, visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(0.72f)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onConnect, enabled = !connecting, modifier = Modifier.height(50.dp)) {
                Text(if (connecting) "Conectando..." else "Verificar cuenta")
            }
            Button(
                onClick = onCancel,
                modifier = Modifier.height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Panel)
            ) { Text("Cancelar") }
        }
        Text(notice, color = if (notice.startsWith("Conexión verificada")) Accent else Muted, fontSize = 14.sp)
        Text("La autenticación está implementada; la carga de catálogo y la reproducción siguen pendientes.", color = Muted, fontSize = 12.sp)
    }
}
