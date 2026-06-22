import React, { useState, useRef } from "react";

interface DataPoint {
  [key: string]: any;
}

interface CustomChartProps {
  data: DataPoint[];
  xAxisKey: string;
  lines: {
    key: string;
    color: string;
    name: string;
    strokeWidth?: number;
  }[];
  title?: string;
  yLabel?: string;
}

export const CustomChart: React.FC<CustomChartProps> = ({
  data,
  xAxisKey,
  lines,
  title,
  yLabel,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Chart dimensions inside the SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute boundaries
  const allYValues: number[] = [];
  data.forEach((d) => {
    lines.forEach((line) => {
      if (typeof d[line.key] === "number") {
        allYValues.push(d[line.key]);
      }
    });
  });

  const minY = Math.min(...allYValues, 0); // Always baseline at 0 or below
  const maxY = Math.max(...allYValues, 100) * 1.1; // Add 10% safety margin

  const xCoords = data.map((_, i) => {
    return paddingLeft + (i / (data.length - 1)) * chartWidth;
  });

  const getYCoord = (val: number) => {
    const ratio = (val - minY) / (maxY - minY);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Map SVG coordinates relative to width/height ratio
    const svgX = (clientX / rect.width) * width;
    const svgY = (clientY / rect.height) * height;

    // Find closest index
    let closestIndex = 0;
    let minDistance = Infinity;

    xCoords.forEach((cx, idx) => {
      const dist = Math.abs(cx - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setHoverIndex(closestIndex);
    
    // Position tooltip nicely relative to the mouse in screen pixels
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 80,
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Generate ticks for Y axis
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    return minY + (i / tickCount) * (maxY - minY);
  });

  return (
    <div ref={containerRef} className="relative w-full bg-[#0a0f12]/90 border border-emerald-950/40 rounded-xl p-4 shadow-xl shadow-black/80">
      {title && (
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-sans font-medium text-sm tracking-wide text-zinc-300 flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {title}
          </h4>
          <div className="flex gap-3 text-[10px] font-mono text-zinc-500">
            {lines.map((line) => (
              <span key={line.key} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-0.5" style={{ backgroundColor: line.color }} />
                {line.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Responsive SVG wrapper */}
      <div className="w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle Grid backgrounds */}
          <rect
            className="fill-none stroke-zinc-900 border-none"
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={chartHeight}
          />

          {/* Draw horizontal grid division lines */}
          {yTicks.map((tick, idx) => {
            const y = getYCoord(tick);
            return (
              <g key={`grid-y-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#0f1a1e"
                  strokeWidth={1}
                  strokeDasharray={idx === 0 ? "0" : "3,3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-600 font-mono text-[9px] antialiased"
                >
                  {tick.toFixed(0)}
                  {yLabel}
                </text>
              </g>
            );
          })}

          {/* Draw X Axis timestamps */}
          {data.map((item, idx) => {
            // Draw every 2nd tick for legibility
            if (idx % 2 !== 0) return null;
            const x = xCoords[idx];
            return (
              <g key={`axis-x-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop + chartHeight}
                  x2={x}
                  y2={paddingTop + chartHeight + 4}
                  stroke="#162e2d"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  className="fill-zinc-600 font-mono text-[9px] antialiased"
                >
                  {String(item[xAxisKey])}
                </text>
              </g>
            );
          })}

          {/* Draw lines */}
          {lines.map((line) => {
            let pathString = "";
            let dotCircles: React.ReactNode[] = [];

            data.forEach((item, idx) => {
              const val = item[line.key];
              if (typeof val === "number") {
                const x = xCoords[idx];
                const y = getYCoord(val);

                if (idx === 0) {
                  pathString = `M ${x} ${y}`;
                } else {
                  pathString += ` L ${x} ${y}`;
                }

                // Push dots for markers
                dotCircles.push(
                  <circle
                    key={`dot-${line.key}-${idx}`}
                    cx={x}
                    cy={y}
                    r={hoverIndex === idx ? 5 : 2}
                    className="transition-all duration-200"
                    fill={hoverIndex === idx ? "#ffffff" : line.color}
                    stroke={line.color}
                    strokeWidth={hoverIndex === idx ? 2 : 0}
                  />
                );
              }
            });

            const fillId = `gradient-fill-${line.key}`;
            const firstPointX = xCoords[0];
            const lastPointX = xCoords[data.length - 1];
            const bottomY = paddingTop + chartHeight;
            const filledPathString = pathString ? `${pathString} L ${lastPointX} ${bottomY} L ${firstPointX} ${bottomY} Z` : "";

            return (
              <g key={`data-line-${line.key}`}>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={line.color} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={line.color} stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                {filledPathString && (
                  <path
                    d={filledPathString}
                    fill={`url(#${fillId})`}
                    className="transition-all duration-300"
                  />
                )}
                <path
                  d={pathString}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.strokeWidth || 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 opacity-95 drop-shadow-[0_2px_12px_rgba(16,185,129,0.25)]"
                />
                {dotCircles}
              </g>
            );
          })}

          {/* Draw the interactive crosshair overlay */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={xCoords[hoverIndex]}
                y1={paddingTop}
                x2={xCoords[hoverIndex]}
                y2={paddingTop + chartHeight}
                stroke="#10b981"
                strokeWidth={1.2}
                strokeDasharray="4,4"
                className="opacity-70 animate-pulse"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Hover tooltip widget */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-30 pointer-events-none bg-zinc-950/95 border border-emerald-500/30 rounded-lg p-2.5 shadow-2xl backdrop-blur-md min-w-[150px]"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="text-[10px] font-mono text-zinc-500 border-b border-zinc-800 pb-1 mb-1.5 flex justify-between items-center">
            <span>TIMESTAMP:</span>
            <span className="text-emerald-400 font-semibold">{data[hoverIndex][xAxisKey]}</span>
          </div>

          <div className="space-y-1">
            {lines.map((line) => {
              const val = data[hoverIndex!][line.key];
              return (
                <div key={line.key} className="flex justify-between items-center gap-4 text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.name}:
                  </span>
                  <span className="text-zinc-200 font-semibold">
                    {typeof val === "number" ? val.toFixed(1) : "N/A"}
                    {yLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
