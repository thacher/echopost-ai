const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Try to set FFmpeg paths
try {
    // Try to find FFmpeg installed via Homebrew
    const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    const ffprobePath = execSync('which ffprobe', { encoding: 'utf8' }).trim();
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    
    console.log('✅ FFmpeg found at:', ffmpegPath);
    console.log('✅ FFprobe found at:', ffprobePath);
} catch (error) {
    console.log('⚠️  FFmpeg not found in PATH, trying fallback...');
    try {
        const ffmpegStatic = require('ffmpeg-static');
        ffmpeg.setFfmpegPath(ffmpegStatic);
        console.log('✅ Using static FFmpeg');
    } catch (staticError) {
        console.log('❌ No FFmpeg available, using fallback mode');
    }
}

// Platform-specific video requirements
const PLATFORM_SPECS = {
    facebook: {
        maxWidth: 1920,
        maxHeight: 1080,
        aspectRatio: '16:9',
        formats: ['mp4'],
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        maxDuration: 240 // 4 minutes
    },
    instagram: {
        feed: {
            maxWidth: 1080,
            maxHeight: 1080,
            aspectRatio: '1:1',
            formats: ['mp4'],
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxDuration: 60 // 1 minute
        },
        reels: {
            maxWidth: 1080,
            maxHeight: 1920,
            aspectRatio: '9:16',
            formats: ['mp4'],
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxDuration: 90 // 1.5 minutes
        },
        story: {
            maxWidth: 1080,
            maxHeight: 1920,
            aspectRatio: '9:16',
            formats: ['mp4'],
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxDuration: 15 // 15 seconds
        }
    },
    tiktok: {
        maxWidth: 1080,
        maxHeight: 1920,
        aspectRatio: '9:16',
        formats: ['mp4'],
        maxFileSize: 500 * 1024 * 1024, // 500MB
        maxDuration: 180 // 3 minutes
    },
    youtube: {
        shorts: {
            maxWidth: 1080,
            maxHeight: 1920,
            aspectRatio: '9:16',
            formats: ['mp4'],
            maxFileSize: 15 * 1024 * 1024 * 1024, // 15GB
            maxDuration: 60 // 1 minute
        },
        regular: {
            maxWidth: 1920,
            maxHeight: 1080,
            aspectRatio: '16:9',
            formats: ['mp4'],
            maxFileSize: 256 * 1024 * 1024 * 1024, // 256GB
            maxDuration: 43200 // 12 hours
        }
    }
};

/**
 * Get video metadata
 */
function getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        try {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    console.error('FFprobe error:', err);
                    // Fallback: provide basic metadata from file stats
                    const fs = require('fs');
                    const stats = fs.statSync(videoPath);
                    resolve({
                        width: 1920,
                        height: 1080,
                        duration: 30,
                        aspectRatio: 16/9,
                        fps: 30,
                        codec: 'unknown',
                        bitrate: 0,
                        fileSize: stats.size
                    });
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }

                resolve({
                    width: videoStream.width,
                    height: videoStream.height,
                    duration: parseFloat(metadata.format.duration),
                    aspectRatio: videoStream.width / videoStream.height,
                    fps: eval(videoStream.r_frame_rate) || 30,
                    codec: videoStream.codec_name,
                    bitrate: parseInt(metadata.format.bit_rate) || 0,
                    fileSize: parseInt(metadata.format.size) || 0
                });
            });
        } catch (error) {
            console.error('FFmpeg not available, using fallback metadata:', error);
            // Fallback for when FFmpeg is not available
            const fs = require('fs');
            const stats = fs.statSync(videoPath);
            resolve({
                width: 1920,
                height: 1080,
                duration: 30,
                aspectRatio: 16/9,
                fps: 30,
                codec: 'unknown',
                bitrate: 0,
                fileSize: stats.size
            });
        }
    });
}

/**
 * Detect camera format based on video dimensions and aspect ratio
 */
