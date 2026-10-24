package com.caos.tv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.doOnNextLayout
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.caos.tv.data.AccountStore
import com.caos.tv.data.Category
import com.caos.tv.data.Channel
import com.caos.tv.data.ChannelRepository
import com.caos.tv.data.IptvClient
import com.caos.tv.databinding.ActivityChannelsBinding
import kotlinx.coroutines.launch

class ChannelsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChannelsBinding
    private lateinit var store: AccountStore

    private val categoryAdapter = CategoryAdapter { onCategoryClick(it) }
    private val channelAdapter = ChannelAdapter { onChannelClick(it) }

    private var currentCategory = ChannelRepository.ALL
    private var currentList: List<Channel> = emptyList()

    private val playerLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val index = result.data?.getIntExtra(PlayerActivity.EXTRA_INDEX, -1) ?: -1
            if (index in currentList.indices) binding.rvChannels.focusItem(index)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChannelsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        store = AccountStore(this)

        binding.rvCategories.layoutManager = LinearLayoutManager(this)
        binding.rvCategories.adapter = categoryAdapter
        binding.rvCategories.itemAnimator = null

        binding.rvChannels.layoutManager = LinearLayoutManager(this)
        binding.rvChannels.adapter = channelAdapter
        binding.rvChannels.itemAnimator = null

        binding.btnRefresh.setOnClickListener { loadData(force = true) }
        binding.btnAccount.setOnClickListener {
            startActivity(
                Intent(this, LoginActivity::class.java).putExtra(LoginActivity.EXTRA_EDIT, true)
            )
        }

        loadData(force = false)
    }

    private fun loadData(force: Boolean) {
        val account = store.load()
        if (account == null) {
            startActivity(
                Intent(this, LoginActivity::class.java).putExtra(LoginActivity.EXTRA_EDIT, true)
            )
            finish()
            return
        }

        if (ChannelRepository.loaded && !force) {
            showData()
            return
        }

        binding.progress.visibility = View.VISIBLE
        binding.tvError.visibility = View.GONE
        lifecycleScope.launch {
            try {
                ChannelRepository.load(account)
                showData()
            } catch (e: Exception) {
                showError(IptvClient.friendlyError(e))
            } finally {
                binding.progress.visibility = View.GONE
            }
        }
    }

    private fun showData() {
        binding.tvError.visibility = View.GONE
        val categories = ChannelRepository.categories
        if (categories.none { it.id == currentCategory }) currentCategory = ChannelRepository.ALL

        categoryAdapter.submit(categories, currentCategory)
        showCategory(currentCategory)

        if (ChannelRepository.channels.isEmpty()) {
            showError("La lista no tiene canales.")
        }
        binding.rvCategories.focusItem(categories.indexOfFirst { it.id == currentCategory }.coerceAtLeast(0))
    }

    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = View.VISIBLE
    }

    private fun showCategory(id: String) {
        currentCategory = id
        currentList = ChannelRepository.channelsIn(id)
        channelAdapter.submit(currentList)
        val name = ChannelRepository.categories.firstOrNull { it.id == id }?.name ?: ""
        binding.tvHeader.text = "$name · ${currentList.size} canales"
        binding.rvChannels.scrollToPosition(0)
    }

    private fun onCategoryClick(category: Category) {
        categoryAdapter.select(category.id)
        showCategory(category.id)
        if (currentList.isNotEmpty()) binding.rvChannels.focusItem(0)
    }

    private fun onChannelClick(position: Int) {
        if (position !in currentList.indices) return
        playerLauncher.launch(
            Intent(this, PlayerActivity::class.java)
                .putExtra(PlayerActivity.EXTRA_CATEGORY, currentCategory)
                .putExtra(PlayerActivity.EXTRA_INDEX, position)
        )
    }

    /** Desplaza la lista a la posición y le da el foco al elemento cuando ya esté dibujado. */
    private fun RecyclerView.focusItem(position: Int) {
        scrollToPosition(position)
        doOnNextLayout {
            post { findViewHolderForAdapterPosition(position)?.itemView?.requestFocus() }
        }
    }
}
