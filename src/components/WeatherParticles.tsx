import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface WeatherParticlesProps {
  type: 'rain' | 'snow' | 'sun' | 'lightning';
  count?: number;
}

const WeatherParticles: React.FC<WeatherParticlesProps> = ({ 
  type = 'sun', 
  count = 15 
}) => {
  // Create particles based on weather type
  const createParticles = () => {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 20 + 10; // Random size between 10 and 30
      const startX = Math.random() * width;
      const startY = Math.random() * height * 0.5; // Start in top half of screen
      
      particles.push({
        id: i,
        size,
        x: startX,
        y: startY,
        opacity: Math.random() * 0.5 + 0.3, // Random opacity between 0.3 and 0.8
        speed: Math.random() * 10000 + 5000, // Random speed between 5000ms and 15000ms
      });
    }
    
    return particles;
  };
  
  const particles = useRef(createParticles()).current;
  const animations = useRef(particles.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    // Start animations for each particle
    animations.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: particles[index].speed,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);
  
  // Get particle image based on weather type
  const getParticleImage = () => {
    switch (type) {
      case 'rain':
        return 'https://cdn-icons-png.flaticon.com/512/3351/3351979.png';
      case 'snow':
        return 'https://cdn-icons-png.flaticon.com/512/642/642000.png';
      case 'sun':
        return 'https://cdn-icons-png.flaticon.com/512/740/740878.png';
      case 'lightning':
        return 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png';
      default:
        return 'https://cdn-icons-png.flaticon.com/512/740/740878.png';
    }
  };
  
  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => {
        // Different animation patterns based on weather type
        let animatedStyle;
        
        if (type === 'rain') {
          // Rain falls diagonally
          animatedStyle = {
            transform: [
              {
                translateY: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [particle.y, height + particle.size]
                })
              },
              {
                translateX: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [particle.x, particle.x + 100]
                })
              }
            ]
          };
        } else if (type === 'snow') {
          // Snow falls with swaying motion
          animatedStyle = {
            transform: [
              {
                translateY: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [particle.y, height + particle.size]
                })
              },
              {
                translateX: animations[index].interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [particle.x, particle.x + 20, particle.x, particle.x - 20, particle.x]
                })
              }
            ]
          };
        } else if (type === 'sun') {
          // Sun particles float and pulse
          animatedStyle = {
            transform: [
              {
                translateY: animations[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [particle.y, particle.y - 30, particle.y]
                })
              },
              {
                translateX: animations[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [particle.x, particle.x + 30, particle.x]
                })
              },
              {
                scale: animations[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 1]
                })
              }
            ],
            opacity: animations[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [particle.opacity, particle.opacity + 0.2, particle.opacity]
            })
          };
        } else if (type === 'lightning') {
          // Lightning flashes
          animatedStyle = {
            opacity: animations[index].interpolate({
              inputRange: [0, 0.1, 0.2, 0.3, 1],
              outputRange: [0, particle.opacity + 0.5, 0, particle.opacity + 0.3, 0]
            })
          };
        }
        
        return (
          <Animated.Image
            key={particle.id}
            source={{ uri: getParticleImage() }}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity,
              },
              animatedStyle
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
  particle: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});

export default WeatherParticles;
