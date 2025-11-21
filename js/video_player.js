// video_player.js - Complete video playback system
const VideoPlayer = {
    modal: null,
    gridModal: null,
    currentTimestamp: null,
    currentCamera: null,
    videoChunks: [],
    currentChunkIndex: 0,
    
    init() {
        this.createVideoModal();
        this.createCameraGridModal();
        this.setupKeyboardShortcuts();
        
        // Log browser info for debugging
        if (this.isSafari()) {
            console.log('🍎 Safari browser detected - applying compatibility fixes');
        }
    },
    
    /**
     * Detect Safari browser
     */
    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    },
    
    /**
     * Setup keyboard shortcuts for video player
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when video modal is open
            if (!this.modal || !document.getElementById('videoModal').classList.contains('show')) {
                return;
            }
            
            // Prevent default for our shortcuts
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.code)) {
                e.preventDefault();
            }
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.skipBackward();
                    break;
                case 'ArrowRight':
                    this.skipForward();
                    break;
                case 'ArrowUp':
                    this.previousChunk();
                    break;
                case 'ArrowDown':
                    this.nextChunk();
                    break;
                case 'Space':
                    this.togglePlayPause();
                    break;
                case 'Escape':
                    this.backToGrid();
                    break;
            }
        });
    },
    
    /**
     * Toggle play/pause for the video
     */
    togglePlayPause() {
        const videoEl = document.getElementById('videoPlayer');
        if (!videoEl) return;
        
        if (videoEl.paused) {
            videoEl.play();
        } else {
            videoEl.pause();
        }
    },
    
    /**
     * Step 1: Show camera grid (like desktop app)
     */
    showCameraGrid(timestamp, count) {
        this.currentTimestamp = timestamp;
        
        // Update info
        document.getElementById('gridTimestamp').textContent = new Date(timestamp).toLocaleString();
        document.getElementById('gridCount').textContent = count;
        
        // Get all cameras
        let cameras = ['Cam1', 'Cam2', 'Cam3', 'Cam4', 'Cam5', 'Cam6', 'Cam7', 'Cam8'];
        
        if (CA.data && CA.data.cameras) {
            cameras = CA.data.cameras.filter(c => c !== 'Global');
            console.log('Using cameras from CA.data:', cameras);
        } else {
            const cameraSelect = document.getElementById('cameraSelect');
            if (cameraSelect && cameraSelect.options.length > 1) {
                cameras = Array.from(cameraSelect.options)
                    .slice(1)
                    .map(option => option.value);
                console.log('Using cameras from select options:', cameras);
            }
        }
        
        // Build grid with PLACEHOLDERS (no video loading)
        const container = document.getElementById('cameraGridContainer');
        container.innerHTML = '';
        
        cameras.forEach(cam => {
            const card = document.createElement('div');
            card.className = 'camera-grid-item';
            card.style.cursor = 'pointer';
            
            // Use placeholder instead of video
            card.innerHTML = `
                <div class="camera-label">${cam}</div>
                <div class="camera-placeholder" style="
                    background: #000;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 180px;
                    border: 2px solid #2196F3;
                    border-radius: 8px;
                ">
                    <div style="text-align: center;">
                        <i class="bi bi-play-circle" style="font-size: 48px;"></i>
                        <div style="margin-top: 10px; font-size: 14px;">Click to Play</div>
                    </div>
                </div>
            `;
            
            // Click opens full player (only loads one video)
            card.onclick = () => this.playFullVideo(cam, timestamp);
            
            container.appendChild(card);
        });
        
        // Show modal
        if (this.gridModal) {
            this.gridModal.show();
        }
    },
    
    /**
     * Step 2: Play full video for selected camera (like desktop app)
     */
    async playFullVideo(camera, timestamp) {
        console.log('🎬 Playing video:', camera, timestamp);
        
        // Hide grid
        if (this.gridModal) {
            this.gridModal.hide();
        }
        
        // Store current state
        this.currentCamera = camera;
        this.currentTimestamp = timestamp;
        
        // Update info
        document.getElementById('videoCamera').textContent = camera;
        const timestampDate = new Date(timestamp);
        document.getElementById('videoTimestamp').textContent = 
            timestampDate.toLocaleString() + 
            ` (Peak at ${timestampDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`;
  
        
        // Show loading
        this.showLoading(true);
        this.hideError();
        
        // Show modal FIRST, then load video after animation completes
        if (this.modal) {
            // Get the modal element
            const modalEl = document.getElementById('videoModal');
            
            // Wait for modal to be fully shown (animation complete)
            modalEl.addEventListener('shown.bs.modal', async () => {
                console.log('🎬 Modal fully shown, waiting for DOM to settle...');
                
                // Wait for DOM to fully render and calculate dimensions
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Check if video container has dimensions
                const videoEl = document.getElementById('videoPlayer');
                const container = document.querySelector('.video-player-container');
                console.log('📐 Container dimensions:', container?.offsetWidth, 'x', container?.offsetHeight);
                console.log('📐 Video element dimensions:', videoEl?.offsetWidth, 'x', videoEl?.offsetHeight);
                
                if (container && container.offsetWidth === 0) {
                    console.warn('⚠️ Container has no width, forcing layout...');
                    container.style.width = '100%';
                    container.style.minHeight = '450px';
                }
                
                try {
                    // Load video chunks for this camera and time period
                    await this.loadVideoChunks(camera, timestamp);
                    
                    // Load first video chunk
                    this.loadCurrentVideo();
                } catch (error) {
                    this.showLoading(false);
                    this.showError('Failed to load video chunks: ' + error.message);
                }
            }, { once: true });  // Only fire once
            
            // Show the modal (this starts the animation)
            this.modal.show();
        }
    },
    
    /**
     * Load video chunks for the given camera and timestamp
     * Videos are stored hourly, so we load the hour containing the timestamp
     */
    async loadVideoChunks(camera, timestamp) {
        const baseTime = new Date(timestamp);
        this.videoChunks = [];
        
        // Generate hourly chunks for ±3 hours around selected time
        const startTime = new Date(baseTime);
        startTime.setHours(baseTime.getHours() - 3);
        startTime.setMinutes(0, 0, 0);
        
        const endTime = new Date(baseTime);
        endTime.setHours(baseTime.getHours() + 3);
        
        let currentTime = new Date(startTime);
        while (currentTime <= endTime) {
            this.videoChunks.push({
                timestamp: new Date(currentTime),
                url: this.buildVideoUrl(camera, currentTime),
                label: currentTime.toLocaleString()
            });
            // Move to next hour
            currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
        }
        
        // Find the chunk closest to the selected timestamp
        this.currentChunkIndex = this.findClosestChunkIndex(timestamp);
        
        console.log(`📹 Loaded ${this.videoChunks.length} hourly video chunks for ${camera}`);
    },
    
    /**
     * Find the chunk index that CONTAINS the given timestamp
     * (not the one "closest" to it - this was causing wrong hour selection)
     * 
     * FIXED: Previously used absolute distance which caused timestamps
     * in the second half of an hour (after :30) to select the NEXT hour.
     * 
     * For example:
     * - Timestamp: 07:52:54 should return hour 7 (not hour 8)
     * - Timestamp: 14:45:00 should return hour 14 (not hour 15)
     */
    findClosestChunkIndex(timestamp) {
        const targetTime = new Date(timestamp).getTime();
        
        // Find the chunk where: chunkTime <= targetTime < chunkTime + 1 hour
        // We iterate backwards to find the last chunk that starts before or at target
        for (let i = this.videoChunks.length - 1; i >= 0; i--) {
            const chunkTime = this.videoChunks[i].timestamp.getTime();
            
            if (chunkTime <= targetTime) {
                console.log(`📍 Found chunk ${i} (${this.videoChunks[i].label}) contains timestamp`);
                return i;
            }
        }
        
        // Fallback to first chunk
        console.log(`⚠️ No chunk found, defaulting to first chunk`);
        return 0;
    },
    
    /**
     * Load the current video chunk
     */
    loadCurrentVideo() {
        if (this.videoChunks.length === 0) {
            this.showError('No video chunks available');
            return;
        }
        
        const chunk = this.videoChunks[this.currentChunkIndex];
        const videoEl = document.getElementById('videoPlayer');
        
        // Update chunk info
        document.getElementById('videoChunkInfo').textContent = 
            `Hour ${this.currentChunkIndex + 1} of ${this.videoChunks.length} - ${chunk.label}`;
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        console.log('📹 Loading video:', chunk.url);
        
        // Show loading, hide video initially
        this.showLoading(true);
        
        // Set video source directly (no cloning needed)
        videoEl.src = '';  // Clear previous source
        videoEl.load();    // Reset video element
        
        // Now set new source
        videoEl.src = chunk.url;
        
        // Remove all existing event listeners by cloning and replacing
        const newVideoEl = videoEl.cloneNode(true);
        videoEl.parentNode.replaceChild(newVideoEl, videoEl);
        
        // Ensure video element is visible (critical!)
        newVideoEl.style.display = 'block';
        
        // Safari-specific fixes
        if (this.isSafari()) {
            console.log('🍎 Applying Safari video attributes');
            newVideoEl.setAttribute('webkit-playsinline', 'true');
            newVideoEl.setAttribute('playsinline', 'true');
            newVideoEl.setAttribute('preload', 'metadata');
            // Force video element to be inline for Safari
            newVideoEl.style.display = 'block';
            newVideoEl.style.width = '100%';
        }
        
        // Calculate seek time if this is the initial chunk with the peak timestamp
        let seekToTime = null;
        if (this.currentChunkIndex === this.findClosestChunkIndex(this.currentTimestamp)) {
            // This is the chunk containing the peak moment
            const chunkStartTime = new Date(chunk.timestamp).getTime();
            const peakTime = new Date(this.currentTimestamp).getTime();
            const offsetSeconds = (peakTime - chunkStartTime) / 1000;
            
            // Only seek if within this hour (0-3600 seconds)
            if (offsetSeconds >= 0 && offsetSeconds <= 3600) {
                seekToTime = offsetSeconds;
                console.log(`⏩ Will seek to ${Math.floor(offsetSeconds / 60)}:${Math.floor(offsetSeconds % 60).toString().padStart(2, '0')} (peak moment)`);
            }
        }
        
        // Add event listeners
        newVideoEl.addEventListener('loadstart', () => {
            console.log('📥 Video load started');
        }, { once: true });
        
        newVideoEl.addEventListener('loadedmetadata', () => {
            console.log('✅ Video metadata loaded');
            console.log('   Duration:', newVideoEl.duration, 'seconds');
            console.log('   Dimensions:', newVideoEl.videoWidth, 'x', newVideoEl.videoHeight);
            
            // CRITICAL: Hide loading and show video
            document.getElementById('videoLoading').style.display = 'none';
            newVideoEl.style.display = 'block';
            
            // Seek to peak timestamp if applicable
            if (seekToTime !== null && seekToTime < newVideoEl.duration) {
                console.log(`⏩ Seeking to peak moment: ${seekToTime.toFixed(1)}s`);
                newVideoEl.currentTime = seekToTime;
            }
            
            // Try to autoplay
            newVideoEl.play().then(() => {
                console.log('✅ Video playing successfully');
            }).catch(err => {
                console.warn('⚠️ Autoplay prevented:', err.message);
                console.log('👆 Click the play button to start video');
            });
        }, { once: true });
        
        newVideoEl.addEventListener('canplay', () => {
            console.log('✅ Video ready to play');
        }, { once: true });
        
        newVideoEl.addEventListener('error', (e) => {
            document.getElementById('videoLoading').style.display = 'none';
            newVideoEl.style.display = 'block';
            console.error('❌ Video error:', newVideoEl.error);
            
            // Log Safari-specific debugging info
            if (this.isSafari()) {
                console.error('🍎 Safari video error details:');
                console.error('   - URL:', chunk.url);
                console.error('   - Error code:', newVideoEl.error?.code);
                console.error('   - NetworkState:', newVideoEl.networkState);
                console.error('   - ReadyState:', newVideoEl.readyState);
                console.error('   - Video src:', newVideoEl.src);
            }
            
            let errorMsg = `Video not available for ${chunk.label}`;
            if (newVideoEl.error) {
                switch(newVideoEl.error.code) {
                    case 1: errorMsg += ' (Playback aborted)'; break;
                    case 2: 
                        errorMsg += ' (Network error)';
                        if (this.isSafari()) {
                            errorMsg += ' - Safari requires proper HTTP headers and Range request support';
                        }
                        break;
                    case 3: 
                        errorMsg += ' (Decode error - codec issue)';
                        if (this.isSafari()) {
                            errorMsg += ' - Safari only supports H.264/MP4 format';
                        }
                        break;
                    case 4: 
                        errorMsg += ' (File not found or format not supported)';
                        if (this.isSafari()) {
                            errorMsg += ' - Check server CORS headers and Range request support';
                        }
                        break;
                }
            }
            this.showError(errorMsg);
        }, { once: true });
        
        // Re-attach time update listeners
        this.setupVideoTimeUpdatesForElement(newVideoEl);
        
        // Load the video
        newVideoEl.load();
    },
    
    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevChunkBtn');
        const nextBtn = document.getElementById('nextChunkBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentChunkIndex <= 0;
        if (nextBtn) nextBtn.disabled = this.currentChunkIndex >= this.videoChunks.length - 1;
    },
    
    /**
     * Navigate to previous video chunk
     */
    previousChunk() {
        if (this.currentChunkIndex > 0) {
            this.currentChunkIndex--;
            this.loadCurrentVideo();
        }
    },
    
    /**
     * Navigate to next video chunk
     */
    nextChunk() {
        if (this.currentChunkIndex < this.videoChunks.length - 1) {
            this.currentChunkIndex++;
            this.loadCurrentVideo();
        }
    },
    
    /**
     * Skip forward 30 seconds
     */
    skipForward() {
        const videoEl = document.getElementById('videoPlayer');
        if (videoEl && videoEl.currentTime !== undefined) {
            videoEl.currentTime = Math.min(videoEl.currentTime + 30, videoEl.duration || 0);
        }
    },
    
    /**
     * Skip backward 30 seconds
     */
    skipBackward() {
        const videoEl = document.getElementById('videoPlayer');
        if (videoEl && videoEl.currentTime !== undefined) {
            videoEl.currentTime = Math.max(videoEl.currentTime - 30, 0);
        }
    },
    
    /**
     * Create camera grid modal
     */
    createCameraGridModal() {
        const modalHTML = `
            <div class="modal fade" id="cameraGridModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Select Camera to View</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>Time:</strong> <span id="gridTimestamp">-</span> | 
                                <strong>Total Count:</strong> <span id="gridCount">-</span>
                            </div>
                            <div id="cameraGridContainer" class="camera-grid">
                                <!-- Camera grid will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.gridModal = new bootstrap.Modal(document.getElementById('cameraGridModal'));
    },
    
    /**
     * Create video playback modal
     */
    createVideoModal() {
        const modalHTML = `
            <div class="modal fade" id="videoModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Video Playback</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info mb-3">
                                <strong>Camera:</strong> <span id="videoCamera" class="badge bg-primary">-</span>
                                <strong>Time:</strong> <span id="videoTimestamp">-</span>
                            </div>
                            
                            <div id="videoLoading" class="text-center p-4" style="display: none;">
                                <div class="spinner-border text-primary"></div>
                                <p class="mt-2">Loading video...</p>
                            </div>
                            
                            <div id="videoError" class="alert alert-danger" style="display: none;"></div>
                            
                            <!-- Video Player Container -->
                            <div class="video-player-container mb-3" style="min-height: 400px;">
                                <video id="videoPlayer" controls width="100%" 
                                       style="background:#000; min-height: 400px; width: 100%;"
                                       preload="metadata"
                                       webkit-playsinline="true"
                                       playsinline="true">
                                    Your browser does not support video playback.
                                </video>
                            </div>
                            
                            <!-- Video Chunk Navigation -->
                            <div class="video-chunk-controls mb-3">
                                <div class="row align-items-center">
                                    <div class="col-md-6">
                                        <div class="btn-group" role="group">
                                            <button type="button" class="btn btn-outline-primary" id="prevChunkBtn" onclick="VideoPlayer.previousChunk()">
                                                <i class="bi bi-skip-backward-fill"></i> Previous Hour
                                            </button>
                                            <button type="button" class="btn btn-outline-primary" id="nextChunkBtn" onclick="VideoPlayer.nextChunk()">
                                                Next Hour <i class="bi bi-skip-forward-fill"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="text-end">
                                            <small class="text-muted" id="videoChunkInfo">Hour 1 of 1</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Time Navigation Controls -->
                            <div class="video-time-controls mb-3">
                                <div class="row justify-content-center">
                                    <div class="col-auto">
                                        <div class="btn-group" role="group">
                                            <button type="button" class="btn btn-outline-secondary" onclick="VideoPlayer.skipBackward()" title="Skip Backward 30s">
                                                <i class="bi bi-arrow-left-circle"></i> 30s
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary" onclick="VideoPlayer.skipForward()" title="Skip Forward 30s">
                                                30s <i class="bi bi-arrow-right-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Video Info Panel -->
                            <div class="video-info-panel">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="card bg-light">
                                            <div class="card-body p-2">
                                                <small class="text-muted">Current Time</small>
                                                <div id="currentTime">00:00</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-light">
                                            <div class="card-body p-2">
                                                <small class="text-muted">Duration</small>
                                                <div id="videoDuration">00:00</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-light">
                                            <div class="card-body p-2">
                                                <small class="text-muted">Progress</small>
                                                <div id="videoProgress">0%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-light">
                                            <div class="card-body p-2">
                                                <small class="text-muted">Shortcuts</small>
                                                <div>
                                                    <button type="button" class="btn btn-sm btn-outline-info" data-bs-toggle="modal" data-bs-target="#shortcutsModal">
                                                        <i class="bi bi-keyboard"></i> Help
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="VideoPlayer.backToGrid()">
                                <i class="bi bi-grid-3x3-gap"></i> Back to Grid
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('videoModal'));
        
        // Create keyboard shortcuts help modal
        this.createShortcutsModal();
    },
    
    /**
     * Create keyboard shortcuts help modal
     */
    createShortcutsModal() {
        const shortcutsHTML = `
            <div class="modal fade" id="shortcutsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-keyboard"></i> Keyboard Shortcuts
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Video Navigation</h6>
                                    <ul class="list-unstyled">
                                        <li><kbd>←</kbd> Skip backward 30s</li>
                                        <li><kbd>→</kbd> Skip forward 30s</li>
                                        <li><kbd>Space</kbd> Play/Pause</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Hour Navigation</h6>
                                    <ul class="list-unstyled">
                                        <li><kbd>↑</kbd> Previous hour</li>
                                        <li><kbd>↓</kbd> Next hour</li>
                                        <li><kbd>Esc</kbd> Back to grid</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="alert alert-info mt-3">
                                <i class="bi bi-info-circle"></i>
                                <strong>Tip:</strong> These shortcuts only work when the video player is focused.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', shortcutsHTML);
    },
    
    /**
     * Setup video time update listeners for a specific video element
     */
    setupVideoTimeUpdatesForElement(videoEl) {
        if (!videoEl) return;
        
        videoEl.addEventListener('timeupdate', () => {
            this.updateVideoTimeInfo();
        });
        
        videoEl.addEventListener('loadedmetadata', () => {
            this.updateVideoTimeInfo();
        });
    },
    
    /**
     * Update video time information display
     */
    updateVideoTimeInfo() {
        const videoEl = document.getElementById('videoPlayer');
        if (!videoEl) return;
        
        const currentTime = videoEl.currentTime || 0;
        const duration = videoEl.duration || 0;
        const progress = duration > 0 ? (currentTime / duration * 100) : 0;
        
        // Update time displays
        document.getElementById('currentTime').textContent = this.formatTime(currentTime);
        document.getElementById('videoDuration').textContent = this.formatTime(duration);
        document.getElementById('videoProgress').textContent = Math.round(progress) + '%';
    },
    
    /**
     * Format time in HH:MM:SS or MM:SS format
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Go back to camera grid
     */
    backToGrid() {
        if (this.modal) {
            this.modal.hide();
        }
        const videoEl = document.getElementById('videoPlayer');
        if (videoEl) {
            videoEl.pause();
        }
        this.showCameraGrid(this.currentTimestamp, 0);
    },
    
    /**
     * Build video URL for given camera and timestamp
     */
    buildVideoUrl(camera, timestamp) {
      // Parse timestamp carefully to avoid timezone issues
      const dt = new Date(timestamp);
      
      // Format as YYYY-MM-DD HH:MM:SS without timezone conversion
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const seconds = String(dt.getSeconds()).padStart(2, '0');
      
      const formattedTs = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      console.log(`🔗 Building URL for ${camera} at ${formattedTs}`);
      
      const params = new URLSearchParams({
          camera: camera,
          timestamp: formattedTs
      });
      
      // Ensure VIDEO_BASE is defined
      const videoBase = CA.VIDEO_BASE || 'http://91.108.111.201:15000';
      
      if (!CA.VIDEO_BASE) {
          console.warn('⚠️ CA.VIDEO_BASE not defined, using fallback:', videoBase);
      }
      
      const url = `${videoBase}/api/video/stream?${params}`;
      
      // Log for Safari debugging
      if (this.isSafari()) {
          console.log('🍎 Safari video URL:', url);
      }
      
      return url;
  },
    
    /**
     * Show/hide loading spinner
     */
    showLoading(show) {
        const loadingEl = document.getElementById('videoLoading');
        const playerEl = document.getElementById('videoPlayer');
        
        if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
        if (playerEl) playerEl.style.display = show ? 'none' : 'block';
    },
    
    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('videoError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        console.error('VideoPlayer error:', message);
    },
    
    /**
     * Hide error message
     */
    hideError() {
        const errorEl = document.getElementById('videoError');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
  };
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    VideoPlayer.init();
    console.log('✅ VideoPlayer initialized');
  });