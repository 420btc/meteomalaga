import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import GradientBackground from '../components/GradientBackground';
import WindSpeedSelector from '../components/WindSpeedSelector';
import WindSpeedDisplay from '../components/WindSpeedDisplay';
import GoldButton from '../components/GoldButton';
import { getWindOdds, getRemainingWindBets } from '../services/localSupabaseService';

type WindBettingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WindBetting'>;

const WindBettingScreen: React.FC = () => {
  const navigation = useNavigation<WindBettingScreenNavigationProp>();
  const { addBet, coins, cancelBet } = useApp();
  
  const [selectedSpeed, setSelectedSpeed] = useState<number>(15);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [loading, setLoading] = useState<boolean>(false);
  const [odds, setOdds] = useState<number>(3.0);
  const [remainingBets, setRemainingBets] = useState<number>(2);
  
  useEffect(() => {
    // Calculate odds based on selected wind speed
    const calculatedOdds = getWindOdds(selectedSpeed);
    setOdds(calculatedOdds);
    
    // Check remaining bets
    checkRemainingBets();
  }, [selectedSpeed]);
  
  const checkRemainingBets = async () => {
    try {
      const remaining = await getRemainingWindBets();
      setRemainingBets(remaining);
    } catch (error) {
      console.error('Error checking remaining wind bets:', error);
      setRemainingBets(0);
    }
  };
  
  const handleSpeedChange = (speed: number) => {
    setSelectedSpeed(speed);
  };
  
  const handleBetAmountChange = (amount: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(amount)) {
      setBetAmount(amount);
    }
  };
  
  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };
  
  const handlePlaceBet = async () => {
    try {
      // Validate bet amount
      const amount = parseInt(betAmount);
      if (isNaN(amount) || amount < 10 || amount > 1000) {
        Alert.alert('Error', 'La cantidad apostada debe estar entre 10 y 1000 monedas.');
        return;
      }
      
      if (amount > coins) {
        Alert.alert('Error', 'No tienes suficientes monedas para esta apuesta.');
        return;
      }
      
      // Check if user has remaining bets
      if (remainingBets <= 0) {
        Alert.alert('Límite alcanzado', 'Has alcanzado el límite de 2 apuestas de viento cada 12 horas.');
        return;
      }
      
      setLoading(true);
      
      // Create bet object
      const bet = {
        option: 'wind_max',
        value: selectedSpeed,
        wind_kmh_max: selectedSpeed,
        coins: amount,
        leverage: 1,
        mode: 'Simple',
        bet_type: 'wind',
        bet_resolution_hours: 12
      };
      
      // Add bet
      const result = await addBet(bet);
      
      if (result) {
        // Update remaining bets
        setRemainingBets(prev => Math.max(0, prev - 1));
        
        Alert.alert(
          '¡Apuesta realizada!',
          `Has apostado ${amount} monedas a que la velocidad máxima del viento será de ${selectedSpeed} km/h en las próximas 12 horas.`,
          [
            { 
              text: 'Ver historial', 
              onPress: () => navigation.navigate('BetHistory') 
            },
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error placing wind bet:', error);
      Alert.alert('Error', error.message || 'Ha ocurrido un error al realizar la apuesta.');
    } finally {
      setLoading(false);
    }
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
  
  const potentialWinnings = parseInt(betAmount) * odds || 0;
  
  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Apuesta de Viento</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Wind Speed Display with emphasized current speed */}
            <WindSpeedDisplay />
            
            <View style={styles.selectorContainer}>
              <Text style={styles.sectionTitle}>Selecciona la velocidad del viento:</Text>
              <WindSpeedSelector 
                value={selectedSpeed}
                onChange={handleSpeedChange}
                min={0}
                max={100}
                step={1}
              />
            </View>
            
            <View style={styles.betContainer}>
              <Text style={styles.sectionTitle}>Cantidad a apostar:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={betAmount}
                  onChangeText={handleBetAmountChange}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#999"
                />
                <Text style={styles.coinIcon}>🪙</Text>
              </View>
              
              <View style={styles.quickAmountsContainer}>
                {[10, 50, 100, 500].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => handleQuickAmount(amount)}
                  >
                    <Text style={styles.quickAmountText}>{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.oddsContainer}>
              <View style={styles.oddsRow}>
                <Text style={styles.oddsLabel}>Cuota:</Text>
                <Text style={styles.oddsValue}>{odds.toFixed(2)}x</Text>
              </View>
              <View style={styles.oddsRow}>
                <Text style={styles.oddsLabel}>Posible ganancia:</Text>
                <Text style={styles.winningsValue}>{potentialWinnings.toFixed(0)} 🪙</Text>
              </View>
            </View>
            
            {/* Remaining bets banner */}
            <View style={styles.remainingBetsContainer}>
              <Text style={styles.remainingBetsText}>
                Apuestas restantes: <Text style={styles.remainingBetsCount}>{remainingBets}/2</Text>
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <GoldButton
                title="Realizar Apuesta"
                onPress={handlePlaceBet}
                loading={loading}
                disabled={loading || remainingBets <= 0 || parseInt(betAmount) > coins || parseInt(betAmount) < 10}
              />
              
              {/* Cancel bet button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBet}
              >
                <Text style={styles.cancelButtonText}>Cancelar Apuesta ❌</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                Las apuestas de viento se resuelven automáticamente 12 horas después de realizarlas.
              </Text>
              <Text style={styles.disclaimerText}>
                Puedes realizar hasta 2 apuestas de viento cada 12 horas.
              </Text>
            </View>
          </ScrollView>
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
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  betContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: '#333333',
  },
  coinIcon: {
    fontSize: 20,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  oddsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  oddsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  oddsValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  winningsValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remainingBetsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  remainingBetsText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  remainingBetsCount: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disclaimerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  disclaimerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default WindBettingScreen;
