import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Stats from './components/Stats'
import ItemManager from './components/ItemManager'
import { supabase } from './supabase'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [items, setItems] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (itemsData) setItems(itemsData)

    const { data: recordsData } = await supabase
      .from('records')
      .select('*')
    
    if (recordsData) {
      const recordsMap = {}
      recordsData.forEach(r => {
        recordsMap[`${r.date}_${r.item_id}`] = r
      })
      setRecords(recordsMap)
    }
    
    setLoading(false)
  }

  const addItem = async (text, icon) => {
    const maxOrder = Math.max(...items.map(i => i.sort_order), -1)
    const { data } = await supabase
      .from('items')
      .insert({ text, icon, sort_order: maxOrder + 1 })
      .select()
    
    if (data) setItems([...items, ...data])
  }

  const updateItem = async (id, text, icon) => {
    await supabase.from('items').update({ text, icon }).eq('id', id)
    setItems(items.map(item => item.id === id ? { ...item, text, icon } : item))
  }

  const deleteItem = async (id) => {
    await supabase.from('items').delete().eq('id', id)
    loadData()
  }

  const reorderItems = async (draggedId, targetId) => {
    const draggedItem = items.find(i => i.id === draggedId)
    const targetItem = items.find(i => i.id === targetId)
    if (!draggedItem || !targetItem) return

    await supabase.from('items').update({ sort_order: targetItem.sort_order }).eq('id', draggedId)
    await supabase.from('items').update({ sort_order: draggedItem.sort_order }).eq('id', targetId)
    loadData()
  }

  const toggleRecord = async (date, itemId) => {
    const key = `${date}_${itemId}`
    
    if (records[key]) {
      await supabase.from('records').delete().eq('id', records[key].id)
      loadData()
      return false
    } else {
      await supabase.from('records').insert({ item_id: itemId, date, note: '' })
      loadData()
      return true
    }
  }

  const updateNote = async (date, itemId, note) => {
    const key = `${date}_${itemId}`
    if (records[key]) {
      await supabase.from('records').update({ note }).eq('id', records[key].id)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏃 每日打卡</h1>
      </header>

      <main className="main-content">
        {activeTab === 'home' && <Dashboard items={items} records={records} onToggleRecord={toggleRecord} onUpdateNote={updateNote} />}
        {activeTab === 'manage' && <ItemManager items={items} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onReorder={reorderItems} />}
        {activeTab === 'stats' && <Stats items={items} records={records} />}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <span className="nav-icon">✅</span><span className="nav-label">打卡</span>
        </button>
        <button className={`nav-item ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
          <span className="nav-icon">📋</span><span className="nav-label">事项</span>
        </button>
        <button className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <span className="nav-icon">📊</span><span className="nav-label">统计</span>
        </button>
      </nav>
    </div>
  )
}