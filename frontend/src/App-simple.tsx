function App() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef7cd, #fed7aa, #fecaca)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          color: '#dc2626',
          fontSize: '2.5em',
          marginBottom: '20px',
          fontWeight: '600' 
        }}>
          🏮 古诗词学习平台
        </h1>
        
        <div style={{
          background: '#d1fae5',
          color: '#065f46',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #34d399',
          marginBottom: '20px'
        }}>
          ✅ React应用启动成功！
        </div>
        
        <div style={{
          background: '#fef3c7',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{
            fontSize: '1.2em',
            lineHeight: '1.8',
            color: '#374151'
          }}>
            静夜思<br />
            李白<br /><br />
            床前明月光，疑是地上霜。<br />
            举头望明月，低头思故乡。
          </div>
        </div>
        
        <div style={{
          background: '#dbeafe',
          color: '#1e40af',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #60a5fa'
        }}>
          📋 简化版React应用正在运行<br />
          如果看到这个页面，说明React基础功能正常
        </div>
      </div>
    </div>
  )
}

export default App
