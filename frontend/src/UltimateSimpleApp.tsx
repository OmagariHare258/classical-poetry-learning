function UltimateSimpleApp() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'red', 
      color: 'white',
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>测试页面 - 如果能看到这个红色背景，说明React正在工作</h1>
      <p>当前时间: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('按钮工作正常!')}>
          点击测试
        </button>
      </div>
    </div>
  )
}

export default UltimateSimpleApp
