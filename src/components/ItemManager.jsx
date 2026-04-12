import React, { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Trash2, Edit3, Check, X, GripVertical, Sparkles } from 'lucide-react'

const ICONS = [
  '🪢', '🦵', '🏋️', '💊', '🧘', '📚', '🎓', '🏃', '💪', '🎯',
  '💤', '🥗', '💧', '🍎', '🥤', '🧠', '✍️', '📖', '🎵', '🎨',
  '🌅', '🌙', '⭐', '❤️', '🔥', '💎', '🌟', '🍀', '🌈', '⚡'
]

export default function ItemManager({ items, onAdd, onUpdate, onDelete, onReorder }) {
  const [editingItem, setEditingItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ text: '', icon: '📌' })
  const [draggedItem, setDraggedItem] = useState(null)

  const handleAddItem = async () => {
    if (!formData.text.trim()) return
    await onAdd(formData.text, formData.icon)
    setFormData({ text: '', icon: '📌' })
    setShowAddForm(false)
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.text.trim()) return
    await onUpdate(editingItem.id, formData.text, formData.icon)
    setEditingItem(null)
    setFormData({ text: '', icon: '📌' })
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('确定删除这个打卡事项吗？')) return
    await onDelete(id)
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
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        管理打卡事项
      </motion.h2>

      {/* 添加/编辑表单 */}
      <AnimatePresence>
        {(showAddForm || editingItem) && (
          <motion.div
            className="item-form glass"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="form-section">
              <label>选择图标</label>
              <div className="icon-grid">
                {ICONS.map(icon => (
                  <motion.button
                    key={icon}
                    className={`icon-btn ${formData.icon === icon ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, icon })}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>事项内容</label>
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="例如：跳绳100个"
                className="text-input glass"
              />
            </div>

            <div className="form-actions">
              <motion.button 
                className="btn-cancel"
                onClick={cancelForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X size={18} /> 取消
              </motion.button>
              <motion.button 
                className="btn-save"
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={!formData.text.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check size={18} /> {editingItem ? '更新' : '添加'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 事项列表 */}
      <div className="items-container">
        {items.length === 0 ? (
          <motion.div 
            className="empty-hint glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles size={32} opacity={0.5} />
            <p>暂无打卡事项</p>
            <p className="hint">点击下方按钮添加</p>
          </motion.div>
        ) : (
          <div className="items-list">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="item-row glass"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItem(item)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedItem && draggedItem.id !== item.id) {
                      onReorder(draggedItem.id, item.id)
                    }
                    setDraggedItem(null)
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <GripVertical className="drag-handle" size={18} />
                  <span className="item-preview-icon">{item.icon}</span>
                  <span className="item-preview-text">{item.text}</span>
                  <div className="item-actions">
                    <motion.button 
                      className="action-btn edit"
                      onClick={() => startEdit(item)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit3 size={16} />
                    </motion.button>
                    <motion.button 
                      className="action-btn delete"
                      onClick={() => handleDeleteItem(item.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 添加按钮 */}
      {!showAddForm && !editingItem && (
        <motion.button 
          className="add-item-btn glass"
          onClick={() => { setShowAddForm(true); setEditingItem(null); }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} /> 添加打卡事项
        </motion.button>
      )}
    </div>
  )
}