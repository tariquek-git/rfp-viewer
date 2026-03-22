'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualScrollOptions {
  totalItems: number;
  itemHeight: number;
  overscan?: number;
}

interface UseVirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualItems: { index: number; offsetTop: number }[];
  totalHeight: number;
  containerProps: {
    onScroll: () => void;
    style: React.CSSProperties;
  };
  innerProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScroll({
  totalItems,
  itemHeight,
  overscan = 5,
}: UseVirtualScrollOptions): UseVirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  const totalHeight = totalItems * itemHeight;

  const virtualItems = useMemo(() => {
    if (containerHeight === 0) return [];
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    const items: { index: number; offsetTop: number }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({ index: i, offsetTop: i * itemHeight });
    }
    return items;
  }, [scrollTop, containerHeight, totalItems, itemHeight, overscan]);

  const handleScroll = () => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  };

  return {
    containerRef,
    virtualItems,
    totalHeight,
    containerProps: {
      onScroll: handleScroll,
      style: { overflow: 'auto', position: 'relative' as const },
    },
    innerProps: {
      style: { height: totalHeight, position: 'relative' as const },
    },
  };
}
