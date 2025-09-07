const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processVideoForAllPlatforms } = require('../services/videoProcessor');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept video files
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: fileFilter
});

// Upload video endpoint
router.post('/video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/${req.file.filename}`
        };

        console.log('Video uploaded:', fileInfo);

        // Just analyze the video metadata without processing
        const { getVideoMetadata, detectCameraFormat } = require('../services/videoProcessor');
        
        try {
            console.log('🎬 Analyzing video metadata...');
            const metadata = await getVideoMetadata(req.file.path);
            const cameraFormat = detectCameraFormat(metadata);
            
            console.log('✅ Video analysis completed:', {
                format: cameraFormat,
                dimensions: `${metadata.width}x${metadata.height}`,
                duration: `${metadata.duration}s`
            });

            // Store basic analysis results
            const processedDir = path.join(__dirname, '../../uploads/processed');
            if (!fs.existsSync(processedDir)) {
                fs.mkdirSync(processedDir, { recursive: true });
            }
            
            const analysisPath = path.join(processedDir, `${req.file.filename}_analysis.json`);
            fs.writeFileSync(analysisPath, JSON.stringify({
                original: {
                    metadata,
                    cameraFormat
                },
                analyzed: true,
                processed: {}
            }, null, 2));

            // Send response with analysis results
            res.json({
                success: true,
                message: 'Video uploaded and analyzed successfully',
                file: {
                    ...fileInfo,
                    metadata,
                    cameraFormat
                }
            });

        } catch (analysisError) {
            console.error('❌ Video analysis failed:', analysisError);
            // Send response anyway - processing can happen later
            res.json({
                success: true,
                message: 'Video uploaded successfully',
                file: fileInfo
            });
        }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed', 
            message: error.message 
        });
    }
});

// Get uploaded files
router.get('/files', (req, res) => {
    try {
        const uploadsPath = path.join(__dirname, '../../uploads');
        
        if (!fs.existsSync(uploadsPath)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(uploadsPath)
            .filter(file => {
                const filePath = path.join(uploadsPath, file);
                return fs.statSync(filePath).isFile();
            })
            .map(file => {
                const filePath = path.join(uploadsPath, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    uploadDate: stats.birthtime,
                    url: `/uploads/${file}`
                };
            })
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        res.json({ files });

    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ 
            error: 'Failed to list files', 
            message: error.message 
        });
    }
});

