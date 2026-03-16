import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

const R = 90;
const CX = 100;
const CY = 100;
const VIEW = 200;

function toFixed4(n: number) {
  return Number(n.toFixed(4));
}

const PARALLELS = [20, 45, 90, 135, 160].map((deg) => (deg * Math.PI) / 180);
const MERIDIANS = [0, 45, 90, 135, 180].map((deg) => (deg * Math.PI) / 180);

function parallelPath(phi: number) {
  const cy = CY - R * Math.cos(phi);
  const cr = R * Math.sin(phi);
  return { cx: CX, cy: toFixed4(cy), r: toFixed4(cr) };
}

function meridianPath(theta: number) {
  const points: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const phi = (i / 24) * Math.PI;
    const x = CX + R * Math.sin(phi) * Math.cos(theta);
    const y = CY - R * Math.cos(phi);
    points.push(`${toFixed4(x)} ${toFixed4(y)}`);
  }
  return `M ${points.join(' L ')}`;
}

export function WireframeSphere({
  width = VIEW,
  height = VIEW,
  stroke = COLORS.mutedTeal,
  strokeWidth = 1.5,
}: {
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const w = toFixed4(width);
  const h = toFixed4(height);
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${VIEW} ${VIEW}`} style={{ overflow: 'visible' }}>
      {PARALLELS.map((phi, i) => {
        const { cx, cy, r } = parallelPath(phi);
        return (
          <Circle
            key={`p-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
        );
      })}
      {MERIDIANS.map((theta, i) => (
        <Path
          key={`m-${i}`}
          d={meridianPath(theta)}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
        />
      ))}
    </Svg>
  );
}
