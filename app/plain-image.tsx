/* eslint-disable @next/next/no-img-element */

"use client";

import { useCallback, useState, type CSSProperties } from "react";

const GENERAL_FALLBACK = "/assets/jahez/hero-chicken.jpg";

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

  const onError = useCallback(() => {
    if (attempt === 0 && fallbackSrc && fallbackSrc !== src) {
      setResolvedSrc(fallbackSrc);
      setAttempt(1);
    } else if (attempt < 2) {
      setResolvedSrc(GENERAL_FALLBACK);
      setAttempt(2);
    }
  }, [attempt, fallbackSrc, src]);

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