// Process video for selected platforms
router.post('/video/:filename/process', async (req, res) => {
    try {
        const filename = req.params.filename;
        const { platforms } = req.body;

        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            return res.status(400).json({ error: 'Please select at least one platform' });
        }

        const videoPath = path.join(__dirname, '../../uploads', filename);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ error: 'Video file not found' });
        }

        const processedDir = path.join(__dirname, '../../uploads/processed');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Send immediate response
        res.json({
            success: true,
            message: `Starting processing for ${platforms.length} platform(s)`,
            platforms: platforms,
            status: 'processing'
        });

        // Process video asynchronously for selected platforms
        try {
            console.log(`🎬 Starting video processing for selected platforms: ${platforms.join(', ')}`);
            
            const { 
                getVideoMetadata, 
                detectCameraFormat, 
                getOptimalPlatformConfigs,
                processVideoForPlatform 
            } = require('../services/videoProcessor');

            // Get or load existing analysis
            const analysisPath = path.join(processedDir, `${filename}_analysis.json`);
            let analysisData;
            
            if (fs.existsSync(analysisPath)) {
                analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
            } else {
                // Create analysis if it doesn't exist
                const metadata = await getVideoMetadata(videoPath);
                const cameraFormat = detectCameraFormat(metadata);
                analysisData = {
                    original: { metadata, cameraFormat },
                    analyzed: true,
                    processed: {}
                };
            }

            // Get platform configurations
            const allPlatformConfigs = getOptimalPlatformConfigs(
                analysisData.original.cameraFormat, 
                analysisData.original.metadata
            );

            // Process only selected platforms
            for (const platform of platforms) {
                if (allPlatformConfigs[platform]) {
                    try {
                        const outputFilename = `${path.parse(filename).name}_${platform}.mp4`;
                        const outputPath = path.join(processedDir, outputFilename);
                        
                        console.log(`📹 Processing for ${platform}...`);
                        const processResult = await processVideoForPlatform(
                            videoPath, 
                            outputPath, 
                            allPlatformConfigs[platform], 
                            analysisData.original.metadata
                        );
                        
                        analysisData.processed[platform] = {
                            ...processResult,
                            url: `/uploads/processed/${outputFilename}`,
                            config: allPlatformConfigs[platform],
                            processedAt: new Date().toISOString()
                        };
                        
                        console.log(`✅ Completed processing for ${platform}`);
                    } catch (error) {
                        console.error(`❌ Failed to process for ${platform}:`, error.message);
                        analysisData.processed[platform] = {
                            error: error.message,
                            config: allPlatformConfigs[platform],
                            processedAt: new Date().toISOString()
                        };
                    }
                } else {
                    console.log(`⚠️  No configuration found for platform: ${platform}`);
                    analysisData.processed[platform] = {
                        error: 'Platform configuration not found',
                        processedAt: new Date().toISOString()
                    };
                }
            }

            // Update analysis file with results
            fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2));
            
            const successCount = platforms.filter(p => 
                analysisData.processed[p] && !analysisData.processed[p].error
            ).length;
            
            console.log(`✅ Processing completed: ${successCount}/${platforms.length} platforms successful`);
            
        } catch (processingError) {
            console.error('❌ Video processing failed:', processingError);
            
            // Store error info
            const errorPath = path.join(processedDir, `${filename}_error.json`);
            fs.writeFileSync(errorPath, JSON.stringify({ 
                error: processingError.message,
                platforms: platforms,
                timestamp: new Date().toISOString()
            }, null, 2));
        }

    } catch (error) {
        console.error('Processing request error:', error);
        res.status(500).json({ 
            error: 'Processing request failed', 
            message: error.message 
        });
    }
});

// Get video processing status and results
router.get('/video/:filename/status', (req, res) => {
    try {
        const filename = req.params.filename;
        const processedDir = path.join(__dirname, '../../uploads/processed');
        
        // Check for analysis file (new format)
        const analysisPath = path.join(processedDir, `${filename}_analysis.json`);
        const errorPath = path.join(processedDir, `${filename}_error.json`);
        
        if (fs.existsSync(analysisPath)) {
            const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
            
            // Check if any platforms are currently being processed
            const processedPlatforms = Object.keys(analysisData.processed || {});
            const hasProcessedResults = processedPlatforms.length > 0;
            
            res.json({
                success: true,
                status: hasProcessedResults ? 'completed' : 'analyzed',
                results: {
                    original: analysisData.original,
                    processed: analysisData.processed || {}
                },
                message: hasProcessedResults 
                    ? `Processed for ${processedPlatforms.length} platform(s)` 
                    : 'Video analyzed, ready for platform processing'
            });
        } else if (fs.existsSync(errorPath)) {
            const error = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
            res.json({
                success: false,
                status: 'failed',
                error: error
            });
        } else {
            res.json({
                success: true,
                status: 'analyzing',
                message: 'Video is being analyzed'
            });
        }
    } catch (error) {
        console.error('Error checking processing status:', error);
        res.status(500).json({ 
            error: 'Failed to check processing status', 
            message: error.message 
        });
    }
});

// Delete uploaded file
router.delete('/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        fs.unlinkSync(filePath);
        
        res.json({ 
            success: true, 
            message: 'File deleted successfully' 
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            error: 'Failed to delete file', 
            message: error.message 
        });
    }
});

module.exports = router;
