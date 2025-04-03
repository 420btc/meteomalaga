import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  colors?: string[];
  style?: ViewStyle;
  children: React.ReactNode;
}

// Export both as default and named export for compatibility
const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  colors = ['#4c669f', '#3b5998', '#192f6a'], 
  style, 
  children 
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export { GradientBackground };
export default GradientBackground;
