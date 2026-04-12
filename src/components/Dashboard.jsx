import React, { useState } from 'react'
import { format, subDays, addDays } from 'date-fns'

export default function Dashboard({ items, records, onToggleRecord, onUpdateNote }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === today

  const handleCheckin = async (itemId) => {
    const result = await onToggleRecord(selectedDate, itemId)
    showToast(result ? '✅ 打卡成功' : '已取消打卡')
  }

  const completedCount = items.filter(item => {
    return records[`${selectedDate}_${item.id}`]
  }).length

  const progress = items.length > 0 ? (completedCount / items.length * 100).toFixed(0) : 0

  return (
    <div className="dashboard">
      <div className="date-header">
        <button className="date-nav" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>◀</button>
        <div className="date-display">
          {isToday ? '今天' : format(new Date(selectedDate), 'M月d日')}
          {selectedDate < today && <span className="date-badge">补打卡</span>}
        </div>
        <button className="date-nav" onClick={() => {
          const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd')
          if (next <= today) setSelectedDate(next)
        }} disabled={selectedDate === today}>▶</button>
      </div>

      <div className="progress-section">
        <div className="progress-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#667eea" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${progress * 2.51} 251`} transform="rotate(-90 50 50)" />
          </svg>
          <div className="progress-text">
            <span className="progress-value">{completedCount}/{items.length}</span>
            <span className="progress-label">今日完成</span>
          </div>
        </div>
      </div>

      <div className="checkin-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>还没有打卡事项</p>
            <p>点击下方「事项」添加</p>
          </div>
        ) : (
          items.map(item => {
            const record = records[`${selectedDate}_${item.id}`]
            return (
              <div key={item.id} className={`checkin-item ${record ? 'completed' : ''}`}>
                <div className="checkin-main" onClick={() => handleCheckin(item.id)}>
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-text">{item.text}</span>
                  <span className="checkin-status">{record ? '✓' : '○'}</span>
                </div>
                {record && (
                  <div className="note-section">
                    <input type="text" placeholder="添加备注..." defaultValue={record.note || ''}
                      onBlur={(e) => onUpdateNote(selectedDate, item.id, e.target.value)}
                      className="note-input" />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}