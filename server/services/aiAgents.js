const OpenAI = require('openai');
const axios = require('axios');
const cron = require('node-cron');

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock_openai_api_key') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

class AIAgent {
    constructor(name, config = {}) {
        this.name = name;
        this.config = {
            enabled: false,
            schedule: '0 9 * * *', // Default: daily at 9 AM
            maxActionsPerDay: 10,
            cooldownMinutes: 30,
            ...config
        };
        this.lastActionTime = null;
        this.actionCount = 0;
        this.dailyResetTime = new Date();
        this.isRunning = false;
    }

    // Check if required services are configured
    checkServiceAvailability() {
        const platformConnections = {
            facebook: !!process.env.FACEBOOK_ACCESS_TOKEN,
            instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
            tiktok: !!process.env.TIKTOK_ACCESS_TOKEN,
            youtube: !!process.env.YOUTUBE_ACCESS_TOKEN
        };

        const hasOpenAI = !!openai;
        const hasConnectedPlatforms = Object.values(platformConnections).some(connected => connected);

        return {
            hasOpenAI,
            hasConnectedPlatforms,
            platformConnections,
            canOperate: hasOpenAI && hasConnectedPlatforms
        };
    }

    async canPerformAction() {
        if (!this.config.enabled) return false;
        
        // Check if required services are available
        const serviceCheck = this.checkServiceAvailability();
        if (!serviceCheck.canOperate) {
            console.log(`[${this.name}] Cannot perform action: Missing required services`);
            console.log(`[${this.name}] OpenAI: ${serviceCheck.hasOpenAI}, Connected Platforms: ${serviceCheck.hasConnectedPlatforms}`);
            return false;
        }
        
        // Check daily limit
        const now = new Date();
        if (now.getDate() !== this.dailyResetTime.getDate()) {
            this.actionCount = 0;
            this.dailyResetTime = now;
        }
        
        if (this.actionCount >= this.config.maxActionsPerDay) {
            console.log(`[${this.name}] Daily action limit reached`);
            return false;
        }
        
        // Check cooldown
        if (this.lastActionTime) {
            const timeSinceLastAction = now - this.lastActionTime;
            const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
            if (timeSinceLastAction < cooldownMs) {
                console.log(`[${this.name}] Still in cooldown period`);
                return false;
            }
        }
        
        return true;
    }

    async performAction() {
        if (!(await this.canPerformAction())) return false;
        
        this.lastActionTime = new Date();
        this.actionCount++;
        return true;
    }

    async analyzeContent(content) {
        if (!openai) {
            console.log(`[${this.name}] OpenAI not configured, using fallback analysis`);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Analyze this social media content for engagement potential:
                    
                    Content: "${content}"
                    
                    Return a JSON object with:
                    - sentiment: "positive", "negative", or "neutral"
                    - engagement: score from 0-1 (higher = more engaging)
                    - relevance: score from 0-1 (higher = more relevant to target audience)
                    - keywords: array of key topics
                    - action_recommendation: "like", "comment", "share", or "follow"`
                }],
                max_tokens: 300,
                temperature: 0.3,
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            return analysis;
        } catch (error) {
            console.error(`[${this.name}] Content analysis error:`, error.message);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }
    }

    async generateEngagementResponse(content, platform) {
        if (!openai) {
            return "Great content! 👍";
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Generate a natural, engaging response for this ${platform} content:
                    
                    Content: "${content}"
                    
                    Requirements:
                    - Keep it short and authentic (under 50 characters)
                    - Use appropriate emojis
                    - Sound like a real person, not a bot
                    - Match the tone of the original content
                    - Don't be overly promotional
                    
                    Return only the response text, no quotes or explanations.`
                }],
                max_tokens: 100,
                temperature: 0.7,
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error(`[${this.name}] Response generation error:`, error.message);
            return "Great content! 👍";
        }
    }
}

class AutoPostingAgent extends AIAgent {
    constructor(config = {}) {
        super('AutoPostingAgent', {
            schedule: '0 9,15,21 * * *', // 9 AM, 3 PM, 9 PM
            maxActionsPerDay: 3,
            cooldownMinutes: 60,
            ...config
        });
        this.contentQueue = [];
        this.postingHistory = [];
    }

