import React from 'react';

export function calculateSymbolSize(amount: number, scale = 1) {
  if (amount == null || isNaN(amount) || amount <= 0) return 2 * scale;
  return Math.max(2, Math.sqrt(amount) * scale);
}

type Point = { timestamp: number; price: number; amount: number };

export default function TopBottomPurchaseChart({
  title,
  data,
  width = 400,
  height = 240,
  scale = 0.03,
}: {
  title?: string;
  data: Point[] | null | undefined;
  width?: number;
  height?: number;
  scale?: number;
}) {
  if (!data || data.length === 0) {
    return <div role="status">No data available for {title ?? 'chart'}.</div>;
  }

  const timestamps = data.map((d) => d.timestamp);
  const prices = data.map((d) => d.price);
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const toX = (t: number) => ((t - minT) / (maxT - minT || 1)) * (width - 40) + 20;
  const toY = (p: number) => (height - 20) - ((p - minP) / (maxP - minP || 1)) * (height - 40);

  return (
    <figure style={{ width, height }}>
      {title && <figcaption>{title}</figcaption>}
      <svg width={width} height={height} role="img" aria-label={title ?? 'purchase chart'}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        {data.map((pt, i) => {
          const r = calculateSymbolSize(pt.amount, scale);
          return (
            <circle
              key={i}
              cx={toX(pt.timestamp)}
              cy={toY(pt.price)}
              r={r}
              fill="#1f77b4"
              stroke="#08306b"
              strokeWidth={0.5}
              aria-label={`point-${i}`}
              title={`${new Date(pt.timestamp).toLocaleString()}\nPrice: ${pt.price}\nAmount: ${pt.amount}`}
            />
          );
        })}
      </svg>
    </figure>
  );
}
