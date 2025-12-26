// State management
const state = {
    videos: {},
    names: {},
    resolutions: {},
    processedVideos: new Set(),
    recordedBlob: null,
    mimeType: 'video/webm'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Video uploads and settings
    for (let i = 1; i <= 5; i++) {
        const fileInput = document.getElementById(`video${i}`);
        const nameInput = document.getElementById(`name${i}`);
        const magicBtn = document.querySelector(`[data-video="${i}"]`);
        const resSelector = document.getElementById(`res${i}`);
        
        if (fileInput) fileInput.addEventListener('change', (e) => handleVideoUpload(e, i));
        if (nameInput) nameInput.addEventListener('input', (e) => {
            state.names[i] = e.target.value;
        });
        if (magicBtn) magicBtn.addEventListener('click', () => enhanceClipName(i));
        if (resSelector) resSelector.addEventListener('change', (e) => {
            state.resolutions[i] = e.target.value;
        });
        
        // Set default resolution
        state.resolutions[i] = 'mobile';
    }
    
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
        const statusEl = document.getElementById(`status${num}`);
        if (statusEl) statusEl.textContent = '✓ Loaded';
        checkReady();
    };
    
    video.onerror = () => {
        const statusEl = document.getElementById(`status${num}`);
        if (statusEl) statusEl.textContent = '❌ Error';
        showMessage('Error loading video ' + num, 'error');
    };
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
    const bar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progress) progress.style.display = 'block';
    if (bar) bar.style.width = percent + '%';
    if (progressText) progressText.textContent = text;
}

function hideProgress() {
    const progress = document.getElementById('progress');
    if (progress) progress.style.display = 'none';
}

// Magic wand functionality
function enhanceClipName(videoNum) {
    const nameInput = document.getElementById(`name${videoNum}`);
    if (!nameInput) return;
    
    const currentName = nameInput.value.trim();
    if (!currentName) return;
    
    const lowerName = currentName.toLowerCase();
    let enhancedName = currentName;
    
    const enhancements = {
        dunk: 'Slam Dunk 🏀', slam: 'Slam 🏀', shot: 'Amazing Shot 🎯',
        goal: 'Epic Goal ⚽', score: 'Perfect Score 🎯', win: 'Victory 🏆',
        victory: 'Victory 🏆', fail: 'Epic Fail 😂', funny: 'Hilarious 😂',
        lol: 'LOL 😂', kill: 'Epic Kill 💀', eliminate: 'Eliminated 💀',
        trick: 'Insane Trick 🎪', amazing: 'Amazing ✨', cool: 'Cool 😎',
        awesome: 'Awesome 🔥', fire: 'Fire 🔥', lit: 'Lit 🔥',
        clutch: 'Clutch Play ⚡', epic: 'Epic 🌟', crazy: 'Crazy 🤪',
        insane: 'Insane 🤪', perfect: 'Perfect 💯', best: 'The Best 👑',
        first: 'First Place 🥇', second: 'Second Place 🥈', third: 'Third Place 🥉',
        lucky: 'Lucky 🍀', unlucky: 'Unlucky 💀', rage: 'Rage 😡',
        angry: 'Angry 😡', happy: 'Happy 😊', sad: 'Sad 😢',
        wow: 'Wow 😮', omg: 'OMG 😮', nice: 'Nice! 👍',
        good: 'Good! 👍', great: 'Great! 🎉'
    };
    
    for (const [keyword, enhanced] of Object.entries(enhancements)) {
        if (lowerName.includes(keyword)) {
            enhancedName = enhanced;
            break;
        }
    }
    
    if (enhancedName === currentName) {
        const emojis = ['🔥', '✨', '💯', '🎯', '🏆', '⚡', '🌟'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        enhancedName = currentName.charAt(0).toUpperCase() + currentName.slice(1) + ' ' + randomEmoji;
    }
    
    nameInput.value = enhancedName;
    state.names[videoNum] = enhancedName;
}

function getSupportedMimeType() {
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
    
    return 'video/webm';
}

function getFilename() {
    const titleElement = document.getElementById('titleText');
    const top5Element = document.getElementById('top5Text');
    const objectElement = document.getElementById('rankingObject');
    const endingElement = document.getElementById('endingText');
    
    const title = (titleElement && titleElement.value) || 'ranking';
    const top5 = (top5Element && top5Element.value) || 'top-5';
    const object = (objectElement && objectElement.value) || 'moments';
    const ending = (endingElement && endingElement.value) || '';
    
    let filename = `${title}-${top5}-${object}-${ending}`.toLowerCase().replace(/\s+/g, '-');
    filename = filename.replace(/[^a-z0-9-]/g, '');
    
    return filename + '.mp4';
}

async function generateVideo() {
    try {
        showMessage('Generating video...', 'info');
        showProgress(0, 'Initializing...');
        
        state.processedVideos.clear();
        
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            throw new Error('Browser not supported. Use Chrome, Edge, or Firefox.');
        }
        
        const mimeType = getSupportedMimeType();
        state.mimeType = mimeType;
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Always output 1080x1920 (mobile resolution)
        canvas.width = 1080;
        canvas.height = 1920;
        
        // Get settings
        const titleText = document.getElementById('titleText')?.value || 'Ranking';
        const top5Text = document.getElementById('top5Text')?.value || 'TOP 5';
        const top5Color = document.getElementById('top5Color')?.value || '#00FF00';
        const rankingObject = document.getElementById('rankingObject')?.value || 'FUNNIEST';
        const objectColor = document.getElementById('objectColor')?.value || '#FFFF00';
        const endingText = document.getElementById('endingText')?.value || 'MOMENTS';
        
        // Play order: 3, 4, 5, 2, 1
        const playOrder = [3, 4, 5, 2, 1];
        
        // Setup MediaRecorder
        const stream = canvas.captureStream(25);
        
        let options = {
            mimeType: mimeType,
            videoBitsPerSecond: 2500000
        };
        
        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            try {
                options = { videoBitsPerSecond: 2500000 };
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e2) {
                mediaRecorder = new MediaRecorder(stream);
            }
        }
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onerror = (e) => {
            throw new Error('Recording failed: ' + e.error);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            state.recordedBlob = blob;
            showMessage('✅ Video generated!', 'success');
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            }
            hideProgress();
        };
        
        mediaRecorder.start(100);
        showProgress(10, 'Recording...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Process each video in order
        for (let i = 0; i < playOrder.length; i++) {
            const videoNum = playOrder[i];
            const video = state.videos[videoNum];
            
            if (!video) {
                throw new Error(`Video ${videoNum} not loaded`);
            }
            
            // Show subscribe button before video 2 (after video 5)
            if (i === 3) { // After 3,4,5 and before 2
                showProgress(60, 'Showing subscribe...');
                await showSubscribeButton(ctx, canvas.width, canvas.height);
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

async function showSubscribeButton(ctx, width, height) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Draw black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            
            // Draw subscribe button centered
            const imgAspect = img.width / img.height;
            const targetWidth = width * 0.6;
            const targetHeight = targetWidth / imgAspect;
            const x = (width - targetWidth) / 2;
            const y = (height - targetHeight) / 2;
            
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            resolve();
        };
        img.onerror = () => {
            // Fallback if image doesn't load
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
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
    
    // Draw current number overlay on video
    if (currentVideo) {
        ctx.font = `bold ${numberFontSize * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = numberColors[currentVideo];
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        const overlayY = height * 0.5;
        ctx.strokeText(currentVideo.toString(), width / 2, overlayY);
        ctx.fillText(currentVideo.toString(), width / 2, overlayY);
    }
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