    async addToQueue(content) {
        this.contentQueue.push({
            ...content,
            id: Date.now(),
            createdAt: new Date(),
            status: 'pending'
        });
        console.log(`[${this.name}] Added content to queue: ${content.title}`);
    }

    async processQueue() {
        if (!(await this.canPerformAction())) return;
        
        const pendingContent = this.contentQueue.filter(item => item.status === 'pending');
        if (pendingContent.length === 0) return;

        const content = pendingContent[0];
        console.log(`[${this.name}] Processing content: ${content.title}`);

        try {
            // Analyze content for optimal posting time using existing AI system
            const analysis = await this.analyzeContentWithAI(content.description || content.title);
            
            // Generate platform-specific content using existing AI system
            if (!content.platformContent) {
                content.platformContent = await this.generatePlatformContentWithAI(content);
            }

            // Post to platforms
            const results = await this.postToPlatforms(content);
            
            // Update content status
            content.status = 'posted';
            content.postedAt = new Date();
            content.results = results;
            
            this.postingHistory.push(content);
            await this.performAction();
            
            console.log(`[${this.name}] Successfully posted: ${content.title}`);
        } catch (error) {
            console.error(`[${this.name}] Posting error:`, error.message);
            content.status = 'failed';
            content.error = error.message;
        }
    }

