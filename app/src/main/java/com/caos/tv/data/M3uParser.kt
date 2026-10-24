package com.caos.tv.data

/** Lee listas M3U/M3U8 línea por línea (sirve para listas muy grandes). */
object M3uParser {

    const val DEFAULT_GROUP = "Sin categoría"

    private val attrRegex = Regex("""([A-Za-z0-9_-]+)="([^"]*)"""")

    fun parse(lines: Sequence<String>): Pair<List<Category>, List<Channel>> {
        val channels = ArrayList<Channel>()
        val groups = LinkedHashSet<String>()

        var pending = false
        var name = ""
        var logo: String? = null
        var group = DEFAULT_GROUP

        for (raw in lines) {
            val line = raw.trim()
            if (line.isEmpty()) continue

            if (line.startsWith("#EXTINF", ignoreCase = true)) {
                val attrs = attrRegex.findAll(line)
                    .associate { it.groupValues[1].lowercase() to it.groupValues[2] }
                // El nombre va después de la última comilla de los atributos y de la coma.
                val afterAttrs = if (line.contains('"')) line.substringAfterLast('"') else line
                val title = afterAttrs.substringAfter(',', "").trim()

                name = title.ifEmpty { attrs["tvg-name"] ?: "Canal ${channels.size + 1}" }
                logo = attrs["tvg-logo"]?.takeIf { it.isNotBlank() }
                group = attrs["group-title"]?.takeIf { it.isNotBlank() } ?: DEFAULT_GROUP
                pending = true
            } else if (line.startsWith("#")) {
                if (pending && line.startsWith("#EXTGRP:", ignoreCase = true)) {
                    val g = line.substringAfter(':').trim()
                    if (g.isNotEmpty()) group = g
                }
            } else if (pending) {
                channels += Channel(
                    id = channels.size.toString(),
                    name = name,
                    logo = logo,
                    categoryId = group,
                    url = line
                )
                groups += group
                pending = false
            }
        }

        val categories = groups.map { Category(id = it, name = it) }
        return Pair(categories, channels)
    }
}
