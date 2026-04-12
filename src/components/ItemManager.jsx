import React, { useState } from 'react'

const ICONS = [
  '🪢', '🦵', '🏋️', '💊', '🧘', '📚', '🎓', '🏃', '💪', '🎯',
  '💤', '🥗', '💧', '🍎', '🥤', '🧠', '✍️', '📖', '🎵', '🎨',
  '🌅', '🌙', '⭐', '❤️', '🔥', '💎', '🌟', '🍀', '🌈', '⚡'
]

export default function ItemManager({ items, onAdd, onUpdate, onDelete, onReorder }) {
  const [editingItem, setEditingItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ text: '', icon: '📌' })
  const [loading, setLoading] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  const handleAddItem = async () => {
    if (!formData.text.trim()) return
    setLoading(true)
    await onAdd(formData.text, formData.icon)
    setFormData({ text: '', icon: '📌' })
    setShowAddForm(false)
    setLoading(false)
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.text.trim()) return
    setLoading(true)
    await onUpdate(editingItem.id, formData.text, formData.icon)
    setEditingItem(null)
    setFormData({ text: '', icon: '📌' })
    setLoading(false)
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('确定删除这个打卡事项吗？')) return
    await onDelete(id)
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return
    onReorder(draggedItem.id, targetItem.id)
    setDraggedItem(null)
  }

  const startEdit = (item) => {
    setEditingItem(item)
    setFormData({ text: item.text, icon: item.icon })
    setShowAddForm(false)
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData({ text: '', icon: '📌' })
  }

  return (
    <div className="item-manager">
      <h2 className="section-title">管理打卡事项</h2>
      
      {(showAddForm || editingItem) && (
        <div className="item-form">
          <div className="form-row">
            <label>图标</label>
            <div className="icon-picker">
              {ICONS.map(icon => (
                <button key={icon} className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}>{icon}</button>
              ))}
            </div>
          </div>
          
          <div className="form-row">
            <label>事项内容</label>
            <input type="text" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="例如：跳绳100个" className="text-input" />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={cancelForm}>取消</button>
            <button className="btn-save" onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={loading || !formData.text.trim()}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </div>
      )}

      <div className="items-list">
        {items.length === 0 ? (
          <div className="empty-hint">暂无打卡事项，点击下方添加</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="item-row" draggable
              onDragStart={(e) => handleDragStart(e, item)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, item)}>
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

      {!showAddForm && !editingItem && (
        <button className="add-item-btn" onClick={() => { setShowAddForm(true); setEditingItem(null); }}>
          + 添加打卡事项
        </button>
      )}
    </div>
  )
}