    async generatePlatformContent(content) {
        if (!openai) {
            return {
                facebook: { caption: content.title, hashtags: ['#content', '#social'] },
                instagram: { caption: content.title, hashtags: ['#content', '#instagram'] },
                tiktok: { caption: content.title, hashtags: ['#content', '#tiktok'] },
                youtube: { caption: content.title, hashtags: ['#content', '#youtube'] }
            };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Generate platform-specific content for this video:
                    
                    Title: ${content.title}
                    Description: ${content.description || 'No description provided'}
                    
                    Generate optimized content for Facebook, Instagram, TikTok, and YouTube.
                    Return JSON with platform-specific captions and hashtags.
                    
                    Format:
                    {
                        "facebook": {"caption": "...", "hashtags": ["#tag1", "#tag2"]},
                        "instagram": {"caption": "...", "hashtags": ["#tag1", "#tag2"]},
                        "tiktok": {"caption": "...", "hashtags": ["#tag1", "#tag2"]},
                        "youtube": {"caption": "...", "hashtags": ["#tag1", "#tag2"]}
                    }`
                }],
                max_tokens: 800,
                temperature: 0.7,
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error(`[${this.name}] Content generation error:`, error.message);
            return null;
        }
    }

    async postToPlatforms(content) {
        const results = [];
        
        for (const platform of content.platforms || ['facebook', 'instagram']) {
            try {
                const platformContent = content.platformContent?.[platform];
                if (!platformContent) continue;

                const postData = {
                    message: platformContent.caption,
                    videoPath: content.videoPath,
                    accessToken: process.env[`${platform.toUpperCase()}_ACCESS_TOKEN`],
                    hashtags: platformContent.hashtags
                };

                const response = await axios.post(
                    `${process.env.SERVER_URL || 'http://localhost:3000'}/api/social/${platform}`,
                    postData
                );

                results.push({
                    platform,
                    success: true,
                    postId: response.data.postId || response.data.id,
                    message: response.data.message
                });
            } catch (error) {
                console.error(`[${this.name}] Error posting to ${platform}:`, error.message);
                results.push({
                    platform,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    async analyzeContentWithAI(content) {
        if (!openai) {
            console.log(`[${this.name}] OpenAI not configured, using fallback analysis`);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Analyze this content for optimal social media posting:
                    
                    Content: "${content}"
                    
                    Return a JSON object with:
                    - sentiment: "positive", "negative", or "neutral"
                    - engagement: score from 0-1 (higher = more engaging)
                    - relevance: score from 0-1 (higher = more relevant to target audience)
                    - optimal_time: "morning", "afternoon", "evening", or "anytime"
                    - platform_suitability: object with platform scores (facebook, instagram, tiktok, youtube)`
                }],
                max_tokens: 300,
                temperature: 0.3,
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            return analysis;
        } catch (error) {
            console.error(`[${this.name}] Content analysis error:`, error.message);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }
    }

    async generatePlatformContentWithAI(content) {
        if (!openai) {
            return {
                facebook: { caption: content.description, hashtags: [] },
                instagram: { caption: content.description, hashtags: [] },
                tiktok: { caption: content.description, hashtags: [] },
                youtube: { title: content.title, description: content.description }
            };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Generate platform-specific content for this social media post:
                    
                    Title: "${content.title}"
                    Description: "${content.description}"
                    Platforms: ${content.platforms.join(', ')}
                    
                    Return a JSON object with platform-specific content:
                    - facebook: { caption: string, hashtags: array }
                    - instagram: { caption: string, hashtags: array }
                    - tiktok: { caption: string, hashtags: array }
                    - youtube: { title: string, description: string, tags: array }
                    
                    Make each platform's content optimized for that platform's style and audience.`
                }],
                max_tokens: 500,
                temperature: 0.7,
            });

            const platformContent = JSON.parse(response.choices[0].message.content);
            return platformContent;
        } catch (error) {
            console.error(`[${this.name}] Platform content generation error:`, error.message);
            return {
                facebook: { caption: content.description, hashtags: [] },
                instagram: { caption: content.description, hashtags: [] },
                tiktok: { caption: content.description, hashtags: [] },
                youtube: { title: content.title, description: content.description }
            };
        }
    }
}

class EngagementAgent extends AIAgent {
    constructor(config = {}) {
        super('EngagementAgent', {
            schedule: '*/30 * * * *', // Every 30 minutes
            maxActionsPerDay: 50,
            cooldownMinutes: 5,
            ...config
        });
        this.targetAccounts = [];
        this.engagementHistory = [];
    }

    async addTargetAccount(platform, accountId, criteria = {}) {
        this.targetAccounts.push({
            platform,
            accountId,
            criteria: {
                minEngagement: 0.3,
                maxFollowers: 100000,
                keywords: [],
                ...criteria
            },
            lastChecked: null
        });
        console.log(`[${this.name}] Added target account: ${accountId} on ${platform}`);
    }

    async findEngagementOpportunities() {
        if (!(await this.canPerformAction())) return [];

        const opportunities = [];
        
        for (const target of this.targetAccounts) {
            try {
                const posts = await this.fetchRecentPosts(target.platform, target.accountId);
                
                for (const post of posts) {
                    const analysis = await this.analyzePostWithAI(post.content);
                    
                    if (analysis.engagement > target.criteria.minEngagement && 
                        analysis.relevance > 0.5) {
                        opportunities.push({
                            platform: target.platform,
                            postId: post.id,
                            content: post.content,
                            analysis,
                            accountId: target.accountId
                        });
                    }
                }
            } catch (error) {
                console.error(`[${this.name}] Error checking ${target.accountId}:`, error.message);
            }
        }

        return opportunities;
    }

    async analyzePostWithAI(content) {
        if (!openai) {
            console.log(`[${this.name}] OpenAI not configured, using fallback analysis`);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Analyze this social media post for engagement potential:
                    
                    Content: "${content}"
                    
                    Return a JSON object with:
                    - sentiment: "positive", "negative", or "neutral"
                    - engagement: score from 0-1 (higher = more engaging)
                    - relevance: score from 0-1 (higher = more relevant to target audience)
                    - keywords: array of key topics
                    - action_recommendation: "like", "comment", "share", or "follow"`
                }],
                max_tokens: 300,
                temperature: 0.3,
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            return analysis;
        } catch (error) {
            console.error(`[${this.name}] Post analysis error:`, error.message);
            return { sentiment: 'neutral', engagement: 0.5, relevance: 0.5 };
        }
    }

    async performEngagement(opportunity) {
        if (!(await this.canPerformAction())) return false;

        try {
            const response = await this.generateEngagementResponse(
                opportunity.content, 
                opportunity.platform
            );

            // Like the post
            await this.likePost(opportunity.platform, opportunity.postId);
            
            // Comment if engagement score is high enough
            if (opportunity.analysis.engagement > 0.7) {
                await this.commentOnPost(opportunity.platform, opportunity.postId, response);
            }

            this.engagementHistory.push({
                platform: opportunity.platform,
                postId: opportunity.postId,
                action: 'engaged',
                response,
                timestamp: new Date()
            });

            await this.performAction();
            console.log(`[${this.name}] Engaged with post: ${opportunity.postId}`);
            return true;
        } catch (error) {
            console.error(`[${this.name}] Engagement error:`, error.message);
            return false;
        }
    }

    async likePost(platform, postId) {
        // Implementation would depend on platform API
        console.log(`[${this.name}] Liking ${platform} post: ${postId}`);
        // Placeholder - would use actual platform APIs
    }

    async commentOnPost(platform, postId, comment) {
        // Implementation would depend on platform API
        console.log(`[${this.name}] Commenting on ${platform} post: ${postId} - "${comment}"`);
        // Placeholder - would use actual platform APIs
    }

    async fetchRecentPosts(platform, accountId) {
        // Placeholder - would fetch from platform APIs
        return [
            {
                id: 'sample_post_1',
                content: 'Sample post content for engagement testing',
                timestamp: new Date()
            }
        ];
    }
}

