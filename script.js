// ============================================================================
// NOKIA WEBSITE - INTERACTIVE EXPERIENCE
// ============================================================================

// Global variables for interactive elements
let canvas, ctx, particles = [], connections = [], mouseX = 0, mouseY = 0;
let isScrolling = false;
let scrollTimeout;
let isVideoPlaying = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    initializeNavigation();
    initializeScrollEffects();
    initializeAnimations();
    initializeInteractiveElements();
    initializeSnakeGame();
    initializeParticleSystem();
    
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.8s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
        startAnimationLoop();
    }, 200);

    console.log('🚀 Nokia Interactive Experience Loaded!');
});

// ============================================================================
// INTERACTIVE BACKGROUND CANVAS
// ============================================================================

function initializeCanvas() {
    // Create and setup canvas
    canvas = document.createElement('canvas');
    canvas.id = 'background-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('scroll', handleScroll);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initializeParticles();
}

function updateMousePosition(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function handleScroll() {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

class Particle {
    constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.originalAlpha = this.alpha;
        this.hue = Math.random() * 60 + 200; // Blue-cyan range
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulse = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Pulse effect
        this.pulse += this.pulseSpeed;
        this.alpha = this.originalAlpha + Math.sin(this.pulse) * 0.2;
        
        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
            const force = (100 - distance) / 100;
            this.vx += dx * force * 0.0001;
            this.vy += dy * force * 0.0001;
            this.size = Math.min(this.size * (1 + force * 0.1), 6);
        } else {
            this.size = Math.max(this.size * 0.99, 1);
        }
        
        // Boundaries
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initializeParticles() {
    particles = [];
    const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 150);
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function initializeParticleSystem() {
    // Create Nokia logo particles on hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', () => {
            createLogoParticles();
        });
    }
}

function createLogoParticles() {
    const colors = ['#124191', '#1e5bb8', '#00d4ff', '#ffed00'];
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const particle = new Particle(
                mouseX + (Math.random() - 0.5) * 100,
                mouseY + (Math.random() - 0.5) * 100
            );
            particle.hue = Math.random() * 360;
            particle.size = Math.random() * 4 + 2;
            particles.push(particle);
            
            // Remove after animation
            setTimeout(() => {
                const index = particles.indexOf(particle);
                if (index > -1) particles.splice(index, 1);
            }, 3000);
        }, i * 50);
    }
}

// ============================================================================
// CONNECTION LINES (Network Effect)
// ============================================================================

function drawConnections() {
    ctx.save();
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                const opacity = (120 - distance) / 120 * 0.3;
                ctx.globalAlpha = opacity;
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    
    ctx.restore();
}

// ============================================================================
// SNAKE GAME TRIBUTE
// ============================================================================

let snakeSegments = [];
let snakeDirection = { x: 1, y: 0 };
let showSnake = false;

function initializeSnakeGame() {
    // Initialize snake in corner
    snakeSegments = [
        { x: 50, y: 50 },
        { x: 40, y: 50 },
        { x: 30, y: 50 }
    ];
    
    // Activate snake on Nokia logo hover
    const nokiaLogos = document.querySelectorAll('.nav-logo, .footer-logo');
    nokiaLogos.forEach(logo => {
        logo.addEventListener('mouseenter', () => {
            showSnake = true;
            setTimeout(() => showSnake = false, 5000);
        });
    });
}

function updateSnake() {
    if (!showSnake || snakeSegments.length === 0) return;
    
    // Move snake head
    const head = { ...snakeSegments[0] };
    head.x += snakeDirection.x * 10;
    head.y += snakeDirection.y * 10;
    
    // Change direction occasionally
    if (Math.random() < 0.1) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        snakeDirection = directions[Math.floor(Math.random() * directions.length)];
    }
    
    // Wrap around screen
    if (head.x < 0) head.x = canvas.width;
    if (head.x > canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height;
    if (head.y > canvas.height) head.y = 0;
    
    snakeSegments.unshift(head);
    snakeSegments.pop();
}

function drawSnake() {
    if (!showSnake) return;
    
    ctx.save();
    ctx.fillStyle = '#ffed00';
    ctx.strokeStyle = '#124191';
    ctx.lineWidth = 2;
    
    snakeSegments.forEach((segment, index) => {
        const size = index === 0 ? 12 : 8; // Head is bigger
        ctx.fillRect(segment.x - size/2, segment.y - size/2, size, size);
        ctx.strokeRect(segment.x - size/2, segment.y - size/2, size, size);
    });
    
    ctx.restore();
}

