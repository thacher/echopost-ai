'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  CloudArrowUpIcon, 
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface UploadedFile {
  filename: string
  originalName: string
  url: string
  size: number
}

interface VideoUploadProps {
  onFileUpload: (file: UploadedFile) => void
}

export default function VideoUpload({ onFileUpload }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 100MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 200)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await response.json()
      
      setTimeout(() => {
        toast.success('Video uploaded successfully!')
        onFileUpload(data.file)
        setUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
      setUploadProgress(0)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div className="w-full">
      <div {...getRootProps()}>
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 scale-105'
              : isDragReject
              ? 'border-red-400 bg-red-50'
              : uploading
              ? 'border-secondary-300 bg-secondary-50 cursor-not-allowed'
              : 'border-secondary-300 bg-white hover:border-primary-400 hover:bg-primary-50/50'
          }`}
          whileHover={!uploading ? { scale: 1.02 } : {}}
          whileTap={!uploading ? { scale: 0.98 } : {}}
        >
          <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
              <CloudArrowUpIcon className="w-8 h-8 text-primary-600 animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-medium text-secondary-900 mb-2">
                Uploading your video...
              </p>
              <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
                <motion.div
                  className="bg-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-secondary-600">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isDragActive
                ? 'bg-primary-600 text-white'
                : isDragReject
                ? 'bg-red-100 text-red-600'
                : 'bg-secondary-100 text-secondary-600'
            }`}>
              {isDragReject ? (
                <ExclamationTriangleIcon className="w-8 h-8" />
              ) : (
                <VideoCameraIcon className="w-8 h-8" />
              )}
            </div>
            
            <div>
              <p className="text-xl font-semibold text-secondary-900 mb-2">
                {isDragActive
                  ? 'Drop your video here'
                  : isDragReject
                  ? 'Invalid file type'
                  : 'Drop your video here, or click to browse'
                }
              </p>
              <p className="text-secondary-600">
                {isDragReject
                  ? 'Please select a valid video file'
                  : 'Supports MP4, AVI, MOV, WMV, FLV, WebM (max 100MB)'
                }
              </p>
            </div>

            {!isDragReject && (
              <div className="flex items-center justify-center space-x-6 text-sm text-secondary-500">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>High quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Fast upload</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Secure</span>
                </div>
              </div>
            )}
          </div>
        )}
        </motion.div>
      </div>

      {/* Upload Tips */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <VideoCameraIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-900 mb-2">Best Quality</h3>
          <p className="text-sm text-blue-700">
            Upload in 1080p or higher for best results across platforms
          </p>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-medium text-green-900 mb-2">Optimized</h3>
          <p className="text-sm text-green-700">
            We&apos;ll automatically optimize for each social platform
          </p>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-purple-900 mb-2">AI Powered</h3>
          <p className="text-sm text-purple-700">
            Smart content generation for maximum engagement
          </p>
        </div>
      </div>
    </div>
  )
}
