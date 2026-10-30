"use client";

import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export function DualRangeSlider({
  label,
  domainMin,
  domainMax,
  step = 0.5,
  low,
  high,
  onChange,
  formatValue = (n) => n.toFixed(n % 1 === 0 ? 0 : 1),
  unit = "",
}: {
  label: string;
  domainMin: number;
  domainMax: number;
  step?: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  formatValue?: (n: number) => string;
  unit?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef({ low, high });
  valuesRef.current = { low, high };

  const labelId = useId();
  const span = domainMax - domainMin || 1;
  const gap = step;

  const snap = useCallback(
    (raw: number) => {
      const clamped = Math.max(domainMin, Math.min(domainMax, raw));
      const steps = Math.round((clamped - domainMin) / step);
      return Math.min(domainMax, domainMin + steps * step);
    },
    [domainMin, domainMax, step],
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return domainMin;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snap(domainMin + ratio * span);
    },
    [domainMin, span, snap],
  );

  const lowPct = ((low - domainMin) / span) * 100;
  const highPct = ((high - domainMin) / span) * 100;

  const applyLow = useCallback(
    (next: number) => {
      const { high: h } = valuesRef.current;
      const v = snap(next);
      onChange(Math.min(v, h - gap), h);
    },
    [gap, onChange, snap],
  );

  const applyHigh = useCallback(
    (next: number) => {
      const { low: l } = valuesRef.current;
      const v = snap(next);
      onChange(l, Math.max(v, l + gap));
    },
    [gap, onChange, snap],
  );

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const v = valueFromClientX(e.clientX);
    const { low: l, high: h } = valuesRef.current;
    if (Math.abs(v - l) <= Math.abs(v - h)) applyLow(v);
    else applyHigh(v);
  };

  const onThumbPointerMove =
    (which: "low" | "high") => (e: PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const v = valueFromClientX(e.clientX);
      if (which === "low") applyLow(v);
      else applyHigh(v);
    };

  const onThumbPointerDown =
    (which: "low" | "high") => (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const v = valueFromClientX(e.clientX);
      if (which === "low") applyLow(v);
      else applyHigh(v);
    };

  const onThumbKey =
    (which: "low" | "high") => (e: KeyboardEvent<HTMLButtonElement>) => {
      let delta = 0;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
      if (!delta) return;
      e.preventDefault();
      const { low: l, high: h } = valuesRef.current;
      if (which === "low") applyLow(l + delta);
      else applyHigh(h + delta);
    };

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span id={labelId} className={labelClass}>
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-stone-600 dark:text-stone-400">
          {formatValue(low)}
          {unit} – {formatValue(high)}
          {unit}
        </span>
      </div>
      <div
        ref={trackRef}
        role="group"
        aria-labelledby={labelId}
        className="relative mt-3 flex h-8 touch-none items-center"
        onPointerDown={onTrackPointerDown}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stone-200 dark:bg-stone-700" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-500/80 dark:bg-emerald-600"
          style={{
            left: `${lowPct}%`,
            width: `${Math.max(0, highPct - lowPct)}%`,
          }}
        />
        <Thumb
          style={{ left: `calc(${lowPct}% - 8px)` }}
          aria-label={`${label} minimum`}
          aria-valuemin={domainMin}
          aria-valuemax={high - gap}
          aria-valuenow={low}
          onPointerDown={onThumbPointerDown("low")}
          onPointerMove={onThumbPointerMove("low")}
          onKeyDown={onThumbKey("low")}
        />
        <Thumb
          style={{ left: `calc(${highPct}% - 8px)` }}
          aria-label={`${label} maximum`}
          aria-valuemin={low + gap}
          aria-valuemax={domainMax}
          aria-valuenow={high}
          onPointerDown={onThumbPointerDown("high")}
          onPointerMove={onThumbPointerMove("high")}
          onKeyDown={onThumbKey("high")}
        />
      </div>
    </div>
  );
}

function Thumb({
  style,
  onPointerDown,
  onPointerMove,
  onKeyDown,
  ...a11y
}: {
  style: { left: string };
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  "aria-label": string;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
}) {
  return (
    <button
      type="button"
      role="slider"
      tabIndex={0}
      className="absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 cursor-grab rounded-full border-2 border-emerald-500 bg-white shadow-sm active:cursor-grabbing dark:border-emerald-400 dark:bg-stone-900"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      {...a11y}
    />
  );
}

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400";
