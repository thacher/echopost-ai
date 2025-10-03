'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import VideoUpload from './components/VideoUpload'
import VideoFormatDisplay from './components/VideoFormatDisplay'
import ContentGenerator from './components/ContentGenerator'
import PlatformSelector from './components/PlatformSelector'
import PostPreview from './components/PostPreview'
import Dashboard from './components/Dashboard'
import AIAgentsManager from './components/AIAgentsManager'
import { 
  CloudArrowUpIcon, 
  SparklesIcon, 
  ShareIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface UploadedFile {
  filename: string
  originalName: string
  url: string
  size: number
}

interface GeneratedContent {
  [platform: string]: {
    caption: string
    platform: string
    characterCount: number
  }
}

interface HashtagsData {
  [platform: string]: string[]
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'upload' | 'agents'>('dashboard')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({})
  const [hashtags, setHashtags] = useState<HashtagsData>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<any>(null)

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFile(file)
    // Could add logic here to automatically go to content generation
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Social AI Manager</h1>
                <p className="text-sm text-secondary-600">AI-powered content creation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentPage === 'dashboard' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage('upload')}
                    className="btn-outline"
                  >
                    Upload Video
                  </button>
                  <button
                    onClick={() => setCurrentPage('agents')}
                    className="btn-primary"
                  >
                    AI Agents
                  </button>
                </div>
              )}
              {currentPage === 'upload' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="btn-outline"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentPage('agents')}
                    className="btn-outline"
                  >
                    AI Agents
                  </button>
                </div>
              )}
              {currentPage === 'agents' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="btn-outline"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentPage('upload')}
                    className="btn-outline"
                  >
                    Upload Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentPage === 'dashboard' && (
            <Dashboard 
              onShowAgents={() => setCurrentPage('agents')} 
              onUploadVideo={() => setCurrentPage('upload')}
            />
          )}

          {currentPage === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                  Upload Your Video
                </h2>
                <p className="text-lg text-secondary-600">
                  Start by uploading the video you want to share across social media platforms
                </p>
              </div>
              <VideoUpload onFileUpload={handleFileUpload} />
            </div>
          )}

          {currentPage === 'agents' && (
            <AIAgentsManager />
          )}
        </motion.div>
      </main>
    </div>
  )
}