function detectCameraFormat(metadata) {
    const { width, height, aspectRatio } = metadata;
    
    // Common camera formats
    if (Math.abs(aspectRatio - (16/9)) < 0.1) {
        if (width >= 1920) return 'landscape_hd'; // 16:9 landscape
        return 'landscape_sd';
    } else if (Math.abs(aspectRatio - (9/16)) < 0.1) {
        return 'portrait'; // 9:16 portrait (phone vertical)
    } else if (Math.abs(aspectRatio - 1) < 0.1) {
        return 'square'; // 1:1 square
    } else if (Math.abs(aspectRatio - (4/3)) < 0.1) {
        return 'standard'; // 4:3 standard
    } else if (aspectRatio > 2) {
        return 'ultrawide'; // Ultra-wide format
    } else if (aspectRatio < 0.5) {
        return 'ultra_portrait'; // Very tall portrait
    }
    
    return 'custom'; // Custom aspect ratio
}

/**
 * Get optimal platform configurations based on camera format
 */
function getOptimalPlatformConfigs(cameraFormat, originalMetadata) {
    const configs = {};
    
    switch (cameraFormat) {
        case 'portrait':
            // Perfect for TikTok, Instagram Reels, YouTube Shorts
            configs.tiktok = PLATFORM_SPECS.tiktok;
            configs.instagram_reels = PLATFORM_SPECS.instagram.reels;
            configs.youtube_shorts = PLATFORM_SPECS.youtube.shorts;
            // Convert to square for Instagram feed
            configs.instagram_feed = {
                ...PLATFORM_SPECS.instagram.feed,
                cropToSquare: true
            };
            // Convert to landscape for Facebook
            configs.facebook = {
                ...PLATFORM_SPECS.facebook,
                addPadding: true,
                backgroundColor: 'black'
            };
            break;
            
        case 'landscape_hd':
        case 'landscape_sd':
            // Perfect for Facebook, YouTube regular
            configs.facebook = PLATFORM_SPECS.facebook;
            configs.youtube_regular = PLATFORM_SPECS.youtube.regular;
            // Convert to square for Instagram feed
            configs.instagram_feed = {
                ...PLATFORM_SPECS.instagram.feed,
                cropToSquare: true
            };
            // Convert to portrait for TikTok and Instagram Reels
            configs.tiktok = {
                ...PLATFORM_SPECS.tiktok,
                addPadding: true,
                backgroundColor: 'black'
            };
            configs.instagram_reels = {
                ...PLATFORM_SPECS.instagram.reels,
                addPadding: true,
                backgroundColor: 'black'
            };
            break;
            
        case 'square':
            // Perfect for Instagram feed
            configs.instagram_feed = PLATFORM_SPECS.instagram.feed;
            // Add padding for other formats
            configs.facebook = {
                ...PLATFORM_SPECS.facebook,
                addPadding: true,
                backgroundColor: 'black'
            };
            configs.tiktok = {
                ...PLATFORM_SPECS.tiktok,
                addPadding: true,
                backgroundColor: 'black'
            };
            configs.youtube_regular = {
                ...PLATFORM_SPECS.youtube.regular,
                addPadding: true,
                backgroundColor: 'black'
            };
            break;
            
        default:
            // For custom formats, provide all options with appropriate transformations
            configs.facebook = PLATFORM_SPECS.facebook;
            configs.instagram_feed = PLATFORM_SPECS.instagram.feed;
            configs.instagram_reels = PLATFORM_SPECS.instagram.reels;
            configs.tiktok = PLATFORM_SPECS.tiktok;
            configs.youtube_regular = PLATFORM_SPECS.youtube.regular;
            configs.youtube_shorts = PLATFORM_SPECS.youtube.shorts;
    }
    
    return configs;
}

/**
 * Process video for specific platform
 */
