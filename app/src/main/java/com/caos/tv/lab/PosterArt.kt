package com.caos.tv.lab

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap

/**
 * Pósters de mentira dibujados con código (estilo dibujo plano con neón).
 * Se usan solo en el prototipo; después entran las portadas reales de TMDB.
 * Las esquinas ya salen redondeadas para no recortar cada cuadro al dibujarlo.
 */
object PosterArt {

    fun make(title: String, hue: Float, style: Int, w: Int, h: Int, tag: String? = null): ImageBitmap {
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val wf = w.toFloat()
        val hf = h.toFloat()
        val radius = wf * 0.07f
        val p = Paint(Paint.ANTI_ALIAS_FLAG)
        // En formato horizontal (episodios) las figuras se miden con el alto para que no se salgan.
        val landscape = wf > hf
        val sw = if (landscape) hf * 0.667f else wf
        val mx = wf / 2f

        val top = Color.HSVToColor(floatArrayOf(hue % 360f, 0.70f, 0.95f))
        val mid = Color.HSVToColor(floatArrayOf((hue + 35f) % 360f, 0.85f, 0.55f))
        val bot = Color.HSVToColor(floatArrayOf((hue + 70f) % 360f, 0.95f, 0.16f))

        c.save()
        val clip = Path()
        clip.addRoundRect(RectF(0f, 0f, wf, hf), radius, radius, Path.Direction.CW)
        c.clipPath(clip)

        p.shader = LinearGradient(
            0f, 0f, 0f, hf,
            intArrayOf(top, mid, bot),
            floatArrayOf(0f, 0.55f, 1f),
            Shader.TileMode.CLAMP
        )
        c.drawRect(0f, 0f, wf, hf, p)
        p.shader = null

        when (((style % 4) + 4) % 4) {
            0 -> { // sol con rendijas
                p.color = Color.argb(215, 255, 236, 190)
                c.drawCircle(mx, hf * 0.36f, sw * 0.30f, p)
                p.color = mid
                for (i in 0 until 5) {
                    val y = hf * 0.40f + i * hf * 0.035f
                    c.drawRect(mx - sw * 0.35f, y, mx + sw * 0.35f, y + hf * 0.006f * (i + 1), p)
                }
            }
            1 -> { // montañas
                p.color = Color.argb(150, 6, 8, 24)
                val m1 = Path()
                m1.moveTo(0f, hf * 0.62f)
                m1.lineTo(wf * 0.30f, hf * 0.28f)
                m1.lineTo(wf * 0.55f, hf * 0.56f)
                m1.lineTo(wf * 0.75f, hf * 0.36f)
                m1.lineTo(wf, hf * 0.62f)
                m1.lineTo(wf, hf)
                m1.lineTo(0f, hf)
                m1.close()
                c.drawPath(m1, p)
                p.color = Color.argb(200, 255, 255, 255)
                c.drawCircle(wf * 0.72f, hf * 0.17f, sw * 0.09f, p)
            }
            2 -> { // planeta con anillo
                p.color = Color.argb(225, 255, 255, 255)
                c.drawCircle(mx, hf * 0.36f, sw * 0.22f, p)
                p.style = Paint.Style.STROKE
                p.strokeWidth = sw * 0.035f
                p.color = Color.argb(235, 61, 242, 255)
                c.save()
                c.rotate(-18f, mx, hf * 0.36f)
                c.drawOval(RectF(mx - sw * 0.38f, hf * 0.30f, mx + sw * 0.38f, hf * 0.42f), p)
                c.restore()
                p.style = Paint.Style.FILL
            }
            else -> { // franjas diagonales
                p.color = Color.argb(70, 255, 255, 255)
                for (i in 0 until 4) {
                    val x = wf * (0.05f + i * 0.26f)
                    val band = Path()
                    band.moveTo(x, 0f)
                    band.lineTo(x + wf * 0.14f, 0f)
                    band.lineTo(x + wf * 0.14f - wf * 0.35f, hf * 0.62f)
                    band.lineTo(x - wf * 0.35f, hf * 0.62f)
                    band.close()
                    c.drawPath(band, p)
                }
            }
        }

        // título
        val tp = Paint(Paint.ANTI_ALIAS_FLAG)
        tp.typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        tp.color = Color.WHITE
        tp.textAlign = Paint.Align.CENTER
        tp.textSize = if (landscape) hf * 0.15f else wf * 0.115f
        tp.setShadowLayer(sw * 0.02f, 0f, sw * 0.01f, Color.BLACK)
        val lines = wrap(title.uppercase(), tp, wf * 0.86f).take(3)
        val lineH = tp.textSize * 1.15f
        var y = hf * 0.86f - (lines.size - 1) * lineH
        for (line in lines) {
            c.drawText(line, wf / 2f, y, tp)
            y += lineH
        }

        // etiqueta (por ejemplo "T1 · E3")
        if (tag != null) {
            val gp = Paint(Paint.ANTI_ALIAS_FLAG)
            gp.textSize = wf * 0.065f
            gp.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            gp.color = Color.argb(255, 61, 242, 255)
            val tw = gp.measureText(tag)
            val pad = wf * 0.03f
            val bg = Paint(Paint.ANTI_ALIAS_FLAG)
            bg.color = Color.argb(170, 4, 5, 16)
            c.drawRoundRect(RectF(wf * 0.04f, wf * 0.04f, wf * 0.04f + tw + pad * 2, wf * 0.04f + gp.textSize + pad * 1.4f), pad, pad, bg)
            c.drawText(tag, wf * 0.04f + pad, wf * 0.04f + pad * 0.7f + gp.textSize * 0.9f, gp)
        }

        c.restore()

        // borde: tapa los dientes del recorte
        val bp = Paint(Paint.ANTI_ALIAS_FLAG)
        bp.style = Paint.Style.STROKE
        bp.strokeWidth = wf * 0.018f
        bp.color = Color.argb(150, 255, 255, 255)
        val inset = bp.strokeWidth / 2f
        c.drawRoundRect(RectF(inset, inset, wf - inset, hf - inset), radius, radius, bp)

        return bmp.asImageBitmap()
    }

    private fun wrap(text: String, paint: Paint, maxWidth: Float): List<String> {
        val out = ArrayList<String>()
        var line = ""
        for (word in text.split(" ")) {
            val candidate = if (line.isEmpty()) word else "$line $word"
            if (paint.measureText(candidate) <= maxWidth || line.isEmpty()) {
                line = candidate
            } else {
                out += line
                line = word
            }
        }
        if (line.isNotEmpty()) out += line
        return out
    }
}
