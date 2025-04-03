import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Animated, 
  Easing,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Remove LottieView import and replace with a simpler animation approach

interface BetSuccessAnimationProps {
  visible: boolean;
  amount: number;
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const BetSuccessAnimation: React.FC<BetSuccessAnimationProps> = ({
  visible,
  amount,
  onAnimationComplete
}) => {
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);
  const coinAnims = Array(10).fill(0).map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
  }));

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      coinAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(0);
        anim.scale.setValue(0.5);
      });
      
      // Start animations
      Animated.sequence([
        // Fade in and scale up the success message
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        
        // Animate coins
        Animated.stagger(50, coinAnims.map((anim, index) => 
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1 + (Math.random() * 0.5),
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: (Math.random() * 2 - 1) * width * 0.5,
              duration: 1500,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: height * 0.5 * Math.random() - height * 0.2,
              duration: 1500,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: (Math.random() * 8 - 4) * Math.PI,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        )),
        
        // Keep visible for a moment
        Animated.delay(1500),
        
        // Fade out everything
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Feather name="check-circle" size={40} color="#10B981" />
        </View>
        <Text style={styles.title}>¡Apuesta Realizada!</Text>
        <Text style={styles.subtitle}>Ganancia potencial:</Text>
        <Text style={styles.amount}>{amount} monedas</Text>
        
        <View style={styles.authorContainer}>
          <Text style={styles.authorText}>By Carlos Freire</Text>
        </View>
      </Animated.View>

      {/* Animated coins */}
      {coinAnims.map((anim, index) => (
        <Animated.Image
          key={index}
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/272/272525.png' }}
          style={[
            styles.coin,
            {
              opacity: anim.opacity,
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { rotate: anim.rotate.interpolate({
                  inputRange: [0, 2 * Math.PI],
                  outputRange: ['0deg', '360deg']
                })},
                { scale: anim.scale }
              ]
            }
          ]}
        />
      ))}
      
      {/* Simple confetti animation instead of Lottie */}
      <View style={styles.confettiContainer}>
        {Array(20).fill(0).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const color = ['#FFD700', '#FF6B6B', '#4CAF50', '#3B82F6', '#9333EA'][Math.floor(Math.random() * 5)];
          const left = Math.random() * width;
          const animDuration = Math.random() * 3000 + 2000;
          const delay = Math.random() * 1000;
          
          const fallAnim = new Animated.Value(-20);
          const rotateAnim = new Animated.Value(0);
          
          Animated.timing(fallAnim, {
            toValue: height,
            duration: animDuration,
            delay,
            easing: Easing.linear,
            useNativeDriver: true
          }).start();
          
          Animated.timing(rotateAnim, {
            toValue: 10,
            duration: animDuration,
            delay,
            easing: Easing.linear,
            useNativeDriver: true
          }).start();
          
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left,
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: size / 2,
                transform: [
                  { translateY: fallAnim },
                  { rotate: rotateAnim.interpolate({
                    inputRange: [0, 10],
                    outputRange: ['0deg', '360deg']
                  })}
                ]
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1001,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    marginBottom: 16,
  },
  authorContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    width: '100%',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
  },
  coin: {
    position: 'absolute',
    width: 40,
    height: 40,
    zIndex: 1000,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
});

export default BetSuccessAnimation;
