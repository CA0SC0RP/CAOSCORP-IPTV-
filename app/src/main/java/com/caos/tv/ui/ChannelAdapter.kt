package com.caos.tv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.caos.tv.R
import com.caos.tv.data.Channel
import com.caos.tv.databinding.ItemChannelBinding

class ChannelAdapter(
    private val onClick: (Int) -> Unit
) : RecyclerView.Adapter<ChannelAdapter.VH>() {

    private var items: List<Channel> = emptyList()

    class VH(val b: ItemChannelBinding) : RecyclerView.ViewHolder(b.root)

    fun submit(list: List<Channel>) {
        items = list
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemChannelBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val channel = items[position]
        holder.b.tvNumber.text = (position + 1).toString()
        holder.b.tvName.text = channel.name
        holder.b.ivLogo.load(channel.logo) {
            placeholder(R.drawable.ic_channel_placeholder)
            error(R.drawable.ic_channel_placeholder)
        }
        holder.itemView.setOnClickListener {
            val pos = holder.bindingAdapterPosition
            if (pos != RecyclerView.NO_POSITION) onClick(pos)
        }
    }
}
