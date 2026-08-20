import { useRef, useCallback, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum px to count as a swipe. Default 50 */
  threshold?: number;
  /** Max vertical drift before treating as a scroll. Default 80 */
  verticalTolerance?: number;
}

export interface SwipeBindings {
  /** Spread these onto the swipeable element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove:  (e: React.TouchEvent) => void;
    onTouchEnd:   (e: React.TouchEvent) => void;
    onMouseDown:  (e: React.MouseEvent) => void;
    onMouseMove:  (e: React.MouseEvent) => void;
    onMouseUp:    (e: React.MouseEvent) => void;
    onClick:      (e: React.MouseEvent) => void;
  };
  /** Live horizontal drag offset in px (rubber-band feel). Use for CSS transform. */
  dragOffset: number;
  /** True while the user is actively dragging */
  isDragging: boolean;
}

/**
 * Detects left/right swipe via touch (mobile) and mouse (laptop touchscreen).
 * - Exposes live dragOffset for real-time rubber-band animation
 * - Cancels the browser click event that follows a touchend so onClick on
 *   parent elements doesn't fire after a swipe
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  verticalTolerance = 80,
}: SwipeOptions): SwipeBindings {
  const startX       = useRef<number | null>(null);
  const startY       = useRef<number | null>(null);
  const isDraggingH  = useRef(false);   // true once confirmed horizontal drag
  const wasSwiped    = useRef(false);   // prevents click after swipe
  const mouseDown    = useRef(false);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Start ──────────────────────────────────────────────────────────────────
  const onStart = useCallback((x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    isDraggingH.current = false;
    wasSwiped.current = false;
  }, []);

  // ── Move (live rubber-band) ────────────────────────────────────────────────
  const onMove = useCallback((x: number, y: number) => {
    if (startX.current === null || startY.current === null) return;

    const dx = x - startX.current;
    const dy = y - startY.current;

    // Once vertical drift is large, cancel horizontal tracking
    if (!isDraggingH.current && Math.abs(dy) > verticalTolerance) {
      startX.current = null;
      startY.current = null;
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    // Commit to horizontal once we move 8px horizontally
    if (Math.abs(dx) > 8) {
      isDraggingH.current = true;
    }

    if (isDraggingH.current) {
      // Rubber-band: full drag near start, dampen toward ends
      const damped = dx * 0.55;
      setDragOffset(damped);
      setIsDragging(true);
    }
  }, [verticalTolerance]);

  // ── End ───────────────────────────────────────────────────────────────────
  const onEnd = useCallback((x: number, y: number) => {
    if (startX.current === null || startY.current === null) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const dx = x - startX.current;
    const dy = y - startY.current;

    startX.current = null;
    startY.current = null;
    setDragOffset(0);
    setIsDragging(false);
    isDraggingH.current = false;

    if (Math.abs(dy) > verticalTolerance) return;

    if (dx < -threshold) {
      wasSwiped.current = true;
      onSwipeLeft?.();
    } else if (dx > threshold) {
      wasSwiped.current = true;
      onSwipeRight?.();
    }
  }, [onSwipeLeft, onSwipeRight, threshold, verticalTolerance]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlers: SwipeBindings['handlers'] = {
    onTouchStart: (e) => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    },
    onTouchMove: (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    onTouchEnd: (e) => {
      const t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    },
    onMouseDown: (e) => {
      if (e.button !== 0) return;
      mouseDown.current = true;
      onStart(e.clientX, e.clientY);
    },
    onMouseMove: (e) => {
      if (!mouseDown.current) return;
      onMove(e.clientX, e.clientY);
    },
    onMouseUp: (e) => {
      if (e.button !== 0) return;
      mouseDown.current = false;
      onEnd(e.clientX, e.clientY);
    },
    // Swallow the synthetic click that browsers fire after touchend
    onClick: (e) => {
      if (wasSwiped.current) {
        e.stopPropagation();
        e.preventDefault();
        wasSwiped.current = false;
      }
    },
  };

  return { handlers, dragOffset, isDragging };
}
