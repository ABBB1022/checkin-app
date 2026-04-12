import React, { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Stats from './components/Stats'
import ItemManager from './components/ItemManager'
import { supabase } from './supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, ListBarChart, BarChart3 } from 'lucide-react'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [items, setItems] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [pendingChanges, setPendingChanges] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    
    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .order('sort_order', { ascending: true })
    
    const { data: recordsData } = await supabase.from('records').select('*')
    
    if (itemsData) setItems(itemsData)
    
    if (recordsData) {
      const recordsMap = {}
      recordsData.forEach(r => {
        recordsMap[`${r.date}_${r.item_id}`] = r
      })
      setRecords(recordsMap)
    }
    
    setLoading(false)
  }

  // 乐观更新：添加事项
  const addItem = async (text, icon) => {
    const maxId = Math.max(...items.map(i => i.id), 0)
    const maxOrder = Math.max(...items.map(i => i.sort_order), -1)
    const tempItem = { id: maxId + 1, text, icon, sort_order: maxOrder + 1 }
    
    // 立即更新UI
    setItems([...items, tempItem])
    
    // 后台写入
    const { data } = await supabase
      .from('items')
      .insert({ text, icon, sort_order: maxOrder + 1 })
      .select()
    
    // 用真实数据替换临时数据
    if (data) {
      setItems(prev => prev.map(item => 
        item.id === tempItem.id ? data[0] : item
      ))
    }
  }

  // 乐观更新：更新事项
  const updateItem = async (id, text, icon) => {
    const oldItem = items.find(i => i.id === id)
    setItems(items.map(item => item.id === id ? { ...item, text, icon } : item))
    
    await supabase.from('items').update({ text, icon }).eq('id', id)
  }

  // 乐观更新：删除事项
  const deleteItem = async (id) => {
    const oldItems = [...items]
    setItems(items.filter(item => item.id !== id))
    
    await supabase.from('items').delete().eq('id', id)
  }

  // 乐观更新：排序
  const reorderItems = async (draggedId, targetId) => {
    const draggedItem = items.find(i => i.id === draggedId)
    const targetItem = items.find(i => i.id === targetId)
    if (!draggedItem || !targetItem) return

    const newItems = items.map(item => {
      if (item.id === draggedId) return { ...item, sort_order: targetItem.sort_order }
      if (item.id === targetId) return { ...item, sort_order: draggedItem.sort_order }
      return item
    }).sort((a, b) => a.sort_order - b.sort_order)
    
    setItems(newItems)
    
    await supabase.from('items').update({ sort_order: targetItem.sort_order }).eq('id', draggedId)
    await supabase.from('items').update({ sort_order: draggedItem.sort_order }).eq('id', targetId)
  }

  // 乐观更新：打卡
  const toggleRecord = async (date, itemId) => {
    const key = `${date}_${itemId}`
    
    if (records[key]) {
      // 取消打卡
      const oldRecord = records[key]
      const newRecords = { ...records }
      delete newRecords[key]
      setRecords(newRecords)
      
      await supabase.from('records').delete().eq('id', oldRecord.id)
      return false
    } else {
      // 打卡
      const tempRecord = { item_id: itemId, date, note: '' }
      setRecords({ ...records, [key]: tempRecord })
      
      const { data } = await supabase
        .from('records')
        .insert({ item_id: itemId, date, note: '' })
        .select()
      
      if (data) {
        setRecords(prev => ({ ...prev, [key]: data[0] }))
      }
      return true
    }
  }

  // 更新备注
  const updateNote = async (date, itemId, note) => {
    const key = `${date}_${itemId}`
    if (records[key]) {
      setRecords(prev => ({ ...prev, [key]: { ...prev[key], note } }))
      await supabase.from('records').update({ note }).eq('id', records[key].id)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          加载中...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* 背景装饰 */}
      <div className="bg-gradient" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      
      {/* 头部 */}
      <motion.header 
        className="header glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1>每日打卡</h1>
        <div className="header-date">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
      </motion.header>

      {/* 主内容 */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Dashboard items={items} records={records} onToggleRecord={toggleRecord} onUpdateNote={updateNote} />
            </motion.div>
          )}
          {activeTab === 'manage' && (
            <motion.div
              key="manage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ItemManager items={items} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onReorder={reorderItems} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Stats items={items} records={records} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部导航 */}
      <nav className="bottom-nav glass">
        {[
          { id: 'home', icon: CheckSquare, label: '打卡' },
          { id: 'manage', icon: ListBarChart, label: '事项' },
          { id: 'stats', icon: BarChart3, label: '统计' }
        ].map(tab => (
          <motion.button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.9 }}
          >
            <tab.icon size={22} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="nav-indicator"
                layoutId="navIndicator"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </nav>
    </div>
  )
}