// ============================================================================
// NAVIGATION ENHANCEMENTS
// ============================================================================

function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');

    // Mobile menu functionality
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Add mobile menu styles
            if (navMenu.classList.contains('active')) {
                navMenu.style.display = 'flex';
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'fixed';
                navMenu.style.top = '80px';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.background = 'rgba(255, 255, 255, 0.98)';
                navMenu.style.padding = '2rem';
                navMenu.style.backdropFilter = 'blur(20px)';
                navMenu.style.boxShadow = '0 10px 40px rgba(18, 65, 145, 0.15)';
            } else {
                navMenu.style.display = '';
            }
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                navMenu.style.display = '';
            });
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================================================
// SCROLL EFFECTS & ANIMATIONS
// ============================================================================

function initializeScrollEffects() {
    // Create scroll progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
        progressBar.style.width = scrollPercent + '%';
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add specific animations based on element type
                if (entry.target.classList.contains('why-card')) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out';
                } else if (entry.target.classList.contains('timeline-item')) {
                    entry.target.style.animation = 'fadeInLeft 0.8s ease-out';
                } else if (entry.target.classList.contains('phone-card')) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out';
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.why-card, .phone-card, .timeline-item, .competitor-card, .nokia-card, .support-card'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });

    // Parallax effect for floating shapes
    window.addEventListener('scroll', () => {
        const shapes = document.querySelectorAll('.shape');
        const scrolled = window.pageYOffset;
        
        shapes.forEach((shape, index) => {
            const speed = 0.3 + (index * 0.1);
            const yPos = scrolled * speed;
            const rotation = scrolled * 0.05;
            shape.style.transform = `translateY(${yPos}px) rotate(${rotation}deg)`;
        });
    });
}

// ============================================================================
// INTERACTIVE ELEMENTS
// ============================================================================

function initializeInteractiveElements() {
    // Enhanced button interactions
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.02)';
            createButtonParticles(button);
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });

        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Phone frame interactions
    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
        phoneFrame.addEventListener('mouseenter', () => {
            createPhoneGlow();
        });

        phoneFrame.addEventListener('click', (e) => {
            // Don't trigger if clicking the home button
            if (!e.target.closest('.phone-home-button')) {
                nokiaBootAnimation();
            }
        });
    }

    // Turn On Button functionality
    const turnOnBtn = document.querySelector('.phone-home-button');
    const nokiaVideo = document.getElementById('nokia-video');
    const phoneScreen = document.getElementById('phone-screen');
    const screenOverlay = document.getElementById('screen-overlay');

    if (turnOnBtn && nokiaVideo) {
        // Add both click and touch events for better mobile support
        turnOnBtn.addEventListener('click', () => {
            togglePhoneVideo();
        });
        
        // Mobile-specific touch events
        turnOnBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            turnOnBtn.style.transform = 'translateX(-50%) scale(0.96)';
        });
        
        turnOnBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent click event from firing twice
            turnOnBtn.style.transform = 'translateX(-50%) scale(1)';
            togglePhoneVideo();
        });

        // Handle video events
        nokiaVideo.addEventListener('loadstart', () => {
            console.log('📱 Nokia video loading...');
        });

        nokiaVideo.addEventListener('canplay', () => {
            console.log('📱 Nokia video ready to play');
        });

        nokiaVideo.addEventListener('ended', () => {
            if (nokiaVideo.loop) {
                console.log('📱 Nokia video looping...');
            }
        });

        nokiaVideo.addEventListener('error', (e) => {
            console.error('📱 Nokia video error:', e);
            showVideoError();
        });
        
        // Mobile tap-to-unmute functionality
        nokiaVideo.addEventListener('click', (e) => {
            if (nokiaVideo.muted && isVideoPlaying) {
                e.preventDefault();
                nokiaVideo.muted = false;
                console.log('📱 Video unmuted by user click');
                showVideoMessage('🔊 Sound enabled!', 'success');
            }
        });
        
        // Mobile touch events for video
        nokiaVideo.addEventListener('touchend', (e) => {
            if (nokiaVideo.muted && isVideoPlaying) {
                e.preventDefault();
                nokiaVideo.muted = false;
                console.log('📱 Video unmuted by user touch');
                showVideoMessage('🔊 Sound enabled!', 'success');
            }
        });
    }

    // Card hover effects
    document.querySelectorAll('.why-card, .phone-card, .competitor-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-15px) scale(1.02)';
            createCardGlow(card);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Timeline item interactions
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.03)';
            item.style.filter = 'brightness(1.05)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.filter = 'brightness(1)';
        });
    });
}

