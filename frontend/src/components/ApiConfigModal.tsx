import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react'

interface ApiConfig {
  n8nUrl: string
  n8nApiKey: string
  deepseekApiKey: string
  imageServiceUrl: string
}

interface ApiConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ApiConfig) => void
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<ApiConfig>({
    n8nUrl: 'http://localhost:5678',
    n8nApiKey: '',
    deepseekApiKey: '',
    imageServiceUrl: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    n8nApiKey: false,
    deepseekApiKey: false
  })
  
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem('apiConfig')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('Failed to parse saved config:', error)
      }
    }
  }, [])

  const handleSave = () => {
    // 保存到localStorage
    localStorage.setItem('apiConfig', JSON.stringify(config))
    onSave(config)
    onClose()
  }

  const handleReset = () => {
    setConfig({
      n8nUrl: 'http://localhost:5678',
      n8nApiKey: '',
      deepseekApiKey: '',
      imageServiceUrl: ''
    })
    localStorage.removeItem('apiConfig')
  }

  const testConnection = async (service: string) => {
    setTesting(true)
    try {
      let url = ''
      
      switch (service) {
        case 'n8n':
          url = `${config.n8nUrl}/healthz`
          break
        case 'backend':
          url = '/api/health'
          break
        default:
          return
      }
      
      const response = await fetch(url)
      setTestResults(prev => ({ ...prev, [service]: response.ok }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [service]: false }))
    }
    setTesting(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">API 配置</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mt-2">配置外部服务API，提升学习体验</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* N8N配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">N8N 工作流服务</h3>
              <button
                onClick={() => testConnection('n8n')}
                disabled={testing}
                className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                <span>{testing ? '测试中...' : '测试连接'}</span>
                {testResults.n8n !== undefined && (
                  testResults.n8n ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )
                )}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N8N 服务地址
              </label>
              <input
                type="url"
                value={config.n8nUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, n8nUrl: e.target.value }))}
                placeholder="http://localhost:5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N8N API Key (可选)
              </label>
              <div className="relative">
                <input
                  type={showPasswords.n8nApiKey ? "text" : "password"}
                  value={config.n8nApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, n8nApiKey: e.target.value }))}
                  placeholder="n8n_api_key_here"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, n8nApiKey: !prev.n8nApiKey }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.n8nApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* DeepSeek AI配置 */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">DeepSeek AI 服务 (主要)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
              </label>
              <div className="relative">
                <input
                  type={showPasswords.deepseekApiKey ? "text" : "password"}
                  value={config.deepseekApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, deepseekApiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, deepseekApiKey: !prev.deepseekApiKey }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.deepseekApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">用于AI智能分析和古诗文内容生成</p>
            </div>
          </div>

          {/* 图片服务配置 */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">图片服务 (可选)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义图片服务地址
              </label>
              <input
                type="url"
                value={config.imageServiceUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, imageServiceUrl: e.target.value }))}
                placeholder="https://your-image-service.com/api"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">留空则使用默认图片服务</p>
            </div>
          </div>

          {/* 后端连接测试 */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">后端服务状态</h3>
              <button
                onClick={() => testConnection('backend')}
                disabled={testing}
                className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                <span>{testing ? '测试中...' : '检查状态'}</span>
                {testResults.backend !== undefined && (
                  testResults.backend ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiConfigModal
