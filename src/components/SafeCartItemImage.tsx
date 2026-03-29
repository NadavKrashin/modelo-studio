"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
};

/**
 * Next/Image for remote cart thumbnails. Parent should pass `key={src}` (or
 * `${itemId}-${src}`) so error state resets when the URL changes.
 */
export function SafeCartItemImage({ src, alt, className = "object-cover", sizes }: Props) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] text-center p-2 leading-tight">
        תמונה חסרה
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes ?? "(max-width: 768px) 80px, 80px"}
      onError={() => setImgError(true)}
    />
  );
}

/** Same behavior as SafeCartItemImage for cart/checkout pages that use a plain img element. */
export function SafeCartItemImg({
  src,
  alt,
  className = "w-full h-full object-cover",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted-bg text-muted text-[10px] text-center p-2 leading-tight">
        תמונה חסרה
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setImgError(true)} />
  );
}
