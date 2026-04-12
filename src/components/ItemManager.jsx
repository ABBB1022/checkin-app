import React, { useState } from 'react'
import { supabase } from '../supabase'

const ICONS = [
  '🪢', '🦵', '🏋️', '💊', '🧘', '📚', '🎓', '🏃', '💪', '🎯',
  '💤', '🥗', '💧', '🍎', '🥤', '🧠', '✍️', '📖', '🎵', '🎨',
  '🌅', '🌙', '⭐', '❤️', '🔥', '💎', '🌟', '🍀', '🌈', '⚡'
]

export default function ItemManager({ items, onRefresh }) {
  const [editingItem, setEditingItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ text: '', icon: '📌' })
  const [loading, setLoading] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  const handleAddItem = async () => {
    if (!formData.text.trim()) return
    
    setLoading(true)
    const maxOrder = Math.max(...items.map(i => i.sort_order), -1)
    
    const { error } = await supabase
      .from('items')
      .insert({
        text: formData.text,
        icon: formData.icon,
        sort_order: maxOrder + 1
      })
    
    if (!error) {
      setFormData({ text: '', icon: '📌' })
      setShowAddForm(false)
      onRefresh()
    }
    setLoading(false)
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.text.trim()) return
    
    setLoading(true)
    const { error } = await supabase
      .from('items')
      .update({
        text: formData.text,
        icon: formData.icon
      })
      .eq('id', editingItem.id)
    
    if (!error) {
      setEditingItem(null)
      setFormData({ text: '', icon: '📌' })
      onRefresh()
    }
    setLoading(false)
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('确定删除这个打卡事项吗？相关打卡记录也会被删除。')) return
    
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
    
    if (!error) {
      onRefresh()
    }
  }

  // 拖拽排序
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return

    // 交换排序
    const updates = [
      { id: draggedItem.id, sort_order: targetItem.sort_order },
      { id: targetItem.id, sort_order: draggedItem.sort_order }
    ]

    for (const update of updates) {
      await supabase
        .from('items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }

    setDraggedItem(null)
    onRefresh()
  }

  const startEdit = (item) => {
    setEditingItem(item)
    setFormData({ text: item.text, icon: item.icon })
    setShowAddForm(false)
  }

  const startAdd = () => {
    setShowAddForm(true)
    setEditingItem(null)
    setFormData({ text: '', icon: '📌' })
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData({ text: '', icon: '📌' })
  }

  return (
    <div className="item-manager">
      <h2 className="section-title">管理打卡事项</h2>
      
      {/* 添加/编辑表单 */}
      {(showAddForm || editingItem) && (
        <div className="item-form">
          <div className="form-row">
            <label>图标</label>
            <div className="icon-picker">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-row">
            <label>事项内容</label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="例如：跳绳100个"
              className="text-input"
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={cancelForm}>取消</button>
            <button 
              className="btn-save" 
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={loading || !formData.text.trim()}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* 事项列表 */}
      <div className="items-list">
        {items.length === 0 ? (
          <div className="empty-hint">暂无打卡事项，点击下方添加</div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className="item-row"
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
            >
              <span className="drag-handle">⋮⋮</span>
              <span className="item-preview-icon">{item.icon}</span>
              <span className="item-preview-text">{item.text}</span>
              <div className="item-actions">
                <button className="btn-edit" onClick={() => startEdit(item)}>编辑</button>
                <button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加按钮 */}
      {!showAddForm && !editingItem && (
        <button className="add-item-btn" onClick={startAdd}>
          + 添加打卡事项
        </button>
      )}
    </div>
  )
}