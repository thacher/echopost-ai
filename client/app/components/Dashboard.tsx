'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnalyticsModal from './AnalyticsModal'
import PerformanceReportModal from './PerformanceReportModal'
import { 
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  VideoCameraIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

interface Post {
  id: number
  title: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  createdAt: string
  platforms: string[]
  publishResults?: any[]
}

interface Analytics {
  postId: number
  platforms: Array<{
    platform: string
    views: number
    likes: number
    comments: number
    shares: number
    engagement_rate: string
  }>
  totalEngagement: {
    views: number
    likes: number
    comments: number
    shares: number
  }
}

const platformConfig = {
  facebook: { name: 'Facebook', color: 'bg-blue-600' },
  instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  tiktok: { name: 'TikTok', color: 'bg-black' },
  youtube: { name: 'YouTube', color: 'bg-red-600' }
}

const PlatformIcon = ({ platform, size = 'w-5 h-5' }: { platform: string, size?: string }) => {
  switch (platform) {
    case 'facebook':
      return (
        <svg className={`${size} text-blue-600`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case 'instagram':
      return (
        <svg className={`${size} text-pink-600`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    case 'tiktok':
      return (
        <svg className={`${size} text-black`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg className={`${size} text-red-600`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    default:
      return <div className={`${size} bg-gray-300 rounded`}></div>
  }
}

interface DashboardProps {
  onShowAgents?: () => void
  onUploadVideo?: () => void
}

export default function Dashboard({ onShowAgents, onUploadVideo }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [analytics, setAnalytics] = useState<{ [key: number]: Analytics }>({})
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showPerformanceReport, setShowPerformanceReport] = useState(false)
  const [platformStatus, setPlatformStatus] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchPosts()
    fetchPlatformStatus()
  }, [])

  const fetchPlatformStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/social/status')
      const data = await response.json()
      setPlatformStatus(data.status)
    } catch (error) {
      console.error('Error fetching platform status:', error)
      // Set all platforms as disconnected if API fails
      setPlatformStatus({
        facebook: false,
        instagram: false,
        tiktok: false,
        youtube: false
      })
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/posts')
      const data = await response.json()
      setPosts(data.posts || [])
      
      // Fetch analytics for each post
      const analyticsPromises = data.posts?.map(async (post: Post) => {
        if (post.status === 'published') {
          try {
            const analyticsResponse = await fetch(`http://localhost:3000/api/posts/${post.id}/analytics`)
            const analyticsData = await analyticsResponse.json()
            return { postId: post.id, analytics: analyticsData.analytics }
          } catch (error) {
            return { postId: post.id, analytics: null }
          }
        }
        return { postId: post.id, analytics: null }
      }) || []

      const analyticsResults = await Promise.all(analyticsPromises)
      const analyticsMap: { [key: number]: Analytics } = {}
      
      analyticsResults.forEach(({ postId, analytics }) => {
        if (analytics) {
          analyticsMap[postId] = analytics
        }
      })
      
      setAnalytics(analyticsMap)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      case 'scheduled':
        return <ClockIcon className="w-5 h-5 text-blue-500" />
      default:
        return <ChartBarIcon className="w-5 h-5 text-secondary-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-200'
    }
  }

  const totalStats = Object.values(analytics).reduce(
    (acc, postAnalytics) => ({
      views: acc.views + postAnalytics.totalEngagement.views,
      likes: acc.likes + postAnalytics.totalEngagement.likes,
      comments: acc.comments + postAnalytics.totalEngagement.comments,
      shares: acc.shares + postAnalytics.totalEngagement.shares,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary-900 mb-4">
          Dashboard
        </h2>
        <p className="text-lg text-secondary-600">
          Monitor your social media performance and manage your content
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <EyeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900">
            {totalStats.views.toLocaleString()}
          </h3>
          <p className="text-secondary-600">Total Views</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <HeartIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900">
            {totalStats.likes.toLocaleString()}
          </h3>
          <p className="text-secondary-600">Total Likes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <ChatBubbleLeftIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900">
            {totalStats.comments.toLocaleString()}
          </h3>
          <p className="text-secondary-600">Total Comments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <ShareIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900">
            {totalStats.shares.toLocaleString()}
          </h3>
          <p className="text-secondary-600">Total Shares</p>
        </motion.div>
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Recent Posts</h3>
          <div className="flex items-center space-x-2 text-sm text-secondary-600">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>{posts.length} total posts</span>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-secondary-900 mb-2">No posts yet</h4>
            <p className="text-secondary-600 mb-4">Create your first post to see it here</p>
            {Object.values(platformStatus).every(status => !status) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>Setup Required:</strong> Configure API keys in your .env file to connect social media platforms before creating posts.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 10).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(post.status)}
                    <div>
                      <h4 className="font-medium text-secondary-900">{post.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-secondary-600">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          {post.platforms.map((platform) => (
                            <PlatformIcon key={platform} platform={platform} size="w-4 h-4" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    
                    {analytics[post.id] && (
                      <button
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="btn-outline text-sm"
                      >
                        View Analytics
                      </button>
                    )}
                  </div>
                </div>

                {/* Analytics Dropdown */}
                {selectedPost === post.id && analytics[post.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-secondary-200"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {analytics[post.id].platforms.map((platform) => (
                        <div key={platform.platform} className="text-center p-3 bg-secondary-50 rounded-lg">
                          <div className="flex justify-center mb-2">
                            <PlatformIcon platform={platform.platform} size="w-6 h-6" />
                          </div>
                          <div className="text-sm font-medium capitalize mb-2">
                            {platform.platform}
                          </div>
                          <div className="space-y-1 text-xs text-secondary-600">
                            <div>Views: {platform.views.toLocaleString()}</div>
                            <div>Likes: {platform.likes.toLocaleString()}</div>
                            <div>Comments: {platform.comments.toLocaleString()}</div>
                            <div>Shares: {platform.shares.toLocaleString()}</div>
                            <div className="font-medium text-primary-600">
                              Engagement: {platform.engagement_rate}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={onUploadVideo}
              className="w-full btn-primary justify-start"
            >
              <VideoCameraIcon className="w-5 h-5 mr-3" />
              Upload New Video
            </button>
            {onShowAgents && (
              <button 
                onClick={onShowAgents}
                className="w-full btn-outline justify-start"
              >
                <SparklesIcon className="w-5 h-5 mr-3" />
                Manage AI Agents
              </button>
            )}
            <button 
              onClick={() => setShowPerformanceReport(true)}
              className="w-full btn-outline justify-start"
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-3" />
              Performance Report
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Platform Status</h3>
            {Object.values(platformStatus).every(status => !status) && (
              <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
                Configure API keys in .env file
              </div>
            )}
          </div>
          <div className="space-y-3">
            {Object.entries(platformConfig).map(([key, platform]) => {
              const isConnected = platformStatus[key] || false
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PlatformIcon platform={key} size="w-5 h-5" />
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnalyticsModal 
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        post={posts.find(p => p.id === selectedPost) || null}
      />
      
      <PerformanceReportModal 
        isOpen={showPerformanceReport}
        onClose={() => setShowPerformanceReport(false)}
      />
    </div>
  )
}
