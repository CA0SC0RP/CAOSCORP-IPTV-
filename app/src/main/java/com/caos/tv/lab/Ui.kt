package com.caos.tv.lab

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.sin
import kotlin.random.Random

/** Paleta: fondo espacial oscuro (OLED) + neones de dibujo animado. */
object Neon {
    val Space = Color(0xFF05060F)
    val Deep = Color(0xFF0B0E26)
    val Ink = Color(0xFF080A1E)
    val Cyan = Color(0xFF3DF2FF)
    val Magenta = Color(0xFFFF4FD8)
    val Amber = Color(0xFFFFC857)
    val Lime = Color(0xFF9DFF6B)
    val Text = Color(0xFFEFF3FF)
    val TextDim = Color(0xFF9AA6C8)
}

const val TWO_PI = 6.2831855f
const val PI_F = 3.1415927f

/** Texto simple (sin Material). */
@Composable
fun Label(
    text: String,
    modifier: Modifier = Modifier,
    size: TextUnit = 16.sp,
    color: Color = Neon.Text,
    weight: FontWeight = FontWeight.Normal,
    mono: Boolean = false,
    spacing: TextUnit = TextUnit.Unspecified,
    maxLines: Int = Int.MAX_VALUE,
    align: TextAlign = TextAlign.Start,
    lineHeight: TextUnit = TextUnit.Unspecified
) {
    BasicText(
        text = text,
        modifier = modifier,
        style = TextStyle(
            color = color,
            fontSize = size,
            fontWeight = weight,
            fontFamily = if (mono) FontFamily.Monospace else FontFamily.SansSerif,
            letterSpacing = spacing,
            textAlign = align,
            lineHeight = lineHeight
        ),
        maxLines = maxLines,
        overflow = TextOverflow.Ellipsis
    )
}

/** Control remoto: flechas, OK/Enter. Los demás botones se dejan pasar. */
fun Modifier.dpad(
    onLeft: () -> Unit = {},
    onRight: () -> Unit = {},
    onUp: () -> Unit = {},
    onDown: () -> Unit = {},
    onOk: () -> Unit = {}
): Modifier = this.onPreviewKeyEvent { e ->
    if (e.type != KeyEventType.KeyDown) {
        false
    } else {
        when (e.key) {
            Key.DirectionLeft -> { onLeft(); true }
            Key.DirectionRight -> { onRight(); true }
            Key.DirectionUp -> { onUp(); true }
            Key.DirectionDown -> { onDown(); true }
            Key.DirectionCenter, Key.Enter, Key.NumPadEnter -> { onOk(); true }
            else -> false
        }
    }
}

/**
 * Reloj de animación: llama a [onFrame] con los segundos transcurridos desde el
 * cuadro anterior y devuelve un estado que cambia en cada cuadro (leerlo dentro
 * de un Canvas hace que se redibuje sin recomponer).
 */
@Composable
fun rememberClock(onFrame: (dt: Float) -> Unit = {}): State<Long> {
    val clock = remember { mutableStateOf(0L) }
    val callback = rememberUpdatedState(onFrame)
    LaunchedEffect(Unit) {
        var last = 0L
        while (true) {
            androidx.compose.runtime.withFrameNanos { n ->
                val dt = if (last == 0L) 0f else ((n - last) / 1_000_000_000f).coerceAtMost(0.05f)
                last = n
                callback.value(dt)
                clock.value = n
            }
        }
    }
    return clock
}

private class Star(val x: Float, val y: Float, val size: Float, val phase: Float, val depth: Float)

