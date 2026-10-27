package com.chaoscorp.iptv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

private val Background = Color(0xFF070A12)
private val Panel = Color(0xFF101625)
private val Accent = Color(0xFF54D8E8)
private val Muted = Color(0xFF9AA7BD)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(
                primary = Accent, background = Background, surface = Panel,
                onBackground = Color.White, onSurface = Color.White
            )) { ChaosCorpApp() }
        }
    }
}

private enum class AppSection(val label: String) {
    HOME("Inicio"), LIVE("TV en vivo"), MOVIES("Películas"),
    SERIES("Series"), SETTINGS("Ajustes")
}

@Composable
private fun ChaosCorpApp() {
    var section by rememberSaveable { mutableStateOf(AppSection.HOME) }
    var showConnection by rememberSaveable { mutableStateOf(false) }
    var server by rememberSaveable { mutableStateOf("") }
    var username by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var connecting by rememberSaveable { mutableStateOf(false) }
    var notice by rememberSaveable { mutableStateOf("Agrega una cuenta Xtream Codes para comenzar.") }
    val coroutineScope = rememberCoroutineScope()

    Row(
        modifier = Modifier.fillMaxSize().background(Background).padding(22.dp),
        horizontalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        Column(
            modifier = Modifier.width(190.dp).fillMaxHeight()
                .background(Panel, RoundedCornerShape(18.dp)).padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("CHAOS CORP", color = Accent, fontSize = 20.sp, fontWeight = FontWeight.Black)
            Text("IPTV", color = Muted, fontSize = 12.sp)
            Spacer(Modifier.height(12.dp))
            AppSection.entries.forEach { item ->
                Button(
                    onClick = { section = item; showConnection = false },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (section == item) Color(0xFF203344) else Panel,
                        contentColor = if (section == item) Accent else Color.White
                    )
                ) { Text(item.label, fontSize = 14.sp) }
            }
            Spacer(Modifier.weight(1f))
            Text("Versión 0.1.0 · Base nativa", color = Muted, fontSize = 11.sp)
        }

        Column(
            modifier = Modifier.weight(1f).fillMaxHeight(),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            when {
                showConnection -> ConnectionPanel(
                    server, { server = it }, username, { username = it },
                    password, { password = it }, notice,
                    onConnect = {
                        if (server.isBlank() || username.isBlank() || password.isBlank()) {
                            notice = "Completa servidor, usuario y contraseña."
                        } else if (!connecting) {
                            connecting = true
                            notice = "Conectando con el proveedor..."
                            coroutineScope.launch {
                                when (val result = XtreamClient(server, username, password).authenticate()) {
                                    is XtreamAuthResult.Success -> {
                                        notice = "Conexión correcta. Cuenta: ${result.account.username} · Estado: ${result.account.status ?: "sin estado informado"}."
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
                section == AppSection.HOME -> HomePanel(
                    onAddAccount = { showConnection = true },
                    onOpenSection = { section = it }
                )
                section == AppSection.LIVE -> FeaturePanel(
                    "Televisión en vivo",
                    "Lista de canales, reproductor lateral y guía EPG real.",
                    "Conecta una cuenta para cargar canales. No se muestran canales ni horarios de demostración."
                )
                section == AppSection.MOVIES -> FeaturePanel(
                    "Películas", "Tendedero horizontal de portadas, filtros y fichas de contenido.",
                    "Las portadas aparecerán al cargar el catálogo real de la cuenta."
                )
                section == AppSection.SERIES -> FeaturePanel(
                    "Series", "Hileras horizontales, temporadas y episodios.",
                    "Las series aparecerán al cargar el catálogo real de la cuenta."
                )
                else -> FeaturePanel(
                    "Ajustes", "Cuentas, reproducción, guía EPG y configuración.",
                    "Las opciones se habilitarán conforme se implementen sus funciones."
                )
            }
        }
    }
}

@Composable
private fun HomePanel(onAddAccount: () -> Unit, onOpenSection: (AppSection) -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(start = 10.dp, top = 10.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("Tu entretenimiento, en un solo lugar", fontSize = 30.sp, fontWeight = FontWeight.Bold)
        Text("Conecta tu proveedor para cargar canales, películas y series.", color = Muted, fontSize = 17.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Button(onClick = onAddAccount, modifier = Modifier.height(54.dp)) {
                Text("Agregar cuenta Xtream", fontSize = 16.sp)
            }
            Button(
                onClick = { onOpenSection(AppSection.SETTINGS) }, modifier = Modifier.height(54.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Panel)
            ) { Text("Configurar aplicación") }
        }
        Text("Explorar", color = Accent, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            items(listOf(AppSection.LIVE, AppSection.MOVIES, AppSection.SERIES)) { item ->
                Surface(
                    onClick = { onOpenSection(item) },
                    modifier = Modifier.width(220.dp).height(112.dp),
                    color = Panel, shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
                        Text(item.label, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("Requiere cuenta conectada", color = Muted, fontSize = 12.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(4.dp))
        Text("Estado: todavía no hay ninguna cuenta conectada.", color = Muted, fontSize = 14.sp)
    }
}

@Composable
private fun ConnectionPanel(
    server: String, onServerChange: (String) -> Unit,
    username: String, onUsernameChange: (String) -> Unit,
    password: String, onPasswordChange: (String) -> Unit,
    notice: String, onConnect: () -> Unit, onCancel: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(start = 10.dp, top = 4.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Agregar cuenta Xtream Codes", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("Introduce los datos proporcionados por tu servicio IPTV.", color = Muted, fontSize = 15.sp)
        OutlinedTextField(
            value = server, onValueChange = onServerChange, label = { Text("Servidor (URL)") },
            singleLine = true, modifier = Modifier.fillMaxWidth(0.78f)
        )
        OutlinedTextField(
            value = username, onValueChange = onUsernameChange, label = { Text("Usuario") },
            singleLine = true, modifier = Modifier.fillMaxWidth(0.78f)
        )
        OutlinedTextField(
            value = password, onValueChange = onPasswordChange, label = { Text("Contraseña") },
            singleLine = true, visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(0.78f)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onConnect, modifier = Modifier.height(50.dp)) { Text(if (notice == "Conectando con el proveedor...") "Conectando..." else "Conectar") }
            Button(
                onClick = onCancel, modifier = Modifier.height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Panel)
            ) { Text("Cancelar") }
        }
        Text(notice, color = if (notice.startsWith("Formulario")) Accent else Muted, fontSize = 14.sp)
        Text("El cliente de conexión real se implementará en la siguiente fase.", color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun FeaturePanel(title: String, description: String, detail: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(start = 10.dp, top = 10.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Text(title, fontSize = 30.sp, fontWeight = FontWeight.Bold)
        Text(description, color = Accent, fontSize = 18.sp)
        Surface(color = Panel, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
            Text(detail, modifier = Modifier.padding(22.dp), color = Muted, fontSize = 16.sp)
        }
    }
}
