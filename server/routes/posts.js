const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// In-memory storage for posts (in production, use a database)
let posts = [];
let postIdCounter = 1;

// Get all posts
router.get('/', (req, res) => {
    try {
        const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ posts: sortedPosts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get post by ID
router.get('/:id', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ post });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create new post
router.post('/', (req, res) => {
    try {
        const {
            title,
            videoPath,
            content,
            hashtags,
            platforms,
            scheduledTime,
            status = 'draft'
        } = req.body;

        const newPost = {
            id: postIdCounter++,
            title: title || 'Untitled Post',
            videoPath,
            content,
            hashtags: hashtags || {},
            platforms: platforms || [],
            scheduledTime,
            status, // draft, scheduled, published, failed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishResults: []
        };

        posts.push(newPost);

        res.status(201).json({
            success: true,
            post: newPost,
            message: 'Post created successfully'
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ 
            error: 'Failed to create post', 
            message: error.message 
        });
    }
});

// Update post
router.put('/:id', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const updatedPost = {
            ...posts[postIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        posts[postIndex] = updatedPost;

        res.json({
            success: true,
            post: updatedPost,
            message: 'Post updated successfully'
        });

    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ 
            error: 'Failed to update post', 
            message: error.message 
        });
    }
});

// Delete post
router.delete('/:id', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const deletedPost = posts[postIndex];
        posts.splice(postIndex, 1);

        // Optionally delete associated video file
        if (deletedPost.videoPath) {
            const videoPath = path.join(__dirname, '../../uploads', path.basename(deletedPost.videoPath));
            if (fs.existsSync(videoPath)) {
                try {
                    fs.unlinkSync(videoPath);
                } catch (err) {
                    console.error('Error deleting video file:', err);
                }
            }
        }

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ 
            error: 'Failed to delete post', 
            message: error.message 
        });
    }
});

// Publish post to social media
router.post('/:id/publish', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = posts[postIndex];
        const { tokens } = req.body;

        // Update post status
        posts[postIndex].status = 'publishing';
        posts[postIndex].updatedAt = new Date().toISOString();

        // Call the social media posting endpoint
        try {
            const publishResponse = await fetch(`${req.protocol}://${req.get('host')}/api/social/post-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: post.content,
                    videoPath: post.videoPath,
                    platforms: post.platforms,
                    tokens: tokens
                })
            });

            const publishResult = await publishResponse.json();

            // Update post with results
            posts[postIndex].status = publishResult.success ? 'published' : 'failed';
            posts[postIndex].publishResults = publishResult.results || [];
            posts[postIndex].publishErrors = publishResult.errors || [];
            posts[postIndex].publishedAt = new Date().toISOString();
            posts[postIndex].updatedAt = new Date().toISOString();

            res.json({
                success: publishResult.success,
                post: posts[postIndex],
                results: publishResult.results,
                errors: publishResult.errors,
                summary: publishResult.summary
            });

        } catch (publishError) {
            console.error('Publishing error:', publishError);
            posts[postIndex].status = 'failed';
            posts[postIndex].publishErrors = [{ error: publishError.message }];
            posts[postIndex].updatedAt = new Date().toISOString();

            res.status(500).json({
                success: false,
                error: 'Publishing failed',
                message: publishError.message
            });
        }

    } catch (error) {
        console.error('Error publishing post:', error);
        res.status(500).json({ 
            error: 'Failed to publish post', 
            message: error.message 
        });
    }
});

// Get post analytics/stats
router.get('/:id/analytics', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Mock analytics data (in production, fetch from social media APIs)
        const analytics = {
            postId: post.id,
            platforms: post.platforms.map(platform => ({
                platform,
                views: Math.floor(Math.random() * 10000),
                likes: Math.floor(Math.random() * 1000),
                comments: Math.floor(Math.random() * 100),
                shares: Math.floor(Math.random() * 50),
                engagement_rate: (Math.random() * 10).toFixed(2) + '%'
            })),
            totalEngagement: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0
            }
        };

        // Calculate totals
        analytics.platforms.forEach(platform => {
            analytics.totalEngagement.views += platform.views;
            analytics.totalEngagement.likes += platform.likes;
            analytics.totalEngagement.comments += platform.comments;
            analytics.totalEngagement.shares += platform.shares;
        });

        res.json({ analytics });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch analytics', 
            message: error.message 
        });
    }
});

module.exports = router;
