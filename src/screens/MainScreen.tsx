import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import GradientBackground from '../components/GradientBackground';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PlantButton from '../components/PlantButton'; // Import the new PlantButton component
import { Feather } from '@expo/vector-icons';

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const { width } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { coins, language } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Animation for breathing effect on play button
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const coinPulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start breathing animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Subtle rotation animation for dynamic feel
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Coin pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinPulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(coinPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Actualizar la hora actual inmediatamente
    setCurrentTime(new Date());

    // Actualizar la hora cada minuto para refrescar el saludo si es necesario
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60000 ms = 1 minuto

    return () => clearInterval(intervalId);
  }, []);
  
  // Navigation function
  const navigateToScreen = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  /**
   * Determina el saludo apropiado según la hora actual y el idioma seleccionado
   * 
   * Franjas horarias:
   * - 5:00-11:59: Buenos días / Good morning
   * - 12:00-17:59: Buenas tardes / Good afternoon
   * - 18:00-21:59: Buenas noches / Good evening
   * - 22:00-4:59: Buenas noches / Good night
   */
  const getGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return language === 'es' ? '☀️ Buenos días' : '☀️ Good morning';
    } else if (hour >= 12 && hour < 18) {
      return language === 'es' ? '🌤️ Buenas tardes' : '🌤️ Good afternoon';
    } else if (hour >= 18 && hour < 22) {
      return language === 'es' ? '🌆 Buenas noches' : '🌆 Good evening';
    } else {
      return language === 'es' ? '🌙 Buenas noches' : '🌙 Good night';
    }
  };

  // Rotation interpolation for subtle UI movement
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1deg', '1deg']
  });

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header with logo and coins */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.coinsContainer}
              onPress={() => navigateToScreen('Coins')}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: coinPulseAnim }] }}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/272/272525.png' }}
                  style={styles.coinIcon}
                />
              </Animated.View>
              <Text style={styles.coinsText}>{coins}</Text>
            </TouchableOpacity>
            <View style={styles.headerRightContainer}>
              <PlantButton style={styles.plantButton} />
              <LanguageSwitcher />
            </View>
          </View>

          {/* Logo section - moved below header and enlarged */}
          <Animated.View 
            style={[
              styles.logoContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png' }}
              style={styles.logo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Meteo Málaga</Text>
              <Text style={styles.subtitle}>{getGreeting()}</Text>
            </View>
          </Animated.View>

          {/* Main menu grid - moved up to leave space for additional buttons */}
          <Animated.View 
            style={[
              styles.menuGrid,
              {
                opacity: fadeAnim
              }
            ]}
          >
            {/* Main JUGAR button with breathing animation */}
            <Animated.View
              style={{
                transform: [
                  { scale: breathingAnim },
                  { rotate: rotation }
                ],
                shadowOpacity: breathingAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: [0.3, 0.5]
                })
              }}
            >
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => navigateToScreen('CombinedBet')}
                accessibilityLabel={language === 'es' ? "Botón para jugar" : "Play button"}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <View style={styles.playButtonContent}>
                  <Text style={styles.playButtonText}>
                    {language === 'es' ? '🎮 JUGAR' : '🎮 PLAY'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Other menu options in a 2x2 grid */}
            <View style={styles.optionsGrid}>
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(59, 130, 246, 0.8)' }]}
                  onPress={() => navigateToScreen('LiveCameras')}
                  accessibilityLabel={language === 'es' ? "Cámaras en vivo" : "Live cameras"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '📹 Cámaras' : '📹 Cameras'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(236, 72, 153, 0.8)' }]}
                  onPress={() => navigateToScreen('Profile')}
                  accessibilityLabel={language === 'es' ? "Perfil de usuario" : "User profile"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '👤 Perfil' : '👤 Profile'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(245, 158, 11, 0.8)' }]}
                  onPress={() => navigateToScreen('Leaderboard')}
                  accessibilityLabel={language === 'es' ? "Ranking de jugadores" : "Players ranking"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '🏆 Ranking' : '🏆 Ranking'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(16, 185, 129, 0.8)' }]}
                  onPress={() => navigateToScreen('BetHistory')}
                  accessibilityLabel={language === 'es' ? "Historial de apuestas" : "Bet history"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '📊 Historial' : '📊 History'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* New buttons: Historical Weather and Alerts */}
            <View style={styles.additionalButtonsContainer}>
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(168, 85, 247, 0.8)' }]} // Purple color
                  onPress={() => navigateToScreen('RainHistory')}
                  accessibilityLabel={language === 'es' ? "Clima histórico" : "Historical Weather"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '📅 Clima Histórico' : '📅 Historical Weather'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]} // Red color
                  onPress={() => navigateToScreen('WeatherAlerts')} // Updated to navigate to WeatherAlerts
                  accessibilityLabel={language === 'es' ? "Alertas" : "Alerts"}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuButtonText}>
                    {language === 'es' ? '⚠️ Alertas' : '⚠️ Alerts'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
          
          <View style={styles.footer}>
            {/* Footer buttons */}
            <View style={styles.footerButtonsContainer}>
              {/* How to Play button - simplified to just a question mark */}
              <TouchableOpacity 
                style={styles.howToPlayButton}
                onPress={() => navigateToScreen('Rules')}
                accessibilityLabel={language === 'es' ? "Cómo jugar" : "How to play"}
                accessibilityRole="button"
              >
                <Text style={styles.questionMarkText}>?</Text>
              </TouchableOpacity>
            </View>
            
            {/* Restructured credits */}
            <Text style={styles.creditText}>Made By Carlos Freire</Text>
            <Text style={styles.bfloatText}>Bfloat</Text>
            <Text style={styles.footerText}>v1.0.0</Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantButton: {
    marginRight: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15, // Reducido de 20 a 15 para acercar todo el conjunto
  },
  logo: {
    width: 125, // Aumentado de 100 a 125 (25% más grande)
    height: 125, // Aumentado de 100 a 125 (25% más grande)
    marginBottom: 5, // Reducido de 10 a 5 para acercar el logo al texto
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  coinsText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuGrid: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  playButton: {
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    overflow: 'hidden',
  },
  playButtonContent: {
    width: '100%',
    height: 100, // Reduced from 120 to 100
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 0, 0.7)', // Yellow color
    borderRadius: 15,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 34,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: (width - 50) / 2,
    height: (width - 50) / 4,
    borderRadius: 15,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Increased shadow offset
    shadowOpacity: 0.4, // Increased from 0.2 to 0.4
    shadowRadius: 6, // Increased from 3 to 6
    elevation: 8, // Increased from 3 to 8
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Increased shadow opacity
    textShadowOffset: { width: 2, height: 2 }, // Increased shadow offset
    textShadowRadius: 4, // Increased from 2 to 4
  },
  // Container for additional buttons
  additionalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  howToPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  questionMarkText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  creditText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bfloatText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});

export default MainScreen;
