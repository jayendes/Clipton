// State management
const state = {
    videos: {},
    names: {},
    highlightColor: '#FF0000',
    recordedBlob: null,
    mimeType: 'video/webm',
    processedVideos: new Set() // Track which videos have been shown
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
        
        fileInput.addEventListener('change', (e) => handleVideoUpload(e, i));
        nameInput.addEventListener('input', (e) => {
            state.names[i] = e.target.value;
        });
    }
    
    // Color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.highlightColor = e.target.dataset.color;
        });
    });
    
    // Generate and download buttons
    document.getElementById('generateBtn').addEventListener('click', generateVideo);
    document.getElementById('downloadBtn').addEventListener('click', downloadVideo);
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

// Get the best supported MIME type for MediaRecorder
function getSupportedMimeType() {
    // Test in order of preference
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264',
        'video/mp4'
    ];
    
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log('Using codec:', type);
            return type;
        }
    }
    
    // Last resort - try without any codec spec
    console.log('Using fallback: video/webm');
    return 'video/webm';
}

function getFilename() {
    const titleText = document.getElementById('titleText').value || 'Top 5';
    const highlightWord = document.getElementById('highlightWord').value;
    const endingText = document.getElementById('endingText').value || 'Moments';
    
    // Build clean filename
    let filename = titleText.toLowerCase().replace(/\s+/g, '-');
    if (highlightWord) {
        filename += '-' + highlightWord.toLowerCase().replace(/\s+/g, '-');
    }
    filename += '-' + endingText.toLowerCase().replace(/\s+/g, '-');
    
    // Clean up special characters
    filename = filename.replace(/[^a-z0-9-]/g, '');
    
    // Add file extension based on MIME type
    const extension = state.mimeType.includes('mp4') ? '.mp4' : '.webm';
    
    return filename + extension;
}

async function generateVideo() {
    try {
        showMessage('Preparing video generation...', 'info');
        showProgress(0, 'Initializing...');
        
        // Reset processed videos
        state.processedVideos.clear();
        
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
        
        // Get title settings
        const titleText = document.getElementById('titleText').value || 'Ranking Top 5 Best';
        const highlightWord = document.getElementById('highlightWord').value;
        const endingText = document.getElementById('endingText').value || 'Moments';
        
        // Play order: 2, 3, 4, 5, 1
        const playOrder = [2, 3, 4, 5, 1];
        
        // Setup MediaRecorder with supported codec
        const stream = canvas.captureStream(30);
        
        let options = {
            mimeType: mimeType,
            videoBitsPerSecond: 2500000 // Lower bitrate for compatibility
        };
        
        // Try to create MediaRecorder with options
        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.log('Falling back to default options');
            // Try without mimeType
            try {
                options = { videoBitsPerSecond: 2500000 };
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e2) {
                console.log('Falling back to no options');
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

function drawOverlays(ctx, width, height, titleText, highlightWord, endingText, currentVideo) {
    // Scale font sizes for phone resolution
    const titleFontSize = Math.floor(width * 0.065); // ~47px for 720px width
    const numberFontSize = Math.floor(width * 0.083); // ~60px for 720px width
    const nameFontSize = Math.floor(width * 0.046); // ~33px for 720px width
    
    // Draw title
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.floor(titleFontSize * 0.08); // ~4px
    ctx.fillStyle = '#FFF';
    
    const titleY = height * 0.08; // 8% from top
    
    // Build full title
    let fullTitle = titleText;
    if (highlightWord) {
        fullTitle += ' ' + highlightWord;
    }
    if (endingText) {
        fullTitle += ' ' + endingText;
    }
    
    // Draw title with outline
    ctx.strokeText(fullTitle, width / 2, titleY);
    
    // Draw title parts with color
    if (highlightWord && titleText.includes(highlightWord)) {
        // Complex rendering with highlight
        const parts = titleText.split(highlightWord);
        const beforeText = parts[0];
        const afterText = parts[1] || '';
        
        // Measure text widths
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
    
    // Draw numbers 1-5 with persistent text
    ctx.font = `bold ${numberFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFF';
    
    let numberY = height * 0.25; // 25% from top
    const numberX = width * 0.07; // 7% from left
    const nameX = width * 0.25; // 25% from left
    const numberSpacing = height * 0.14; // 14% spacing
    
    for (let i = 1; i <= 5; i++) {
        const numberText = `${i}.`;
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
        
        // Create download link
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
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage('✅ Video downloaded successfully!', 'success');
            }, 100);
        }, 100);
        
    } catch (error) {
        console.error('Download error:', error);
        showMessage('❌ Download failed: ' + error.message, 'error');
    }
}