'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  PencilIcon, 
  ShareIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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

interface PostPreviewProps {
  videoFile: UploadedFile | null
  content: GeneratedContent
  hashtags: HashtagsData
  selectedPlatforms: string[]
  onPostSuccess: () => void
}

const platformConfig = {
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  tiktok: {
    name: 'TikTok',
    color: 'bg-black',
    textColor: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  youtube: {
    name: 'YouTube',
    color: 'bg-red-600',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'facebook':
      return (
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case 'instagram':
      return (
        <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    case 'tiktok':
      return (
        <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    default:
      return <div className="w-6 h-6 bg-gray-300 rounded"></div>
  }
}

// Helper function to clean hashtags from content
const cleanContentFromHashtags = (content: string): string => {
  // Remove hashtags from the end of the content, including emojis after hashtags
  return content
    .replace(/\s*#[\w\u00C0-\u017F]+(\s+#[\w\u00C0-\u017F]+)*(\s*[🚀✨🎯💫🔥⚡️🌟💡🎉🎊🎈🎁🎀🎂🎄🎃🎆🎇🌈⭐️💎💯]*\s*)*$/g, '')
    .replace(/\s+$/, '')
    .trim()
}

export default function PostPreview({ 
  videoFile, 
  content, 
  hashtags, 
  selectedPlatforms,
  onPostSuccess 
}: PostPreviewProps) {
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<GeneratedContent>(content)
  const [editedHashtags, setEditedHashtags] = useState<HashtagsData>(hashtags)
  const [isPosting, setIsPosting] = useState(false)
  const [postResults, setPostResults] = useState<any[]>([])

  const handleEdit = (platform: string) => {
    setEditingPlatform(platform)
  }

  const saveEdit = (platform: string) => {
    setEditingPlatform(null)
    toast.success('Content updated!')
  }

  const handlePost = async () => {
    setIsPosting(true)
    
    try {
      // In a real app, you'd get these tokens from user authentication
      const mockTokens = {
        facebook: {
          accessToken: 'mock_facebook_token',
          pageId: 'mock_page_id'
        },
        instagram: {
          accessToken: 'mock_instagram_token',
          accountId: 'mock_account_id'
        },
        youtube: {
          accessToken: 'mock_youtube_token'
        },
        tiktok: {
          accessToken: 'mock_tiktok_token'
        }
      }

      const response = await fetch('/api/social/post-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
          videoPath: videoFile?.url,
          platforms: selectedPlatforms,
          tokens: mockTokens
        })
      })

      const data = await response.json()
      setPostResults(data.results || [])

      if (data.success) {
        toast.success(`Posted successfully to ${data.summary?.successful || 0} platforms!`)
        onPostSuccess()
      } else {
        toast.error('Some posts failed. Check the results below.')
      }

    } catch (error) {
      console.error('Posting error:', error)
      toast.error('Failed to post content. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary-900 mb-4">
          Review & Post
        </h2>
        <p className="text-lg text-secondary-600">
          Review your AI-generated content and post to all platforms
        </p>
      </div>

      {/* Video Preview */}
      {videoFile && (
        <div className="card max-w-2xl mx-auto">
          <h3 className="font-semibold mb-4">Your Video</h3>
          <div className="aspect-video bg-secondary-100 rounded-lg overflow-hidden">
            <video 
              src={`http://localhost:3000${videoFile.url}`}
              controls 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Platform Content Previews */}
      <div className="grid gap-6">
        {selectedPlatforms.map((platform) => {
          const config = platformConfig[platform as keyof typeof platformConfig]
          const platformContent = editedContent[platform]
          const platformHashtags = editedHashtags[platform] || []
          const isEditing = editingPlatform === platform

          if (!platformContent) return null

          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card border-l-4 ${config.borderColor}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <PlatformIcon platform={platform} />
                  <div>
                    <h3 className="font-semibold text-lg">{config.name}</h3>
                    <p className="text-sm text-secondary-600">
                      {cleanContentFromHashtags(platformContent.caption).length} characters
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => isEditing ? saveEdit(platform) : handleEdit(platform)}
                  className="btn-outline"
                >
                  {isEditing ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </button>
              </div>

              {/* Content Preview */}
              <div className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={cleanContentFromHashtags(platformContent.caption)}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        [platform]: {
                          ...platformContent,
                          caption: e.target.value,
                          characterCount: e.target.value.length
                        }
                      })}
                      className="textarea w-full"
                      rows={6}
                    />
                    <div>
                      <label className="label mb-2 block">Hashtags</label>
                      <input
                        type="text"
                        value={platformHashtags.join(' ')}
                        onChange={(e) => setEditedHashtags({
                          ...editedHashtags,
                          [platform]: e.target.value.split(' ').filter(tag => tag.trim())
                        })}
                        className="input w-full"
                        placeholder="#hashtag1 #hashtag2 #hashtag3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-secondary-900">
                      {cleanContentFromHashtags(platformContent.caption)}
                    </div>
                    
                    {platformHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-secondary-200">
                        {platformHashtags.slice(0, 10).map((hashtag, index) => (
                          <span
                            key={index}
                            className={`text-sm px-2 py-1 rounded ${config.textColor} ${config.bgColor}`}
                          >
                            {hashtag}
                          </span>
                        ))}
                        {platformHashtags.length > 10 && (
                          <span className="text-sm text-secondary-500">
                            +{platformHashtags.length - 10} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Platform-specific info */}
              <div className="mt-4 flex items-center justify-between text-sm text-secondary-600">
                <div className="flex items-center space-x-4">
                  <span>Characters: {cleanContentFromHashtags(platformContent.caption).length}</span>
                  <span>Hashtags: {platformHashtags.length}</span>
                </div>
                
                {cleanContentFromHashtags(platformContent.caption).length > 2200 && platform === 'instagram' && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span className="text-xs">May be truncated</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Post Button */}
      <div className="text-center">
        <motion.button
          onClick={handlePost}
          disabled={isPosting}
          className={`px-8 py-4 rounded-lg font-semibold text-white text-lg transition-all duration-300 ${
            isPosting
              ? 'bg-secondary-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isPosting ? { scale: 1.05 } : {}}
          whileTap={!isPosting ? { scale: 0.95 } : {}}
        >
          {isPosting ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Posting to {selectedPlatforms.length} platforms...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <ShareIcon className="w-6 h-6" />
              <span>Post to All Platforms</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Post Results */}
      {postResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="font-semibold mb-4">Post Results</h3>
          <div className="space-y-3">
            {postResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {result.success ? '✓' : '✗'}
                  </div>
                  <span className="font-medium capitalize">{result.platform}</span>
                </div>
                <span className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <EyeIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Before You Post</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review each platform's content for accuracy</li>
              <li>• Check character limits for each platform</li>
              <li>• Ensure your social media accounts are connected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
