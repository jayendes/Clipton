const state = {
    videos: {},
    resolutions: {},
    names: {},
    processedVideos: new Set(),
    recordedBlob: null,
    isGenerating: false
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Setup file input listeners
    for (let i = 1; i <= 5; i++) {
        const videoInput = document.getElementById(`video${i}`);
        const resSelector = document.getElementById(`res${i}`);
        const magicBtn = document.querySelector(`[data-video="${i}"].magic-btn`);
        const nameInput = document.getElementById(`name${i}`);

        if (videoInput) {
            videoInput.addEventListener('change', (e) => handleVideoUpload(e, i));
        }
        if (resSelector) {
            resSelector.addEventListener('change', (e) => {
                state.resolutions[i] = e.target.value;
            });
        }
        if (magicBtn) {
            magicBtn.addEventListener('click', () => enhanceName(i));
        }
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                state.names[i] = e.target.value;
            });
        }
    }

    // Setup generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateVideo);

    // Setup download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadVideo);

    // Initialize default values
    initializeDefaults();
}

function initializeDefaults() {
    // Set default values from inputs
    for (let i = 1; i <= 5; i++) {
        const resSelector = document.getElementById(`res${i}`);
        if (resSelector) {
            state.resolutions[i] = resSelector.value;
        }
        const nameInput = document.getElementById(`name${i}`);
        if (nameInput) {
            state.names[i] = nameInput.value;
        }
    }
}

function enhanceName(videoNum) {
    const nameInput = document.getElementById(`name${videoNum}`);
    const magicBtn = document.querySelector(`[data-video="${videoNum}"].magic-btn`);
    
    if (!nameInput || !nameInput.value) {
        showMessage('Please enter a name first', 'error');
        return;
    }

    // Add sparkle emojis
    let enhanced = nameInput.value;
    if (!enhanced.includes('✨')) {
        enhanced = `✨ ${enhanced} ✨`;
    }
    
    nameInput.value = enhanced;
    state.names[videoNum] = enhanced;
    
    // Animate the button
    if (magicBtn) {
        magicBtn.style.transform = 'scale(1.2) rotate(360deg)';
        setTimeout(() => {
            magicBtn.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    }
    
    showMessage('Name enhanced! ✨', 'success');
}

function handleVideoUpload(event, videoNum) {
    const file = event.target.files[0];
    const statusEl = document.getElementById(`status${videoNum}`);
    
    if (!file) return;

    try {
        showMessage(`Loading video ${videoNum}...`, 'info');
        if (statusEl) statusEl.textContent = '⏳ Loading...';

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            state.videos[videoNum] = video;
            
            if (statusEl) statusEl.textContent = '✅ Loaded';
            showMessage(`Video ${videoNum} loaded!`, 'success');
            checkReady();
        };

        video.onerror = () => {
            if (statusEl) statusEl.textContent = '❌ Failed';
            showMessage(`Failed to load video ${videoNum}`, 'error');
        };

    } catch (error) {
        console.error('Error handling video upload:', error);
        if (statusEl) statusEl.textContent = '❌ Error';
        showMessage(`Error loading video ${videoNum}`, 'error');
    }
}

function checkReady() {
    const allLoaded = Object.keys(state.videos).length === 5;
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.disabled = !allLoaded;

    if (allLoaded) {
        showMessage('✅ All videos loaded! Click Generate.', 'success');
    }
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    if (msg) {
        msg.textContent = text;
        msg.className = type;
    }
}

function showProgress(percent, text) {
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progress) progress.style.display = 'block';
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = text;
}

function hideProgress() {
    const progress = document.getElementById('progress');
    if (progress) progress.style.display = 'none';
}

