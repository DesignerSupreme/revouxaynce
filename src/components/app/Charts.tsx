import React from "react";
import { useInView } from "@/hooks/useInView";
import { fmt$ } from "@/lib/helpers";

// ─── SVG Bar Chart ────────────────────────────────────────────────
interface ChartDataPoint {
  label: string;
  value: number;
}

export function BarChart({ data, height = 200 }: { data: ChartDataPoint[]; height?: number }) {
  const { ref, inView } = useInView();
  if (data.length === 0) return <p className="text-sm text-muted-foreground font-sans">No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(40, Math.floor(300 / data.length));
  const chartW = data.length * (barW + 12) + 20;
  const chartH = height;
  const barArea = chartH - 40;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: height }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={0} x2={chartW} y1={barArea - barArea * p} y2={barArea - barArea * p}
            stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />
        ))}
        {data.map((d, i) => {
          const barH = (d.value / max) * barArea;
          const x = i * (barW + 12) + 10;
          const y = barArea - barH;
          return (
            <g key={i}>
              <rect x={x} y={inView ? y : barArea} width={barW} height={inView ? barH : 0} fill="currentColor" opacity={0.85}
                style={{ transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 100}ms`, transformOrigin: "bottom" }} />
              <text x={x + barW / 2} y={barArea + 14} textAnchor="middle" fontSize={8} fill="currentColor" opacity={inView ? 0.5 : 0}
                className="font-sans" style={{ transition: "opacity 0.5s ease" }}>{d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={7} fill="currentColor" opacity={inView ? 0.6 : 0}
                className="font-sans" style={{ transition: `opacity 0.5s ease ${i * 100 + 400}ms` }}>{d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${d.value}`}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────
export function HBarChart({ data }: { data: { label: string; value: number; fill?: string }[] }) {
  const { ref, inView } = useInView();
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div ref={ref} className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs font-sans mb-1">
            <span>{d.label}</span>
            <span className="font-semibold">{fmt$(d.value)}</span>
          </div>
          <div className="w-full bg-muted h-3">
            <div className="h-3 bg-foreground transition-all duration-700 ease-out"
              style={{ width: inView ? `${(d.value / max) * 100}%` : "0%", opacity: d.fill === "light" ? 0.3 : 0.85, transitionDelay: `${i * 100}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────
export function DonutChart({ data, size = 160 }: { data: ChartDataPoint[]; size?: number }) {
  const { ref, inView } = useInView();
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 15;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const opacities = [0.9, 0.7, 0.5, 0.35, 0.2];

  return (
    <div ref={ref} className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * c;
          const thisOffset = offset;
          offset += dash;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
              strokeWidth={20} strokeOpacity={opacities[i % opacities.length]}
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-thisOffset}
              style={{ transition: `stroke-dasharray 1s ease ${i * 150}ms, stroke-dashoffset 1s ease ${i * 150}ms`, ...(!inView ? { strokeDasharray: `0 ${c}` } : {}) }}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          );
        })}
        <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em" fontSize={18} fill="currentColor" className="font-display">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 text-xs font-sans">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 shrink-0 bg-foreground" style={{ opacity: opacities[i % opacities.length] }} />
            <span>{d.label}: <span className="font-semibold">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────
export function LineChart({ data, height = 180 }: { data: ChartDataPoint[]; height?: number }) {
  const { ref, inView } = useInView();
  if (data.length < 2) return <p className="text-sm text-muted-foreground font-sans">Not enough data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const padding = 30;
  const chartW = 400;
  const chartH = height;
  const areaH = chartH - padding * 2;
  const areaW = chartW - padding * 2;
  const stepX = areaW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + areaH - (d.value / max) * areaH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + areaH} L ${points[0].x} ${padding + areaH} Z`;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: height }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={padding} x2={chartW - padding} y1={padding + areaH - areaH * p} y2={padding + areaH - areaH * p}
            stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />
        ))}
        <path d={areaPath} fill="currentColor" opacity={inView ? 0.08 : 0} style={{ transition: "opacity 1s ease" }} />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} opacity={inView ? 0.8 : 0}
          strokeDasharray={inView ? "none" : "1000"} strokeDashoffset={inView ? "0" : "1000"}
          style={{ transition: "stroke-dashoffset 1.5s ease, opacity 0.5s ease" }} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="currentColor" opacity={inView ? 0.9 : 0}
              style={{ transition: `opacity 0.3s ease ${i * 100 + 500}ms, r 0.2s ease` }} />
            <text x={p.x} y={padding + areaH + 16} textAnchor="middle" fontSize={7} fill="currentColor" opacity={0.4}
              className="font-sans">{data[i].label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