/** Fondo: degradado oscuro, dos nebulosas suaves y estrellas que titilan. */
@Composable
fun SpaceBackdrop(
    clock: State<Long>,
    modifier: Modifier = Modifier,
    shift: Float = 0f,
    shiftProvider: (() -> Float)? = null,
    tintA: Color = Neon.Magenta,
    tintB: Color = Neon.Cyan
) {
    val stars = remember {
        val r = Random(7)
        List(120) {
            Star(r.nextFloat(), r.nextFloat(), 0.5f + r.nextFloat() * 1.3f, r.nextFloat() * TWO_PI, 0.3f + r.nextFloat() * 0.7f)
        }
    }
    Box(
        modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Neon.Space, Neon.Deep, Neon.Space)))
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val t = clock.value / 1_000_000_000f
            val u = size.height / 540f
            val sh = shiftProvider?.invoke() ?: shift
            val a = Offset(size.width * (0.18f + 0.03f * sin(t * 0.2f)), size.height * 0.25f)
            val b = Offset(size.width * (0.85f - 0.03f * sin(t * 0.17f)), size.height * 0.8f)
            drawCircle(
                brush = Brush.radialGradient(listOf(tintA.copy(alpha = 0.16f), Color.Transparent), center = a, radius = size.height * 0.7f),
                radius = size.height * 0.7f,
                center = a
            )
            drawCircle(
                brush = Brush.radialGradient(listOf(tintB.copy(alpha = 0.13f), Color.Transparent), center = b, radius = size.height * 0.75f),
                radius = size.height * 0.75f,
                center = b
            )
            for (s in stars) {
                val x = (((s.x + sh * 0.03f * s.depth) % 1f) + 1f) % 1f * size.width
                val tw = 0.55f + 0.45f * sin(t * (0.8f + s.depth) + s.phase)
                val alpha = (0.2f + 0.7f * s.depth * tw).coerceIn(0f, 1f)
                drawCircle(Color.White.copy(alpha = alpha), radius = s.size * u * (0.5f + s.depth), center = Offset(x, s.y * size.height))
            }
        }
    }
}

/** Ficha de detalle (al dar OK sobre un póster o episodio). */
@Composable
fun DetailOverlay(
    art: ImageBitmap?,
    title: String,
    meta: String,
    synopsis: String,
    accent: Color,
    message: String?
) {
    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xEB040510)),
        contentAlignment = Alignment.Center
    ) {
        Row(
            Modifier.fillMaxWidth(0.8f),
            horizontalArrangement = Arrangement.spacedBy(32.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (art != null) {
                Image(
                    bitmap = art,
                    contentDescription = null,
                    modifier = Modifier
                        .weight(0.36f)
                        .aspectRatio(art.width.toFloat() / art.height.toFloat())
                        .border(3.dp, accent, RoundedCornerShape(12.dp))
                )
            }
            Column(Modifier.weight(0.64f)) {
                Label(meta, size = 15.sp, color = accent, weight = FontWeight.Bold, spacing = 2.sp, mono = true)
                Spacer(Modifier.height(8.dp))
                Label(title, size = 36.sp, weight = FontWeight.ExtraBold, lineHeight = 40.sp)
                Spacer(Modifier.height(14.dp))
                Label(synopsis, size = 17.sp, color = Neon.TextDim, lineHeight = 25.sp)
                Spacer(Modifier.height(26.dp))
                Box(
                    Modifier
                        .background(accent, RoundedCornerShape(10.dp))
                        .border(3.dp, Color.White.copy(alpha = 0.85f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 26.dp, vertical = 12.dp)
                ) {
                    Label("▶  REPRODUCIR", size = 18.sp, color = Neon.Ink, weight = FontWeight.ExtraBold, spacing = 1.sp)
                }
                if (message != null) {
                    Spacer(Modifier.height(14.dp))
                    Label(message, size = 14.sp, color = Neon.Amber)
                }
            }
        }
    }
}

/** Mensaje corto abajo en la pantalla. */
@Composable
fun HintBar(text: String, modifier: Modifier = Modifier) {
    Label(
        text,
        modifier = modifier.fillMaxWidth(),
        size = 13.sp,
        color = Neon.TextDim.copy(alpha = 0.8f),
        align = TextAlign.Center,
        spacing = 1.sp,
        mono = true
    )
}
