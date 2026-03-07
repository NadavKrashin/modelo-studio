'use client';

import Link from 'next/link';
import type { ModelSummary } from '@/lib/types';
import { ProgressiveImage } from './ProgressiveImage';

interface SearchResultCardProps {
  item: ModelSummary;
  index: number;
  hue?: number;
  query: string;
}

function trackClick(query: string, modelId: string, position: number, source: string) {
  if (typeof navigator === 'undefined') return;

  const body = JSON.stringify({ query, modelId, position, source });
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/click', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/analytics/click', { method: 'POST', body, keepalive: true }).catch(() => {});
  }
}

export function SearchResultCard({ item, index, query }: SearchResultCardProps) {
  const hasImage = !!item.thumbnailUrl;
  const isAboveFold = index < 6;

  return (
    <Link
      href={`/model/${item.id}`}
      onClick={() => trackClick(query, item.id, index, item.sourceName)}
      className={`group bg-white rounded-2xl border border-border/80 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 animate-fade-in stagger-${Math.min(index + 1, 8)}`}
    >
      <div className="relative overflow-hidden">
        {hasImage ? (
          <ProgressiveImage
            lowResSrc={item.lowResThumbnailUrl}
            highResSrc={item.mediumImageUrl ?? item.thumbnailUrl}
            alt={item.localizedName}
            aspectRatio="4/3"
            objectFit="cover"
            priority={isAboveFold}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div style={{ aspectRatio: '4/3' }} className="bg-muted-bg flex items-center justify-center">
            <svg className="w-10 h-10 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] font-medium bg-white/90 backdrop-blur-sm text-muted px-2 py-0.5 rounded-md">
            {item.sourceName}
          </span>
        </div>
        {item.popularityScore >= 85 && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-md">
              פופולרי
            </span>
          </div>
        )}
      </div>
      <div className="p-3.5 md:p-4">
        <h3 className="font-bold text-foreground text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2" dir="auto">
          {item.localizedName}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted">החל מ-</span>
            <span className="text-primary font-extrabold mr-0.5">₪{item.estimatedBasePrice}</span>
          </div>
          <span className="text-[11px] bg-primary-50 text-primary px-2.5 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            צפייה
          </span>
        </div>
      </div>
    </Link>
  );
}