async function generateVideo() {
    if (state.isGenerating) {
        showMessage('Already generating...', 'error');
        return;
    }

    try {
        state.isGenerating = true;
        showMessage('Starting video generation...', 'info');

        // Get title settings
        const titleText = document.getElementById('titleText').value || 'Best';
        const top5Text = document.getElementById('top5Text').value || 'TOP 5';
        const top5Color = document.getElementById('top5Color').value || '#FF0000';
        const rankingObject = document.getElementById('rankingObject').value || 'Moments';
        const objectColor = document.getElementById('objectColor').value || '#FFD700';
        const endingText = document.getElementById('endingText').value || 'Ever';
        const subscribeText = document.getElementById('subscribeText').value || 'Subscribe for more!';

        // Setup canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        // Setup media recorder
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm',
            videoBitsPerSecond: 2500000
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            state.recordedBlob = blob;
            
            // Show download button
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) {
                downloadBtn.style.display = 'block';
                downloadBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            }
            
            hideProgress();
            showMessage('✅ Video generated successfully!', 'success');
        };

        mediaRecorder.start();
        showProgress(0, 'Initializing...');

        // Video play order: 3,4,5,2,1
        const videoOrder = [3, 4, 5, 2, 1];
        
        for (let i = 0; i < videoOrder.length; i++) {
            const videoNum = videoOrder[i];
            const video = state.videos[videoNum];
            
            if (!video) {
                throw new Error(`Video ${videoNum} not loaded`);
            }
            
            // Show subscribe button before video 2 (after video 5)
            if (i === 3) { // After 3,4,5 and before 2
                showProgress(60, 'Showing subscribe...');
                await showSubscribeButton(ctx, canvas.width, canvas.height, video);
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
            }
            
            showProgress(20 + (i * 15), `Processing video ${i + 1}/5...`);
            
            video.currentTime = 0;
            video.muted = true;
            
            await video.play();
            
            state.processedVideos.add(videoNum);
            
            await new Promise((resolve) => {
                let frameCount = 0;
                const maxFrames = 600;
                
                const renderFrame = () => {
                    frameCount++;
                    
                    if (video.ended || video.paused || frameCount > maxFrames) {
                        resolve();
                        return;
                    }
                    
                    // Draw black background
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw video with zoom/crop
                    drawVideoFrame(ctx, video, canvas.width, canvas.height, videoNum);
                    
                    // Draw overlays
                    drawOverlays(ctx, canvas.width, canvas.height, titleText, top5Text, top5Color, 
                                rankingObject, objectColor, endingText, videoNum);
                    
                    requestAnimationFrame(renderFrame);
                };
                
                renderFrame();
            });
            
            video.pause();
        }
        
        showProgress(95, 'Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        mediaRecorder.stop();
        showProgress(100, 'Complete!');
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error: ' + error.message, 'error');
        hideProgress();
    } finally {
        state.isGenerating = false;
    }
}

function drawVideoFrame(ctx, video, canvasWidth, canvasHeight, videoNum) {
    const resolution = state.resolutions[videoNum] || 'mobile';
    
    try {
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (resolution === 'pc') {
            // PC resolution - zoom in and crop
            const zoomFactor = 1.15; // 15% zoom
            
            if (videoAspect > canvasAspect) {
                drawHeight = canvasHeight * zoomFactor;
                drawWidth = drawHeight * videoAspect;
                offsetX = (canvasWidth - drawWidth) / 2;
                offsetY = (canvasHeight - drawHeight) / 2;
            } else {
                drawWidth = canvasWidth * zoomFactor;
                drawHeight = drawWidth / videoAspect;
                offsetX = (canvasWidth - drawWidth) / 2;
                offsetY = (canvasHeight - drawHeight) / 2;
            }
        } else {
            // Mobile resolution - fit normally
            if (videoAspect > canvasAspect) {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * videoAspect;
                offsetX = (canvasWidth - drawWidth) / 2;
            } else {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / videoAspect;
                offsetY = (canvasHeight - drawHeight) / 2;
            }
        }
        
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    } catch (e) {
        console.warn('Failed to draw video frame:', e);
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

async function showSubscribeButton(ctx, width, height, currentVideo) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Draw the current video frame (paused)
            if (currentVideo) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                
                // Draw video frame
                drawVideoFrame(ctx, currentVideo, width, height, 2); // Video 2 since it's before video 2
            }
            
            // Add semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, width, height);
            
            // Draw subscribe button with transparency
            const imgAspect = img.width / img.height;
            const targetWidth = width * 0.5;
            const targetHeight = targetWidth / imgAspect;
            const x = (width - targetWidth) / 2;
            const y = (height - targetHeight) / 2;
            
            // Add white border for better visibility
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.strokeRect(x - 2, y - 2, targetWidth + 4, targetHeight + 4);
            
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            resolve();
        };
        img.onerror = () => {
            // Fallback if image doesn't load
            if (currentVideo) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                
                // Draw video frame
                drawVideoFrame(ctx, currentVideo, width, height, 2); // Video 2 since it's before video 2
            }
            
            // Add semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, width, height);
            
            // Draw fallback subscribe button
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            
            const buttonWidth = 500;
            const buttonHeight = 100;
            const buttonX = (width - buttonWidth) / 2;
            const buttonY = (height - buttonHeight) / 2;
            
            // Draw rounded rectangle with transparency
            roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 20);
            ctx.fill();
            ctx.stroke();
            
            // Draw subscribe text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SUBSCRIBE', width / 2, height / 2);
            
            resolve();
        };
        img.src = 'autosub.png';
    });
}

