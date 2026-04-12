import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, isSameMonth, subMonths } from 'date-fns'

export default function Stats({ items, records }) {
  const [viewMode, setViewMode] = useState('calendar') // calendar | chart
  const [selectedItem, setSelectedItem] = useState('all')
  const [dateRange, setDateRange] = useState('all') // all | month | year
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // 计算统计数据
  const stats = useMemo(() => {
    const recordList = Object.values(records)
    const today = new Date()
    
    // 累计打卡天数
    const uniqueDays = new Set(recordList.map(r => r.date))
    const totalDays = uniqueDays.size
    
    // 累计完成次数
    const totalRecords = recordList.length
    
    // 连续打卡天数
    let streak = 0
    let checkDate = new Date()
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const dayRecords = recordList.filter(r => r.date === dateStr)
      if (dayRecords.length === items.length && items.length > 0) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else if (dayRecords.length > 0 || format(checkDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else {
        break
      }
    }
    
    return { totalDays, totalRecords, streak }
  }, [items, records])

  // 日历数据
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
        date: day,
        dateStr,
        completed: dayRecords.length,
        total: items.length,
        isToday: format(new Date(), 'yyyy-MM-dd') === dateStr
      }
    })
  }, [calendarMonth, items.length, records])

  // 趋势图数据
  const chartData = useMemo(() => {
    const today = new Date()
    let startDate
    
    switch (dateRange) {
      case 'month':
        startDate = startOfMonth(today)
        break
      case 'year':
        startDate = startOfYear(today)
        break
      default:
        // 从第一条记录开始
        const recordDates = Object.keys(records).map(k => k.split('_')[0]).filter(Boolean)
        startDate = recordDates.length > 0 
          ? new Date(Math.min(...recordDates.map(d => new Date(d).getTime())))
          : subMonths(today, 1)
    }

    const days = eachDayOfInterval({ start: startDate, end: today })
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      let count = 0
      
      if (selectedItem === 'all') {
        count = Object.values(records).filter(r => r.date === dateStr).length
      } else {
        const key = `${dateStr}_${selectedItem}`
        count = records[key] ? 1 : 0
      }
      
      return {
        date: format(day, 'M/d'),
        count
      }
    })
  }, [dateRange, selectedItem, records])

  // 每项任务的完成次数
  const itemStats = useMemo(() => {
    return items.map(item => {
      const count = Object.values(records).filter(r => r.item_id === item.id).length
      return { ...item, count }
    }).sort((a, b) => b.count - a.count)
  }, [items, records])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="stats-page">
      {/* 概览卡片 */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalDays}</div>
          <div className="stat-label">累计打卡天数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalRecords}</div>
          <div className="stat-label">累计完成次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">连续打卡天数</div>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="view-tabs">
        <button 
          className={`tab ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          📅 日历视图
        </button>
        <button 
          className={`tab ${viewMode === 'chart' ? 'active' : ''}`}
          onClick={() => setViewMode('chart')}
        >
          📈 趋势图
        </button>
      </div>

      {/* 日历视图 */}
      {viewMode === 'calendar' && (
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>◀</button>
            <span>{format(calendarMonth, 'yyyy年M月')}</span>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>▶</button>
          </div>
          
          <div className="calendar-grid">
            {weekDays.map(d => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))}
            {calendarData.map(day => (
              <div 
                key={day.dateStr} 
                className={`calendar-day ${day.isToday ? 'today' : ''} ${day.completed === day.total && day.total > 0 ? 'full' : day.completed > 0 ? 'partial' : ''}`}
              >
                <span className="day-num">{format(day.date, 'd')}</span>
                {day.completed > 0 && (
                  <span className="day-progress">{day.completed}/{day.total}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 趋势图 */}
      {viewMode === 'chart' && (
        <div className="chart-section">
          <div className="chart-filters">
            <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
              <option value="all">全部事项</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.icon} {item.text}</option>
              ))}
            </select>
            
            <div className="date-range-btns">
              <button 
                className={dateRange === 'all' ? 'active' : ''}
                onClick={() => setDateRange('all')}
              >
                全部
              </button>
              <button 
                className={dateRange === 'month' ? 'active' : ''}
                onClick={() => setDateRange('month')}
              >
                本月
              </button>
              <button 
                className={dateRange === 'year' ? 'active' : ''}
                onClick={() => setDateRange('year')}
              >
                本年
              </button>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 任务完成排行 */}
          <div className="item-ranking">
            <h3>任务完成排行</h3>
            {itemStats.map(item => (
              <div key={item.id} className="ranking-item">
                <span className="ranking-icon">{item.icon}</span>
                <span className="ranking-text">{item.text}</span>
                <span className="ranking-count">{item.count}次</span>
                <div className="ranking-bar">
                  <div 
                    className="ranking-bar-fill" 
                    style={{ width: `${itemStats.length > 0 ? (item.count / itemStats[0].count * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}