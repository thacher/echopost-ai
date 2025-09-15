const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// Initialize OpenAI (only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock_openai_api_key') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

// Generate content for social media post
router.post('/generate-content', async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({ 
                error: 'OpenAI service not configured. Please set OPENAI_API_KEY environment variable.' 
            });
        }

        const { 
            videoDescription, 
            targetAudience, 
            tone, 
            platforms,
            customPrompt 
        } = req.body;

        if (!videoDescription) {
            return res.status(400).json({ error: 'Video description is required' });
        }

        const platformSpecificContent = {};

        // Generate content for each platform
        for (const platform of platforms || ['facebook', 'instagram', 'tiktok', 'youtube']) {
            try {
                const content = await generatePlatformContent(
                    platform, 
                    videoDescription, 
                    targetAudience, 
                    tone, 
                    customPrompt
                );
                platformSpecificContent[platform] = content;
            } catch (error) {
                console.log(`AI generation error for ${platform}:`, error.message);
                
                // Fallback mock content when API fails
                platformSpecificContent[platform] = {
                    caption: `🎬 Check out this amazing ${videoDescription || 'video'}! Perfect for ${platform}. 🚀`,
                    platform: platform,
                    characterCount: 100
                };
            }
        }

        res.json({
            success: true,
            content: platformSpecificContent
        });

    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content', 
            message: error.message 
        });
    }
});

// Generate hashtags
router.post('/generate-hashtags', async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({ 
                error: 'OpenAI service not configured. Please set OPENAI_API_KEY environment variable.' 
            });
        }

        const { content, platform, niche } = req.body;

        const prompt = `Generate relevant hashtags for a ${platform} post about ${niche || 'general content'}. 
        Content: "${content}"
        
        Requirements:
        - Generate 15-20 hashtags
        - Mix of popular and niche-specific hashtags
        - Include trending hashtags when relevant
        - Format as comma-separated list
        - No explanations, just hashtags
        - Do NOT include brand-specific hashtags like #EarthDud or #DontBeAnEarthDud
        - Focus on content-relevant and platform-appropriate hashtags`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
                temperature: 0.7,
            });

            const hashtags = response.choices[0].message.content
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.startsWith('#'))
                .slice(0, 20);

            res.json({
                success: true,
                hashtags
            });
        } catch (error) {
            console.log('Hashtag generation error:', error.message);
            
            // Fallback hashtags when API fails
            const fallbackHashtags = {
                facebook: ['#video', '#content', '#social', '#facebook', '#engagement'],
                instagram: ['#video', '#content', '#instagram', '#reels', '#viral'],
                tiktok: ['#video', '#tiktok', '#fyp', '#viral', '#trending'],
                youtube: ['#video', '#youtube', '#content', '#subscribe', '#viral']
            };

            res.json({
                success: true,
                hashtags: fallbackHashtags[platform] || fallbackHashtags.facebook
            });
        }

    } catch (error) {
        console.error('Hashtag generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate hashtags', 
            message: error.message 
        });
    }
});

// Optimize content for platform
router.post('/optimize-content', async (req, res) => {
    try {
        const { content, platform, objective } = req.body;

        const platformGuidelines = {
            facebook: "Facebook posts should be engaging, conversational, and encourage comments. Keep it under 250 characters for best engagement.",
            instagram: "Instagram captions should be visually appealing, use emojis, tell a story, and include a call-to-action. Can be longer and more personal.",
            tiktok: "TikTok captions should be short, trendy, use popular sounds/challenges references, and create urgency or curiosity.",
            youtube: "YouTube descriptions should be detailed, include keywords for SEO, timestamps, and clear calls-to-action. Include links and channel information."
        };

        const prompt = `Optimize this content for ${platform}:
        Original content: "${content}"
        
        Platform guidelines: ${platformGuidelines[platform]}
        Objective: ${objective || 'maximize engagement'}
        
        Return optimized content that follows platform best practices while maintaining the core message.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        res.json({
            success: true,
            optimizedContent: response.choices[0].message.content.trim()
        });

    } catch (error) {
        console.error('Content optimization error:', error);
        res.status(500).json({ 
            error: 'Failed to optimize content', 
            message: error.message 
        });
    }
});

async function generatePlatformContent(platform, videoDescription, targetAudience, tone, customPrompt) {
    const platformPrompts = {
        facebook: `Create a Facebook post for a video about: ${videoDescription}
        Target audience: ${targetAudience || 'general'}
        Tone: ${tone || 'engaging'}
        
        Requirements:
        - Engaging hook in first line
        - Encourage comments and shares
        - Include relevant emojis
        - Keep under 250 characters
        - End with a question or call-to-action
        - Don't include any hashtags (they'll be generated separately)`,

        instagram: `Create an Instagram caption for a video about: ${videoDescription}
        Target audience: ${targetAudience || 'general'}
        Tone: ${tone || 'authentic'}
        
        Requirements:
        - Start with a compelling hook
        - Tell a story or share insight
        - Use relevant emojis throughout
        - Include line breaks for readability
        - End with engaging questions
        - Don't include any hashtags (they'll be generated separately)`,

        tiktok: `Create a TikTok caption for a video about: ${videoDescription}
        Target audience: ${targetAudience || 'general'}
        Tone: ${tone || 'trendy'}
        
        Requirements:
        - Short and punchy (under 150 characters)
        - Use trending language and slang
        - Create curiosity or urgency
        - Include relevant emojis
        - Reference trends when appropriate
        - Don't include any hashtags (they'll be generated separately)`,

        youtube: `Create a YouTube video description for: ${videoDescription}
        Target audience: ${targetAudience || 'general'}
        Tone: ${tone || 'informative'}
        
        Requirements:
        - Detailed description (200-300 words)
        - Include key points and takeaways
        - SEO-friendly with relevant keywords
        - Call-to-action for likes, comments, subscribe
        - Professional but engaging tone
        - Don't include any hashtags (they'll be generated separately)`
    };

    const prompt = customPrompt || platformPrompts[platform];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: platform === 'youtube' ? 800 : 400,
        temperature: 0.7,
    });

    return {
        caption: response.choices[0].message.content.trim(),
        platform: platform,
        characterCount: response.choices[0].message.content.length
    };
}

module.exports = router;
