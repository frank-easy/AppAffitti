import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../utils/constants';
import { COLORS } from '../../utils/constants';
import { WireframeSphere } from './WireframeSphere';

function toFixed4(n: number) {
  return Number(n.toFixed(4));
}

const sphereWidth = toFixed4(SCREEN_WIDTH * 0.5625);
const sphereHeight = toFixed4(SCREEN_HEIGHT * 0.2778);

const sphereLeft = toFixed4(SCREEN_WIDTH * 0.6187);
const sphereTop = toFixed4(-SCREEN_HEIGHT * 0.0847);

const halfCircle1Left = toFixed4(-SCREEN_WIDTH * 0.3125);
const halfCircle1Top = toFixed4(SCREEN_HEIGHT * 0.3889);
const halfCircle1Size = toFixed4(SCREEN_WIDTH * 0.5208);

const halfCircle2Left = toFixed4(SCREEN_WIDTH * 0.1875);
const halfCircle2Top = toFixed4(SCREEN_HEIGHT * 0.7292);
const halfCircle2Size = toFixed4(SCREEN_WIDTH * 0.4167);

const dotCircleLeft = toFixed4(SCREEN_WIDTH * 0.0833);
const dotCircleTop = toFixed4(SCREEN_HEIGHT * 0.1042);
const dotCircleSize = toFixed4(SCREEN_WIDTH * 0.125);

function HalfCircleSvg({
  size,
  stroke,
  strokeWidth = 2,
  rotate = 0,
}: {
  size: number;
  stroke: string;
  strokeWidth?: number;
  rotate?: number;
}) {
  const r = toFixed4((size / 2) * 0.98);
  const cx = toFixed4(size / 2);
  const cy = toFixed4(size / 2);
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path d={d} stroke={stroke} strokeWidth={strokeWidth} fill="none" />
      </Svg>
    </View>
  );
}

export function IntroShapes() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.sphere, { left: sphereLeft, top: sphereTop }]}>
        <WireframeSphere width={sphereWidth} height={sphereHeight} />
      </View>
      <View style={[styles.shape, { left: halfCircle1Left, top: halfCircle1Top, width: halfCircle1Size, height: halfCircle1Size }]}>
        <HalfCircleSvg size={halfCircle1Size} stroke={COLORS.mutedTeal} strokeWidth={2} rotate={-25} />
      </View>
      <View style={[styles.shape, { left: halfCircle2Left, top: halfCircle2Top, width: halfCircle2Size, height: halfCircle2Size }]}>
        <HalfCircleSvg size={halfCircle2Size} stroke={COLORS.mutedTeal} strokeWidth={1.5} rotate={42} />
      </View>
      <View style={[styles.shape, { left: dotCircleLeft, top: dotCircleTop, width: dotCircleSize, height: dotCircleSize }]}>
        <Svg width={dotCircleSize} height={dotCircleSize} viewBox={`0 0 ${dotCircleSize} ${dotCircleSize}`}>
          <Circle
            cx={dotCircleSize / 2}
            cy={dotCircleSize / 2}
            r={toFixed4(dotCircleSize / 2 - 2)}
            stroke={COLORS.fadedCopper}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sphere: {
    position: 'absolute',
    width: sphereWidth,
    height: sphereHeight,
  },
  shape: {
    position: 'absolute',
  },
});
