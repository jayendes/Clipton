// State management
const state = {
    videos: {},
    names: {},
    highlightColor: '#FF0000',
    recordedBlob: null
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

async function generateVideo() {
    try {
        showMessage('Generating video...', 'info');
        showProgress(0, 'Starting...');
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (9:16 aspect ratio)
        canvas.width = 1080;
        canvas.height = 1920;
        
        // Get title settings
        const titleText = document.getElementById('titleText').value || 'Ranking Top 5 Best';
        const highlightWord = document.getElementById('highlightWord').value;
        const endingText = document.getElementById('endingText').value || 'Moments';
        
        // Play order: 2, 3, 4, 5, 1
        const playOrder = [2, 3, 4, 5, 1];
        
        // Setup MediaRecorder
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            state.recordedBlob = blob;
            showMessage('Video generated! Click Download to save.', 'success');
            document.getElementById('downloadBtn').disabled = false;
            hideProgress();
        };
        
        mediaRecorder.start();
        showProgress(10, 'Recording started...');
        
        // Process each video in order
        for (let i = 0; i < playOrder.length; i++) {
            const videoNum = playOrder[i];
            const video = state.videos[videoNum];
            
            showProgress(20 + (i * 15), `Processing video ${i + 1} of 5...`);
            
            // Reset and play video
            video.currentTime = 0;
            await video.play();
            
            // Render frames
            await new Promise((resolve) => {
                const renderFrame = () => {
                    if (video.ended || video.paused) {
                        resolve();
                        return;
                    }
                    
                    // Draw video frame
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Draw overlays
                    drawOverlays(ctx, canvas.width, canvas.height, titleText, highlightWord, endingText, videoNum);
                    
                    requestAnimationFrame(renderFrame);
                };
                
                renderFrame();
            });
            
            video.pause();
        }
        
        showProgress(95, 'Finalizing...');
        
        // Stop recording after a short delay
        setTimeout(() => {
            mediaRecorder.stop();
            showProgress(100, 'Complete!');
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error generating video: ' + error.message, 'error');
        hideProgress();
    }
}

function drawOverlays(ctx, width, height, titleText, highlightWord, endingText, currentVideo) {
    // Draw title
    ctx.font = 'bold 70px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.fillStyle = '#FFF';
    
    const titleY = 100;
    
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
    
    // Draw numbers 1-5
    ctx.font = 'bold 90px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFF';
    
    let numberY = 300;
    for (let i = 1; i <= 5; i++) {
        const numberText = `${i}.`;
        ctx.strokeText(numberText, 50, numberY);
        ctx.fillText(numberText, 50, numberY);
        
        // Draw clip name if this is the current video
        if (i === currentVideo && state.names[i]) {
            ctx.font = 'bold 50px Arial';
            ctx.strokeText(state.names[i], 180, numberY);
            ctx.fillText(state.names[i], 180, numberY);
            ctx.font = 'bold 90px Arial';
        }
        
        numberY += 180;
    }
}

function downloadVideo() {
    if (!state.recordedBlob) {
        showMessage('No video to download. Generate first!', 'error');
        return;
    }
    
    const url = URL.createObjectURL(state.recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clipton-video-' + Date.now() + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Video downloaded!', 'success');
}