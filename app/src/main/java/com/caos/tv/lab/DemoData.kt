package com.caos.tv.lab

/**
 * Catálogo de mentira para probar el tendedero. Después se cambia por los datos reales
 * de Xtream Codes (película/serie, año, calificación, fecha en que se agregó, etc.).
 */
data class DemoTitle(
    val id: Int,
    val title: String,
    val year: Int,
    val ratingValue: Float,
    val rating: String,
    /** Películas: minutos. Series: número de temporadas. */
    val minutes: Int,
    val genres: String,
    val synopsis: String,
    val hue: Float,
    /** Mientras más alto, más recién agregado. */
    val added: Int,
    /** Mientras más alto, más recién actualizado. */
    val updated: Int
)

object DemoData {

    private val first = listOf(
        "Neón", "Horizonte", "Órbita", "Eclipse", "Cometa", "Nébula", "Vórtice", "Pulso",
        "Quásar", "Aurora", "Sombra", "Eco", "Fractal", "Cénit", "Cristal", "Umbra", "Zafiro", "Andrómeda"
    )
    private val second = listOf(
        "Perdido", "Final", "Infinito", "Rojo", "Oculto", "Distante", "Eterno", "Salvaje",
        "Fantasma", "Último", "Secreto", "Cero", "Prohibido", "Lejano"
    )
    private val genres = listOf(
        "Ciencia ficción", "Acción", "Aventura", "Misterio", "Drama", "Animación", "Thriller", "Fantasía"
    )
    private val plots = listOf(
        "Una piloto sin suerte descubre una señal que nadie debía escuchar y tiene una noche para decidir en quién confiar.",
        "Cuando la ciudad se queda sin luz, un grupo de desconocidos encuentra el mapa de algo enterrado bajo las calles.",
        "Dos hermanos heredan una nave averiada y una deuda imposible. El único trato posible los lleva al borde de la galaxia.",
        "Una investigadora persigue a un fantasma digital que cambia de rostro cada vez que está a punto de atraparlo.",
        "En el último puesto de avanzada, la tripulación recibe un mensaje de su propio futuro. Nadie quiere abrirlo.",
        "Un mensajero de neón recorre la ciudad entregando paquetes. Esta vez, el paquete lo conoce a él."
    )

    /** kind 0 = películas, kind 1 = series. */
    fun catalog(kind: Int, count: Int): List<DemoTitle> = List(count) { i ->
        val s = i + kind * 37
        val rating = 5.6f + ((s * 37) % 38) / 10f
        val seasons = 1 + (s * 7) % 6
        DemoTitle(
            id = i,
            title = "${first[s % first.size]} ${second[(s * 5 + 3) % second.size]}",
            year = 2026 - (s * 5) % 29,
            ratingValue = rating,
            rating = String.format(java.util.Locale.US, "%.1f", rating),
            minutes = if (kind == 0) 82 + (s * 13) % 60 else seasons,
            genres = "${genres[s % genres.size]} · ${genres[(s * 3 + 2) % genres.size]}",
            synopsis = plots[s % plots.size],
            hue = ((s * 47) % 360).toFloat(),
            added = (i * 17) % count,
            updated = (i * 29) % count
        )
    }
}