function createButtonParticles(button) {
    const rect = button.getBoundingClientRect();
    const colors = ['#ffed00', '#00d4ff', '#124191'];
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        const angle = (Math.PI * 2 * i) / 5;
        const velocity = 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.style.animation = `buttonParticle 1s ease-out forwards`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

function createPhoneGlow() {
    const phoneScreen = document.querySelector('.phone-screen');
    if (phoneScreen) {
        phoneScreen.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.6), inset 0 0 30px rgba(255, 237, 0, 0.2)';
        setTimeout(() => {
            phoneScreen.style.boxShadow = '';
        }, 2000);
    }
}

function createCardGlow(card) {
    const originalBoxShadow = card.style.boxShadow;
    card.style.boxShadow = '0 20px 60px rgba(18, 65, 145, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)';
    
    setTimeout(() => {
        card.style.boxShadow = originalBoxShadow;
    }, 300);
}

function nokiaBootAnimation() {
    const screenOverlay = document.getElementById('screen-overlay');
    if (!screenOverlay || isVideoPlaying) return;
    
    const originalContent = screenOverlay.innerHTML;
    screenOverlay.style.background = '#000';
    screenOverlay.style.display = 'flex';
    screenOverlay.style.alignItems = 'center';
    screenOverlay.style.justifyContent = 'center';
    screenOverlay.style.flexDirection = 'column';
    screenOverlay.style.gap = '10px';
    
    // Nokia boot sequence
    setTimeout(() => {
        screenOverlay.innerHTML = '<div style="color: #fff; font-size: 1.2rem; font-weight: 800; letter-spacing: 3px;">NOKIA</div>';
    }, 300);
    
    setTimeout(() => {
        screenOverlay.innerHTML = '<div style="color: #00d4ff; font-size: 0.9rem; font-weight: 600;">Connecting People</div>';
    }, 1000);
    
    setTimeout(() => {
        screenOverlay.innerHTML = '<div style="color: #ffed00; font-size: 0.8rem; font-weight: 600;">🐍 SNAKE GAME</div>';
    }, 1800);
    
    setTimeout(() => {
        screenOverlay.style.background = '';
        screenOverlay.style.flexDirection = '';
        screenOverlay.style.gap = '';
        screenOverlay.innerHTML = originalContent;
    }, 2500);
}

function togglePhoneVideo() {
    const turnOnBtn = document.querySelector('.phone-home-button');
    const nokiaVideo = document.getElementById('nokia-video');
    const phoneScreen = document.getElementById('phone-screen');
    const screenOverlay = document.getElementById('screen-overlay');
    
    if (!nokiaVideo || !phoneScreen || !turnOnBtn || !screenOverlay) return;
    
    if (!isVideoPlaying) {
        // Turn ON - Play video
        startPhoneVideo();
    } else {
        // Turn OFF - Stop video
        stopPhoneVideo();
    }
}

