// State management
const state = {
    videos: {},
    names: {},
    highlightColor: '#FF0000',
    recordedBlob: null,
    mimeType: 'video/webm',
    processedVideos: new Set(), // Track which videos have been shown
    showSubscribe: false // Track when to show subscribe popup
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Video uploads
    for (let i = 1; i <= 5; i++) {
        const fileInput = document.getElementById(`video${i}`);
        const nameInput = document.getElementById(`name${i}`);
        const magicBtn = document.querySelector(`[data-video="${i}"]`);
        
        fileInput.addEventListener('change', (e) => handleVideoUpload(e, i));
        nameInput.addEventListener('input', (e) => {
            state.names[i] = e.target.value;
        });
        
        magicBtn.addEventListener('click', (e) => enhanceClipName(i));
    }
    
    // Color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            document.querySelectorAll('.color-btn').forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = 'transparent';
            });
            
            // Add active to clicked
            e.target.classList.add('active');
            e.target.style.borderColor = '#fff';
            state.highlightColor = e.target.dataset.color;
        });
    });
    
    // Generate and download buttons
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (generateBtn) generateBtn.addEventListener('click', generateVideo);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadVideo);
}

function handleVideoUpload(event, num) {
    const file = event.target.files[0];
    if (!file) return;
    
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
        state.videos[num] = video;
        document.getElementById(`status${num}`).textContent = '✓ Loaded';
        checkReady();
    };
    
    video.onerror = () => {
        document.getElementById(`status${num}`).textContent = '❌ Error loading video';
        showMessage('Error loading video ' + num, 'error');
    };
}

function checkReady() {
    const allLoaded = Object.keys(state.videos).length === 5;
    document.getElementById('generateBtn').disabled = !allLoaded;
    
    if (allLoaded) {
        showMessage('All videos loaded! Click Generate Video to create your compilation.', 'success');
    }
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = type;
}

function showProgress(percent, text) {
    const progress = document.getElementById('progress');
    const bar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progress.style.display = 'block';
    bar.style.width = percent + '%';
    progressText.textContent = text;
}

function hideProgress() {
    document.getElementById('progress').style.display = 'none';
}

