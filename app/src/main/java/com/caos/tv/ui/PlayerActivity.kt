package com.caos.tv.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import com.caos.tv.data.Channel
import com.caos.tv.data.ChannelRepository
import com.caos.tv.data.IptvClient
import com.caos.tv.databinding.ActivityPlayerBinding

@androidx.annotation.OptIn(UnstableApi::class)
class PlayerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPlayerBinding

    private var player: ExoPlayer? = null
    private var list: List<Channel> = emptyList()
    private var index = 0

    private var attempts: List<MediaItem> = emptyList()
    private var attemptIndex = 0
    private var networkRetries = 0

    private val handler = Handler(Looper.getMainLooper())
    private val hideInfo = Runnable { binding.infoBar.visibility = View.GONE }
    private val retryRunnable = Runnable { startAttempt() }

    private val listener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            binding.progress.visibility =
                if (playbackState == Player.STATE_BUFFERING) View.VISIBLE else View.GONE
            if (playbackState == Player.STATE_READY) {
                binding.tvError.visibility = View.GONE
                networkRetries = 0
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            handlePlayerError(error)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemBars()

        val categoryId = intent.getStringExtra(EXTRA_CATEGORY) ?: ChannelRepository.ALL
        list = ChannelRepository.channelsIn(categoryId)
        if (list.isEmpty()) {
            // Pasa si Android cerró la app en segundo plano: la lista se recarga en la pantalla anterior.
            finish()
            return
        }
        index = intent.getIntExtra(EXTRA_INDEX, 0).coerceIn(0, list.lastIndex)
        setResult(RESULT_OK, Intent().putExtra(EXTRA_INDEX, index))
    }

    override fun onStart() {
        super.onStart()
        if (list.isEmpty()) return
        initPlayer()
        playCurrent()
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(retryRunnable)
        releasePlayer()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }

    // ---------- Reproductor ----------

    private fun initPlayer() {
        if (player != null) return
        val httpFactory = DefaultHttpDataSource.Factory()
            .setUserAgent(IptvClient.USER_AGENT)
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(20_000)
        val exo = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(this).setDataSourceFactory(httpFactory))
            .build()
        exo.addListener(listener)
        binding.playerView.player = exo
        player = exo
    }

    private fun releasePlayer() {
        player?.let {
            it.removeListener(listener)
            it.release()
        }
        binding.playerView.player = null
        player = null
    }

    /** Intentos en orden: URL principal, URL alterna (.ts) y, si no tiene extensión, forzar HLS. */
    private fun buildAttempts(channel: Channel): List<MediaItem> {
        val items = mutableListOf(MediaItem.fromUri(channel.url))
        channel.altUrl?.let { items += MediaItem.fromUri(it) }
        val path = channel.url.substringBefore('?').lowercase()
        if (!path.endsWith(".m3u8") && !path.endsWith(".ts")) {
            items += MediaItem.Builder()
                .setUri(channel.url)
                .setMimeType(MimeTypes.APPLICATION_M3U8)
                .build()
        }
        return items
    }

    private fun playCurrent() {
        val channel = list[index]
        handler.removeCallbacks(retryRunnable)
        attempts = buildAttempts(channel)
        attemptIndex = 0
        networkRetries = 0
        binding.tvError.visibility = View.GONE
        setResult(RESULT_OK, Intent().putExtra(EXTRA_INDEX, index))
        showInfo()
        startAttempt()
    }

    private fun startAttempt() {
        val exo = player ?: return
        if (attemptIndex !in attempts.indices) return
        exo.setMediaItem(attempts[attemptIndex])
        exo.prepare()
        exo.playWhenReady = true
    }

    private fun handlePlayerError(error: PlaybackException) {
        val exo = player ?: return

        if (error.errorCode == PlaybackException.ERROR_CODE_BEHIND_LIVE_WINDOW) {
            exo.seekToDefaultPosition()
            exo.prepare()
            return
        }

        if (attemptIndex + 1 < attempts.size) {
            attemptIndex++
            startAttempt()
            return
        }

        val isNetwork = error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ||
            error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT
        if (isNetwork && networkRetries < 3) {
            networkRetries++
            attemptIndex = 0
            handler.removeCallbacks(retryRunnable)
            handler.postDelayed(retryRunnable, 2000)
            return
        }

        binding.progress.visibility = View.GONE
        binding.tvError.text = "No se pudo reproducir este canal\n(${error.errorCodeName})"
        binding.tvError.visibility = View.VISIBLE
        showInfo()
    }

    // ---------- Control remoto ----------

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val firstPress = (event?.repeatCount ?: 0) == 0
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_CHANNEL_UP -> {
                if (firstPress) zap(+1)
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_CHANNEL_DOWN -> {
                if (firstPress) zap(-1)
                return true
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                if (firstPress) showInfo()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                player?.let { it.playWhenReady = !it.playWhenReady }
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun zap(delta: Int) {
        index = (index + delta + list.size) % list.size
        playCurrent()
    }

    private fun showInfo() {
        val channel = list[index]
        binding.tvNumber.text = (index + 1).toString()
        binding.tvName.text = channel.name
        binding.infoBar.visibility = View.VISIBLE
        handler.removeCallbacks(hideInfo)
        handler.postDelayed(hideInfo, 4000)
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, binding.root)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    companion object {
        const val EXTRA_CATEGORY = "category"
        const val EXTRA_INDEX = "index"
    }
}
