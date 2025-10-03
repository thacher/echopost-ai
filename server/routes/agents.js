const express = require('express');
const { agentManager } = require('../services/aiAgents');
const router = express.Router();

// Get all agent statuses
router.get('/status', (req, res) => {
    try {
        const statuses = agentManager.getAllAgentStatus();
        res.json({
            success: true,
            agents: statuses
        });
    } catch (error) {
        console.error('Error getting agent status:', error);
        res.status(500).json({ 
            error: 'Failed to get agent status', 
            message: error.message 
        });
    }
});

// Get specific agent status
router.get('/status/:agentName', (req, res) => {
    try {
        const { agentName } = req.params;
        const status = agentManager.getAgentStatus(agentName);
        
        if (!status) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.json({
            success: true,
            agent: status
        });
    } catch (error) {
        console.error('Error getting agent status:', error);
        res.status(500).json({ 
            error: 'Failed to get agent status', 
            message: error.message 
        });
    }
});

// Start an agent
router.post('/start/:agentName', async (req, res) => {
    try {
        const { agentName } = req.params;
        
        // Check if agent can operate before starting
        const agentStatus = agentManager.getAgentStatus(agentName);
        if (!agentStatus) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        if (!agentStatus.serviceAvailability.canOperate) {
            return res.status(400).json({
                error: 'Agent cannot operate',
                message: 'Cannot start agent. Please configure OpenAI API key and at least one social media platform API key in your .env file.',
                serviceAvailability: agentStatus.serviceAvailability,
                help: 'Copy env.example to .env and configure your API keys'
            });
        }
        
        await agentManager.startAgent(agentName);
        
        res.json({
            success: true,
            message: `${agentName} agent started successfully`
        });
    } catch (error) {
        console.error('Error starting agent:', error);
        res.status(500).json({ 
            error: 'Failed to start agent', 
            message: error.message 
        });
    }
});

// Stop an agent
router.post('/stop/:agentName', async (req, res) => {
    try {
        const { agentName } = req.params;
        await agentManager.stopAgent(agentName);
        
        res.json({
            success: true,
            message: `${agentName} agent stopped successfully`
        });
    } catch (error) {
        console.error('Error stopping agent:', error);
        res.status(500).json({ 
            error: 'Failed to stop agent', 
            message: error.message 
        });
    }
});

// Update agent configuration
router.put('/config/:agentName', async (req, res) => {
    try {
        const { agentName } = req.params;
        const config = req.body;
        
        await agentManager.updateAgentConfig(agentName, config);
        
        res.json({
            success: true,
            message: `${agentName} agent configuration updated`
        });
    } catch (error) {
        console.error('Error updating agent config:', error);
        res.status(500).json({ 
            error: 'Failed to update agent configuration', 
            message: error.message 
        });
    }
});

// Auto-posting agent endpoints
router.post('/auto-posting/add-content', async (req, res) => {
    try {
        const { title, description, videoPath, platforms } = req.body;
        
        if (!title || !videoPath) {
            return res.status(400).json({ 
                error: 'Title and video path are required' 
            });
        }
        
        await agentManager.addContentToQueue({
            title,
            description,
            videoPath,
            platforms: platforms || ['facebook', 'instagram']
        });
        
        res.json({
            success: true,
            message: 'Content added to auto-posting queue'
        });
    } catch (error) {
        console.error('Error adding content to queue:', error);
        res.status(500).json({ 
            error: 'Failed to add content to queue', 
            message: error.message 
        });
    }
});

router.get('/auto-posting/queue', (req, res) => {
    try {
        const agent = agentManager.agents.autoPosting;
        res.json({
            success: true,
            queue: agent.contentQueue,
            history: agent.postingHistory
        });
    } catch (error) {
        console.error('Error getting posting queue:', error);
        res.status(500).json({ 
            error: 'Failed to get posting queue', 
            message: error.message 
        });
    }
});

// Auto-posting agent endpoints
router.post('/autoPosting/run', async (req, res) => {
    try {
        const agent = agentManager.agents.autoPosting;
        await agent.processQueue();
        
        res.json({
            success: true,
            message: 'Auto-posting run completed',
            queueSize: agent.contentQueue.length
        });
    } catch (error) {
        console.error('Error running auto-posting:', error);
        res.status(500).json({ 
            error: 'Failed to run auto-posting', 
            message: error.message 
        });
    }
});

// Engagement agent endpoints
router.post('/engagement/add-target', async (req, res) => {
    try {
        const { platform, accountId, criteria } = req.body;
        
        if (!platform || !accountId) {
            return res.status(400).json({ 
                error: 'Platform and account ID are required' 
            });
        }
        
        await agentManager.addEngagementTarget(platform, accountId, criteria);
        
        res.json({
            success: true,
            message: 'Engagement target added successfully'
        });
    } catch (error) {
        console.error('Error adding engagement target:', error);
        res.status(500).json({ 
            error: 'Failed to add engagement target', 
            message: error.message 
        });
    }
});