class FollowingAgent extends AIAgent {
    constructor(config = {}) {
        super('FollowingAgent', {
            schedule: '0 10,14,18 * * *', // 10 AM, 2 PM, 6 PM
            maxActionsPerDay: 20,
            cooldownMinutes: 15,
            ...config
        });
        this.targetKeywords = [];
        this.followingHistory = [];
        this.followingList = [];
    }

    async addTargetKeywords(keywords, platform) {
        this.targetKeywords.push({
            keywords,
            platform,
            lastSearched: null
        });
        console.log(`[${this.name}] Added target keywords: ${keywords.join(', ')} for ${platform}`);
    }

    async findAccountsToFollow() {
        if (!(await this.canPerformAction())) return [];

        const accounts = [];
        
        for (const target of this.targetKeywords) {
            try {
                const searchResults = await this.searchAccounts(target.keywords, target.platform);
                
                for (const account of searchResults) {
                    if (await this.shouldFollowAccount(account)) {
                        accounts.push(account);
                    }
                }
            } catch (error) {
                console.error(`[${this.name}] Error searching keywords:`, error.message);
            }
        }

        return accounts;
    }

    async shouldFollowAccount(account) {
        // Check if already following
        if (this.followingList.includes(account.id)) return false;
        
        // Check account criteria
        if (account.followers > 1000000) return false; // Don't follow mega-influencers
        if (account.followers < 100) return false; // Don't follow very small accounts
        
        // Use existing AI content analysis system
        const analysis = await this.analyzeAccountWithAI(account.bio || account.lastPost);
        return analysis.relevance > 0.6 && analysis.sentiment === 'positive';
    }

