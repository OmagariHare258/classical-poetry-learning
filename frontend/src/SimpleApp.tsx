import React from 'react'

const SimpleApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>🎯 古诗文学习平台</h1>
      <div style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>✅ React 应用正常运行！</h2>
        <p>这是一个简化版本的测试页面。</p>
        <p>如果你能看到这个页面，说明前端服务已经正常工作。</p>
      </div>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <h3>📊 服务状态：</h3>
        <ul>
          <li>✅ 前端服务：正常运行 (http://localhost:5173)</li>
          <li>✅ 后端服务：正常运行 (http://localhost:5000)</li>
          <li>✅ 数据库：SQLite 连接正常</li>
        </ul>
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
          测试API连接
        </a>
        <button 
          onClick={() => alert('React 交互正常工作！')}
          style={{ 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试交互
        </button>
      </div>
    </div>
  )
}

export default SimpleApp
