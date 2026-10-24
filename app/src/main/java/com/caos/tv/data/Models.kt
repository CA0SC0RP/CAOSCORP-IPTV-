package com.caos.tv.data

enum class AccountType { XTREAM, M3U }

data class Account(
    val type: AccountType,
    val host: String = "",
    val username: String = "",
    val password: String = "",
    val m3uUrl: String = ""
)

data class Category(
    val id: String,
    val name: String,
    val count: Int = 0
)

data class Channel(
    val id: String,
    val name: String,
    val logo: String?,
    val categoryId: String,
    val url: String,
    /** URL alterna (por ejemplo .ts cuando la principal es .m3u8). */
    val altUrl: String? = null
)