function startPhoneVideo() {
    const turnOnBtn = document.querySelector('.phone-home-button');
    const nokiaVideo = document.getElementById('nokia-video');
    const phoneScreen = document.getElementById('phone-screen');
    const screenOverlay = document.getElementById('screen-overlay');
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = loadingScreen?.querySelector('.loading-text');
    
    console.log('📱 Starting Nokia phone boot sequence...');
    
    // Update button state
    turnOnBtn.classList.add('powered-on');
    
    // Hide screen overlay and show loading screen
    screenOverlay.classList.add('hidden');
    loadingScreen.classList.add('active');
    
    // Loading sequence with realistic steps
    const loadingSteps = [
        { text: 'Initializing...', delay: 600 },
        { text: 'Loading system files...', delay: 700 },
        { text: 'Starting Nokia OS...', delay: 800 },
        { text: 'Preparing experience...', delay: 500 },
        { text: 'Ready to connect!', delay: 400 }
    ];
    
    let currentStep = 0;
    
    function showNextLoadingStep() {
        if (currentStep < loadingSteps.length && loadingText) {
            const stepText = loadingSteps[currentStep].text;
            loadingText.textContent = stepText;
            console.log(`📱 Boot: ${stepText}`);
            currentStep++;
            
            if (currentStep < loadingSteps.length) {
                setTimeout(showNextLoadingStep, loadingSteps[currentStep - 1].delay);
            } else {
                // Final step - start the video
                setTimeout(startVideoAfterLoading, loadingSteps[currentStep - 1].delay);
            }
        }
    }
    
    function startVideoAfterLoading() {
        console.log('📱 Boot sequence complete, starting video...');
        
        // Hide loading screen and show video
        loadingScreen.classList.remove('active');
        nokiaVideo.classList.add('playing');
        
        // Mobile-first video playback strategy
        console.log('📱 Attempting video playback...');
        
        // Check if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log(`📱 Mobile device detected: ${isMobile}`);
        
        // Start with muted on mobile, then try to unmute
        if (isMobile) {
            nokiaVideo.muted = true;
            nokiaVideo.volume = 0.8;
        } else {
            nokiaVideo.muted = false;
            nokiaVideo.volume = 0.8;
        }
        
        const playPromise = nokiaVideo.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('📱 Nokia video started successfully!');
                    isVideoPlaying = true;
                    
                    // Try to unmute on mobile after successful play
                    if (isMobile && nokiaVideo.muted) {
                        try {
                            nokiaVideo.muted = false;
                            console.log('📱 Unmuted video on mobile');
                            showVideoMessage('🔊 Nokia Experience ON!', 'success');
                        } catch (unmuteError) {
                            console.log('📱 Could not unmute on mobile, staying muted');
                            showVideoMessage('🔇 Nokia Experience ON (tap to unmute)', 'warning');
                        }
                    } else {
                        showVideoMessage('🔊 Nokia Experience ON!', 'success');
                    }
                    
                    // Create celebration particles
                    createVideoStartParticles();
                })
                .catch(error => {
                    console.error('📱 Error playing Nokia video:', error);
                    console.log('📱 Trying fallback video playback...');
                    
                    // Fallback: Force muted playback
                    nokiaVideo.muted = true;
                    nokiaVideo.load(); // Reload the video
                    
                    setTimeout(() => {
                        nokiaVideo.play()
                            .then(() => {
                                console.log('📱 Nokia video started (muted fallback)');
                                isVideoPlaying = true;
                                showVideoMessage('🔇 Nokia Experience ON (muted)', 'warning');
                                createVideoStartParticles();
                            })
                            .catch(fallbackError => {
                                console.error('📱 Fallback video failed:', fallbackError);
                                showVideoError();
                            });
                    }, 500);
                });
        } else {
            console.error('📱 Video play promise is undefined');
            showVideoError();
        }
    }
    
    // Start the loading sequence
    setTimeout(showNextLoadingStep, 300);
}

function stopPhoneVideo() {
    const turnOnBtn = document.querySelector('.phone-home-button');
    const nokiaVideo = document.getElementById('nokia-video');
    const phoneScreen = document.getElementById('phone-screen');
    const screenOverlay = document.getElementById('screen-overlay');
    const loadingScreen = document.getElementById('loading-screen');
    
    console.log('📱 Stopping Nokia video experience...');
    
    // Update button state
    turnOnBtn.classList.remove('powered-on');
    
    // Hide loading screen and video, show screen overlay
    loadingScreen.classList.remove('active');
    screenOverlay.classList.remove('hidden');
    nokiaVideo.classList.remove('playing');
    
    // Stop video
    nokiaVideo.pause();
    nokiaVideo.currentTime = 0;
    
    isVideoPlaying = false;
    
    // Show message
    showVideoMessage('📱 Nokia Experience OFF', 'info');
}

function showVideoError() {
    const turnOnBtn = document.querySelector('.phone-home-button');
    const screenOverlay = document.getElementById('screen-overlay');
    const loadingScreen = document.getElementById('loading-screen');
    
    // Reset button state
    turnOnBtn.classList.remove('powered-on');
    
    // Hide loading screen and show screen overlay
    loadingScreen.classList.remove('active');
    screenOverlay.classList.remove('hidden');
    
    // Show error message
    showVideoMessage('❌ Video not available', 'error');
}

