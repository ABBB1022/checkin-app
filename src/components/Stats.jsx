import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { format, eachDayOfInterval, subMonths, subDays } from 'date-fns'
import { TrendingUp, Calendar, Flame, Target, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Stats({ items, records }) {
  const [viewMode, setViewMode] = useState('calendar')
  const [selectedItem, setSelectedItem] = useState('all')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const stats = useMemo(() => {
    const recordList = Object.values(records)
    const uniqueDays = new Set(recordList.map(r => r.date))
    
    let streak = 0
    let checkDate = new Date()
    const today = format(new Date(), 'yyyy-MM-dd')
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const dayRecords = recordList.filter(r => r.date === dateStr)
      if (dayRecords.length === items.length && items.length > 0) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else if (dayRecords.length > 0 || dateStr === today) {
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else {
        break
      }
    }
    
    return { totalDays: uniqueDays.size, totalRecords: recordList.length, streak }
  }, [items, records])

  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = eachDayOfInterval({ start: firstDay, end: lastDay })
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayRecords = Object.values(records).filter(r => r.date === dateStr)
      return {
        date: day, dateStr,
        completed: dayRecords.length, total: items.length,
        isToday: format(new Date(), 'yyyy-MM-dd') === dateStr
      }
    })
  }, [calendarMonth, items.length, records])

  const chartData = useMemo(() => {
    const today = new Date()
    const startDate = subMonths(today, 1)
    const days = eachDayOfInterval({ start: startDate, end: today })
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      let count = selectedItem === 'all'
        ? Object.values(records).filter(r => r.date === dateStr).length
        : (records[`${dateStr}_${selectedItem}`] ? 1 : 0)
      return { date: format(day, 'M/d'), count }
    })
  }, [selectedItem, records])

  const itemStats = useMemo(() => {
    return items.map(item => {
      const count = Object.values(records).filter(r => r.item_id === item.id).length
      return { ...item, count }
    }).sort((a, b) => b.count - a.count)
  }, [items, records])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="stats-page">
      {/* 统计卡片 */}
      <div className="stats-grid">
        {[
          { icon: Calendar, label: '累计天数', value: stats.totalDays, color: '#6366f1' },
          { icon: Target, label: '完成次数', value: stats.totalRecords, color: '#8b5cf6' },
          { icon: Flame, label: '连续打卡', value: stats.streak, color: '#f59e0b' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <stat.icon size={24} style={{ color: stat.color }} />
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 视图切换 */}
      <div className="view-switch glass">
        <motion.button
          className={`switch-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
          whileTap={{ scale: 0.95 }}
        >
          <Calendar size={18} /> 日历
        </motion.button>
        <motion.button
          className={`switch-btn ${viewMode === 'chart' ? 'active' : ''}`}
          onClick={() => setViewMode('chart')}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp size={18} /> 趋势
        </motion.button>
      </div>

      {/* 日历视图 */}
      {viewMode === 'calendar' && (
        <motion.div
          className="calendar-section glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="calendar-header">
            <motion.button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} whileTap={{ scale: 0.9 }}>
              <ChevronLeft size={20} />
            </motion.button>
            <span>{format(calendarMonth, 'yyyy年M月')}</span>
            <motion.button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} whileTap={{ scale: 0.9 }}>
              <ChevronRight size={20} />
            </motion.button>
          </div>
          
          <div className="calendar-grid">
            {weekDays.map(d => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty" />
            ))}
            {calendarData.map((day, index) => {
              const ratio = items.length > 0 ? day.completed / items.length : 0
              return (
                <motion.div
                  key={day.dateStr}
                  className={`calendar-day ${day.isToday ? 'today' : ''} ${ratio === 1 ? 'full' : ratio > 0 ? 'partial' : ''}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="day-num">{format(day.date, 'd')}</span>
                  {day.completed > 0 && (
                    <span className="day-progress">{day.completed}/{day.total}</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* 趋势图 */}
      {viewMode === 'chart' && (
        <motion.div
          className="chart-section glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <select 
            value={selectedItem} 
            onChange={(e) => setSelectedItem(e.target.value)}
            className="chart-select"
          >
            <option value="all">全部事项</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.icon} {item.text}</option>
            ))}
          </select>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#chartGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 排行榜 */}
          <div className="ranking-section">
            <h3>任务完成排行</h3>
            {itemStats.map((item, index) => (
              <motion.div
                key={item.id}
                className="ranking-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="ranking-icon">{item.icon}</span>
                <span className="ranking-text">{item.text}</span>
                <span className="ranking-count">{item.count}次</span>
                <div className="ranking-bar">
                  <motion.div
                    className="ranking-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${itemStats.length > 0 ? (item.count / Math.max(...itemStats.map(i => i.count), 1) * 100) : 0}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}