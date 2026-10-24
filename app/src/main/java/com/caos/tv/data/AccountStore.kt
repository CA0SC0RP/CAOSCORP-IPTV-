package com.caos.tv.data

import android.content.Context
import org.json.JSONObject

/** Guarda la cuenta IPTV en el almacenamiento privado de la app. */
class AccountStore(context: Context) {

    private val prefs =
        context.applicationContext.getSharedPreferences("caos_tv_prefs", Context.MODE_PRIVATE)

    fun load(): Account? {
        val raw = prefs.getString(KEY, null) ?: return null
        return try {
            val o = JSONObject(raw)
            Account(
                type = AccountType.valueOf(o.getString("type")),
                host = o.optString("host"),
                username = o.optString("user"),
                password = o.optString("pass"),
                m3uUrl = o.optString("m3u")
            )
        } catch (e: Exception) {
            null
        }
    }

    fun save(account: Account) {
        val json = JSONObject()
            .put("type", account.type.name)
            .put("host", account.host)
            .put("user", account.username)
            .put("pass", account.password)
            .put("m3u", account.m3uUrl)
        prefs.edit().putString(KEY, json.toString()).apply()
    }

    fun clear() {
        prefs.edit().remove(KEY).apply()
    }

    private companion object {
        const val KEY = "account"
    }
}
