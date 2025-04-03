import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
// Fix imports to work in Expo Snack
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { useApp } from '../context/AppContext';

type IntroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

const IntroScreen: React.FC = () => {
  const navigation = useNavigation<IntroScreenNavigationProp>();
  const { isAuthenticated } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonFadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Removed the automatic navigation to Main screen when authenticated
    // Now users must always press the "Comenzar" button
  }, []);
  
  const handleGetStarted = () => {
    // Navigate to the AuthStatus screen instead of directly to Main or Login
    navigation.navigate('AuthStatus');
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Meteo Málaga</Text>
          <Text style={styles.subtitle}>Predicción y Apuestas Meteorológicas</Text>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.featureItem}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png' }} 
              style={styles.featureIcon} 
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Predicciones Precisas</Text>
              <Text style={styles.featureDescription}>Datos meteorológicos en tiempo real</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png' }} 
              style={styles.featureIcon} 
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Apuestas Divertidas</Text>
              <Text style={styles.featureDescription}>Predice la lluvia, viento y temperatura y gana monedas!</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3094/3094918.png' }} 
              style={styles.featureIcon} 
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Compite con Amigos</Text>
              <Text style={styles.featureDescription}>Tabla de clasificación y premios</Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Comenzar</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>By Carlos Freire</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Arial',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Arial',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 4,
  },
});

export default IntroScreen;
