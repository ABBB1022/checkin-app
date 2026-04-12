import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Stats from './components/Stats'
import ItemManager from './components/ItemManager'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [items, setItems] = useState([])
  const [records, setRecords] = useState({})

  useEffect(() => {
    // 检查当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 加载用户的打卡事项
  useEffect(() => {
    if (user) {
      loadItems()
      loadRecords()
    }
  }, [user])

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (!error) setItems(data || [])
  }

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
    
    if (!error) {
      const recordsMap = {}
      data?.forEach(r => {
        const key = `${r.date}_${r.item_id}`
        recordsMap[key] = r
      })
      setRecords(recordsMap)
    }
  }

  const refreshData = () => {
    loadItems()
    loadRecords()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuth={() => {}} />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>每日打卡</h1>
        <button 
          className="logout-btn"
          onClick={() => supabase.auth.signOut()}
        >
          退出
        </button>
      </header>

      <main className="main-content">
        {activeTab === 'home' && (
          <Dashboard 
            items={items} 
            records={records}
            onRefresh={refreshData}
            user={user}
          />
        )}
        {activeTab === 'manage' && (
          <ItemManager 
            items={items} 
            onRefresh={refreshData}
          />
        )}
        {activeTab === 'stats' && (
          <Stats 
            items={items}
            records={records}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-label">打卡</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">事项</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">统计</span>
        </button>
      </nav>
    </div>
  )
}