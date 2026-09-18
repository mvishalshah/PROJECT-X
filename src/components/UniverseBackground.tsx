import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Play, Pause } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

const STAR_COLORS = [
  '#ffffff',
  '#e0f2fe',
  '#bae6fd',
  '#7dd3fc',
  '#38bdf8',
  '#c084fc',
  '#e879f9',
  '#fef08a',
];

export const UniverseBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const isPlayingRef = useRef<boolean>(true);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
      initNebulas();
    };

    window.addEventListener('resize', handleResize);

    // Track gentle mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - width / 2) * 0.05;
      mouseRef.current.targetY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize 3D Stars
    const STAR_COUNT = Math.min(220, Math.floor((width * height) / 7500));
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2,
          y: (Math.random() - 0.5) * height * 2,
          z: Math.random() * width,
          prevZ: width,
          size: Math.random() * 1.5 + 0.6,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };
    initStars();

    // Initialize Cosmic Nebulas (large glowing gas clouds)
    let nebulas: Nebula[] = [];
    const initNebulas = () => {
      nebulas = [
        {
          x: width * 0.2,
          y: height * 0.25,
          radius: Math.min(width, height) * 0.45,
          vx: 0.12,
          vy: 0.08,
          color: 'rgba(56, 189, 248, 0.07)', // Soft sky cyan
        },
        {
          x: width * 0.8,
          y: height * 0.7,
          radius: Math.min(width, height) * 0.5,
          vx: -0.09,
          vy: -0.11,
          color: 'rgba(147, 51, 234, 0.06)', // Deep nebula violet
        },
        {
          x: width * 0.5,
          y: height * 0.5,
          radius: Math.min(width, height) * 0.4,
          vx: 0.07,
          vy: -0.06,
          color: 'rgba(30, 64, 175, 0.08)', // Cosmic deep blue
        },
        {
          x: width * 0.15,
          y: height * 0.85,
          radius: Math.min(width, height) * 0.35,
          vx: 0.08,
          vy: 0.05,
          color: 'rgba(236, 72, 153, 0.04)', // Rose nebula dust
        },
      ];
    };
    initNebulas();

    // Shooting stars
    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.5),
        length: Math.random() * 80 + 60,
        speed: Math.random() * 12 + 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3, // ~45 deg
        opacity: 1,
        active: true,
      });
    };

    let clock = 0;

    const render = () => {
      if (!isPlayingRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      clock += 0.02;

      // Smooth mouse parallax damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base space background: deep cosmic gradient
      const bgGradient = ctx.createRadialGradient(
        width / 2 + mouseRef.current.x * 0.5,
        height / 2 + mouseRef.current.y * 0.5,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGradient.addColorStop(0, '#030712'); // Slate 950 deep center
      bgGradient.addColorStop(0.5, '#020617'); // Rich midnight navy
      bgGradient.addColorStop(1, '#00020a'); // Stygian void edge

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render Moving Nebulas
      for (const neb of nebulas) {
        neb.x += neb.vx;
        neb.y += neb.vy;

        // Bounce gently inside canvas bounds
        if (neb.x < -100 || neb.x > width + 100) neb.vx *= -1;
        if (neb.y < -100 || neb.y > height + 100) neb.vy *= -1;

        const nebGrad = ctx.createRadialGradient(
          neb.x + mouseRef.current.x,
          neb.y + mouseRef.current.y,
          0,
          neb.x + mouseRef.current.x,
          neb.y + mouseRef.current.y,
          neb.radius
        );
        nebGrad.addColorStop(0, neb.color);
        nebGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = nebGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Constellation Network Calculation:
      // Store 2D screen projected coordinates of stars
      const projectedStars: { px: number; py: number; alpha: number; z: number }[] = [];

      const centerX = width / 2 + mouseRef.current.x;
      const centerY = height / 2 + mouseRef.current.y;
      const speed = 1.2;

      // Render Starfield
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.prevZ = star.z;
        star.z -= speed;

        // Reset star when it passes the camera or goes out of view
        if (star.z <= 1) {
          star.z = width;
          star.prevZ = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 280 / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        // Check if within visible bounds
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthRatio = 1 - star.z / width;
          const twinkle = Math.sin(clock * 2 + star.twinklePhase) * 0.3 + 0.7;
          const alpha = Math.min(1, Math.max(0.1, depthRatio * twinkle));
          const radius = Math.max(0.6, (star.size * (1.2 - star.z / width) * 2.2));

          projectedStars.push({ px, py, alpha, z: star.z });

          // Render star core
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fill();

          // Render soft cosmic diffraction glow for brighter/closer stars
          if (depthRatio > 0.6) {
            ctx.beginPath();
            ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = alpha * 0.25;
            ctx.fill();
          }

          // Reset globalAlpha
          ctx.globalAlpha = 1.0;
        }
      }

      // Render Constellation / Cryptographic Mesh lines
      const maxConnectDistance = 85;
      const maxLinesPerStar = 2;

      for (let i = 0; i < projectedStars.length; i++) {
        let connected = 0;
        const p1 = projectedStars[i];

        for (let j = i + 1; j < projectedStars.length; j++) {
          if (connected >= maxLinesPerStar) break;
          const p2 = projectedStars[j];

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDistance) {
            const lineAlpha = (1 - dist / maxConnectDistance) * 0.15 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = '#38bdf8'; // Sky cyan cryptographic mesh line
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            connected++;
          }
        }
      }

      // Handle Shooting Stars
      const now = Date.now();
      if (now - lastShootingStarTime > 5000 + Math.random() * 4000) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const vx = Math.cos(ss.angle) * ss.speed;
        const vy = Math.sin(ss.angle) * ss.speed;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(0.7, `rgba(186, 230, 253, ${ss.opacity * 0.7})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Advance shooting star
        ss.x += vx;
        ss.y += vy;
        ss.opacity -= 0.015;

        if (ss.opacity <= 0 || ss.x > width + 100 || ss.y > height + 100) {
          ss.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Interactive Universe Canvas covering entire viewport background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Subtle cosmic vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)]"
        aria-hidden="true"
      />

      {/* Floating Universe Controls Toggle (Discreet in lower right) */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Universe Motion' : 'Resume Universe Motion'}
          className="bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-1.5 shadow-lg transition-all"
        >
          <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
          <span className="hidden sm:inline">Universe:</span>
          <span>{isPlaying ? 'Active' : 'Paused'}</span>
          {isPlaying ? (
            <Pause className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
          ) : (
            <Play className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
          )}
        </button>
      </div>
    </>
  );
};
