import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CloudProps {
  size: number;
  top: number;
  left: number;
  speed: number;
  opacity: number;
  zIndex: number;
}

const FloatingClouds: React.FC = () => {
  // Create multiple clouds with different properties
  const clouds: CloudProps[] = [
    { size: 100, top: height * 0.1, left: -100, speed: 15000, opacity: 0.7, zIndex: 1 },
    { size: 80, top: height * 0.3, left: -80, speed: 20000, opacity: 0.5, zIndex: 2 },
    { size: 120, top: height * 0.5, left: -120, speed: 25000, opacity: 0.6, zIndex: 3 },
    { size: 90, top: height * 0.7, left: -90, speed: 18000, opacity: 0.4, zIndex: 4 },
    { size: 110, top: height * 0.2, left: -110, speed: 22000, opacity: 0.5, zIndex: 5 },
    { size: 70, top: height * 0.6, left: -70, speed: 19000, opacity: 0.6, zIndex: 6 },
  ];

  // Create animated values for each cloud
  const cloudAnimations = useRef(clouds.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Start animations for each cloud
    cloudAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: clouds[index].speed,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {clouds.map((cloud, index) => {
        // Calculate the total distance the cloud needs to travel
        const totalDistance = width + cloud.size;
        
        // Interpolate the animation value to move from left to right
        const translateX = cloudAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [cloud.left, cloud.left + totalDistance]
        });

        return (
          <Animated.Image
            key={index}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/414/414927.png' }}
            style={[
              styles.cloud,
              {
                width: cloud.size,
                height: cloud.size * 0.6,
                top: cloud.top,
                opacity: cloud.opacity,
                zIndex: cloud.zIndex,
                transform: [{ translateX }]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cloud: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});

export default FloatingClouds;