function processVideoForPlatform(inputPath, outputPath, platformConfig, originalMetadata) {
    return new Promise((resolve, reject) => {
        const { maxWidth, maxHeight, aspectRatio } = platformConfig;
        
        let command = ffmpeg(inputPath);
        
        // Calculate target dimensions
        let targetWidth, targetHeight;
        
        if (platformConfig.cropToSquare) {
            // Crop to square (center crop)
            const size = Math.min(originalMetadata.width, originalMetadata.height);
            targetWidth = targetHeight = Math.min(size, maxWidth);
            
            command = command
                .videoFilters([
                    `crop=${size}:${size}:(iw-${size})/2:(ih-${size})/2`,
                    `scale=${targetWidth}:${targetHeight}`
                ]);
                
        } else if (platformConfig.addPadding) {
            // Add padding to maintain aspect ratio
            const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
            const targetRatio = ratioW / ratioH;
            const originalRatio = originalMetadata.aspectRatio;
            
            if (originalRatio > targetRatio) {
                // Original is wider, fit to width and add vertical padding
                targetWidth = maxWidth;
                targetHeight = Math.round(targetWidth / targetRatio);
            } else {
                // Original is taller, fit to height and add horizontal padding
                targetHeight = maxHeight;
                targetWidth = Math.round(targetHeight * targetRatio);
            }
            
            command = command
                .videoFilters([
                    `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
                    `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:${platformConfig.backgroundColor || 'black'}`
                ]);
                
        } else {
            // Scale to fit within max dimensions
            const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
            const targetRatio = ratioW / ratioH;
            
            if (originalMetadata.width > maxWidth || originalMetadata.height > maxHeight) {
                if (originalMetadata.aspectRatio > targetRatio) {
                    targetWidth = maxWidth;
                    targetHeight = Math.round(targetWidth / originalMetadata.aspectRatio);
                } else {
                    targetHeight = maxHeight;
                    targetWidth = Math.round(targetHeight * originalMetadata.aspectRatio);
                }
            } else {
                targetWidth = originalMetadata.width;
                targetHeight = originalMetadata.height;
            }
            
            command = command.size(`${targetWidth}x${targetHeight}`);
        }
        
        // Set output format and quality
        command
            .format('mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .videoBitrate('2000k')
            .audioBitrate('128k')
            .fps(30)
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on('end', () => {
                console.log('Video processing completed');
                resolve({
                    outputPath,
                    width: targetWidth,
                    height: targetHeight,
                    aspectRatio: `${targetWidth}:${targetHeight}`
                });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Process video for all platforms
 */
async function processVideoForAllPlatforms(inputPath, outputDir, originalFilename) {
    try {
        // Get video metadata
        const metadata = await getVideoMetadata(inputPath);
        console.log('Video metadata:', metadata);
        
        // Detect camera format
        const cameraFormat = detectCameraFormat(metadata);
        console.log('Detected camera format:', cameraFormat);
        
        // Get optimal platform configurations
        const platformConfigs = getOptimalPlatformConfigs(cameraFormat, metadata);
        console.log('Platform configurations:', Object.keys(platformConfigs));
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const results = {
            original: {
                path: inputPath,
                metadata,
                cameraFormat
            },
            processed: {}
        };
        
        // Process video for each platform
        for (const [platformKey, config] of Object.entries(platformConfigs)) {
            const outputFilename = `${path.parse(originalFilename).name}_${platformKey}.mp4`;
            const outputPath = path.join(outputDir, outputFilename);
            
            try {
                const processResult = await processVideoForPlatform(inputPath, outputPath, config, metadata);
                results.processed[platformKey] = {
                    ...processResult,
                    url: `/uploads/processed/${outputFilename}`,
                    config
                };
                console.log(`✅ Processed for ${platformKey}`);
            } catch (error) {
                console.error(`❌ Failed to process for ${platformKey}:`, error.message);
                results.processed[platformKey] = {
                    error: error.message,
                    config
                };
            }
        }
        
        return results;
        
    } catch (error) {
        console.error('Video processing error:', error);
        throw error;
    }
}

module.exports = {
    getVideoMetadata,
    detectCameraFormat,
    getOptimalPlatformConfigs,
    processVideoForPlatform,
    processVideoForAllPlatforms,
    PLATFORM_SPECS
};
