package com.caos.tv.lab

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlin.math.atan
import kotlin.math.roundToInt
import kotlin.math.sin

/** Fotos por hilo (se repiten en círculo) y tamaño del catálogo de prueba. */
private const val PER_LINE = 18
private const val CATALOG = 72

/** Deriva de cada hilo cuando nadie lo toca, en fotos por segundo (muy lenta). */
private val DRIFT = floatArrayOf(0.16f, -0.13f, 0.19f, -0.11f)

private const val SPRING_K = 150f
private const val SPRING_C = 21f
private const val RELEASE_AFTER = 2.5f

private const val CHIPS_COUNT = 6 // 4 filtros + hilos + efectos

private val TABS = listOf("PELÍCULAS", "SERIES")
private val FILTERS_MOVIES = listOf("RECIÉN AGREGADAS", "ESTRENOS DEL AÑO", "MEJOR CALIFICADAS", "CLÁSICAS")
private val FILTERS_SERIES = listOf("RECIÉN AGREGADAS", "ESTRENOS DEL AÑO", "ACTUALIZADAS", "CLÁSICAS")

@Composable
fun ClotheslineScreen(onBack: () -> Unit) {
    var section by remember { mutableIntStateOf(0) }
    var filter by remember { mutableIntStateOf(0) }
    var lineCount by remember { mutableIntStateOf(3) }
    var fx by remember { mutableStateOf(false) }

    // Foco: -2 pestañas, -1 filtros, 0.. los hilos
    var focusRow by remember { mutableIntStateOf(0) }
    var tabFocus by remember { mutableIntStateOf(0) }
    var chipFocus by remember { mutableIntStateOf(0) }

    var detail by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var fpsText by remember { mutableStateOf("FPS --") }
    var selState by remember { mutableIntStateOf(0) }

    val catalog = remember(section) { DemoData.catalog(section, CATALOG) }
    val art by produceState<List<ImageBitmap>?>(initialValue = null, section) {
        value = null
        value = withContext(Dispatchers.Default) {
            catalog.map { PosterArt.make(it.title, it.hue, it.id, 220, 330) }
        }
    }

    // Orden de los títulos según el filtro elegido
    val order: List<Int> = remember(section, filter) {
        val idx = catalog.indices.toList()
        when (filter) {
            0 -> idx.sortedByDescending { catalog[it].added }
            1 -> idx.sortedWith(
                compareByDescending<Int> { catalog[it].year }.thenByDescending { catalog[it].ratingValue }
            )
            2 -> if (section == 0) {
                idx.sortedByDescending { catalog[it].ratingValue }
            } else {
                idx.sortedByDescending { catalog[it].updated }
            }
            else -> idx.sortedBy { catalog[it].year }
        }
    }

    // Estado de cada hilo: posición (en fotos), velocidad, destino, tiempo sin tocar y modo (0 deriva, 1 resorte)
    val xs = remember { floatArrayOf(0f, 4.4f, 2.2f, 7.1f) }
    val vs = remember { FloatArray(4) }
    val target = remember { FloatArray(4) }
    val idle = remember { FloatArray(4) }
    val mode = remember { IntArray(4) }
    val fpsAcc = remember { FloatArray(3) }

    val clock = rememberClock { dt ->
        val focused = focusRow
        for (l in 0 until 4) {
            if (mode[l] == 1) {
                val acc = SPRING_K * (target[l] - xs[l]) - SPRING_C * vs[l]
                vs[l] += acc * dt
                xs[l] += vs[l] * dt
                idle[l] += dt
                if (idle[l] > RELEASE_AFTER && kotlin.math.abs(target[l] - xs[l]) < 0.02f) {
                    mode[l] = 0
                    vs[l] = 0f
                }
            } else {
                // el hilo con foco se mueve más despacio para poder leerlo
                val slow = if (l == focused) 0.3f else 1f
                xs[l] += dt * DRIFT[l] * slow
            }
        }
        if (focused >= 0 && focused < 4) {
            val s = ((xs[focused].roundToInt() % PER_LINE) + PER_LINE) % PER_LINE
            if (s != selState) selState = s
        }
        // contador de cuadros por segundo
        fpsAcc[0] += dt
        fpsAcc[1] += 1f
        if (dt > fpsAcc[2]) fpsAcc[2] = dt
        if (fpsAcc[0] >= 0.5f) {
            fpsText = "FPS ${(fpsAcc[1] / fpsAcc[0]).roundToInt()}  ·  pico ${(fpsAcc[2] * 1000f).roundToInt()} ms"
            fpsAcc[0] = 0f
            fpsAcc[1] = 0f
            fpsAcc[2] = 0f
        }
    }

    fun itemAt(line: Int, k: Int): Int = order[(k * lineCount + line) % order.size]

    fun nudge(l: Int, dir: Int) {
        if (mode[l] == 0) {
            target[l] = xs[l].roundToInt().toFloat()
            vs[l] = 0f
            mode[l] = 1
        }
        target[l] += dir
        idle[l] = 0f
    }

    fun moveSide(dir: Int) {
        if (focusRow == -2) {
            tabFocus = (tabFocus + dir).coerceIn(0, TABS.size - 1)
        } else if (focusRow == -1) {
            chipFocus = (chipFocus + dir).coerceIn(0, CHIPS_COUNT - 1)
        } else {
            nudge(focusRow, dir)
        }
    }

    fun moveVertical(dir: Int) {
        focusRow = (focusRow + dir).coerceIn(-2, lineCount - 1)
    }

    fun activate() {
        if (focusRow == -2) {
            if (section != tabFocus) {
                section = tabFocus
                filter = 0
                chipFocus = 0
            }
        } else if (focusRow == -1) {
            if (chipFocus < 4) {
                filter = chipFocus
            } else if (chipFocus == 4) {
                lineCount = if (lineCount >= 4) 2 else lineCount + 1
                if (focusRow > lineCount - 1) focusRow = lineCount - 1
            } else {
                fx = !fx
            }
        } else {
            detail = true
        }
    }

    BackHandler {
        if (detail) {
            detail = false
            message = null
        } else {
            onBack()
        }
    }

    LaunchedEffect(message) {
        if (message != null) {
            delay(2500)
            message = null
        }
    }

    val focusReq = remember { FocusRequester() }
    LaunchedEffect(Unit) { runCatching { focusReq.requestFocus() } }

    val focusLine = focusRow.coerceAtLeast(0).coerceAtMost(lineCount - 1)
    val selItem = catalog[itemAt(focusLine, selState)]
    val caption = if (focusRow >= 0) "${selItem.title}  ·  ${selItem.year}  ·  ★ ${selItem.rating}" else ""

    Box(
        Modifier
            .fillMaxSize()
            .dpad(
                onLeft = { if (!detail) moveSide(-1) },
                onRight = { if (!detail) moveSide(1) },
                onUp = { if (!detail) moveVertical(-1) },
                onDown = { if (!detail) moveVertical(1) },
                onOk = {
                    if (!detail) {
                        activate()
                    } else {
                        message = "El reproductor llega en la siguiente etapa."
                    }
                }
            )
            .focusRequester(focusReq)
            .focusable()
    ) {
        // cuarto oscuro de revelado: luz roja suave y un toque de cian
        SpaceBackdrop(clock, tintA = Color(0xFFFF5A3C), tintB = Neon.Cyan)

        Canvas(Modifier.fillMaxSize()) {
            val t = clock.value / 1_000_000_000f
            val w = size.width
            val h = size.height
            val u = h / 540f
            val lc = lineCount
            val top = h * 0.17f
            val bottom = h * 0.955f
            val lineH = (bottom - top) / lc
            val fh = lineH * 0.80f
            val fw = fh / 1.54f
            val sp = fw * 1.08f
            val half = PER_LINE / 2f

            for (l in 0 until lc) {
                val ux = xs[l]
                val baseY = top + lineH * l + lineH * 0.07f
                val sag = lineH * 0.07f
                val focused = focusRow == l
                val lineAlpha = if (focusRow >= 0 && !focused) 0.72f else 1f

                // cuerda
                var px0 = 0f
                var py0 = baseY
                for (s in 1..24) {
                    val xx = w * s / 24f
                    val tt = xx / w
                    val yy = baseY + sag * 4f * tt * (1f - tt)
                    drawLine(
                        color = Color(0xFFC9B79A).copy(alpha = 0.55f * lineAlpha),
                        start = Offset(px0, py0),
                        end = Offset(xx, yy),
                        strokeWidth = 2f * u
                    )
                    px0 = xx
                    py0 = yy
                }

                val selK = ((ux.roundToInt() % PER_LINE) + PER_LINE) % PER_LINE
                // primero las fotos normales y al final la elegida (queda encima)
                for (pass in 0..1) {
                    for (k in 0 until PER_LINE) {
                        val isSel = focused && k == selK
                        if ((pass == 1) != isSel) continue
                        var d = (k - ux) % PER_LINE
                        if (d < 0f) d += PER_LINE
                        if (d >= half) d -= PER_LINE
                        val cx = w * 0.5f + d * sp
                        if (cx < -fw || cx > w + fw) continue
                        val tt = (cx / w).coerceIn(0f, 1f)
                        val ropeY = baseY + sag * 4f * tt * (1f - tt)
                        val slope = sag * 4f * (1f - 2f * tt) / w
                        val slopeDeg = Math.toDegrees(atan(slope).toDouble()).toFloat()
                        val sway = sin(t * 0.6f + k * 1.7f + l * 0.9f) * 1.3f
                        val tilt = ((k * 37 + l * 11) % 7 - 3) * 0.8f
                        val bmp = art?.getOrNull(itemAt(l, k))
                        drawPhoto(bmp, cx, ropeY, slopeDeg * 0.6f + tilt + sway, fw, fh, lineAlpha, isSel, fx, u)
                    }
                }
            }
        }

        // Encabezado: pestañas, título de la foto elegida, FPS y filtros
        Column(
            Modifier
                .fillMaxSize()
                .padding(horizontal = 36.dp, vertical = 14.dp)
        ) {
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                for (i in TABS.indices) {
                    Chip(TABS[i], applied = section == i, focused = focusRow == -2 && tabFocus == i, accent = Neon.Amber)
                }
                Label(
                    caption,
                    Modifier
                        .weight(1f)
                        .padding(start = 14.dp),
                    size = 14.sp,
                    color = Neon.Text,
                    maxLines = 1
                )
                Label(fpsText, size = 12.sp, color = Neon.Lime, mono = true)
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val names = if (section == 0) FILTERS_MOVIES else FILTERS_SERIES
                for (i in 0 until 4) {
                    Chip(names[i], applied = filter == i, focused = focusRow == -1 && chipFocus == i)
                }
                Chip("HILOS: $lineCount", applied = false, focused = focusRow == -1 && chipFocus == 4)
                Chip(if (fx) "FX: SÍ" else "FX: NO", applied = fx, focused = focusRow == -1 && chipFocus == 5)
            }
        }

        HintBar(
            "←  →  mover el hilo        ↑  ↓  cambiar de hilo        OK  ficha        ATRÁS  salir",
            Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 4.dp)
        )

        if (detail) {
            val meta = if (section == 0) {
                "${selItem.year}  ·  ★ ${selItem.rating}  ·  ${selItem.minutes} MIN  ·  ${selItem.genres.uppercase()}"
            } else {
                "${selItem.year}  ·  ★ ${selItem.rating}  ·  ${selItem.minutes} TEMPORADAS  ·  ${selItem.genres.uppercase()}"
            }
            DetailOverlay(
                art = art?.getOrNull(selItem.id),
                title = selItem.title,
                meta = meta,
                synopsis = selItem.synopsis,
                accent = Neon.Amber,
                message = message
            )
        }
    }
}