    async analyzeAccountWithAI(content) {
        if (!openai) {
            console.log(`[${this.name}] OpenAI not configured, using fallback analysis`);
            return { sentiment: 'neutral', relevance: 0.5 };
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Analyze this social media account content for following potential:
                    
                    Content: "${content}"
                    
                    Return a JSON object with:
                    - sentiment: "positive", "negative", or "neutral"
                    - relevance: score from 0-1 (higher = more relevant to follow)
                    - should_follow: true/false based on content quality and relevance
                    - reason: brief explanation of the decision`
                }],
                max_tokens: 200,
                temperature: 0.3,
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            return analysis;
        } catch (error) {
            console.error(`[${this.name}] Account analysis error:`, error.message);
            return { sentiment: 'neutral', relevance: 0.5, should_follow: false };
        }
    }

    async followAccount(account) {
        if (!(await this.canPerformAction())) return false;

        try {
            // Follow the account
            await this.performFollow(account.platform, account.id);
            
            this.followingList.push(account.id);
            this.followingHistory.push({
                platform: account.platform,
                accountId: account.id,
                username: account.username,
                timestamp: new Date()
            });

            await this.performAction();
            console.log(`[${this.name}] Followed account: ${account.username} on ${account.platform}`);
            return true;
        } catch (error) {
            console.error(`[${this.name}] Follow error:`, error.message);
            return false;
        }
    }

    async performFollow(platform, accountId) {
        // Implementation would depend on platform API
        console.log(`[${this.name}] Following ${platform} account: ${accountId}`);
        // Placeholder - would use actual platform APIs
    }

    async searchAccounts(keywords, platform) {
        // Placeholder - would search platform APIs
        return [
            {
                id: 'sample_account_1',
                username: 'sample_user',
                platform,
                bio: 'Sample bio for testing',
                followers: 5000,
                lastPost: 'Sample post content'
            }
        ];
    }
}

// Agent Manager
class AgentManager {
    constructor() {
        this.agents = {
            autoPosting: new AutoPostingAgent(),
            engagement: new EngagementAgent(),
            following: new FollowingAgent()
        };
        this.scheduledTasks = new Map();
    }

    async startAgent(agentName) {
        const agent = this.agents[agentName];
        if (!agent) {
            throw new Error(`Agent ${agentName} not found`);
        }

        agent.config.enabled = true;
        
        // Schedule the agent
        const task = cron.schedule(agent.config.schedule, async () => {
            if (agent.isRunning) return;
            
            agent.isRunning = true;
            try {
                switch (agentName) {
                    case 'autoPosting':
                        await agent.processQueue();
                        break;
                    case 'engagement':
                        const opportunities = await agent.findEngagementOpportunities();
                        for (const opportunity of opportunities.slice(0, 3)) {
                            await agent.performEngagement(opportunity);
                        }
                        break;
                    case 'following':
                        const accounts = await agent.findAccountsToFollow();
                        for (const account of accounts.slice(0, 2)) {
                            await agent.followAccount(account);
                        }
                        break;
                }
            } catch (error) {
                console.error(`[AgentManager] Error running ${agentName}:`, error.message);
            } finally {
                agent.isRunning = false;
            }
        }, {
            scheduled: false
        });

        this.scheduledTasks.set(agentName, task);
        task.start();
        
        console.log(`[AgentManager] Started ${agentName} agent`);
    }

    async stopAgent(agentName) {
        const agent = this.agents[agentName];
        if (!agent) return;

        agent.config.enabled = false;
        
        const task = this.scheduledTasks.get(agentName);
        if (task) {
            task.stop();
            this.scheduledTasks.delete(agentName);
        }
        
        console.log(`[AgentManager] Stopped ${agentName} agent`);
    }

    async updateAgentConfig(agentName, config) {
        const agent = this.agents[agentName];
        if (!agent) {
            throw new Error(`Agent ${agentName} not found`);
        }

        agent.config = { ...agent.config, ...config };
        console.log(`[AgentManager] Updated ${agentName} config:`, config);
    }

    getAgentStatus(agentName) {
        const agent = this.agents[agentName];
        if (!agent) return null;

        const serviceCheck = agent.checkServiceAvailability();

        return {
            name: agentName,
            enabled: agent.config.enabled,
            isRunning: agent.isRunning,
            lastActionTime: agent.lastActionTime,
            actionCount: agent.actionCount,
            maxActionsPerDay: agent.config.maxActionsPerDay,
            schedule: agent.config.schedule,
            cooldownMinutes: agent.config.cooldownMinutes,
            serviceAvailability: {
                hasOpenAI: serviceCheck.hasOpenAI,
                hasConnectedPlatforms: serviceCheck.hasConnectedPlatforms,
                platformConnections: serviceCheck.platformConnections,
                canOperate: serviceCheck.canOperate
            },
            status: serviceCheck.canOperate ? 
                (agent.config.enabled ? 'ready' : 'disabled') : 
                'unavailable'
        };
    }

    getAllAgentStatus() {
        return Object.keys(this.agents).map(agentName => this.getAgentStatus(agentName));
    }

    // Convenience methods for specific agents
    async addContentToQueue(content) {
        return await this.agents.autoPosting.addToQueue(content);
    }

    async addEngagementTarget(platform, accountId, criteria) {
        return await this.agents.engagement.addTargetAccount(platform, accountId, criteria);
    }

    async addFollowingKeywords(keywords, platform) {
        return await this.agents.following.addTargetKeywords(keywords, platform);
    }
}

// Export singleton instance
const agentManager = new AgentManager();

module.exports = {
    AgentManager,
    AutoPostingAgent,
    EngagementAgent,
    FollowingAgent,
    agentManager
};
