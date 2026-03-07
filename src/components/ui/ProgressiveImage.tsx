'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ProgressiveImageProps {
  /** Low-res source shown immediately as blurred placeholder. */
  lowResSrc?: string;
  /** Target high-res source loaded in the background. */
  highResSrc: string;
  alt: string;
  /** CSS aspect-ratio value. Prevents layout shift. */
  aspectRatio?: string;
  className?: string;
  /** object-fit behavior for the image. */
  objectFit?: 'cover' | 'contain';
  /** Priority loading for above-the-fold images (disables lazy loading). */
  priority?: boolean;
  /** Callback when high-res image finishes loading. */
  onLoad?: () => void;
}

/**
 * Progressive image component with blur-up loading strategy.
 *
 * 1. Shows a skeleton/pulse while nothing is loaded
 * 2. If lowResSrc is provided, shows it immediately with a CSS blur
 * 3. Preloads highResSrc in the background via an Image() object
 * 4. When highResSrc loads, crossfades from blurred low-res to sharp high-res
 * 5. If highResSrc fails, keeps showing the low-res (or skeleton)
 *
 * Uses IntersectionObserver for lazy loading when priority=false.
 * Fixed aspect ratio via CSS to prevent layout shift.
 */
export function ProgressiveImage({
  lowResSrc,
  highResSrc,
  alt,
  aspectRatio = '4/3',
  className = '',
  objectFit = 'cover',
  priority = false,
  onLoad,
}: ProgressiveImageProps) {
  const [phase, setPhase] = useState<'skeleton' | 'low' | 'high'>('skeleton');
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const highResLoadedRef = useRef(false);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isInView]);

  // Load low-res image
  useEffect(() => {
    if (!isInView || !lowResSrc || phase !== 'skeleton') return;

    const img = new Image();
    img.src = lowResSrc;
    img.onload = () => {
      if (!highResLoadedRef.current) {
        setPhase('low');
      }
    };
  }, [isInView, lowResSrc, phase]);

  // Load high-res image
  const loadHighRes = useCallback(() => {
    if (!isInView || !highResSrc || highResLoadedRef.current) return;

    const img = new Image();
    img.src = highResSrc;
    img.onload = () => {
      highResLoadedRef.current = true;
      setPhase('high');
      onLoad?.();
    };
    img.onerror = () => {
      // Keep showing whatever we have — don't degrade
    };
  }, [isInView, highResSrc, onLoad]);

  useEffect(() => {
    loadHighRes();
  }, [loadHighRes]);

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-muted-bg ${className}`}
      style={{ aspectRatio }}
    >
      {/* Skeleton pulse — always present as a base layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />

      {/* Low-res blurred placeholder */}
      {lowResSrc && (phase === 'low' || phase === 'high') && (
        <img
          src={lowResSrc}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full ${fitClass} transition-opacity duration-300 ${
            phase === 'high' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ filter: phase === 'low' ? 'blur(12px)' : undefined, transform: 'scale(1.05)' }}
          draggable={false}
        />
      )}

      {/* High-res final image */}
      {phase === 'high' && (
        <img
          src={highResSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${fitClass} animate-progressive-reveal`}
          draggable={false}
        />
      )}

      {/* Accessible alt for screen readers when still loading */}
      {phase !== 'high' && (
        <span className="sr-only">{alt}</span>
      )}
    </div>
  );
}