@Composable
private fun Chip(text: String, applied: Boolean, focused: Boolean, accent: Color = Neon.Cyan) {
    val shape = RoundedCornerShape(10.dp)
    Box(
        Modifier
            .background(if (applied) accent else Color(0x55111830), shape)
            .border(
                if (focused) 3.dp else 1.5.dp,
                if (focused) Color.White else accent.copy(alpha = 0.5f),
                shape
            )
            .padding(horizontal = 14.dp, vertical = 7.dp)
    ) {
        Label(
            text,
            size = 12.sp,
            color = if (applied) Neon.Ink else Neon.Text,
            weight = if (applied || focused) FontWeight.ExtraBold else FontWeight.Medium,
            spacing = 1.sp,
            maxLines = 1
        )
    }
}

/** Foto colgada con pinza: marco crema tipo revelado, la portada dentro y un ligero balanceo. */
private fun DrawScope.drawPhoto(
    bmp: ImageBitmap?,
    cx: Float,
    ropeY: Float,
    rotDeg: Float,
    fw: Float,
    fh: Float,
    alpha: Float,
    selected: Boolean,
    fx: Boolean,
    u: Float
) {
    val b = fw * 0.06f
    val imgW = fw - 2f * b
    val imgH = imgW * 1.5f
    val pinH = fw * 0.30f
    val lift = if (selected) 1.10f else 1f
    val corner = CornerRadius(fw * 0.03f, fw * 0.03f)

    withTransform({
        translate(cx, ropeY)
        rotate(rotDeg, Offset.Zero)
        if (lift != 1f) scale(lift, lift, Offset.Zero)
    }) {
        val left = -fw / 2f
        val topY = pinH * 0.35f

        if (fx) {
            // sombra suave bajo la foto
            drawRoundRect(
                color = Color.Black.copy(alpha = 0.35f * alpha),
                topLeft = Offset(left + 4f * u, topY + 6f * u),
                size = Size(fw, fh),
                cornerRadius = corner
            )
            if (selected) {
                drawRoundRect(
                    color = Neon.Cyan.copy(alpha = 0.28f),
                    topLeft = Offset(left - 8f * u, topY - 8f * u),
                    size = Size(fw + 16f * u, fh + 16f * u),
                    cornerRadius = CornerRadius(fw * 0.03f + 8f * u, fw * 0.03f + 8f * u)
                )
            }
        }

        // marco crema
        drawRoundRect(
            color = Color(0xFFF3E9D2).copy(alpha = alpha),
            topLeft = Offset(left, topY),
            size = Size(fw, fh),
            cornerRadius = corner
        )

        // portada
        if (bmp != null) {
            withTransform({
                translate(left + b, topY + b)
                scale(imgW / bmp.width, imgH / bmp.height, Offset.Zero)
            }) {
                drawImage(bmp, alpha = alpha)
            }
        } else {
            drawRoundRect(
                color = Color(0xFF10143A).copy(alpha = alpha),
                topLeft = Offset(left + b, topY + b),
                size = Size(imgW, imgH),
                cornerRadius = corner
            )
        }

        if (selected) {
            drawRoundRect(
                color = Neon.Cyan,
                topLeft = Offset(left - 2f * u, topY - 2f * u),
                size = Size(fw + 4f * u, fh + 4f * u),
                cornerRadius = corner,
                style = Stroke(width = 3.5f * u)
            )
        }

        // pinza de madera
        drawRoundRect(
            color = Color(0xFFD9A441).copy(alpha = alpha),
            topLeft = Offset(-fw * 0.07f, 0f),
            size = Size(fw * 0.14f, pinH),
            cornerRadius = CornerRadius(fw * 0.03f, fw * 0.03f)
        )
        drawRoundRect(
            color = Color(0xFF5A3E12).copy(alpha = alpha),
            topLeft = Offset(-fw * 0.07f, 0f),
            size = Size(fw * 0.14f, pinH),
            cornerRadius = CornerRadius(fw * 0.03f, fw * 0.03f),
            style = Stroke(width = 1.5f * u)
        )
    }
}
