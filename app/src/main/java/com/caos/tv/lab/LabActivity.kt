package com.caos.tv.lab

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent

/** Pantalla de pruebas de interfaz ("CAOS Lab"). Aparece como un segundo ícono en el TV. */
class LabActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContent { ClotheslineScreen(onBack = { finish() }) }
    }
}