function createVideoStartParticles() {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;
    
    const rect = phoneFrame.getBoundingClientRect();
    const colors = ['#ffed00', '#00d4ff', '#124191', '#ff3333'];
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.boxShadow = `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            const angle = (Math.PI * 2 * i) / 15;
            const velocity = 80 + Math.random() * 40;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            let x = 0, y = 0;
            const animate = () => {
                x += vx * 0.02;
                y += vy * 0.02;
                particle.style.transform = `translate(${x}px, ${y}px) scale(${1 - Math.abs(x + y) / 200})`;
                particle.style.opacity = 1 - Math.abs(x + y) / 200;
                
                if (Math.abs(x + y) < 200) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            
            document.body.appendChild(particle);
            animate();
        }, i * 50);
    }
}

function showVideoMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.querySelector('.video-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `video-message video-message-${type}`;
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '1rem 1.5rem';
    messageElement.style.borderRadius = '10px';
    messageElement.style.fontWeight = '600';
    messageElement.style.fontSize = '0.9rem';
    messageElement.style.zIndex = '10000';
    messageElement.style.transform = 'translateX(100%)';
    messageElement.style.transition = 'transform 0.3s ease';
    
    // Set colors based on type
    switch (type) {
        case 'success':
            messageElement.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
            messageElement.style.color = '#ffffff';
            break;
        case 'warning':
            messageElement.style.background = 'linear-gradient(135deg, #ffed00, #ffd700)';
            messageElement.style.color = '#124191';
            break;
        case 'error':
            messageElement.style.background = 'linear-gradient(135deg, #ff3333, #ff6b6b)';
            messageElement.style.color = '#ffffff';
            break;
        default:
            messageElement.style.background = 'linear-gradient(135deg, #124191, #1e5bb8)';
            messageElement.style.color = '#ffffff';
    }
    
    document.body.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 3000);
}

// ============================================================================
// ADVANCED ANIMATIONS
// ============================================================================

function initializeAnimations() {
    // Typing effect for hero title
    const heroTitle = document.querySelector('.hero-title .gradient-text');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        typeWriter(heroTitle, originalText, 120);
    }

    // Counter animations
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                if (number) {
                    animateCounter(target, number);
                }
                counterObserver.unobserve(target);
            }
        });
    }, { threshold: 0.7 });

    // Observe phone stats for counter animation
    document.querySelectorAll('.phone-stats span').forEach(span => {
        if (span.textContent.includes('+') || span.textContent.includes('M')) {
            counterObserver.observe(span);
        }
    });

    // Logo pulse animation
    const logos = document.querySelectorAll('.nav-logo i, .footer-logo i');
    logos.forEach(logo => {
        logo.addEventListener('mouseenter', () => {
            logo.style.animation = 'none';
            logo.offsetHeight; // Trigger reflow
            logo.style.animation = 'pulse-icon 0.6s ease-in-out';
        });
    });
}

function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    setTimeout(type, 500); // Delay start
}

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const suffix = element.textContent.includes('M') ? 'M+' : '+';
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + suffix;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + suffix;
        }
    }
    
    updateCounter();
}

// ============================================================================
// PARTICLE EFFECTS
// ============================================================================

function createSupportParticles() {
    const supportSection = document.querySelector('.support');
    if (!supportSection) return;
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = 'linear-gradient(45deg, #ffed00, #ffd700)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '100%';
            particle.style.boxShadow = '0 0 10px rgba(255, 237, 0, 0.6)';
            
            particle.style.animation = 'supportParticleFloat 4s linear forwards';
            
            supportSection.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 4000);
        }, i * 800);
    }
}

// Start particle creation interval
setInterval(createSupportParticles, 3000);

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function startAnimationLoop() {
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        drawConnections();
        
        // Update and draw snake
        updateSnake();
        drawSnake();
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ============================================================================
// KEYBOARD INTERACTIONS
// ============================================================================

document.addEventListener('keydown', (e) => {
    // Easter eggs
    if (e.code === 'KeyS' && e.ctrlKey) {
        e.preventDefault();
        showSnake = !showSnake;
        console.log('🐍 Snake mode:', showSnake ? 'ON' : 'OFF');
    }
    
    if (e.code === 'KeyN' && e.ctrlKey) {
        e.preventDefault();
        nokiaBootAnimation();
    }
    
    if (e.key === 'Escape') {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            navMenu.style.display = '';
        }
    }
});

// ============================================================================
// TOUCH SUPPORT
// ============================================================================

let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - create upward particles
            createSwipeParticles('up');
        } else {
            // Swipe down - create downward particles
            createSwipeParticles('down');
        }
    }
}

function createSwipeParticles(direction) {
    const colors = ['#124191', '#00d4ff', '#ffed00'];
    
    for (let i = 0; i < 8; i++) {
        const particle = new Particle(
            Math.random() * canvas.width,
            direction === 'up' ? canvas.height - 50 : 50
        );
        particle.vy = direction === 'up' ? -2 : 2;
        particle.hue = Math.random() * 60 + 200;
        particles.push(particle);
        
        setTimeout(() => {
            const index = particles.indexOf(particle);
            if (index > -1) particles.splice(index, 1);
        }, 2000);
    }
}

// ============================================================================
// DYNAMIC STYLES
// ============================================================================

// Add dynamic CSS animations
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes buttonParticle {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--random-x, 50px), var(--random-y, -50px)) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes supportParticleFloat {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .nav-menu.active {
        display: flex !important;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px);
    }
    
    /* Enhanced focus styles */
    .btn:focus-visible {
        outline: 2px solid var(--nokia-cyan);
        outline-offset: 4px;
    }
    
    /* Loading animation */
    @keyframes fadeInScale {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-on-load {
        animation: fadeInScale 0.8s ease-out;
    }
`;

document.head.appendChild(dynamicStyles);

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

// Add skip link and focus management
const skipLink = document.createElement('a');
skipLink.href = '#home';
skipLink.textContent = 'Skip to main content';
skipLink.style.position = 'absolute';
skipLink.style.top = '-40px';
skipLink.style.left = '6px';
skipLink.style.background = 'var(--nokia-blue)';
skipLink.style.color = 'white';
skipLink.style.padding = '8px 16px';
skipLink.style.textDecoration = 'none';
skipLink.style.borderRadius = '4px';
skipLink.style.zIndex = '10000';
skipLink.style.transition = 'top 0.3s ease';

skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
});

skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
});

document.body.insertBefore(skipLink, document.body.firstChild);

// Reduce motion for users who prefer it
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition', 'none');
    
    // Disable particle system for reduced motion
    particles = [];
    showSnake = false;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        
        // Adjust particle count based on performance
        if (fps < 30 && particles.length > 50) {
            particles = particles.slice(0, Math.floor(particles.length * 0.8));
        } else if (fps > 50 && particles.length < 100) {
            initializeParticles();
        }
        
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Monitor performance every frame
setInterval(monitorPerformance, 16);

console.log('🎨 Nokia Interactive Experience Ready!');
console.log('💡 Try Ctrl+S for Snake mode, Ctrl+N for Nokia boot animation');
console.log('📱 Click the phone for a special animation!');
console.log('🔘 Click the TURN ON button to play Nokia video with sound!');
console.log('🎬 Video experience: Nokia loading animation ready!');
console.log('Nokia website loaded successfully! 🚀');

// Mobile debugging and optimization
function debugMobileVideoSupport() {
    const nokiaVideo = document.getElementById('nokia-video');
    const turnOnBtn = document.querySelector('.phone-home-button');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🔍 MOBILE DEBUG - Video Support Check:', {
        isMobile,
        deviceType: isMobile ? 'Mobile' : 'Desktop',
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        videoElement: !!nokiaVideo,
        buttonElement: !!turnOnBtn,
        videoReady: nokiaVideo?.readyState || 'Not ready',
        videoSource: nokiaVideo?.currentSrc || nokiaVideo?.src || 'No source found',
        canPlayMP4: nokiaVideo?.canPlayType('nokia-loading.mp4') || 'Unknown',
        touchSupport: 'ontouchstart' in window,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        orientation: screen.orientation?.type || 'Unknown'
    });
    
    if (isMobile && nokiaVideo) {
        console.log('📱 MOBILE SPECIFIC - Video Properties:', {
            muted: nokiaVideo.muted,
            autoplay: nokiaVideo.autoplay,
            playsinline: nokiaVideo.playsInline,
            controls: nokiaVideo.controls,
            loop: nokiaVideo.loop,
            preload: nokiaVideo.preload
        });
        
        // Test if video can be played
        if (nokiaVideo.readyState >= 2) {
            console.log('✅ Video is loaded and ready to play');
        } else {
            console.log('⚠️ Video is not ready, attempting to load...');
            nokiaVideo.load();
        }
    }
}

// Run mobile debug after a short delay to ensure everything is loaded
setTimeout(debugMobileVideoSupport, 1000); 
