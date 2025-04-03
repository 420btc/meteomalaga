import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Platform, 
  Animated, 
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import GoldButton from '../components/GoldButton';
import { useApp } from '../context/AppContext';
import { Bet } from '../types/weather';
import RainAmountSelector from '../components/RainAmountSelector';
import CurrentWeatherDisplay from '../components/CurrentWeatherDisplay';
import BetSuccessAnimation from '../components/BetSuccessAnimation';
import BettingClock from '../components/BettingClock';
import WeatherInfoPage from '../components/WeatherInfoPage';

type CombinedBetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CombinedBet'>;

const CombinedBetScreen: React.FC = () => {
  const navigation = useNavigation<CombinedBetScreenNavigationProp>();
  const { coins, addBet, getWeatherForDate, userId, betMode, cancelBet, getCurrentRainAmount, checkBettingAllowed } = useApp();
  
  // Shared state
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prediction' | 'info'>('prediction');
  
  // Betting state
  const [ownCoins, setOwnCoins] = useState<string>('10');
  const [rainAmount, setRainAmount] = useState<number>(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [potentialWin, setPotentialWin] = useState(0);
  const [resolutionDate, setResolutionDate] = useState<string>('');
  const [bettingAllowed, setBettingAllowed] = useState(false);
  const [currentRainAmount, setCurrentRainAmount] = useState<number>(0);
  const [hasPendingBet, setHasPendingBet] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    loadWeatherData();
    loadCurrentRainAmount();
    checkBettingStatus();
    
    // Calculate resolution date (24h after current time)
    const now = new Date();
    const resolution = new Date(now);
    resolution.setHours(resolution.getHours() + 24);
    setResolutionDate(resolution.toISOString());
  }, []);

  const checkBettingStatus = async () => {
    const canBet = await checkBettingAllowed();
    setBettingAllowed(canBet);
  };

  useEffect(() => {
    // Calculate potential win whenever relevant values change
    const betCoins = parseInt(ownCoins, 10) || 0;
    
    // Calculate odds based on the difference between predicted and current rain amount
    const odds = calculateOdds(rainAmount, currentRainAmount);
    
    setPotentialWin(Math.round(betCoins * odds));
  }, [ownCoins, rainAmount, currentRainAmount]);

  const loadWeatherData = async () => {
    try {
      // Siempre usar la fecha actual para obtener datos del clima
      const today = new Date().toISOString().split('T')[0];
      const data = await getWeatherForDate(today);
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };
  
  const loadCurrentRainAmount = async () => {
    try {
      const amount = await getCurrentRainAmount();
      setCurrentRainAmount(amount);
    } catch (error) {
      console.error('Error loading current rain amount:', error);
    }
  };
  
  const handleRainAmountChange = (amount: number) => {
    setRainAmount(amount);
  };
  
  // Calculate odds based on the difference between predicted and current rain amount
  const calculateOdds = (predictedAmount: number, currentAmount: number): number => {
    // Base odds calculation
    let odds = 2;
    
    // If predicting extreme values, increase odds dramatically
    if (predictedAmount > 100) {
      // Exponential increase for high predictions
      const excessAmount = predictedAmount - 100;
      odds = 5 + (excessAmount * 0.5);
      
      // For very high predictions (>500mm), increase odds even more dramatically
      if (predictedAmount > 500) {
        odds = 250 + (predictedAmount - 500) * 1.5;
      }
    } else if (predictedAmount === 0 && currentAmount > 0) {
      // Predicting no rain when there is rain currently
      odds = 3 + (currentAmount * 0.5);
    } else {
      // Standard calculation for moderate predictions
      const diff = Math.abs(predictedAmount - currentAmount);
      
      if (diff === 0) {
        // Exact match with current amount
        odds = 2;
      } else if (diff <= 5) {
        // Close to current amount
        odds = 3;
      } else if (diff <= 20) {
        // Moderate difference
        odds = 5 + (diff * 0.2);
      } else {
        // Large difference
        odds = 10 + (diff * 0.3);
      }
    }
    
    // Cap the odds at a reasonable maximum for UI display
    return Math.min(Math.max(odds, 1.1), 1000);
  };
  
  const handleBet = async () => {
    if (!bettingAllowed) {
      Alert.alert(
        'Apuestas cerradas',
        'Las apuestas están cerradas hasta las 23:00 CET. Vuelve más tarde para realizar tu apuesta.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const own = parseInt(ownCoins, 10);
    if (own < 10) {
      Alert.alert('Error', 'Debes apostar al menos 10 monedas.');
      return;
    }
    
    if (own > coins) {
      Alert.alert('Error', 'No tienes suficientes monedas para esta apuesta.');
      return;
    }

    setLoading(true);
    
    try {
      // Calcular la fecha de resolución (24 horas exactas después de la hora actual)
      const now = new Date();
      const resolutionTime = new Date(now);
      resolutionTime.setHours(resolutionTime.getHours() + 24);
      
      // Calculate odds based on the difference between predicted and current rain amount
      const odds = calculateOdds(rainAmount, currentRainAmount);
      
      const newBet: Bet = {
        date: new Date().toISOString().split('T')[0], // Usar fecha actual
        option: 'rain_amount',
        value: rainAmount,
        coins: own,
        leverage: odds, // Use calculated odds instead of fixed leverage
        timestamp: now.toISOString(),
        resolution_date: resolutionTime.toISOString().split('T')[0],
        user_id: userId || 'anonymous',
        status: 'pending',
        mode: betMode,
        city: 'Málaga',
        rain_mm: rainAmount
      };
      
      await addBet(newBet);
      
      // Indicar que hay una apuesta pendiente
      setHasPendingBet(true);
      
      // Show success animation
      setShowSuccessAnimation(true);
    } catch (error) {
      console.error('Error placing bet:', error);
      Alert.alert('Error ❌', 'Hubo un problema al realizar tu apuesta. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    setLoading(false);
    navigation.goBack();
  };

  const handleCancelBet = async () => {
    try {
      await cancelBet();
      setHasPendingBet(false);
      Alert.alert(
        'Apuesta Cancelada ✅',
        'Tu apuesta ha sido cancelada exitosamente.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error canceling bet:', error);
      Alert.alert('Error ❌', 'Hubo un problema al cancelar tu apuesta. Inténtalo de nuevo.');
    }
  };

  const handleCountdownComplete = () => {
    setBettingAllowed(true);
  };

  const navigateToTemperatureBetting = () => {
    navigation.navigate('TemperatureBetting');
  };
  
  const navigateToWindBetting = () => {
    // Navegar a la pantalla de apuestas de viento
    navigation.navigate('WindBetting');
  };
  
  const navigateToCharts = () => {
    navigation.navigate('Charts');
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Predicción y Apuestas 🎲</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Tab selector */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'prediction' && styles.activeTabButton]}
              onPress={() => setActiveTab('prediction')}
              accessibilityLabel="Ver predicciones"
              accessibilityRole="tab"
            >
              <Text style={[styles.tabButtonText, activeTab === 'prediction' && styles.activeTabButtonText]}>
                Predicción 🌧️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]}
              onPress={() => setActiveTab('info')}
              accessibilityLabel="Ver información meteorológica"
              accessibilityRole="tab"
            >
              <Text style={[styles.tabButtonText, activeTab === 'info' && styles.activeTabButtonText]}>
                +Info 📊
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'prediction' ? (
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Current Weather Display */}
              <CurrentWeatherDisplay onRefresh={loadWeatherData} />
              
              {/* Button Container for Temperature and Wind */}
              <View style={styles.specialButtonsRow}>
                {/* Temperature Betting Button */}
                <TouchableOpacity 
                  style={styles.temperatureBettingButton}
                  onPress={navigateToTemperatureBetting}
                >
                  <View style={styles.specialButtonContent}>
                    <Feather name="thermometer" size={20} color="#FFFFFF" style={styles.specialButtonIcon} />
                    <View style={styles.specialButtonTextContainer}>
                      <Text style={styles.temperatureBettingTitle}>Apuestas de Temperatura 🌡️</Text>
                      <Text style={styles.specialButtonSubtitle}>¡Resolución cada 12 horas!</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* Wind Betting Button - Usando directamente la función de navegación */}
                <TouchableOpacity 
                  style={styles.windBettingButton}
                  onPress={() => {
                    console.log("Navegando a WindBetting");
                    navigation.navigate("WindBetting");
                  }}
                >
                  <View style={styles.specialButtonContent}>
                    <Feather name="wind" size={20} color="#333" style={styles.specialButtonIcon} />
                    <View style={styles.specialButtonTextContainer}>
                      <Text style={styles.windBettingTitle}>Apuestas de Viento 💨</Text>
                      <Text style={styles.specialButtonSubtitle}>¡Resolución cada 12 horas!</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Charts Button */}
              <TouchableOpacity 
                style={styles.chartsButton}
                onPress={navigateToCharts}
              >
                <View style={styles.chartsButtonContent}>
                  <View style={styles.chartsButtonIcon}>
                    <Feather name="bar-chart-2" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.chartsButtonTextContainer}>
                    <Text style={styles.chartsButtonTitle}>Gráficas Meteorológicas 📊</Text>
                    <Text style={styles.chartsButtonSubtitle}>Ver datos históricos</Text>
                  </View>
                  <Feather name="chevron-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Rain Amount Selector */}
              <View style={styles.rainSelectorContainer}>
                <Text style={styles.rainSelectorTitle}>Predice la cantidad de lluvia (mm) 💧</Text>
                <Text style={styles.rainSelectorSubtitle}>
                  Selecciona los milímetros de lluvia que crees que caerán
                </Text>
                <RainAmountSelector 
                  initialValue={rainAmount}
                  onValueChange={handleRainAmountChange}
                  rainChance={weatherData?.rainChance || 0}
                  currentRainAmount={currentRainAmount}
                />
              </View>

              {/* Betting Options */}
              <View style={styles.bettingContainer}>
                <Text style={styles.bettingTitle}>Configura tu apuesta 💸</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monedas (mín. 10) 🪙</Text>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    value={ownCoins}
                    onChangeText={setOwnCoins}
                    accessibilityLabel="Cantidad de monedas para apostar"
                    accessibilityHint="Introduce un número mínimo de 10"
                  />
                  <Text style={styles.availableCoins}>Disponibles: {coins} monedas</Text>
                </View>

                <View style={styles.potentialWinContainer}>
                  <View>
                    <Text style={styles.potentialWinLabel}>Ganancia potencial: 💎</Text>
                    <Text style={styles.oddsExplanation}>
                      Cuota: {calculateOdds(rainAmount, currentRainAmount).toFixed(1)}x
                    </Text>
                  </View>
                  <Text style={styles.potentialWinValue}>
                    {potentialWin} monedas
                  </Text>
                </View>

                {/* Betting Clock Banner */}
                <BettingClock onCountdownComplete={handleCountdownComplete} />

                <View style={styles.betButtonContainer}>
                  <GoldButton 
                    title="Realizar Apuesta 🎰"
                    onPress={handleBet}
                    loading={loading}
                    disabled={parseInt(ownCoins, 10) < 10 || parseInt(ownCoins, 10) > coins || !bettingAllowed || hasPendingBet}
                    style={styles.placeBetButton}
                    icon="dollar-sign"
                  />
                  
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      !hasPendingBet && styles.disabledCancelButton
                    ]}
                    onPress={handleCancelBet}
                    disabled={!hasPendingBet}
                  >
                    <Text style={[
                      styles.cancelButtonText,
                      !hasPendingBet && styles.disabledCancelButtonText
                    ]}>Cancelar Apuesta ❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.authorContainer}>
                <Text style={styles.authorText}>By Carlos Freire</Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.infoContainer}>
              <WeatherInfoPage onRefresh={loadWeatherData} />
            </View>
          )}
        </View>
      </SafeAreaView>
      
      {/* Success Animation */}
      <BetSuccessAnimation 
        visible={showSuccessAnimation} 
        amount={potentialWin}
        onAnimationComplete={handleAnimationComplete}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { 
    flex: 1,
    padding: 12,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: Platform.OS === 'ios' ? 0 : 5, 
    marginBottom: 5
  },
  backButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontFamily: 'Arial', 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  placeholder: { 
    width: 36 
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  specialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  temperatureBettingButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderRadius: 10,
    width: '48.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.9)',
  },
  windBettingButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: '48.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E6C200',
  },
  specialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    height: 60,
  },
  specialButtonIcon: {
    marginRight: 6,
  },
  specialButtonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  temperatureBettingTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  windBettingTitle: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  specialButtonSubtitle: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  chartsButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.9)',
  },
  chartsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  chartsButtonIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartsButtonTextContainer: {
    flex: 1,
  },
  chartsButtonTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chartsButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  rainSelectorContainer: {
    marginBottom: 8,
  },
  rainSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rainSelectorSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  bettingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginTop: 0,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bettingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputGroup: { 
    width: '100%', 
    marginBottom: 10
  },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    marginBottom: 4
  },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    padding: 8, 
    width: 100, 
    textAlign: 'center', 
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  availableCoins: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  potentialWinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  potentialWinLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  oddsExplanation: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  potentialWinValue: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  betButtonContainer: {
    marginBottom: 6,
  },
  placeBetButton: {
    marginBottom: 8,
    backgroundColor: '#FFD700',
    borderColor: '#E6C200',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledCancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledCancelButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  authorContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  authorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default CombinedBetScreen;
