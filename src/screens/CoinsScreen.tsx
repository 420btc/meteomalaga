import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import GradientBackground from '../components/GradientBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

type CoinsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Coins'>;

// Key for storing the last collection time
const LAST_COLLECTION_KEY = 'last_coins_collection_time';
// Amount of coins to collect
const DAILY_COINS_AMOUNT = 10;
// Cooldown period in milliseconds (24 hours)
const COLLECTION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const CoinsScreen: React.FC = () => {
  const navigation = useNavigation<CoinsScreenNavigationProp>();
  const { coins, addCoins, language } = useApp();
  const [canCollect, setCanCollect] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isCollecting, setIsCollecting] = useState(false);
  
  // Animation values
  const coinScale = new Animated.Value(1);
  const coinRotate = new Animated.Value(0);
  const collectButtonScale = new Animated.Value(1);
  
  useEffect(() => {
    checkCollectionStatus();
    
    // Start coin animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinScale, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(coinRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Set up timer to update countdown
    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const checkCollectionStatus = async () => {
    try {
      const lastCollectionTime = await AsyncStorage.getItem(LAST_COLLECTION_KEY);
      
      if (!lastCollectionTime) {
        // First time or never collected before
        setCanCollect(true);
        return;
      }
      
      const lastCollection = parseInt(lastCollectionTime, 10);
      const now = Date.now();
      const timePassed = now - lastCollection;
      
      if (timePassed >= COLLECTION_COOLDOWN) {
        setCanCollect(true);
      } else {
        setCanCollect(false);
        updateTimeRemaining();
      }
    } catch (error) {
      console.error('Error checking collection status:', error);
      setCanCollect(false);
    }
  };
  
  const updateTimeRemaining = async () => {
    try {
      const lastCollectionTime = await AsyncStorage.getItem(LAST_COLLECTION_KEY);
      
      if (!lastCollectionTime) {
        setCanCollect(true);
        return;
      }
      
      const lastCollection = parseInt(lastCollectionTime, 10);
      const now = Date.now();
      const timePassed = now - lastCollection;
      
      if (timePassed >= COLLECTION_COOLDOWN) {
        setCanCollect(true);
        setTimeRemaining('');
      } else {
        const timeLeft = COLLECTION_COOLDOWN - timePassed;
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        
        setCanCollect(false);
      }
    } catch (error) {
      console.error('Error updating time remaining:', error);
    }
  };
  
  const collectCoins = async () => {
    if (!canCollect || isCollecting) return;
    
    setIsCollecting(true);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(collectButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(collectButtonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(collectButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      // Add coins to user's balance
      await addCoins(DAILY_COINS_AMOUNT);
      
      // Update last collection time
      await AsyncStorage.setItem(LAST_COLLECTION_KEY, Date.now().toString());
      
      // Update UI
      setCanCollect(false);
      updateTimeRemaining();
      
      // Show success message
      Alert.alert(
        language === 'es' ? '¡Monedas Recogidas!' : 'Coins Collected!',
        language === 'es' 
          ? `Has recogido ${DAILY_COINS_AMOUNT} monedas. Vuelve mañana para recoger más.` 
          : `You've collected ${DAILY_COINS_AMOUNT} coins. Come back tomorrow to collect more.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error collecting coins:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' 
          ? 'No se pudieron recoger las monedas. Inténtalo de nuevo.' 
          : 'Could not collect coins. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCollecting(false);
    }
  };
  
  const rotation = coinRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'es' ? 'Monedas Diarias' : 'Daily Coins'}
            </Text>
            <View style={styles.coinsContainer}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/272/272525.png' }}
                style={styles.coinIcon}
              />
              <Text style={styles.coinsText}>{coins}</Text>
            </View>
          </View>
          
          {/* Main content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {language === 'es' ? 'Recolección Diaria' : 'Daily Collection'}
            </Text>
            
            <Animated.View
              style={[
                styles.coinImageContainer,
                {
                  transform: [
                    { scale: coinScale },
                    { rotateY: rotation }
                  ]
                }
              ]}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/272/272525.png' }}
                style={styles.largeCoinImage}
              />
              <Text style={styles.coinAmount}>+{DAILY_COINS_AMOUNT}</Text>
            </Animated.View>
            
            {canCollect ? (
              <Animated.View
                style={{
                  transform: [{ scale: collectButtonScale }]
                }}
              >
                <TouchableOpacity
                  style={[styles.collectButton, isCollecting && styles.collectButtonDisabled]}
                  onPress={collectCoins}
                  disabled={isCollecting}
                >
                  <Text style={styles.collectButtonText}>
                    {language === 'es' ? 'RECOGER MONEDAS' : 'COLLECT COINS'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>
                  {language === 'es' ? 'Próxima recolección en:' : 'Next collection in:'}
                </Text>
                <Text style={styles.timerText}>{timeRemaining}</Text>
                <Text style={styles.timerHint}>
                  {language === 'es' 
                    ? 'Vuelve mañana para recoger más monedas' 
                    : 'Come back tomorrow to collect more coins'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Info section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>
              {language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
            </Text>
            <Text style={styles.infoText}>
              {language === 'es' 
                ? `• Recoge ${DAILY_COINS_AMOUNT} monedas gratis cada 24 horas\n• Usa tus monedas para realizar apuestas\n• Gana más monedas acertando tus predicciones` 
                : `• Collect ${DAILY_COINS_AMOUNT} free coins every 24 hours\n• Use your coins to place bets\n• Win more coins by making correct predictions`}
            </Text>
          </View>
          
          {/* Back button at the bottom */}
          <TouchableOpacity
            style={styles.bottomBackButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>
              {language === 'es' ? 'Volver' : 'Back'}
            </Text>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  coinImageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  largeCoinImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  coinAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  collectButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  collectButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  collectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 10,
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CoinsScreen;
