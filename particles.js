(function(global) {
  'use strict';

  const BG_GRADIENTS = {
    sunset: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    dunes: 'linear-gradient(135deg, #d4a574 0%, #e8d5b7 50%, #c9b896 100%)',
    fog: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
    ocean: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    night: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
  };

  const BG_SEQUENCE = Object.keys(BG_GRADIENTS);

  const BG_BRIGHTNESS = {
    sunset: 0.6,
    dunes: 0.7,
    fog: 0.4,
    ocean: 0.5,
    forest: 0.4,
    night: 0.2
  };

  const THEME_LUT_FILTERS = {
    sunset: { brightness: 1.05, contrast: 1.1, saturate: 1.2, hueRotate: 0 },
    dunes: { brightness: 1.0, contrast: 1.05, saturate: 0.9, hueRotate: 10 },
    fog: { brightness: 0.95, contrast: 0.9, saturate: 0.8, hueRotate: -5 },
    ocean: { brightness: 1.0, contrast: 1.1, saturate: 1.1, hueRotate: 0 },
    forest: { brightness: 0.95, contrast: 1.0, saturate: 1.15, hueRotate: -10 },
    night: { brightness: 0.85, contrast: 1.15, saturate: 0.7, hueRotate: 0 }
  };

  const THEME_BACKGROUND_IMAGES = {
    sunset: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80',
    dunes: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80',
    fog: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?w=1920&q=80',
    ocean: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80',
    forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    night: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'
  };

  const THEME_PARTICLE_CONFIGS = {
    sunset: {
      type: 'glow',
      color: ['#ff6b6b', '#feca57', '#ff9ff3', '#ff8a65'],
      count: 25,
      speed: 0.3,
      size: { min: 3, max: 8 },
      opacity: { min: 0.2, max: 0.6 },
      glow: true,
      exposure: 1.15,
      blendMode: 'screen'
    },
    dunes: {
      type: 'sand',
      color: ['#d4a574', '#e8d5b7', '#c9b896', '#fff8e7', '#f5deb3'],
      count: 50,
      speed: 1.5,
      size: { min: 0.8, max: 2.5 },
      opacity: { min: 0.3, max: 0.7 },
      wind: 1.2,
      turbulence: 0.3,
      blendMode: 'normal'
    },
    fog: {
      type: 'fog',
      color: ['#a8c0ff', '#3f2b96', '#ffffff', '#dbeafe'],
      count: 12,
      speed: 0.15,
      size: { min: 80, max: 200 },
      opacity: { min: 0.03, max: 0.12 },
      blur: true,
      flow: true,
      blendMode: 'normal'
    },
    ocean: {
      type: 'wave',
      color: ['#2193b0', '#6dd5ed', '#ffffff', '#a5f3fc'],
      count: 30,
      speed: 0.6,
      size: { min: 2, max: 6 },
      opacity: { min: 0.3, max: 0.6 },
      wave: true,
      foam: true,
      normal: true,
      blendMode: 'normal'
    },
    forest: {
      type: 'leaf',
      color: ['#134e5e', '#71b280', '#a8e6cf', '#88d8b0', '#4ade80'],
      count: 18,
      speed: 0.4,
      size: { min: 5, max: 12 },
      opacity: { min: 0.4, max: 0.75 },
      rotation: true,
      sway: true,
      gravity: 0.8,
      blendMode: 'normal'
    },
    night: {
      type: 'star',
      color: ['#ffffff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8'],
      count: 80,
      speed: 0.08,
      size: { min: 0.8, max: 3.5 },
      opacity: { min: 0.4, max: 0.95 },
      twinkle: true,
      aurora: true,
      shooting: true,
      blendMode: 'lighter'
    }
  };

  const PRELOADED_IMAGES = {};

  class Particle {
    constructor(config) {
      this.config = config;
      this.reset();
    }

    reset() {
      const cfg = this.config;
      if (!cfg) return;

      this.x = Math.random() * (window.innerWidth || 1920);
      this.y = Math.random() * (window.innerHeight || 1080);
      this.size = cfg.size.min + Math.random() * (cfg.size.max - cfg.size.min);
      this.opacity = cfg.opacity.min + Math.random() * (cfg.opacity.max - cfg.opacity.min);
      this.color = cfg.color[Math.floor(Math.random() * cfg.color.length)];
      this.vx = (Math.random() - 0.5) * cfg.speed;
      this.vy = Math.random() * cfg.speed * 0.5 + 0.1;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 2;
      this.phase = Math.random() * Math.PI * 2;
      this.twinkleSpeed = 0.02 + Math.random() * 0.03;
      this.originalX = this.x;
      this.originalY = this.y;
      this.age = 0;
      this.lifespan = 1000 + Math.random() * 2000;
      this.fadeIn = true;
      this.fadeProgress = 0;

      if (cfg.type === 'sand') {
        this.vx = (cfg.wind || 0.5) * (0.5 + Math.random() * 0.5);
        this.vy = Math.random() * cfg.speed * 0.3;
        this.turbulence = Math.random() * Math.PI * 2;
      } else if (cfg.type === 'fog') {
        this.vx = (Math.random() - 0.5) * cfg.speed;
        this.vy = (Math.random() - 0.5) * cfg.speed * 0.2;
        this.flowPhase = Math.random() * Math.PI * 2;
      } else if (cfg.type === 'star') {
        this.vy = cfg.speed * 0.1;
        this.vx = (Math.random() - 0.5) * cfg.speed * 0.2;
        this.isShooting = cfg.shooting && Math.random() < 0.02;
        if (this.isShooting) {
          this.vx = (Math.random() - 0.3) * 8;
          this.vy = (Math.random() + 0.5) * 6;
          this.size *= 1.5;
        }
      } else if (cfg.type === 'wave') {
        this.wavePhase = Math.random() * Math.PI * 2;
        this.waveAmplitude = 0.5 + Math.random() * 1.5;
      } else if (cfg.type === 'leaf') {
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swayAmplitude = 0.3 + Math.random() * 0.5;
        this.bezierControl1 = Math.random() * 0.5;
        this.bezierControl2 = Math.random() * 0.5;
      }
    }

    update(dt) {
      const cfg = this.config;

      if (this.fadeIn && this.fadeProgress < 1) {
        this.fadeProgress = Math.min(1, this.fadeProgress + dt * 2);
      }

      if (cfg.type === 'sand' && cfg.turbulence) {
        this.turbulence += dt * 2;
        this.vx += Math.sin(this.turbulence) * cfg.turbulence * 0.1;
      }

      if (cfg.type === 'fog' && cfg.flow) {
        this.flowPhase += dt * 0.5;
        this.x += Math.sin(this.flowPhase) * 0.2;
      }

      if (cfg.type === 'wave' && cfg.wave) {
        this.wavePhase += dt * 2;
        this.x = this.originalX + Math.sin(this.wavePhase) * this.waveAmplitude * 20;
      }

      if (cfg.type === 'leaf' && cfg.sway) {
        this.swayPhase += dt * 1.5;
        const swayX = Math.sin(this.swayPhase) * this.swayAmplitude;
        const bezierOffset = Math.sin(this.swayPhase * this.bezierControl1) * this.bezierControl2 * 2;
        this.x += swayX + bezierOffset;
        this.vy = cfg.speed * (cfg.gravity || 1) * (1 + Math.sin(this.swayPhase * 0.5) * 0.2);
      }

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed || 0;
      this.phase += this.twinkleSpeed || 0;

      const margin = 100;
      if (this.x < -margin) this.x = window.innerWidth + margin;
      if (this.x > window.innerWidth + margin) this.x = -margin;
      if (this.y < -margin) this.y = window.innerHeight + margin;
      if (this.y > window.innerHeight + margin) {
        if (this.isShooting) {
          this.y = -margin;
          this.isShooting = false;
          this.vx = (Math.random() - 0.5) * cfg.speed * 0.2;
          this.vy = cfg.speed * 0.1;
        } else {
          this.y = -margin;
        }
      }

      this.age += dt * 1000;
      if (this.age > this.lifespan) {
        this.reset();
      }
    }

    draw(ctx, time) {
      const cfg = this.config;
      ctx.save();

      let opacity = this.opacity;
      if (cfg.twinkle) {
        opacity = this.opacity * (0.5 + 0.5 * Math.sin(this.phase));
      }

      const ageRatio = this.age / this.lifespan;
      if (ageRatio > 0.8) {
        opacity *= (1 - ageRatio) * 5;
      }

      if (this.fadeIn) {
        opacity *= this.fadeProgress;
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      if (cfg.blendMode) {
        ctx.globalCompositeOperation = cfg.blendMode;
      }

      if (cfg.type === 'glow' || cfg.glow) {
        this.drawGlow(ctx);
      } else if (cfg.type === 'fog' || cfg.blur) {
        this.drawFog(ctx);
      } else if (cfg.type === 'leaf' || cfg.rotation) {
        this.drawLeaf(ctx);
      } else if (cfg.type === 'star') {
        this.drawStar(ctx);
      } else if (cfg.type === 'wave' && cfg.foam) {
        this.drawWave(ctx);
      } else if (cfg.type === 'sand') {
        this.drawSand(ctx);
      } else {
        this.drawDefault(ctx);
      }

      ctx.restore();
    }

    drawGlow(ctx) {
      const cfg = this.config;
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.4, this.color + '80');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fill();

      if (cfg.exposure) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawFog(ctx) {
      ctx.filter = 'blur(30px)';
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
    }

    drawLeaf(ctx) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.5, -this.size * 0.5, this.size * 0.5, this.size * 0.5, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.5, this.size * 0.5, -this.size * 0.5, -this.size * 0.5, 0, -this.size);
      ctx.fill();

      ctx.strokeStyle = this.color + '60';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.8);
      ctx.lineTo(0, this.size * 0.8);
      ctx.stroke();
    }

    drawStar(ctx) {
      const cfg = this.config;
      if (this.isShooting) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x - this.vx * 10, this.y - this.vy * 10);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 15, this.y - this.vy * 15);
        ctx.stroke();
      }

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      if (cfg.twinkle) {
        ctx.globalAlpha *= 0.2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.size > 2) {
        ctx.globalAlpha *= 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.5;
        const crossSize = this.size * 2;
        ctx.beginPath();
        ctx.moveTo(this.x - crossSize, this.y);
        ctx.lineTo(this.x + crossSize, this.y);
        ctx.moveTo(this.x, this.y - crossSize);
        ctx.lineTo(this.x, this.y + crossSize);
        ctx.stroke();
      }
    }

    drawWave(ctx) {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.5, this.color + '60');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawSand(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    drawDefault(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.config = null;
      this.animationId = null;
      this.running = false;
      this.lastFrameTime = 0;
      this.frameCount = 0;
      this.fps = 60;
      this.time = 0;
      this.transitioning = false;
      this.transitionProgress = 0;
      this.oldParticles = [];
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.ctx.scale(dpr, dpr);
    }

    setConfig(config, smoothTransition = true) {
      if (!config) {
        this.particles = [];
        this.config = null;
        return;
      }

      if (smoothTransition && this.config && this.particles.length > 0) {
        this.transitioning = true;
        this.transitionProgress = 0;
        this.oldParticles = this.particles.map(p => ({ ...p }));
        
        this.config = config;
        this.particles = [];
        for (let i = 0; i < config.count; i++) {
          const p = new Particle(config);
          p.fadeProgress = 0;
          this.particles.push(p);
        }
      } else {
        this.config = config;
        this.particles = [];
        for (let i = 0; i < config.count; i++) {
          this.particles.push(new Particle(config));
        }
      }
      this.time = 0;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastFrameTime = performance.now();
      this.animate();
    }

    stop() {
      this.running = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
      if (!this.running) return;

      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.time += delta * 0.001;

      this.frameCount++;
      if (this.frameCount % 30 === 0) {
        this.fps = Math.round(1000 / delta);
      }

      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (this.config && this.config.aurora) {
        this.drawAurora();
      }

      if (this.transitioning) {
        this.transitionProgress += delta * 0.001;
        if (this.transitionProgress >= 0.8) {
          this.transitioning = false;
          this.oldParticles = [];
        } else {
          const oldOpacity = 1 - this.transitionProgress;
          this.ctx.globalAlpha = oldOpacity;
          this.oldParticles.forEach(p => {
            if (p.draw) {
              this.ctx.save();
              this.ctx.globalAlpha = oldOpacity * (p.opacity || 1);
              this.ctx.fillStyle = p.color || '#fff';
              this.ctx.beginPath();
              this.ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.restore();
            }
          });
          this.ctx.globalAlpha = 1;
        }
      }

      if (this.config) {
        const dt = delta * 0.001;
        for (const p of this.particles) {
          p.update(dt);
          p.draw(this.ctx, this.time);
        }
      }

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawAurora() {
      const gradient = this.ctx.createLinearGradient(0, 0, window.innerWidth, 0);
      gradient.addColorStop(0, 'rgba(0, 255, 128, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 255, 128, 0.05)');
      gradient.addColorStop(0.5, 'rgba(128, 0, 255, 0.08)');
      gradient.addColorStop(0.7, 'rgba(0, 255, 128, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 255, 128, 0)');

      this.ctx.save();
      this.ctx.fillStyle = gradient;
      this.ctx.filter = 'blur(60px)';
      const yOffset = Math.sin(this.time * 0.3) * 100;
      this.ctx.fillRect(0, window.innerHeight * 0.2 + yOffset, window.innerWidth, window.innerHeight * 0.4);
      this.ctx.restore();
    }

    getFPS() {
      return this.fps;
    }
  }

  let particleSystem = null;
  let currentTheme = null;
  let isLowEndDevice = false;

  function detectLowEndDevice() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return true;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (renderer && /swiftshader|llvmpipe|software/i.test(renderer)) {
      return true;
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    return maxTextureSize < 4096;
  }

  function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    isLowEndDevice = detectLowEndDevice();
    particleSystem = new ParticleSystem(canvas);

    if (!isLowEndDevice) {
      particleSystem.start();
    }

    return particleSystem;
  }

  function updateParticlesForTheme(theme, smoothTransition = true) {
    if (!particleSystem || isLowEndDevice) return;

    if (currentTheme !== theme) {
      currentTheme = theme;
      const config = THEME_PARTICLE_CONFIGS[theme];
      if (config) {
        particleSystem.setConfig(config, smoothTransition);
      }
    }
  }

  async function preloadBackgroundImages() {
    const promises = Object.entries(THEME_BACKGROUND_IMAGES).map(([theme, url]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          PRELOADED_IMAGES[theme] = img;
          resolve({ theme, success: true });
        };
        img.onerror = () => {
          resolve({ theme, success: false });
        };
        img.src = url;
      });
    });
    return Promise.all(promises);
  }

  function getPreloadedImage(theme) {
    return PRELOADED_IMAGES[theme];
  }

  function isImagePreloaded(theme) {
    return !!PRELOADED_IMAGES[theme];
  }

  global.ParticleSystem = ParticleSystem;
  global.Particle = Particle;
  global.initParticleSystem = initParticleSystem;
  global.updateParticlesForTheme = updateParticlesForTheme;
  global.detectLowEndDevice = detectLowEndDevice;
  global.preloadBackgroundImages = preloadBackgroundImages;
  global.getPreloadedImage = getPreloadedImage;
  global.isImagePreloaded = isImagePreloaded;

  global.BG_GRADIENTS = BG_GRADIENTS;
  global.BG_SEQUENCE = BG_SEQUENCE;
  global.BG_BRIGHTNESS = BG_BRIGHTNESS;
  global.THEME_LUT_FILTERS = THEME_LUT_FILTERS;
  global.THEME_BACKGROUND_IMAGES = THEME_BACKGROUND_IMAGES;
  global.THEME_PARTICLE_CONFIGS = THEME_PARTICLE_CONFIGS;
  global.isLowEndDeviceState = () => isLowEndDevice;

})(typeof window !== 'undefined' ? window : global);