router.get('/engagement/targets', (req, res) => {
    try {
        const agent = agentManager.agents.engagement;
        res.json({
            success: true,
            targets: agent.targetAccounts,
            history: agent.engagementHistory
        });
    } catch (error) {
        console.error('Error getting engagement targets:', error);
        res.status(500).json({ 
            error: 'Failed to get engagement targets', 
            message: error.message 
        });
    }
});

router.post('/engagement/run', async (req, res) => {
    try {
        const agent = agentManager.agents.engagement;
        const opportunities = await agent.findEngagementOpportunities();
        
        const results = [];
        for (const opportunity of opportunities.slice(0, 3)) {
            const success = await agent.performEngagement(opportunity);
            results.push({ opportunity, success });
        }
        
        res.json({
            success: true,
            message: 'Engagement run completed',
            results
        });
    } catch (error) {
        console.error('Error running engagement:', error);
        res.status(500).json({ 
            error: 'Failed to run engagement', 
            message: error.message 
        });
    }
});

// Following agent endpoints
router.post('/following/add-keywords', async (req, res) => {
    try {
        const { keywords, platform } = req.body;
        
        if (!keywords || !Array.isArray(keywords) || !platform) {
            return res.status(400).json({ 
                error: 'Keywords array and platform are required' 
            });
        }
        
        await agentManager.addFollowingKeywords(keywords, platform);
        
        res.json({
            success: true,
            message: 'Following keywords added successfully'
        });
    } catch (error) {
        console.error('Error adding following keywords:', error);
        res.status(500).json({ 
            error: 'Failed to add following keywords', 
            message: error.message 
        });
    }
});

router.get('/following/keywords', (req, res) => {
    try {
        const agent = agentManager.agents.following;
        res.json({
            success: true,
            keywords: agent.targetKeywords,
            followingList: agent.followingList,
            history: agent.followingHistory
        });
    } catch (error) {
        console.error('Error getting following keywords:', error);
        res.status(500).json({ 
            error: 'Failed to get following keywords', 
            message: error.message 
        });
    }
});

router.post('/following/run', async (req, res) => {
    try {
        const agent = agentManager.agents.following;
        const accounts = await agent.findAccountsToFollow();
        
        const results = [];
        for (const account of accounts.slice(0, 2)) {
            const success = await agent.followAccount(account);
            results.push({ account, success });
        }
        
        res.json({
            success: true,
            message: 'Following run completed',
            results
        });
    } catch (error) {
        console.error('Error running following:', error);
        res.status(500).json({ 
            error: 'Failed to run following', 
            message: error.message 
        });
    }
});

// Manual trigger for all agents
router.post('/trigger-all', async (req, res) => {
    try {
        const results = {};
        
        // Trigger auto-posting
        try {
            await agentManager.agents.autoPosting.processQueue();
            results.autoPosting = { success: true, message: 'Queue processed' };
        } catch (error) {
            results.autoPosting = { success: false, error: error.message };
        }
        
        // Trigger engagement
        try {
            const opportunities = await agentManager.agents.engagement.findEngagementOpportunities();
            for (const opportunity of opportunities.slice(0, 2)) {
                await agentManager.agents.engagement.performEngagement(opportunity);
            }
            results.engagement = { success: true, message: `${opportunities.length} opportunities found` };
        } catch (error) {
            results.engagement = { success: false, error: error.message };
        }
        
        // Trigger following
        try {
            const accounts = await agentManager.agents.following.findAccountsToFollow();
            for (const account of accounts.slice(0, 1)) {
                await agentManager.agents.following.followAccount(account);
            }
            results.following = { success: true, message: `${accounts.length} accounts found` };
        } catch (error) {
            results.following = { success: false, error: error.message };
        }
        
        res.json({
            success: true,
            message: 'All agents triggered successfully',
            results
        });
    } catch (error) {
        console.error('Error triggering all agents:', error);
        res.status(500).json({ 
            error: 'Failed to trigger all agents', 
            message: error.message 
        });
    }
});

// Get agent analytics
router.get('/analytics', (req, res) => {
    try {
        const analytics = {
            autoPosting: {
                queueSize: agentManager.agents.autoPosting.contentQueue.length,
                postsToday: agentManager.agents.autoPosting.postingHistory.filter(
                    post => new Date(post.postedAt).toDateString() === new Date().toDateString()
                ).length,
                totalPosts: agentManager.agents.autoPosting.postingHistory.length
            },
            engagement: {
                targetsCount: agentManager.agents.engagement.targetAccounts.length,
                engagementsToday: agentManager.agents.engagement.engagementHistory.filter(
                    engagement => new Date(engagement.timestamp).toDateString() === new Date().toDateString()
                ).length,
                totalEngagements: agentManager.agents.engagement.engagementHistory.length
            },
            following: {
                keywordsCount: agentManager.agents.following.targetKeywords.length,
                followsToday: agentManager.agents.following.followingHistory.filter(
                    follow => new Date(follow.timestamp).toDateString() === new Date().toDateString()
                ).length,
                totalFollows: agentManager.agents.following.followingHistory.length,
                followingListSize: agentManager.agents.following.followingList.length
            }
        };
        
        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('Error getting agent analytics:', error);
        res.status(500).json({ 
            error: 'Failed to get agent analytics', 
            message: error.message 
        });
    }
});

module.exports = router;
