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
import BetSuccessAnimation from '../components/BetSuccessAnimation';
import BettingClock from '../components/BettingClock';
import TemperatureOnlyDisplay from '../components/TemperatureOnlyDisplay';
import EnhancedTemperatureSelector from '../components/EnhancedTemperatureSelector';

type TemperatureBettingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TemperatureBetting'>;

const TemperatureBettingScreen: React.FC = () => {
  const navigation = useNavigation<TemperatureBettingScreenNavigationProp>();
  const { coins, addBet, getWeatherForDate, userId, betMode, cancelBet, getCurrentTemperature, checkBettingAllowed, remainingTempBets } = useApp();
  
  // Shared state
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMinTemp, setIsMinTemp] = useState<boolean>(true);
  
  // Betting state
  const [ownCoins, setOwnCoins] = useState<string>('10');
  const [selectedTemp, setSelectedTemp] = useState<number>(20);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [potentialWin, setPotentialWin] = useState(0);
  const [resolutionDate, setResolutionDate] = useState<string>('');
  const [bettingAllowed, setBettingAllowed] = useState(true);
  const [currentTemperature, setCurrentTemperature] = useState<{min: number; max: number; current: number}>({
    min: 0,
    max: 0,
    current: 0
  });
  
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
    loadCurrentTemperature();
    checkBettingStatus();
    
    // Calculate resolution date (12h after current time for temperature bets)
    const now = new Date();
    const resolution = new Date(now);
    resolution.setHours(resolution.getHours() + 12);
    setResolutionDate(resolution.toISOString());
  }, []);

  const checkBettingStatus = async () => {
    const canBet = await checkBettingAllowed();
    setBettingAllowed(canBet);
  };

  useEffect(() => {
    // Calculate potential win whenever relevant values change
    const betCoins = parseInt(ownCoins, 10) || 0;
    
    // Calculate odds based on the temperature
    const odds = calculateOdds(selectedTemp);
    
    setPotentialWin(Math.round(betCoins * odds));
  }, [ownCoins, selectedTemp, isMinTemp]);

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
  
  const loadCurrentTemperature = async () => {
    try {
      const tempData = await getCurrentTemperature();
      setCurrentTemperature(tempData);
    } catch (error) {
      console.error('Error loading current temperature:', error);
    }
  };
  
  const handleTempSelect = (temp: number) => {
    setSelectedTemp(temp);
  };
  
  // Calculate odds based on the temperature and whether it's min or max
  const calculateOdds = (temp: number): number => {
    // Different odds calculation for min and max temperature
    if (isMinTemp) {
      if (temp < 0) return 50.0;  // Very cold for Málaga
      if (temp <= 5) return 20.0;
      if (temp <= 10) return 5.0;
      if (temp <= 15) return 2.5;
      if (temp <= 20) return 5.0;
      if (temp <= 25) return 20.0;
      return 50.0;  // Very hot minimum
    } else {
      // Max temperature odds
      if (temp < 10) return 50.0;  // Very cold max for Málaga
      if (temp <= 15) return 20.0;
      if (temp <= 20) return 5.0;
      if (temp <= 25) return 2.0;
      if (temp <= 30) return 2.5;
      if (temp <= 35) return 5.0;
      if (temp <= 40) return 20.0;
      return 50.0;  // Extremely hot
    }
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

    // Check temperature bet limits
    if (remainingTempBets <= 0) {
      Alert.alert('Error', 'Has alcanzado el límite de 2 apuestas de temperatura para hoy.');
      return;
    }

    setLoading(true);
    
    try {
      // Calcular la fecha de resolución (12 horas exactas después de la hora actual)
      const now = new Date();
      const resolutionTime = new Date(now);
      resolutionTime.setHours(resolutionTime.getHours() + 12);
      
      // Calculate odds based on the temperature
      const odds = calculateOdds(selectedTemp);
      
      const newBet: Bet = {
        date: new Date().toISOString().split('T')[0], // Usar fecha actual
        option: isMinTemp ? 'temp_min' : 'temp_max',
        value: selectedTemp,
        coins: own,
        leverage: odds,
        timestamp: now.toISOString(),
        resolution_date: resolutionTime.toISOString().split('T')[0],
        user_id: userId || 'anonymous',
        status: 'pending',
        mode: betMode,
        city: 'Málaga',
        bet_type: isMinTemp ? 'temp_min' : 'temp_max',
        bet_resolution_hours: 12
      };

      // Add specific fields based on bet type
      if (isMinTemp) {
        newBet.temp_min_c = selectedTemp;
      } else {
        newBet.temp_max_c = selectedTemp;
      }
      
      await addBet(newBet);
      
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
            <Text style={styles.headerTitle}>Apuestas de Temperatura 🌡️</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Temperature Only Display */}
            <TemperatureOnlyDisplay onRefresh={loadWeatherData} />

            {/* Temperature Info Banner */}
            <View style={styles.infoBanner}>
              <Feather name="clock" size={20} color="#FFFFFF" />
              <Text style={styles.infoText}>
                Las apuestas de temperatura se resuelven cada 12 horas
              </Text>
            </View>

            {/* Remaining Bets Banner */}
            <View style={styles.remainingBetsBanner}>
              <Feather name="alert-circle" size={20} color="#FFFFFF" />
              <Text style={styles.remainingBetsText}>
                Te quedan <Text style={styles.highlightText}>{remainingTempBets}</Text> apuestas de temperatura hoy
              </Text>
            </View>

            {/* Temperature Type Selector */}
            <View style={styles.tempTypeSelectorContainer}>
              <Text style={styles.tempSelectorTitle}>Tipo de temperatura 🌡️</Text>
              <View style={styles.tempTypeButtons}>
                <TouchableOpacity 
                  style={[
                    styles.tempTypeButton, 
                    isMinTemp && styles.selectedTempTypeButton
                  ]}
                  onPress={() => setIsMinTemp(true)}
                >
                  <Text style={styles.tempTypeButtonText}>Temperatura Mínima</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.tempTypeButton, 
                    !isMinTemp && styles.selectedTempTypeButton
                  ]}
                  onPress={() => setIsMinTemp(false)}
                >
                  <Text style={styles.tempTypeButtonText}>Temperatura Máxima</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Enhanced Temperature Selector */}
            <EnhancedTemperatureSelector
              initialValue={selectedTemp}
              onValueChange={handleTempSelect}
              isMin={isMinTemp}
              currentTemperature={isMinTemp ? currentTemperature.min : currentTemperature.max}
            />

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
                    Cuota: {calculateOdds(selectedTemp).toFixed(1)}x
                  </Text>
                </View>
                <Text style={styles.potentialWinValue}>
                  {potentialWin} monedas
                </Text>
              </View>

              {/* Resolution Time Banner */}
              <View style={styles.resolutionBanner}>
                <Feather name="clock" size={16} color="#FFFFFF" />
                <Text style={styles.resolutionText}>
                  Resolución: {new Date(resolutionDate).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} (12h)
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <GoldButton 
                  title={`Apostar Temperatura ${isMinTemp ? 'Mínima' : 'Máxima'} 🌡️`}
                  onPress={handleBet}
                  loading={loading}
                  disabled={parseInt(ownCoins, 10) < 10 || parseInt(ownCoins, 10) > coins || !bettingAllowed || remainingTempBets <= 0}
                  style={styles.placeBetButton}
                  icon="dollar-sign"
                />
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelBet}
                >
                  <Text style={styles.cancelButtonText}>Cancelar Apuesta ❌</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.authorContainer}>
              <Text style={styles.authorText}>By Carlos Freire</Text>
            </View>
          </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  remainingBetsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  remainingBetsText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  tempTypeSelectorContainer: {
    marginBottom: 8,
  },
  tempSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tempTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tempTypeButton: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedTempTypeButton: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  tempTypeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
  resolutionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  resolutionText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
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
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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

export default TemperatureBettingScreen;
