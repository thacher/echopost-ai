'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  VideoCameraIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TvIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface VideoMetadata {
  width: number
  height: number
  duration: number
  aspectRatio: number
  fps: number
  codec: string
  bitrate: number
  fileSize: number
}

interface ProcessingResults {
  original: {
    metadata: VideoMetadata
    cameraFormat: string
  }
  processed: {
    [key: string]: {
      width: number
      height: number
      aspectRatio: string
      url: string
      config: any
      error?: string
      processedAt?: string
    }
  }
}

interface VideoFormatDisplayProps {
  videoFile: {
    filename: string
    originalName: string
    url: string
    size: number
  }
  selectedPlatforms: string[]
  onFormatDetected?: (format: string, metadata: VideoMetadata) => void
  onProcessingStart?: () => void

}

const formatLabels: { [key: string]: { name: string, icon: any, color: string, description: string } } = {
  'portrait': {
    name: 'Portrait (9:16)',
    icon: DevicePhoneMobileIcon,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Perfect for TikTok, Instagram Reels, YouTube Shorts'
  },
  'landscape_hd': {
    name: 'Landscape HD (16:9)',
    icon: ComputerDesktopIcon,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Perfect for YouTube, Facebook, desktop viewing'
  },
  'landscape_sd': {
    name: 'Landscape SD (16:9)',
    icon: TvIcon,
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Good for Facebook, YouTube, TV viewing'
  },
  'square': {
    name: 'Square (1:1)',
    icon: VideoCameraIcon,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    description: 'Perfect for Instagram feed posts'
  },
  'standard': {
    name: 'Standard (4:3)',
    icon: TvIcon,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: 'Classic TV format, good for older content'
  },
  'ultrawide': {
    name: 'Ultra-wide',
    icon: ComputerDesktopIcon,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Cinematic format, great for creative content'
  },
  'custom': {
    name: 'Custom Format',
    icon: VideoCameraIcon,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Custom aspect ratio'
  }
}

export default function VideoFormatDisplay({ 
  videoFile, 
  selectedPlatforms, 
  onFormatDetected, 
  onProcessingStart
}: VideoFormatDisplayProps) {
  const [processingStatus, setProcessingStatus] = useState<'loading' | 'analyzing' | 'analyzed' | 'processing' | 'completed' | 'failed'>('loading')
  const [results, setResults] = useState<ProcessingResults | null>(null)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!videoFile?.filename) return

    const checkProcessingStatus = async () => {
      try {
        const response = await fetch(`/api/upload/video/${videoFile.filename}/status`)
        const data = await response.json()

        if (data.success) {
          setProcessingStatus(data.status)
          
          if (data.results) {
            setResults(data.results)
            if (onFormatDetected && data.results.original) {
              onFormatDetected(
                data.results.original.cameraFormat, 
                data.results.original.metadata
              )
            }
          }
        } else {
          setProcessingStatus('failed')
          setError(data.error?.error || 'Processing failed')
        }
      } catch (err) {
        console.error('Error checking status:', err)
        setError('Failed to check processing status')
        setProcessingStatus('failed')
      }
    }

    // Initial check
    checkProcessingStatus()

    // Poll for updates if still processing
    const interval = setInterval(() => {
      if (processingStatus === 'processing' || processingStatus === 'loading' || processingStatus === 'analyzing') {
        checkProcessingStatus()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [videoFile?.filename, processingStatus, onFormatDetected])



  const getVideoDisplayStyle = () => {
    // Always use widescreen (16:9) format for consistent app display
    return 'aspect-video'
  }

  const formatInfo = results ? formatLabels[results.original.cameraFormat] || formatLabels.custom : null

  return (
    <div className="space-y-6">
      {/* Video Display */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Uploaded Video</h3>
          {formatInfo && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${formatInfo.color}`}>
              <div className="flex items-center space-x-2">
                <formatInfo.icon className="w-4 h-4" />
                <span>{formatInfo.name}</span>
              </div>
            </div>
          )}
        </div>

        <div className={`${getVideoDisplayStyle()} bg-secondary-100 rounded-lg overflow-hidden mb-4`}>
          <video 
            src={`http://localhost:3000${videoFile.url}`}
            controls 
            className="w-full h-full object-contain bg-black"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-secondary-600">
          <span>{videoFile.originalName}</span>
          <span>{(videoFile.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {/* Processing Status */}
      {processingStatus === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-blue-50 border-blue-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-800">Loading video...</span>
          </div>
        </motion.div>
      )}

      {processingStatus === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-blue-50 border-blue-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-800">Analyzing video format...</span>
          </div>
        </motion.div>
      )}



      {processingStatus === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-yellow-50 border-yellow-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-800">Processing video for selected platforms...</span>
          </div>
        </motion.div>
      )}

      {processingStatus === 'failed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card bg-red-50 border-red-200"
        >
          <div className="flex items-center space-x-3">
            <InformationCircleIcon className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Processing failed</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Format Information */}
      {results && formatInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h4 className="font-semibold mb-4">Video Format Details</h4>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Dimensions:</span>
                <span className="font-medium">
                  {results.original.metadata.width} × {results.original.metadata.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Aspect Ratio:</span>
                <span className="font-medium">
                  {results.original.metadata.aspectRatio.toFixed(2)} 
                  ({results.original.metadata.width}:{results.original.metadata.height})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Duration:</span>
                <span className="font-medium">
                  {Math.floor(results.original.metadata.duration / 60)}:
                  {(results.original.metadata.duration % 60).toFixed(0).padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Frame Rate:</span>
                <span className="font-medium">{results.original.metadata.fps} fps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Codec:</span>
                <span className="font-medium">{results.original.metadata.codec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Bitrate:</span>
                <span className="font-medium">
                  {(results.original.metadata.bitrate / 1000000).toFixed(1)} Mbps
                </span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${formatInfo.color}`}>
            <div className="flex items-center space-x-3 mb-2">
              <formatInfo.icon className="w-5 h-5" />
              <span className="font-medium">{formatInfo.name}</span>
            </div>
            <p className="text-sm">{formatInfo.description}</p>
          </div>
        </motion.div>
      )}

      {/* Platform Optimization Results */}
      {results && Object.keys(results.processed).length > 0 && processingStatus === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">✅ Processing Complete</h4>
            <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
              {Object.keys(results.processed).length} platform{Object.keys(results.processed).length !== 1 ? 's' : ''} ready
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(results.processed).map(([platform, data]) => (
              <div key={platform} className="p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">
                    {platform.replace('_', ' ')}
                  </span>
                  {!data.error && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✓ Optimized
                    </span>
                  )}
                </div>
                {data.error ? (
                  <p className="text-sm text-red-600">❌ {data.error}</p>
                ) : (
                  <div className="text-sm text-secondary-600">
                    <p>{data.width} × {data.height}</p>
                    {data.processedAt && (
                      <p className="text-xs text-secondary-500 mt-1">
                        Processed at {new Date(data.processedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> You can select different platforms and process again if needed.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
