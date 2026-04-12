import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react'

export default function Dashboard({ items, records, onToggleRecord, onUpdateNote }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [toast, setToast] = useState('')
  const [animatingItem, setAnimatingItem] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === today

  const handleCheckin = async (itemId) => {
    setAnimatingItem(itemId)
    const result = await onToggleRecord(selectedDate, itemId)
    showToast(result ? '✨ 打卡成功' : '已取消')
    setTimeout(() => setAnimatingItem(null), 500)
  }

  const completedCount = items.filter(item => records[`${selectedDate}_${item.id}`]).length
  const progress = items.length > 0 ? (completedCount / items.length) : 0

  return (
    <div className="dashboard">
      {/* 日期选择器 */}
      <motion.div 
        className="date-selector glass"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.button 
          className="date-btn"
          onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        
        <div className="date-display">
          <Calendar size={16} />
          <span>{isToday ? '今天' : format(new Date(selectedDate), 'M月d日')}</span>
          {selectedDate < today && <span className="badge">补打卡</span>}
        </div>
        
        <motion.button 
          className="date-btn"
          onClick={() => {
            const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd')
            if (next <= today) setSelectedDate(next)
          }}
          disabled={selectedDate === today}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </motion.div>

      {/* 进度环 */}
      <motion.div 
        className="progress-section"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            <motion.circle 
              cx="100" cy="100" r="85" 
              fill="none" 
              stroke="url(#progressGradient)" 
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={534}
              animate={{ strokeDashoffset: 534 * (1 - progress) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          <div className="progress-content">
            <motion.span 
              className="progress-value"
              key={completedCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
            >
              {completedCount}
            </motion.span>
            <span className="progress-total">/ {items.length}</span>
            <span className="progress-label">已完成</span>
          </div>
        </div>
      </motion.div>

      {/* 打卡列表 */}
      <div className="checkin-list">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div 
              className="empty-state glass"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles size={40} opacity={0.5} />
              <p>还没有打卡事项</p>
              <p className="hint">点击下方「事项」添加</p>
            </motion.div>
          ) : (
            items.map((item, index) => {
              const record = records[`${selectedDate}_${item.id}`]
              return (
                <motion.div
                  key={item.id}
                  className={`checkin-card glass ${record ? 'completed' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="checkin-content" onClick={() => handleCheckin(item.id)}>
                    <motion.span 
                      className="item-icon"
                      animate={animatingItem === item.id ? { scale: [1, 1.3, 1] } : {}}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="item-text">{item.text}</span>
                    <motion.div 
                      className={`check-box ${record ? 'checked' : ''}`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {record && (
                        <motion.svg
                          viewBox="0 0 24 24"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.path
                            d="M5 13l4 4L19 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {record && (
                      <motion.div
                        className="note-section"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <input
                          type="text"
                          placeholder="添加备注..."
                          defaultValue={record.note || ''}
                          onBlur={(e) => onUpdateNote(selectedDate, item.id, e.target.value)}
                          className="note-input"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast glass"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}