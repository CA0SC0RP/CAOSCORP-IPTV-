package com.caos.tv.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Guarda en memoria la lista de canales cargada para compartirla entre pantallas. */
object ChannelRepository {

    const val ALL = "__all__"
    const val UNCATEGORIZED = "__none__"

    @Volatile
    var categories: List<Category> = emptyList()
        private set

    @Volatile
    var channels: List<Channel> = emptyList()
        private set

    @Volatile
    var loaded: Boolean = false
        private set

    @Volatile
    private var byCategory: Map<String, List<Channel>> = emptyMap()

    suspend fun load(account: Account) = withContext(Dispatchers.IO) {
        val (cats, raw) = when (account.type) {
            AccountType.XTREAM -> IptvClient.loadXtream(account)
            AccountType.M3U -> IptvClient.loadM3u(account.m3uUrl)
        }

        // Canales cuya categoría no existe en la lista caen en "Sin categoría".
        val known = cats.map { it.id }.toSet()
        val normalized = raw.map { if (it.categoryId in known) it else it.copy(categoryId = UNCATEGORIZED) }

        val grouped = normalized.groupBy { it.categoryId }
        val catList = ArrayList<Category>()
        for (c in cats) {
            val n = grouped[c.id]?.size ?: 0
            if (n > 0) catList += c.copy(count = n)
        }
        grouped[UNCATEGORIZED]?.let { catList += Category(UNCATEGORIZED, M3uParser.DEFAULT_GROUP, it.size) }

        byCategory = grouped
        channels = normalized
        categories = listOf(Category(ALL, "Todos los canales", normalized.size)) + catList
        loaded = true
    }

    fun channelsIn(categoryId: String): List<Channel> =
        if (categoryId == ALL) channels else byCategory[categoryId].orEmpty()
}
