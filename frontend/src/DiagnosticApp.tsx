import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  translation?: string
}

const DiagnosticApp: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        console.log('开始获取诗词数据...')
        const response = await axios.get('/api/poems?limit=5')
        console.log('API响应:', response.data)
        
        if (response.data.success) {
          setPoems(response.data.data)
          console.log('诗词数据设置成功:', response.data.data.length)
        } else {
          setError('API返回了错误状态')
        }
      } catch (err) {
        console.error('获取诗词失败:', err)
        setError(`API请求失败: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPoems()
  }, [])

  console.log('组件渲染状态:', { loading, error, poemsCount: poems.length })

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🎯 古诗文学习平台</h1>
        <p>正在加载诗词数据...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>🎯 古诗文学习平台</h1>
        <h2>❌ 加载错误</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>🎯 古诗文学习平台</h1>
      
      <div style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>✅ 数据加载成功！</h2>
        <p>共获取到 {poems.length} 首诗词</p>
      </div>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <h3>📚 诗词列表：</h3>
        {poems.map((poem, index) => (
          <div key={poem.id} style={{ 
            background: 'white', 
            margin: '10px 0', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
              {index + 1}. {poem.title} - {poem.author} ({poem.dynasty})
            </h4>
            <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{poem.content}</p>
            {poem.translation && (
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                💭 {poem.translation}
              </p>
            )}
            <span style={{ 
              display: 'inline-block', 
              background: poem.difficulty === 'easy' ? '#4CAF50' : poem.difficulty === 'medium' ? '#FF9800' : '#F44336',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {poem.difficulty}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a 
          href="/test-api.html" 
          style={{ 
            display: 'inline-block', 
            background: '#007cba', 
            color: 'white', 
            padding: '10px 15px', 
            textDecoration: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          API测试页面
        </a>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          刷新数据
        </button>
      </div>
    </div>
  )
}

export default DiagnosticApp
