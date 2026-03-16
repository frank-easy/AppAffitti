import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SCREEN_HEIGHT } from '../../utils/constants';

const BUBBLE_COLOR = 'rgba(132, 169, 140, ';
const BUBBLE_BORDER = 'rgba(132, 169, 140, 0.2)';

const BUBBLES = [
  { diameter: 180, top: -40,                   left: -50,     right: undefined, opacity: 0.12 },
  { diameter: 120, top: SCREEN_HEIGHT * 0.15,  left: undefined, right: -30,     opacity: 0.08 },
  { diameter: 200, top: SCREEN_HEIGHT * 0.28,  left: -80,     right: undefined, opacity: 0.06 },
  { diameter:  90, top: SCREEN_HEIGHT * 0.5,   left: undefined, right: 20,      opacity: 0.10 },
];

export function IntroShapes() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BUBBLES.map((b, i) => (
        <View
          key={i}
          style={[
            styles.bubble,
            {
              width: b.diameter,
              height: b.diameter,
              borderRadius: b.diameter / 2,
              top: b.top,
              left: b.left,
              right: b.right,
              backgroundColor: BUBBLE_COLOR + b.opacity + ')',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: BUBBLE_BORDER,
  },
});
