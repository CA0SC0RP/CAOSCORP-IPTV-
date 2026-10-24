package com.caos.tv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.caos.tv.R
import com.caos.tv.data.Account
import com.caos.tv.data.AccountStore
import com.caos.tv.data.AccountType
import com.caos.tv.data.ChannelRepository
import com.caos.tv.data.IptvClient
import com.caos.tv.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var store: AccountStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = AccountStore(this)

        val editMode = intent.getBooleanExtra(EXTRA_EDIT, false)
        if (!editMode && store.load() != null) {
            openChannels()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        store.load()?.let { prefill(it) }

        binding.rgType.setOnCheckedChangeListener { _, checkedId ->
            showFields(m3u = checkedId == R.id.rbM3u)
        }
        binding.btnConnect.setOnClickListener { connect() }
    }

    private fun prefill(account: Account) {
        binding.etHost.setText(account.host)
        binding.etUser.setText(account.username)
        binding.etPass.setText(account.password)
        binding.etM3u.setText(account.m3uUrl)
        if (account.type == AccountType.M3U) {
            binding.rbM3u.isChecked = true
            showFields(m3u = true)
        }
    }

    private fun showFields(m3u: Boolean) {
        binding.etHost.visibility = if (m3u) View.GONE else View.VISIBLE
        binding.etUser.visibility = if (m3u) View.GONE else View.VISIBLE
        binding.etPass.visibility = if (m3u) View.GONE else View.VISIBLE
        binding.etM3u.visibility = if (m3u) View.VISIBLE else View.GONE
    }

    private fun buildAccount(): Account? {
        return if (binding.rbM3u.isChecked) {
            val url = binding.etM3u.text.toString().trim()
            if (url.isEmpty()) {
                showError("Escribe la URL de la lista M3U")
                return null
            }
            Account(type = AccountType.M3U, m3uUrl = url)
        } else {
            val host = binding.etHost.text.toString().trim()
            val user = binding.etUser.text.toString().trim()
            val pass = binding.etPass.text.toString().trim()
            if (host.isEmpty() || user.isEmpty() || pass.isEmpty()) {
                showError("Completa servidor, usuario y contraseña")
                return null
            }
            Account(
                type = AccountType.XTREAM,
                host = IptvClient.normalizeHost(host),
                username = user,
                password = pass
            )
        }
    }

    private fun connect() {
        val account = buildAccount() ?: return
        setBusy(true)
        lifecycleScope.launch {
            try {
                ChannelRepository.load(account)
                store.save(account)
                openChannels()
            } catch (e: Exception) {
                showError(IptvClient.friendlyError(e))
            } finally {
                setBusy(false)
            }
        }
    }

    private fun setBusy(busy: Boolean) {
        binding.progress.visibility = if (busy) View.VISIBLE else View.GONE
        binding.btnConnect.isEnabled = !busy
        if (busy) binding.tvStatus.visibility = View.GONE
    }

    private fun showError(message: String) {
        binding.tvStatus.text = message
        binding.tvStatus.visibility = View.VISIBLE
    }

    private fun openChannels() {
        startActivity(
            Intent(this, ChannelsActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
        finish()
    }

    companion object {
        const val EXTRA_EDIT = "edit"
    }
}