// Magic wand functionality - enhance clip names with emojis and better formatting
function enhanceClipName(videoNum) {
    const nameInput = document.getElementById(`name${videoNum}`);
    if (!nameInput) return;
    
    const currentName = nameInput.value.trim();
    if (!currentName) return;
    
    const lowerName = currentName.toLowerCase();
    let enhancedName = currentName;
    
    // Common keywords and their enhanced versions
    const enhancements = {
        dunk: 'Slam Dunk 🏀',
        slam: 'Slam 🏀',
        shot: 'Amazing Shot 🎯',
        goal: 'Epic Goal ⚽',
        score: 'Perfect Score 🎯',
        win: 'Victory 🏆',
        victory: 'Victory 🏆',
        fail: 'Epic Fail 😂',
        funny: 'Hilarious 😂',
        lol: 'LOL 😂',
        kill: 'Epic Kill 💀',
        eliminate: 'Eliminated 💀',
        trick: 'Insane Trick 🎪',
        amazing: 'Amazing ✨',
        cool: 'Cool 😎',
        awesome: 'Awesome 🔥',
        fire: 'Fire 🔥',
        lit: 'Lit 🔥',
        clutch: 'Clutch Play ⚡',
        epic: 'Epic 🌟',
        crazy: 'Crazy 🤪',
        insane: 'Insane 🤪',
        perfect: 'Perfect 💯',
        best: 'The Best 👑',
        first: 'First Place 🥇',
        second: 'Second Place 🥈',
        third: 'Third Place 🥉',
        lucky: 'Lucky 🍀',
        unlucky: 'Unlucky 💀',
        rage: 'Rage 😡',
        angry: 'Angry 😡',
        happy: 'Happy 😊',
        sad: 'Sad 😢',
        wow: 'Wow 😮',
        omg: 'OMG 😮',
        nice: 'Nice! 👍',
        good: 'Good! 👍',
        great: 'Great! 🎉',
        perfect: 'Perfect! 💯'
    };
    
    // Check for keywords and enhance
    for (const [keyword, enhanced] of Object.entries(enhancements)) {
        if (lowerName.includes(keyword)) {
            enhancedName = enhanced;
            break;
        }
    }
    
    // If no specific match, add general enhancement
    if (enhancedName === currentName) {
        if (lowerName.includes('video')) {
            enhancedName = currentName.replace(/video/i, 'Video 📹');
        } else if (lowerName.includes('clip')) {
            enhancedName = currentName.replace(/clip/i, 'Clip 🎬');
        } else if (lowerName.includes('moment')) {
            enhancedName = currentName.replace(/moment/i, 'Moment 📸');
        } else {
            // Add a random positive emoji
            const emojis = ['🔥', '✨', '💯', '🎯', '🏆', '⚡', '🌟'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            enhancedName = currentName.charAt(0).toUpperCase() + currentName.slice(1) + ' ' + randomEmoji;
        }
    }
    
    nameInput.value = enhancedName;
    state.names[videoNum] = enhancedName;
}

// Get the best supported MIME type for MediaRecorder (optimized for Firefox compatibility)
function getSupportedMimeType() {
    // Optimized order for better Firefox support
    const types = [
        'video/webm;codecs=vp8',
        'video/webm',
        'video/webm;codecs=vp9',
        'video/mp4;codecs=h264',
        'video/mp4'
    ];
    
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    
    // Last resort
    return 'video/webm';
}

function getFilename() {
    const titleElement = document.getElementById('titleText');
    const highlightElement = document.getElementById('highlightWord');
    const endingElement = document.getElementById('endingText');
    
    const titleText = (titleElement && titleElement.value) || 'Top 5';
    const highlightWord = (highlightElement && highlightElement.value) || '';
    const endingText = (endingElement && endingElement.value) || 'Moments';
    
    // Build clean filename
    let filename = titleText.toLowerCase().replace(/\s+/g, '-');
    if (highlightWord) {
        filename += '-' + highlightWord.toLowerCase().replace(/\s+/g, '-');
    }
    filename += '-' + endingText.toLowerCase().replace(/\s+/g, '-');
    
    // Clean up special characters
    filename = filename.replace(/[^a-z0-9-]/g, '');
    
    // Force MP4 extension for YouTube compatibility
    return filename + '.mp4';
}

async function generateVideo() {
    try {
        showMessage('Preparing video generation...', 'info');
        showProgress(0, 'Initializing...');
        
        // Reset processed videos and subscribe state
        state.processedVideos.clear();
        state.showSubscribe = false;
        
        // Check browser compatibility
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            throw new Error('Your browser does not support video recording. Please try Chrome, Edge, or Firefox.');
        }
        
        // Get supported MIME type
        const mimeType = getSupportedMimeType();
        state.mimeType = mimeType;
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for phone resolution (9:16 aspect ratio)
        canvas.width = 720;  // Phone width
        canvas.height = 1280; // Phone height
        
        // Get title settings with null checks
        const titleElement = document.getElementById('titleText');
        const highlightElement = document.getElementById('highlightWord');
        const endingElement = document.getElementById('endingText');
        const subscribeElement = document.getElementById('subscribeText');
        
        const titleText = (titleElement && titleElement.value) || 'Ranking Top 5 Best';
        const highlightWord = (highlightElement && highlightElement.value) || '';
        const endingText = (endingElement && endingElement.value) || 'Moments';
        const subscribeText = (subscribeElement && subscribeElement.value) || 'Subscribe for more!';
        
        // Play order: 2, 3, 4, 5, 1
        const playOrder = [2, 3, 4, 5, 1];
        
        // Setup MediaRecorder with supported codec (optimized for Firefox)
        const stream = canvas.captureStream(25); // Lower framerate for better compatibility
        
        let options = {
            mimeType: mimeType,
            videoBitsPerSecond: 2000000 // Lower bitrate for better compatibility
        };
        
        // Try to create MediaRecorder with options (Firefox-friendly approach)
        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            try {
                // Try without mimeType for Firefox
                options = { videoBitsPerSecond: 2000000 };
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e2) {
                // Final fallback
                mediaRecorder = new MediaRecorder(stream);
            }
        }
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onerror = (e) => {
            console.error('MediaRecorder error:', e);
            throw new Error('Recording failed: ' + e.error);
        };
        
        mediaRecorder.onstop = () => {
            try {
                const blob = new Blob(chunks, { type: mimeType });
                state.recordedBlob = blob;
                showMessage('✅ Video generated successfully! Click Download to save.', 'success');
                document.getElementById('downloadBtn').disabled = false;
                document.getElementById('downloadBtn').style.background = '#4CAF50';
                hideProgress();
            } catch (error) {
                throw new Error('Failed to create video file: ' + error.message);
            }
        };
        
        mediaRecorder.start(100); // Collect data every 100ms
        showProgress(10, 'Recording started...');
        
        // Add a small delay to ensure recording is active
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Process each video in order
        for (let i = 0; i < playOrder.length; i++) {
            const videoNum = playOrder[i];
            const video = state.videos[videoNum];
            
            if (!video) {
                throw new Error(`Video ${videoNum} is not loaded properly`);
            }
            
            // Show subscribe popup before last video (video 1)
            if (videoNum === 1 && !state.showSubscribe) {
                state.showSubscribe = true;
                showProgress(70 + (i * 5), 'Showing subscribe popup...');
                
                // Show subscribe popup for 3 seconds
                await showSubscribePopup(ctx, canvas.width, canvas.height, subscribeText);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            showProgress(20 + (i * 15), `Processing video ${i + 1} of 5...`);
            
            // Reset and play video
            video.currentTime = 0;
            video.muted = true;
            
            try {
                await video.play();
            } catch (e) {
                throw new Error(`Failed to play video ${videoNum}: ${e.message}`);
            }
            
            // Add this video to processed set
            state.processedVideos.add(videoNum);
            
            // Render frames
            await new Promise((resolve) => {
                let frameCount = 0;
                const maxFrames = 450; // Allow more frames for longer videos
                
                const renderFrame = () => {
                    frameCount++;
                    
                    if (video.ended || video.paused || frameCount > maxFrames) {
                        resolve();
                        return;
                    }
                    
                    // Draw background
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw video frame (fit to canvas while maintaining aspect ratio)
                    try {
                        const videoAspect = video.videoWidth / video.videoHeight;
                        const canvasAspect = canvas.width / canvas.height;
                        
                        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                        
                        if (videoAspect > canvasAspect) {
                            // Video is wider than canvas
                            drawHeight = canvas.height;
                            drawWidth = canvas.height * videoAspect;
                            offsetX = (canvas.width - drawWidth) / 2;
                        } else {
                            // Video is taller than canvas
                            drawWidth = canvas.width;
                            drawHeight = canvas.width / videoAspect;
                            offsetY = (canvas.height - drawHeight) / 2;
                        }
                        
                        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
                    } catch (e) {
                        // If video fails to draw, just show background
                        console.warn('Failed to draw video frame:', e);
                    }
                    
                    // Draw overlays with persistent text
                    drawOverlays(ctx, canvas.width, canvas.height, titleText, highlightWord, endingText, videoNum);
                    
                    requestAnimationFrame(renderFrame);
                };
                
                renderFrame();
            });
            
            video.pause();
        }
        
        showProgress(95, 'Finalizing video...');
        
        // Wait a bit before stopping to ensure final frames are captured
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Stop recording
        mediaRecorder.stop();
        showProgress(100, 'Complete!');
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error: ' + error.message, 'error');
        hideProgress();
    }
}

