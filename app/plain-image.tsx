/* eslint-disable @next/next/no-img-element */

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

const GENERAL_FALLBACK = "/assets/jahez/hero-chicken.jpg";
// Transient media failures (slow DB/CDN cold start) get this many silent retries
// against the ORIGINAL url before any fallback is shown.
const MAX_RETRIES = 2;

export function PlainImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  fallbackSrc,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);

  // The parent may pass a NEW src after mount (e.g., fresh catalog settings
  // arrive, or the admin just saved a new image). Always follow the prop —
  // otherwise the first-rendered (old) image sticks on screen forever.
  useEffect(() => {
    setResolvedSrc(src);
    setAttempt(0);
  }, [src]);

  const onError = useCallback(() => {
    if (attempt < MAX_RETRIES) {
      // Retry the original url (cache-busted) — most failures are transient.
      const n = attempt + 1;
      setAttempt(n);
      const sep = src.includes("?") ? "&" : "?";
      setResolvedSrc(`${src}${sep}retry=${n}`);
      return;
    }
    if (fallbackSrc && resolvedSrc !== fallbackSrc) {
      setResolvedSrc(fallbackSrc);
      return;
    }
    if (resolvedSrc !== GENERAL_FALLBACK) {
      setResolvedSrc(GENERAL_FALLBACK);
    }
    // else: fallback itself failed — leave it, avoid an infinite error loop.
  }, [attempt, resolvedSrc, fallbackSrc, src]);

  const style: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }
    : undefined;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      style={style}
      onError={onError}
    />
  );
}