function drawOverlays(ctx, width, height, titleText, top5Text, top5Color, rankingObject, objectColor, endingText, currentVideo) {
    const titleFontSize = Math.floor(width * 0.055);
    const numberFontSize = Math.floor(width * 0.09);
    const nameFontSize = Math.floor(width * 0.045);
    
    // Draw title
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(Math.floor(titleFontSize * 0.12), 4);
    
    const titleY = height * 0.06;
    
    // Build title parts
    const fullTitle = `${titleText} ${top5Text} ${rankingObject} ${endingText}`;
    const titleWidth = ctx.measureText(titleText).width;
    const top5Width = ctx.measureText(top5Text).width;
    const objectWidth = ctx.measureText(rankingObject).width;
    const endingWidth = ctx.measureText(endingText).width;
    const totalWidth = titleWidth + top5Width + objectWidth + endingWidth + 30; // spacing
    
    let x = (width - totalWidth) / 2;
    
    // Draw title
    ctx.fillStyle = '#FFF';
    ctx.strokeText(titleText, x + titleWidth / 2, titleY);
    ctx.fillText(titleText, x + titleWidth / 2, titleY);
    x += titleWidth + 10;
    
    // Draw TOP 5 in custom color
    ctx.fillStyle = top5Color;
    ctx.strokeText(top5Text, x + top5Width / 2, titleY);
    ctx.fillText(top5Text, x + top5Width / 2, titleY);
    x += top5Width + 10;
    
    // Draw ranking object in custom color
    ctx.fillStyle = objectColor;
    ctx.strokeText(rankingObject, x + objectWidth / 2, titleY);
    ctx.fillText(rankingObject, x + objectWidth / 2, titleY);
    x += objectWidth + 10;
    
    // Draw ending
    ctx.fillStyle = '#FFF';
    ctx.strokeText(endingText, x + endingWidth / 2, titleY);
    ctx.fillText(endingText, x + endingWidth / 2, titleY);
    
    // Draw numbers with gold/silver/bronze
    ctx.font = `bold ${numberFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let numberY = height * 0.18;
    const numberX = width * 0.05;
    const nameX = width * 0.18;
    const numberSpacing = height * 0.12;
    
    const numberColors = {
        1: '#FFD700', // Gold
        2: '#C0C0C0', // Silver
        3: '#CD7F32', // Bronze
        4: '#FFFFFF', // White
        5: '#FFFFFF'  // White
    };
    
    for (let i = 1; i <= 5; i++) {
        const numberText = `${i}.`;
        
        ctx.fillStyle = numberColors[i];
        ctx.strokeText(numberText, numberX, numberY);
        ctx.fillText(numberText, numberX, numberY);
        
        // Draw clip name if processed
        if (state.processedVideos.has(i) && state.names[i]) {
            ctx.font = `bold ${nameFontSize}px Arial`;
            ctx.fillStyle = '#FFF';
            ctx.strokeText(state.names[i], nameX, numberY + 5);
            ctx.fillText(state.names[i], nameX, numberY + 5);
            ctx.font = `bold ${numberFontSize}px Arial`;
        }
        
        numberY += numberSpacing;
    }
    
    // Note: Big number overlay removed as requested
}

function downloadVideo() {
    if (!state.recordedBlob) {
        showMessage('❌ Generate video first!', 'error');
        return;
    }
    
    try {
        showMessage('Preparing download...', 'info');
        
        const url = URL.createObjectURL(state.recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFilename();
        a.style.display = 'none';
        
        document.body.appendChild(a);
        
        setTimeout(() => {
            a.click();
            
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                URL.revokeObjectURL(url);
                showMessage('✅ Downloaded!', 'success');
            }, 100);
        }, 100);
        
    } catch (error) {
        console.error('Download error:', error);
        showMessage('❌ Download failed: ' + error.message, 'error');
    }
}

function getFilename() {
    const titleText = document.getElementById('titleText').value || 'Best';
    const top5Text = document.getElementById('top5Text').value || 'TOP 5';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${titleText} ${top5Text} - ${timestamp}.webm`;
}