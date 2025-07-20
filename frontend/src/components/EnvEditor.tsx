import React, { useState, useEffect } from 'react'
import { X, Save, FileText, AlertTriangle, Download, Upload } from 'lucide-react'
import axios from 'axios'

interface EnvEditorProps {
  isOpen: boolean
  onClose: () => void
}

const EnvEditor: React.FC<EnvEditorProps> = ({ isOpen, onClose }) => {
  const [envContent, setEnvContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [originalContent, setOriginalContent] = useState('')

  // 获取 .env 文件内容
  const fetchEnvContent = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/config/env')
      const content = response.data.content || ''
      setEnvContent(content)
      setOriginalContent(content)
      setHasChanges(false)
    } catch (error: any) {
      console.error('获取.env文件失败:', error)
      setError(error.response?.data?.error || '获取配置文件失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存 .env 文件
  const saveEnvContent = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await axios.post('/api/config/env', { content: envContent })
      setSuccess('配置文件保存成功！服务器将在几秒后重启生效。')
      setOriginalContent(envContent)
      setHasChanges(false)
      
      // 3秒后自动关闭成功提示
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (error: any) {
      console.error('保存.env文件失败:', error)
      setError(error.response?.data?.error || '保存配置文件失败')
    } finally {
      setSaving(false)
    }
  }

  // 下载 .env 文件
  const downloadEnvFile = () => {
    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 上传 .env 文件
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setEnvContent(content)
      setHasChanges(content !== originalContent)
    }
    reader.readAsText(file)
  }

  // 处理内容变化
  const handleContentChange = (value: string) => {
    setEnvContent(value)
    setHasChanges(value !== originalContent)
    setError('')
    setSuccess('')
  }

  // 重置更改
  const resetChanges = () => {
    setEnvContent(originalContent)
    setHasChanges(false)
    setError('')
    setSuccess('')
  }

  // 组件打开时获取内容
  useEffect(() => {
    if (isOpen) {
      fetchEnvContent()
    }
  }, [isOpen])

  // 关闭时检查未保存的更改
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('您有未保存的更改，确定要关闭吗？')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">环境配置编辑器</h2>
            {hasChanges && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                未保存
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={saveEnvContent}
              disabled={saving || !hasChanges}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中...' : '保存配置'}</span>
            </button>

            {hasChanges && (
              <button
                onClick={resetChanges}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <span>重置更改</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={downloadEnvFile}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>下载</span>
            </button>

            <label className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>上传</span>
              <input
                type="file"
                accept=".env,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 状态提示 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4 text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* 编辑器 */}
        <div className="flex-1 p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">加载配置文件...</span>
            </div>
          ) : (
            <textarea
              value={envContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="# 环境配置文件内容将在这里显示..."
              spellCheck={false}
            />
          )}
        </div>

        {/* 底部说明 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <p>💡 <strong>提示：</strong>编辑环境配置文件时请小心，错误的配置可能导致服务无法启动。</p>
            <p>🔄 保存后服务器将自动重启以使新配置生效。</p>
            <p>📁 支持上传和下载 .env 文件进行备份和恢复。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnvEditor
