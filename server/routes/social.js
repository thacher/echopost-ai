const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Facebook/Instagram posting
router.post('/facebook', async (req, res) => {
    try {
        const { message, videoPath, accessToken, pageId } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Facebook access token required' });
        }

        let postData = {
            message: message,
            access_token: accessToken
        };

        let endpoint = `https://graph.facebook.com/v18.0/${pageId || 'me'}/feed`;

        // If video is provided, upload as video post
        if (videoPath) {
            const fullVideoPath = path.join(__dirname, '../../uploads', path.basename(videoPath));
            
            if (fs.existsSync(fullVideoPath)) {
                const formData = new FormData();
                formData.append('source', fs.createReadStream(fullVideoPath));
                formData.append('description', message);
                formData.append('access_token', accessToken);

                endpoint = `https://graph.facebook.com/v18.0/${pageId || 'me'}/videos`;

                const response = await axios.post(endpoint, formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });

                return res.json({
                    success: true,
                    platform: 'facebook',
                    postId: response.data.id,
                    message: 'Video posted to Facebook successfully'
                });
            }
        }

        // Text-only post
        const response = await axios.post(endpoint, postData);

        res.json({
            success: true,
            platform: 'facebook',
            postId: response.data.id,
            message: 'Posted to Facebook successfully'
        });

    } catch (error) {
        console.error('Facebook posting error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Facebook posting failed', 
            message: error.response?.data?.error?.message || error.message 
        });
    }
});

// Instagram posting
router.post('/instagram', async (req, res) => {
    try {
        const { caption, videoPath, accessToken, instagramAccountId } = req.body;

        if (!accessToken || !instagramAccountId) {
            return res.status(400).json({ 
                error: 'Instagram access token and account ID required' 
            });
        }

        if (!videoPath) {
            return res.status(400).json({ error: 'Video is required for Instagram posts' });
        }

        const fullVideoPath = path.join(__dirname, '../../uploads', path.basename(videoPath));
        
        if (!fs.existsSync(fullVideoPath)) {
            return res.status(400).json({ error: 'Video file not found' });
        }

        // Step 1: Create media container
        const containerResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
            {
                media_type: 'VIDEO',
                video_url: `${req.protocol}://${req.get('host')}/uploads/${path.basename(videoPath)}`,
                caption: caption,
                access_token: accessToken
            }
        );

        const containerId = containerResponse.data.id;

        // Step 2: Publish the media
        const publishResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
            {
                creation_id: containerId,
                access_token: accessToken
            }
        );

        res.json({
            success: true,
            platform: 'instagram',
            postId: publishResponse.data.id,
            message: 'Posted to Instagram successfully'
        });

    } catch (error) {
        console.error('Instagram posting error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Instagram posting failed', 
            message: error.response?.data?.error?.message || error.message 
        });
    }
});

// TikTok posting (Note: TikTok API has limited access)
router.post('/tiktok', async (req, res) => {
    try {
        const { caption, videoPath, accessToken } = req.body;

        // Note: TikTok Content Posting API requires special approval
        // This is a placeholder implementation
        
        res.status(501).json({
            error: 'TikTok posting not yet implemented',
            message: 'TikTok Content Posting API requires special approval from TikTok. Please check their developer documentation for access requirements.',
            documentation: 'https://developers.tiktok.com/doc/content-posting-api-get-started'
        });

    } catch (error) {
        console.error('TikTok posting error:', error);
        res.status(500).json({ 
            error: 'TikTok posting failed', 
            message: error.message 
        });
    }
});

// YouTube posting
router.post('/youtube', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            videoPath, 
            accessToken, 
            tags = [], 
            privacy = 'private' 
        } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'YouTube access token required' });
        }

        if (!videoPath) {
            return res.status(400).json({ error: 'Video is required for YouTube upload' });
        }

        const fullVideoPath = path.join(__dirname, '../../uploads', path.basename(videoPath));
        
        if (!fs.existsSync(fullVideoPath)) {
            return res.status(400).json({ error: 'Video file not found' });
        }

        // YouTube upload requires resumable upload
        // This is a simplified implementation
        const metadata = {
            snippet: {
                title: title,
                description: description,
                tags: tags,
                categoryId: '22' // People & Blogs category
            },
            status: {
                privacyStatus: privacy
            }
        };

        const formData = new FormData();
        formData.append('metadata', JSON.stringify(metadata));
        formData.append('media', fs.createReadStream(fullVideoPath));

        const response = await axios.post(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/related'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        res.json({
            success: true,
            platform: 'youtube',
            videoId: response.data.id,
            message: 'Video uploaded to YouTube successfully'
        });

    } catch (error) {
        console.error('YouTube posting error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'YouTube posting failed', 
            message: error.response?.data?.error?.message || error.message 
        });
    }
});

// Post to all platforms
router.post('/post-all', async (req, res) => {
    try {
        const { 
            content, 
            videoPath, 
            platforms,
            tokens 
        } = req.body;

        const results = [];
        const errors = [];

        // Post to each selected platform
        for (const platform of platforms) {
            try {
                let result;
                
                switch (platform) {
                    case 'facebook':
                        if (tokens.facebook) {
                            const fbResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/social/facebook`, {
                                message: content.facebook?.caption || content.caption,
                                videoPath: videoPath,
                                accessToken: tokens.facebook.accessToken,
                                pageId: tokens.facebook.pageId
                            });
                            result = fbResponse.data;
                        }
                        break;
                        
                    case 'instagram':
                        if (tokens.instagram) {
                            const igResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/social/instagram`, {
                                caption: content.instagram?.caption || content.caption,
                                videoPath: videoPath,
                                accessToken: tokens.instagram.accessToken,
                                instagramAccountId: tokens.instagram.accountId
                            });
                            result = igResponse.data;
                        }
                        break;
                        
                    case 'youtube':
                        if (tokens.youtube) {
                            const ytResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/social/youtube`, {
                                title: content.youtube?.title || 'Untitled Video',
                                description: content.youtube?.caption || content.caption,
                                videoPath: videoPath,
                                accessToken: tokens.youtube.accessToken,
                                tags: content.youtube?.tags || []
                            });
                            result = ytResponse.data;
                        }
                        break;
                        
                    case 'tiktok':
                        // TikTok posting placeholder
                        result = {
                            success: false,
                            platform: 'tiktok',
                            message: 'TikTok posting requires special API approval'
                        };
                        break;
                }

                if (result) {
                    results.push(result);
                }

            } catch (error) {
                console.error(`Error posting to ${platform}:`, error.message);
                errors.push({
                    platform: platform,
                    error: error.response?.data?.message || error.message
                });
            }
        }

        res.json({
            success: results.length > 0,
            results: results,
            errors: errors,
            summary: {
                successful: results.filter(r => r.success).length,
                failed: errors.length,
                total: platforms.length
            }
        });

    } catch (error) {
        console.error('Multi-platform posting error:', error);
        res.status(500).json({ 
            error: 'Multi-platform posting failed', 
            message: error.message 
        });
    }
});

// Get platform connection status
router.get('/status', (req, res) => {
    const status = {
        facebook: !!process.env.FACEBOOK_ACCESS_TOKEN,
        instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
        tiktok: !!process.env.TIKTOK_ACCESS_TOKEN,
        youtube: !!process.env.YOUTUBE_ACCESS_TOKEN
    };

    res.json({ status });
});

module.exports = router;
