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
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({})
  const [hashtags, setHashtags] = useState<HashtagsData>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<any>(null)

  const steps = [
    { id: 1, name: 'Upload Video', icon: CloudArrowUpIcon },
    { id: 2, name: 'Generate Content', icon: SparklesIcon },
    { id: 3, name: 'Review & Post', icon: ShareIcon },
    { id: 4, name: 'Dashboard', icon: ChartBarIcon },
  ]

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFile(file)
    setCurrentStep(2)
  }

  const handleFormatDetected = (format: string, metadata: any) => {
    setDetectedFormat(format)
    setVideoMetadata(metadata)
    
    // Auto-select all platforms (but don't override user's selection if they've already selected)
    console.log('Format detected:', { format, currentSelection: selectedPlatforms })
    if (selectedPlatforms.length === 0) {
      console.log('Auto-selecting all platforms')
      setSelectedPlatforms(['facebook', 'instagram', 'tiktok', 'youtube'])
    } else {
      console.log('Keeping existing selection:', selectedPlatforms)
    }
  }

  const handleProcessForPlatforms = async () => {
    if (!uploadedFile || !selectedPlatforms || selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(`/api/upload/video/${uploadedFile.filename}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selectedPlatforms })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Started processing for ${selectedPlatforms.length} platform(s)`)
      } else {
        toast.error(data.error || 'Failed to start processing')
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Failed to start processing')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContentGenerated = (content: GeneratedContent, generatedHashtags: HashtagsData) => {
    setGeneratedContent(content)
    setHashtags(generatedHashtags)
    setCurrentStep(3)
  }

  const handlePostSuccess = () => {
    setCurrentStep(4)
  }

  const resetWorkflow = () => {
    setCurrentStep(1)
    setUploadedFile(null)
    setGeneratedContent({})
    setHashtags({})
    setSelectedPlatforms([])
    setDetectedFormat(null)
    setVideoMetadata(null)
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
            
            <button
              onClick={resetWorkflow}
              className="btn-outline"
            >
              New Post
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: currentStep >= step.id ? 1 : 0.8,
                    opacity: currentStep >= step.id ? 1 : 0.5
                  }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                      : 'bg-white border-secondary-300 text-secondary-500'
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </motion.div>
                <span className={`ml-3 text-sm font-medium hidden sm:block ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-secondary-500'
                }`}>
                  {step.name}
                </span>
                {stepIdx < steps.length - 1 && (
                  <div className={`ml-8 w-16 h-0.5 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-secondary-300'
                  }`} />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentStep === 1 && (
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

          {currentStep === 2 && uploadedFile && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <VideoFormatDisplay
                  videoFile={uploadedFile}
                  selectedPlatforms={selectedPlatforms}
                  onFormatDetected={handleFormatDetected}
                  onProcessingStart={() => setIsGenerating(true)}
                />
                
                <div className="card mt-6">
                  <PlatformSelector
                    selectedPlatforms={selectedPlatforms}
                    onPlatformsChange={setSelectedPlatforms}
                    disabled={isGenerating}
                  />
                </div>
              </div>
              
              <div>
                <ContentGenerator
                  videoFile={uploadedFile}
                  selectedPlatforms={selectedPlatforms}
                  onContentGenerated={handleContentGenerated}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                />
                
                {detectedFormat && (
                  <div className="card mt-6">
                    <button
                      onClick={handleProcessForPlatforms}
                      disabled={isGenerating || selectedPlatforms.length === 0}
                      className={`w-full px-6 py-4 rounded-lg font-semibold text-white transition-all duration-300 ${
                        isGenerating || selectedPlatforms.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg transform hover:scale-[1.02]'
                      }`}
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Process for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <PostPreview
              videoFile={uploadedFile}
              content={generatedContent}
              hashtags={hashtags}
              selectedPlatforms={selectedPlatforms}
              onPostSuccess={handlePostSuccess}
            />
          )}

          {currentStep === 4 && (
            <Dashboard />
          )}
        </motion.div>
      </main>
    </div>
  )
}
