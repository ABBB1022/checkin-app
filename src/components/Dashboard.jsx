import React, { useState } from 'react'
import { supabase } from '../supabase'
import { format, subDays, addDays } from 'date-fns'

export default function Dashboard({ items, records, onRefresh, user }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [noteModal, setNoteModal] = useState({ show: false, itemId: null, note: '' })
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === today
  const isPast = selectedDate < today

  const handleCheckin = async (itemId) => {
    const key = `${selectedDate}_${itemId}`
    const existing = records[key]

    if (existing) {
      // 取消打卡
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', existing.id)
      
      if (!error) {
        showToast('已取消打卡')
        onRefresh()
      }
    } else {
      // 打卡
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: user.id,
          item_id: itemId,
          date: selectedDate,
          note: ''
        })
      
      if (!error) {
        showToast('打卡成功！')
        onRefresh()
      }
    }
  }

  const handleAddNote = async () => {
    if (!noteModal.itemId) return

    const key = `${selectedDate}_${noteModal.itemId}`
    const existing = records[key]

    if (existing) {
      const { error } = await supabase
        .from('records')
        .update({ note: noteModal.note })
        .eq('id', existing.id)
      
      if (!error) {
        showToast('备注已保存')
        onRefresh()
      }
    }
    setNoteModal({ show: false, itemId: null, note: '' })
  }

  const completedCount = items.filter(item => {
    const key = `${selectedDate}_${item.id}`
    return records[key]
  }).length

  const progress = items.length > 0 ? (completedCount / items.length * 100).toFixed(0) : 0

  return (
    <div className="dashboard">
      {/* 日期选择器 */}
      <div className="date-header">
        <button 
          className="date-nav"
          onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
        >
          ◀
        </button>
        <div className="date-display" onClick={() => setShowDatePicker(!showDatePicker)}>
          {isToday ? '今天' : format(new Date(selectedDate), 'M月d日 EEEE', { locale: undefined })}
          {isPast && <span className="date-badge">补打卡</span>}
        </div>
        <button 
          className="date-nav"
          onClick={() => {
            const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd')
            if (next <= today) setSelectedDate(next)
          }}
          disabled={selectedDate === today}
        >
          ▶
        </button>
      </div>

      {showDatePicker && (
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => {
            setSelectedDate(e.target.value)
            setShowDatePicker(false)
          }}
          className="date-picker-input"
        />
      )}

      {/* 进度环 */}
      <div className="progress-section">
        <div className="progress-ring">
          <svg viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="#e0e0e0" 
              strokeWidth="8"
            />
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="#667eea" 
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.51} 251`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="progress-text">
            <span className="progress-value">{completedCount}/{items.length}</span>
            <span className="progress-label">今日完成</span>
          </div>
        </div>
      </div>

      {/* 打卡列表 */}
      <div className="checkin-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>还没有打卡事项</p>
            <p>点击下方「事项」添加</p>
          </div>
        ) : (
          items.map(item => {
            const key = `${selectedDate}_${item.id}`
            const isCompleted = records[key]
            const note = isCompleted?.note || ''

            return (
              <div key={item.id} className={`checkin-item ${isCompleted ? 'completed' : ''}`}>
                <div 
                  className="checkin-main"
                  onClick={() => handleCheckin(item.id)}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-text">{item.text}</span>
                  <span className="checkin-status">
                    {isCompleted ? '✓' : '○'}
                  </span>
                </div>
                {isCompleted && (
                  <div className="note-section">
                    <input
                      type="text"
                      placeholder="添加备注..."
                      value={note}
                      onChange={(e) => {
                        const newRecords = { ...records }
                        newRecords[key] = { ...newRecords[key], note: e.target.value }
                        // 本地更新
                      }}
                      onBlur={async (e) => {
                        if (e.target.value !== note) {
                          await supabase
                            .from('records')
                            .update({ note: e.target.value })
                            .eq('id', isCompleted.id)
                          onRefresh()
                        }
                      }}
                      className="note-input"
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Toast提示 */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  )
}