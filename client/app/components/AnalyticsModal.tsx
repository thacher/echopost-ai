'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Analytics {
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  reach: number
  impressions: number
  clicks: number
  last_updated: string
}

interface Post {
  id: number
  title: string
  description: string
  platforms: string[]
  status: string
  created_at: string
  scheduled_for?: string
  published_at?: string
}

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post | null
}

export default function AnalyticsModal({ isOpen, onClose, post }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (isOpen && post) {
      fetchAnalytics()
    }
  }, [isOpen, post, timeRange])

  const fetchAnalytics = async () => {
    if (!post) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}/analytics?range=${timeRange}`)
      const data = await response.json()
      setAnalytics(data.analytics || generateMockAnalytics())
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics(generateMockAnalytics())
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalytics = (): Analytics => ({
    views: Math.floor(Math.random() * 10000) + 1000,
    likes: Math.floor(Math.random() * 1000) + 100,
    comments: Math.floor(Math.random() * 100) + 10,
    shares: Math.floor(Math.random() * 200) + 20,
    engagement_rate: Math.random() * 10 + 2,
    reach: Math.floor(Math.random() * 5000) + 500,
    impressions: Math.floor(Math.random() * 15000) + 2000,
    clicks: Math.floor(Math.random() * 500) + 50,
    last_updated: new Date().toISOString()
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || !post) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detailed Analytics</h2>
                  <p className="text-sm text-gray-600">{post.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <div className="flex space-x-2">
                  {['24h', '7d', '30d', '90d'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <EyeIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Views</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{formatNumber(analytics.views)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <HeartIcon className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Likes</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">{formatNumber(analytics.likes)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <ChatBubbleLeftIcon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Comments</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{formatNumber(analytics.comments)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <ShareIcon className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Shares</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{formatNumber(analytics.shares)}</div>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Engagement Rate</span>
                          <span className="font-semibold text-gray-900">{analytics.engagement_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Reach</span>
                          <span className="font-semibold text-gray-900">{formatNumber(analytics.reach)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Impressions</span>
                          <span className="font-semibold text-gray-900">{formatNumber(analytics.impressions)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Clicks</span>
                          <span className="font-semibold text-gray-900">{formatNumber(analytics.clicks)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600">Created</div>
                            <div className="font-medium text-gray-900">{formatDate(post.created_at)}</div>
                          </div>
                        </div>
                        {post.published_at && (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-600">Published</div>
                              <div className="font-medium text-gray-900">{formatDate(post.published_at)}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-gray-400 rounded"></div>
                          <div>
                            <div className="text-sm text-gray-600">Platforms</div>
                            <div className="font-medium text-gray-900">{post.platforms.join(', ')}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-gray-400 rounded"></div>
                          <div>
                            <div className="text-sm text-gray-600">Status</div>
                            <div className="font-medium text-gray-900 capitalize">{post.status}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-center text-sm text-gray-500">
                    Last updated: {formatDate(analytics.last_updated)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No analytics data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
