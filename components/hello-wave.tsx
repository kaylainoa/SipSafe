import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <MaterialCommunityIcons name="hand-wave-outline" size={28} color="#F0EBE1" />
    </Animated.View>
  );
}
