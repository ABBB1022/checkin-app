import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Stats from './components/Stats'
import ItemManager from './components/ItemManager'
import { db, COLLECTIONS } from './cloudbase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, BarChart3 } from 'lucide-react'
import './App.css'
import { db, COLLECTIONS, signInAnonymously } from './cloudbase'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [items, setItems] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)

// 在 useEffect 里先登录再加载数据
useEffect(() => {
  const init = async () => {
    try {
      await signInAnonymously()
      await loadData()
    } catch (error) {
      console.error('初始化失败:', error)
      setLoading(false)
    }
  }
  init()
}, [])
  
  // 加载数据
  const loadData = async () => {
    setLoading(true)
    
    const itemsRes = await db.collection(COLLECTIONS.ITEMS)
      .orderBy('sort_order', 'asc')
      .get()
    
    const recordsRes = await db.collection(COLLECTIONS.RECORDS).get()
    
    if (itemsRes.data) setItems(itemsRes.data)
    
    if (recordsRes.data) {
      const recordsMap = {}
      recordsRes.data.forEach(r => {
        recordsMap[`${r.date}_${r.item_id}`] = r
      })
      setRecords(recordsMap)
    }
    
    setLoading(false)
  }

  // 添加事项
  const addItem = async (text, icon) => {
    const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : -1
    const newItem = { id: maxId + 1, text, icon, sort_order: maxOrder + 1 }
    
    setItems([...items, newItem])
    await db.collection(COLLECTIONS.ITEMS).add(newItem)
  }

  // 更新事项
  const updateItem = async (id, text, icon) => {
    setItems(items.map(item => item.id === id ? { ...item, text, icon } : item))
    
    const item = items.find(i => i.id === id)
    if (item && item._id) {
      await db.collection(COLLECTIONS.ITEMS).doc(item._id).update({ text, icon })
    }
  }

  // 删除事项
  const deleteItem = async (id) => {
    setItems(items.filter(item => item.id !== id))
    
    const item = items.find(i => i.id === id)
    if (item && item._id) {
      await db.collection(COLLECTIONS.ITEMS).doc(item._id).remove()
    }
  }

  // 排序
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
    
    if (draggedItem._id) {
      await db.collection(COLLECTIONS.ITEMS).doc(draggedItem._id).update({ sort_order: targetItem.sort_order })
    }
    if (targetItem._id) {
      await db.collection(COLLECTIONS.ITEMS).doc(targetItem._id).update({ sort_order: draggedItem.sort_order })
    }
  }

  // 打卡
  const toggleRecord = async (date, itemId) => {
    const key = `${date}_${itemId}`
    
    if (records[key]) {
      const oldRecord = records[key]
      const newRecords = { ...records }
      delete newRecords[key]
      setRecords(newRecords)
      
      if (oldRecord._id) {
        await db.collection(COLLECTIONS.RECORDS).doc(oldRecord._id).remove()
      }
      return false
    } else {
      const newRecord = { item_id: itemId, date, note: '' }
      setRecords({ ...records, [key]: newRecord })
      
      const res = await db.collection(COLLECTIONS.RECORDS).add(newRecord)
      if (res.id) {
        setRecords(prev => ({ ...prev, [key]: { ...newRecord, _id: res.id } }))
      }
      return true
    }
  }

  // 更新备注
  const updateNote = async (date, itemId, note) => {
    const key = `${date}_${itemId}`
    if (records[key]) {
      setRecords(prev => ({ ...prev, [key]: { ...prev[key], note } }))
      
      if (records[key]._id) {
        await db.collection(COLLECTIONS.RECORDS).doc(records[key]._id).update({ note })
      }
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
      <div className="bg-gradient" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      
      <motion.header 
        className="header glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1>每日打卡</h1>
        <div className="header-date">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
      </motion.header>

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

      <nav className="bottom-nav glass">
        {[
          { id: 'home', icon: CheckSquare, label: '打卡' },
          { id: 'manage', icon: BarChart3, label: '事项' },
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
