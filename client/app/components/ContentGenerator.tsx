'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  SparklesIcon, 
  Cog6ToothIcon,
  CheckCircleIcon
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

interface ContentGeneratorProps {
  videoFile: UploadedFile
  selectedPlatforms: string[]
  onContentGenerated: (content: GeneratedContent, hashtags: HashtagsData) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
}

export default function ContentGenerator({ 
  videoFile, 
  selectedPlatforms, 
  onContentGenerated,
  isGenerating,
  setIsGenerating
}: ContentGeneratorProps) {
  const [videoDescription, setVideoDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [tone, setTone] = useState('engaging')
  const [customPrompt, setCustomPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customHashtags, setCustomHashtags] = useState('#EarthDud #DontBeAnEarthDud')

  const toneOptions = [
    { value: 'engaging', label: 'Engaging & Fun' },
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'trendy', label: 'Trendy & Hip' },
    { value: 'informative', label: 'Informative' },
    { value: 'inspirational', label: 'Inspirational' },
  ]

  const audienceOptions = [
    { value: 'general', label: 'General Audience' },
    { value: 'young-adults', label: 'Young Adults (18-30)' },
    { value: 'professionals', label: 'Professionals' },
    { value: 'entrepreneurs', label: 'Entrepreneurs' },
    { value: 'creatives', label: 'Creatives & Artists' },
    { value: 'tech-enthusiasts', label: 'Tech Enthusiasts' },
    { value: 'fitness', label: 'Fitness & Health' },
    { value: 'food-lovers', label: 'Food Lovers' },
  ]

  const generateContent = async () => {
    if (!videoDescription.trim()) {
      toast.error('Please describe your video content')
      return
    }

    setIsGenerating(true)

    try {
      // Generate content for each platform
      const contentResponse = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoDescription,
          targetAudience,
          tone,
          platforms: selectedPlatforms,
          customPrompt: customPrompt.trim() || undefined
        })
      })

      if (!contentResponse.ok) {
        throw new Error('Failed to generate content')
      }

      const contentData = await contentResponse.json()
      
      // Generate hashtags for each platform and combine with EarthDud hashtags
      const hashtagPromises = selectedPlatforms.map(async (platform) => {
        const hashtagResponse = await fetch('/api/ai/generate-hashtags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentData.content[platform]?.caption || videoDescription,
            platform,
            niche: targetAudience
          })
        })

        let aiHashtags = []
        if (hashtagResponse.ok) {
          const hashtagData = await hashtagResponse.json()
          aiHashtags = hashtagData.hashtags || []
        }

        // Parse EarthDud hashtags from Advanced section
        const earthDudHashtags = customHashtags.trim()
          .split(/\s+/)
          .filter(tag => tag.startsWith('#') && tag.length > 1)

        // Combine EarthDud hashtags with AI-generated ones (EarthDud first)
        const combinedHashtags = [...earthDudHashtags, ...aiHashtags]
        
        return { platform, hashtags: combinedHashtags }
      })

      const hashtagResults = await Promise.all(hashtagPromises)
      const hashtagsData: HashtagsData = {}
      
      hashtagResults.forEach(({ platform, hashtags }) => {
        hashtagsData[platform] = hashtags
      })

      onContentGenerated(contentData.content, hashtagsData)
      toast.success('Content generated successfully!')

    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Generate AI Content</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-outline text-sm"
        >
          <Cog6ToothIcon className="w-4 h-4 mr-2" />
          Advanced
        </button>
      </div>

      <div className="space-y-6">
        {/* Video Description */}
        <div>
          <label className="label mb-2 block">
            Describe your video content *
          </label>
          <textarea
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            placeholder="e.g., A tutorial on making homemade pasta, showing step-by-step process from mixing ingredients to final plating..."
            className="textarea w-full"
            rows={4}
            disabled={isGenerating}
          />
          <p className="text-xs text-secondary-500 mt-1">
            Be specific about what happens in your video for better AI-generated content
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <label className="label mb-2 block">
            Target Audience
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="input w-full"
            disabled={isGenerating}
          >
            {audienceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className="label mb-2 block">
            Content Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="input w-full"
            disabled={isGenerating}
          >
            {toneOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-secondary-200 pt-6"
          >
            <div>
              <label className="label mb-2 block">
                Brand Hashtags
              </label>
              <textarea
                value={customHashtags}
                onChange={(e) => setCustomHashtags(e.target.value)}
                placeholder="Enter your custom hashtags separated by spaces..."
                className="textarea w-full"
                rows={3}
                disabled={isGenerating}
              />
              <p className="text-xs text-secondary-500 mt-1">
                These brand hashtags will be combined with AI-generated hashtags for each platform.
              </p>
            </div>
            
            <div>
              <label className="label mb-2 block">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add any specific instructions for content generation..."
                className="textarea w-full"
                rows={3}
                disabled={isGenerating}
              />
              <p className="text-xs text-secondary-500 mt-1">
                Override default prompts with your custom instructions
              </p>
            </div>
          </motion.div>
        )}

        {/* Selected Platforms Preview */}
        <div>
          <label className="label mb-2 block">
            Generating content for
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedPlatforms.map(platform => (
              <span
                key={platform}
                className={`px-3 py-2 rounded-full text-sm font-medium capitalize flex items-center space-x-2 ${
                  platform === 'facebook' ? 'bg-blue-100 text-blue-800' :
                  platform === 'instagram' ? 'bg-pink-100 text-pink-800' :
                  platform === 'tiktok' ? 'bg-gray-100 text-gray-800' :
                  platform === 'youtube' ? 'bg-red-100 text-red-800' :
                  'bg-secondary-100 text-secondary-800'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {platform === 'facebook' && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  {platform === 'instagram' && (
                    <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  )}
                  {platform === 'tiktok' && (
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  )}
                  {platform === 'youtube' && (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                </div>
                <span>{platform}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={generateContent}
          disabled={isGenerating || !videoDescription.trim()}
          className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-300 ${
            isGenerating || !videoDescription.trim()
              ? 'bg-secondary-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating AI Content...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <SparklesIcon className="w-5 h-5" />
              <span>Generate Content with AI</span>
            </div>
          )}
        </motion.button>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific about your video content for better results</li>
                <li>• Choose the right tone that matches your brand voice</li>
                <li>• Target audience helps tailor the language and style</li>
                <li>• Use Advanced to customize your brand hashtags</li>
                <li>• You can edit the generated content before posting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