function showSubscribePopup(ctx, width, height, text) {
    return new Promise((resolve) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const popupWidth = width * 0.8;
        const popupHeight = height * 0.3;
        const popupX = (width - popupWidth) / 2;
        const popupY = (height - popupHeight) / 2;
        
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw popup background
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
        
        // Draw subscribe text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(text, centerX, centerY);
        ctx.fillText(text, centerX, centerY);
        
        // Draw "Click to continue" text
        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Click to continue...', centerX, centerY + 50);
        
        resolve();
    });
}

function drawOverlays(ctx, width, height, titleText, highlightWord, endingText, currentVideo) {
    // Scale font sizes for phone resolution with proper sizing
    const titleFontSize = Math.min(Math.floor(width * 0.055), 40); // Smaller title font
    const numberFontSize = Math.min(Math.floor(width * 0.07), 50); // Smaller number font
    const nameFontSize = Math.min(Math.floor(width * 0.04), 30); // Smaller name font
    
    // Draw title with proper wrapping
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(Math.floor(titleFontSize * 0.1), 3); // Ensure outline is visible
    ctx.fillStyle = '#FFF';
    
    const titleY = height * 0.06; // Higher position to prevent cutoff
    
    // Build full title
    let fullTitle = titleText;
    if (highlightWord) {
        fullTitle += ' ' + highlightWord;
    }
    if (endingText) {
        fullTitle += ' ' + endingText;
    }
    
    // Check if title is too wide and wrap if necessary
    const titleWidth = ctx.measureText(fullTitle).width;
    const maxTitleWidth = width * 0.9; // Leave some padding
    
    if (titleWidth > maxTitleWidth) {
        // Split title into multiple lines
        const words = fullTitle.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth <= maxTitleWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Draw each line
        lines.forEach((line, index) => {
            const lineY = titleY + (index * titleFontSize * 1.2);
            
            // Check if this line contains the highlight
            if (highlightWord && line.includes(highlightWord)) {
                const parts = line.split(highlightWord);
                const beforeText = parts[0];
                const afterText = parts[1] || '';
                
                const beforeWidth = ctx.measureText(beforeText).width;
                const highlightWidth = ctx.measureText(highlightWord).width;
                
                let x = (width - ctx.measureText(line).width) / 2;
                
                // Draw before text
                ctx.fillStyle = '#FFF';
                ctx.strokeText(beforeText, x + beforeWidth / 2, lineY);
                ctx.fillText(beforeText, x + beforeWidth / 2, lineY);
                x += beforeWidth;
                
                // Draw highlight
                ctx.fillStyle = state.highlightColor;
                ctx.strokeText(highlightWord, x + highlightWidth / 2, lineY);
                ctx.fillText(highlightWord, x + highlightWidth / 2, lineY);
                x += highlightWidth;
                
                // Draw after text
                ctx.fillStyle = '#FFF';
                ctx.strokeText(afterText, x + ctx.measureText(afterText).width / 2, lineY);
                ctx.fillText(afterText, x + ctx.measureText(afterText).width / 2, lineY);
            } else {
                ctx.fillStyle = '#FFF';
                ctx.strokeText(line, width / 2, lineY);
                ctx.fillText(line, width / 2, lineY);
            }
        });
    } else {
        // Single line title
        ctx.strokeText(fullTitle, width / 2, titleY);
        
        // Draw title parts with color
        if (highlightWord && titleText.includes(highlightWord)) {
            const parts = titleText.split(highlightWord);
            const beforeText = parts[0];
            const afterText = parts[1] || '';
            
            const beforeWidth = ctx.measureText(beforeText).width;
            const highlightWidth = ctx.measureText(highlightWord).width;
            const afterWidth = ctx.measureText(afterText + ' ' + endingText).width;
            const totalWidth = beforeWidth + highlightWidth + afterWidth;
            
            let x = (width - totalWidth) / 2;
            
            // Draw before text
            ctx.fillStyle = '#FFF';
            ctx.fillText(beforeText, x + beforeWidth / 2, titleY);
            x += beforeWidth;
            
            // Draw highlight
            ctx.fillStyle = state.highlightColor;
            ctx.fillText(highlightWord, x + highlightWidth / 2, titleY);
            x += highlightWidth;
            
            // Draw after text
            ctx.fillStyle = '#FFF';
            ctx.fillText(afterText + ' ' + endingText, x + afterWidth / 2, titleY);
        } else {
            ctx.fillStyle = '#FFF';
            ctx.fillText(fullTitle, width / 2, titleY);
        }
    }
    
    // Draw numbers 1-5 with persistent text
    ctx.font = `bold ${numberFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'top';
    
    let numberY = height * 0.2; // Start higher to avoid title overlap
    const numberX = width * 0.05; // More padding from edge
    const nameX = width * 0.2; // Adjusted position
    const numberSpacing = height * 0.12; // Tighter spacing
    
    for (let i = 1; i <= 5; i++) {
        const numberText = `${i}.`;
        
        // Check if we're running out of space at the bottom
        if (numberY > height * 0.85) {
            break; // Stop drawing if we're too low
        }
        
        ctx.strokeText(numberText, numberX, numberY);
        ctx.fillText(numberText, numberX, numberY);
        
        // Draw clip name if this video has been processed and has a name
        if (state.processedVideos.has(i) && state.names[i]) {
            ctx.font = `bold ${nameFontSize}px Arial`;
            ctx.strokeText(state.names[i], nameX, numberY);
            ctx.fillText(state.names[i], nameX, numberY);
            ctx.font = `bold ${numberFontSize}px Arial`;
        }
        
        numberY += numberSpacing;
    }
}

function downloadVideo() {
    if (!state.recordedBlob) {
        showMessage('❌ No video to download. Generate first!', 'error');
        return;
    }
    
    try {
        showMessage('Preparing download...', 'info');
        
        // Create download link with MP4 filename for YouTube
        const url = URL.createObjectURL(state.recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFilename();
        a.style.display = 'none';
        
        // Add to body, click, then remove
        document.body.appendChild(a);
        
        // Use setTimeout to ensure the link is properly added
        setTimeout(() => {
            a.click();
            
            // Clean up
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                URL.revokeObjectURL(url);
                showMessage('✅ Video downloaded!', 'success');
            }, 100);
        }, 100);
        
    } catch (error) {
        console.error('Download error:', error);
        showMessage('❌ Download failed: ' + error.message, 'error');
    }
}