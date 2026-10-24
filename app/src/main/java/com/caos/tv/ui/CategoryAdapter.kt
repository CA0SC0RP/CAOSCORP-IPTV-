package com.caos.tv.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.caos.tv.data.Category
import com.caos.tv.data.ChannelRepository
import com.caos.tv.databinding.ItemCategoryBinding

class CategoryAdapter(
    private val onClick: (Category) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.VH>() {

    private var items: List<Category> = emptyList()
    private var selectedId: String = ChannelRepository.ALL

    class VH(val b: ItemCategoryBinding) : RecyclerView.ViewHolder(b.root)

    fun submit(list: List<Category>, selected: String) {
        items = list
        selectedId = selected
        notifyDataSetChanged()
    }

    fun select(id: String) {
        val old = items.indexOfFirst { it.id == selectedId }
        val new = items.indexOfFirst { it.id == id }
        selectedId = id
        if (old >= 0) notifyItemChanged(old)
        if (new >= 0) notifyItemChanged(new)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemCategoryBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val category = items[position]
        holder.b.tvCategoryName.text = category.name
        holder.b.tvCategoryCount.text = category.count.toString()
        holder.itemView.isSelected = category.id == selectedId
        holder.itemView.setOnClickListener { onClick(category) }
    }
}
