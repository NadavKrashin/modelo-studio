'use client';

import { useState } from 'react';
import type { ModelImage } from '@/lib/types';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';

interface Props {
  images: ModelImage[];
  modelName: string;
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full bg-muted-bg flex items-center justify-center">
      <svg className="w-16 h-16 text-muted/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    </div>
  );
}

export function ModelGallery({ images, modelName }: Props) {
  const viewCount = Math.max(images.length, 1);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasRealImages = images.length > 0 && images.some((img) => img.url || img.cachedUrl);

  return (
    <div className="lg:sticky lg:top-24">
      {/* Main image */}
      <div className="bg-white rounded-2xl overflow-hidden border border-border/80 shadow-sm relative">
        {hasRealImages && images[activeIndex] ? (
          <ProgressiveImage
            key={activeIndex}
            lowResSrc={images[activeIndex].thumbnailUrl ?? images[activeIndex].url}
            highResSrc={images[activeIndex].largeUrl ?? images[activeIndex].mediumUrl ?? images[activeIndex].cachedUrl ?? images[activeIndex].url}
            alt={images[activeIndex].alt || modelName}
            aspectRatio="1/1"
            objectFit="contain"
            priority
          />
        ) : (
          <div style={{ aspectRatio: '1/1' }}>
            <ImagePlaceholder />
          </div>
        )}
        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between z-10">
          <span className="text-[10px] bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md">
            {modelName}
          </span>
          <span className="text-[10px] bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md">
            {hasRealImages ? `${activeIndex + 1}/${images.length}` : 'אין תמונה'}
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {viewCount > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {Array.from({ length: viewCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeIndex === i
                  ? 'border-primary shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {hasRealImages && images[i] ? (
                <ProgressiveImage
                  lowResSrc={images[i].thumbnailUrl}
                  highResSrc={images[i].thumbnailUrl ?? images[i].url}
                  alt={images[i].alt || `${modelName} ${i + 1}`}
                  aspectRatio="1/1"
                  objectFit="cover"
                  priority
                />
              ) : (
                <ImagePlaceholder />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
