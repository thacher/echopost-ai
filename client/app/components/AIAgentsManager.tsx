'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  HeartIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

interface AgentStatus {
  name: string
  enabled: boolean
  isRunning: boolean
  lastActionTime: string | null
  actionCount: number
  maxActionsPerDay: number
  schedule: string
  cooldownMinutes: number
  serviceAvailability?: {
    hasOpenAI: boolean
    hasConnectedPlatforms: boolean
    platformConnections: { [key: string]: boolean }
    canOperate: boolean
  }
  status?: 'ready' | 'disabled' | 'unavailable'
}

interface AgentAnalytics {
  autoPosting: {
    queueSize: number
    postsToday: number
    totalPosts: number
  }
  engagement: {
    targetsCount: number
    engagementsToday: number
    totalEngagements: number
  }
  following: {
    keywordsCount: number
    followsToday: number
    totalFollows: number
    followingListSize: number
  }
}

export default function AIAgentsManager() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    schedule: '',
    maxActionsPerDay: 10,
    cooldownMinutes: 30
  })

  // Auto-posting specific state
  const [contentQueue, setContentQueue] = useState<any[]>([])
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    platforms: ['facebook', 'instagram']
  })

  // Engagement specific state
  const [engagementTargets, setEngagementTargets] = useState<any[]>([])
  const [newTarget, setNewTarget] = useState({
    platform: 'instagram',
    accountId: '',
    minEngagement: 0.3,
    maxFollowers: 100000,
    keywords: []
  })

  // Following specific state
  const [followingKeywords, setFollowingKeywords] = useState<any[]>([])
  const [newKeywords, setNewKeywords] = useState({
    keywords: '',
    platform: 'instagram'
  })

  useEffect(() => {
    fetchAgentStatus()
    fetchAnalytics()
  }, [])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/status')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching agent status:', error)
      toast.error('Failed to fetch agent status')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/agents/analytics')
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const toggleAgent = async (agentName: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'start' : 'stop'
      const response = await fetch(`/api/agents/${endpoint}/${agentName}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success(`${agentName} agent ${enabled ? 'started' : 'stopped'}`)
        fetchAgentStatus()
        fetchAnalytics()
      } else {
        throw new Error('Failed to toggle agent')
      }
    } catch (error) {
      console.error('Error toggling agent:', error)
      toast.error(`Failed to ${enabled ? 'start' : 'stop'} agent`)
    }
  }

  const updateAgentConfig = async (agentName: string) => {
    try {
      const response = await fetch(`/api/agents/config/${agentName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        toast.success('Agent configuration updated')
        setShowConfig(false)
        fetchAgentStatus()
      } else {
        throw new Error('Failed to update config')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      toast.error('Failed to update configuration')
    }
  }

  const addContentToQueue = async () => {
    try {
      const response = await fetch('/api/agents/auto-posting/add-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      })
      
      if (response.ok) {
        toast.success('Content added to queue')
        setNewContent({ title: '', description: '', platforms: ['facebook', 'instagram'] })
        fetchContentQueue()
      } else {
        throw new Error('Failed to add content')
      }
    } catch (error) {
      console.error('Error adding content:', error)
      toast.error('Failed to add content to queue')
    }
  }

  const fetchContentQueue = async () => {
    try {
      const response = await fetch('/api/agents/auto-posting/queue')
      const data = await response.json()
      setContentQueue(data.queue || [])
    } catch (error) {
      console.error('Error fetching content queue:', error)
    }
  }

  const addEngagementTarget = async () => {
    try {
      const response = await fetch('/api/agents/engagement/add-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTarget,
          keywords: newTarget.keywords.length > 0 ? newTarget.keywords : []
        })
      })
      
      if (response.ok) {
        toast.success('Engagement target added')
        setNewTarget({
          platform: 'instagram',
          accountId: '',
          minEngagement: 0.3,
          maxFollowers: 100000,
          keywords: []
        })
        fetchEngagementTargets()
      } else {
        throw new Error('Failed to add target')
      }
    } catch (error) {
      console.error('Error adding engagement target:', error)
      toast.error('Failed to add engagement target')
    }
  }

  const fetchEngagementTargets = async () => {
    try {
      const response = await fetch('/api/agents/engagement/targets')
      const data = await response.json()
      setEngagementTargets(data.targets || [])
    } catch (error) {
      console.error('Error fetching engagement targets:', error)
    }
  }

  const addFollowingKeywords = async () => {
    try {
      const keywords = newKeywords.keywords.split(',').map(k => k.trim()).filter(k => k)
      const response = await fetch('/api/agents/following/add-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          platform: newKeywords.platform
        })
      })
      
      if (response.ok) {
        toast.success('Following keywords added')
        setNewKeywords({ keywords: '', platform: 'instagram' })
        fetchFollowingKeywords()
      } else {
        throw new Error('Failed to add keywords')
      }
    } catch (error) {
      console.error('Error adding following keywords:', error)
      toast.error('Failed to add following keywords')
    }
  }

  const fetchFollowingKeywords = async () => {
    try {
      const response = await fetch('/api/agents/following/keywords')
      const data = await response.json()
      setFollowingKeywords(data.keywords || [])
    } catch (error) {
      console.error('Error fetching following keywords:', error)
    }
  }

  const runAgentManually = async (agentName: string) => {
    try {
      const response = await fetch(`/api/agents/${agentName}/run`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success(`${agentName} agent run completed`)
        fetchAnalytics()
      } else {
        throw new Error('Failed to run agent')
      }
    } catch (error) {
      console.error('Error running agent:', error)
      toast.error(`Failed to run ${agentName} agent`)
    }
  }

  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'autoPosting':
        return <SparklesIcon className="w-6 h-6" />
      case 'engagement':
        return <HeartIcon className="w-6 h-6" />
      case 'following':
        return <UserPlusIcon className="w-6 h-6" />
      default:
        return <Cog6ToothIcon className="w-6 h-6" />
    }
  }

  const getAgentColor = (agentName: string) => {
    switch (agentName) {
      case 'autoPosting':
        return 'bg-blue-500'
      case 'engagement':
        return 'bg-pink-500'
      case 'following':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

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
          AI Agents Manager
        </h2>
        <p className="text-lg text-secondary-600 mb-6">
          Automate your social media with intelligent AI agents
        </p>
        
        {/* Setup Status Alert */}
        {agents.some(agent => agent.status === 'unavailable') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">Setup Required</h4>
                <p className="text-sm text-yellow-700">
                  Configure OpenAI API key and social media platform keys in your .env file to activate AI agents.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Getting Started Guide */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Getting Started with AI Agents</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1. Setup:</strong> Configure API keys in your .env file (OpenAI + Social Media platforms)</p>
              <p><strong>2. Auto-Posting:</strong> Add content to the queue, AI generates platform-specific posts automatically</p>
              <p><strong>3. Engagement:</strong> Add target accounts for AI to analyze and engage with their posts</p>
              <p><strong>4. Following:</strong> Add keywords for AI to find and analyze relevant accounts to follow</p>
              <p><strong>5. Run:</strong> Click "Run Now" to execute agents manually or enable scheduling</p>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Note:</strong> All agents use the same AI content generation system for consistency and efficiency
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics.autoPosting.queueSize}
            </h3>
            <p className="text-secondary-600">Posts in Queue</p>
            <p className="text-sm text-secondary-500">
              {analytics.autoPosting.postsToday} posted today
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HeartIcon className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics.engagement.engagementsToday}
            </h3>
            <p className="text-secondary-600">Engagements Today</p>
            <p className="text-sm text-secondary-500">
              {analytics.engagement.targetsCount} targets
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <UserPlusIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              {analytics.following.followsToday}
            </h3>
            <p className="text-secondary-600">New Follows Today</p>
            <p className="text-sm text-secondary-500">
              {analytics.following.followingListSize} total following
            </p>
          </motion.div>
        </div>
      )}

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getAgentColor(agent.name)} rounded-lg flex items-center justify-center text-white`}>
                  {getAgentIcon(agent.name)}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">
                    {agent.name.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {agent.status === 'unavailable' ? 'Service Unavailable' : 
                     agent.enabled ? 'Active' : 'Inactive'}
                  </p>
                  {agent.serviceAvailability && !agent.serviceAvailability.canOperate && (
                    <p className="text-xs text-red-600 mt-1">
                      Missing: {!agent.serviceAvailability.hasOpenAI ? 'OpenAI API' : ''}
                      {!agent.serviceAvailability.hasOpenAI && !agent.serviceAvailability.hasConnectedPlatforms ? ', ' : ''}
                      {!agent.serviceAvailability.hasConnectedPlatforms ? 'Social Media APIs' : ''}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleAgent(agent.name, !agent.enabled)}
                  disabled={agent.status === 'unavailable'}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'unavailable' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : agent.enabled 
                        ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {agent.status === 'unavailable' ? (
                    <>
                      <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                      Unavailable
                    </>
                  ) : agent.enabled ? (
                    <>
                      <StopIcon className="w-3 h-3 inline mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-3 h-3 inline mr-1" />
                      Start
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedAgent(agent.name)
                    setConfig({
                      schedule: agent.schedule,
                      maxActionsPerDay: agent.maxActionsPerDay,
                      cooldownMinutes: agent.cooldownMinutes
                    })
                    setShowConfig(true)
                  }}
                  className="p-1 text-secondary-500 hover:text-secondary-700"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Actions Today:</span>
                <span className="font-medium">
                  {agent.actionCount} / {agent.maxActionsPerDay}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-secondary-600">Schedule:</span>
                <span className="font-medium">{agent.schedule}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-secondary-600">Cooldown:</span>
                <span className="font-medium">{agent.cooldownMinutes}m</span>
              </div>
              
              {agent.lastActionTime && (
                <div className="flex justify-between">
                  <span className="text-secondary-600">Last Action:</span>
                  <span className="font-medium">
                    {new Date(agent.lastActionTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <button
                onClick={() => runAgentManually(agent.name)}
                disabled={agent.isRunning}
                className="w-full btn-outline text-sm"
              >
                {agent.isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 inline mr-2" />
                    Run Now
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Configuration Modal */}
      {showConfig && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Configure {selectedAgent.replace(/([A-Z])/g, ' $1').trim()} Agent
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label mb-2 block">Schedule (Cron Format)</label>
                <input
                  type="text"
                  value={config.schedule}
                  onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
                  className="input w-full"
                  placeholder="0 9 * * *"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Format: minute hour day month weekday
                </p>
              </div>
              
              <div>
                <label className="label mb-2 block">Max Actions Per Day</label>
                <input
                  type="number"
                  value={config.maxActionsPerDay}
                  onChange={(e) => setConfig({ ...config, maxActionsPerDay: parseInt(e.target.value) })}
                  className="input w-full"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="label mb-2 block">Cooldown (Minutes)</label>
                <input
                  type="number"
                  value={config.cooldownMinutes}
                  onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) })}
                  className="input w-full"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => updateAgentConfig(selectedAgent)}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Posting Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Auto-Posting Queue</h3>
            <p className="text-sm text-secondary-600 mt-1">
              Add content to automatically post to your social media platforms
            </p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <h4 className="font-medium mb-3">Add Content to Queue</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Content title"
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              className="input w-full"
            />
            <textarea
              placeholder="Content description"
              value={newContent.description}
              onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
              className="textarea w-full"
              rows={3}
            />
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newContent.platforms.includes('facebook')}
                  onChange={(e) => {
                    const platforms = e.target.checked
                      ? [...newContent.platforms, 'facebook']
                      : newContent.platforms.filter(p => p !== 'facebook')
                    setNewContent({ ...newContent, platforms })
                  }}
                />
                <span>Facebook</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newContent.platforms.includes('instagram')}
                  onChange={(e) => {
                    const platforms = e.target.checked
                      ? [...newContent.platforms, 'instagram']
                      : newContent.platforms.filter(p => p !== 'instagram')
                    setNewContent({ ...newContent, platforms })
                  }}
                />
                <span>Instagram</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newContent.platforms.includes('tiktok')}
                  onChange={(e) => {
                    const platforms = e.target.checked
                      ? [...newContent.platforms, 'tiktok']
                      : newContent.platforms.filter(p => p !== 'tiktok')
                    setNewContent({ ...newContent, platforms })
                  }}
                />
                <span>TikTok</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newContent.platforms.includes('youtube')}
                  onChange={(e) => {
                    const platforms = e.target.checked
                      ? [...newContent.platforms, 'youtube']
                      : newContent.platforms.filter(p => p !== 'youtube')
                    setNewContent({ ...newContent, platforms })
                  }}
                />
                <span>YouTube</span>
              </label>
            </div>
            <button
              onClick={addContentToQueue}
              disabled={!newContent.title}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add to Queue
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {contentQueue.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div>
                <h5 className="font-medium">{item.title}</h5>
                <p className="text-sm text-secondary-600">{item.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {item.platforms?.map(platform => (
                    <span key={platform} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'posted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Engagement Targets</h3>
            <p className="text-sm text-secondary-600 mt-1">
              Automatically like and comment on posts from target accounts
            </p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <h4 className="font-medium mb-3">Add Engagement Target</h4>
          <p className="text-xs text-secondary-500 mb-3">
            Add accounts you want the AI to engage with automatically
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newTarget.platform}
                onChange={(e) => setNewTarget({ ...newTarget, platform: e.target.value })}
                className="input"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
              <input
                type="text"
                placeholder="Account ID (e.g., @username)"
                value={newTarget.accountId}
                onChange={(e) => setNewTarget({ ...newTarget, accountId: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min Engagement (0-1)"
                value={newTarget.minEngagement}
                onChange={(e) => setNewTarget({ ...newTarget, minEngagement: parseFloat(e.target.value) })}
                className="input"
                min="0"
                max="1"
                step="0.1"
              />
              <input
                type="number"
                placeholder="Max Followers"
                value={newTarget.maxFollowers}
                onChange={(e) => setNewTarget({ ...newTarget, maxFollowers: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            <button
              onClick={addEngagementTarget}
              disabled={!newTarget.accountId}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Target
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {engagementTargets.map((target, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div>
                <h5 className="font-medium">{target.accountId}</h5>
                <p className="text-sm text-secondary-600">
                  {target.platform} • Min engagement: {target.criteria.minEngagement} • Max followers: {target.criteria.maxFollowers.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-secondary-500">
                  Last checked: {target.lastChecked ? new Date(target.lastChecked).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Following Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Following Keywords</h3>
            <p className="text-sm text-secondary-600 mt-1">
              Automatically follow accounts based on keywords and criteria
            </p>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
          <h4 className="font-medium mb-3">Add Following Keywords</h4>
          <p className="text-xs text-secondary-500 mb-3">
            Add keywords to find and follow relevant accounts automatically
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Keywords (comma-separated)"
                value={newKeywords.keywords}
                onChange={(e) => setNewKeywords({ ...newKeywords, keywords: e.target.value })}
                className="input"
              />
              <select
                value={newKeywords.platform}
                onChange={(e) => setNewKeywords({ ...newKeywords, platform: e.target.value })}
                className="input"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <button
              onClick={addFollowingKeywords}
              disabled={!newKeywords.keywords}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Keywords
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {followingKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div>
                <h5 className="font-medium">{keyword.keywords.join(', ')}</h5>
                <p className="text-sm text-secondary-600">{keyword.platform}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-secondary-500">
                  Last searched: {keyword.lastSearched ? new Date(keyword.lastSearched).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
