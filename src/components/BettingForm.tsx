import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DatePicker from './DatePicker';
import { useApp } from '../context/AppContext';
import { Bet, BetOption } from '../types/weather';
import GoldButton from './GoldButton';
import { getRemainingTemperatureBets } from '../services/localBetService';
import { isBettingAllowed, getRemainingRainBets, resetAllBetCounters } from '../services/localSupabaseService';
import { 
  getRainOdds, 
  getTemperatureOdds, 
  getWindOdds, 
  getCurrentSeason, 
  getSeasonalBettingDescription,
  getRainYesOdds,
  getRainNoOdds
} from '../services/oddsService';

interface BettingFormProps {
  selectedDate: string;
}

const BettingForm: React.FC<BettingFormProps> = ({ selectedDate }) => {
  const { addBet, coins, getWeatherForDate } = useApp();
  const [selectedOption, setSelectedOption] = useState<BetOption | null>(null);
  const [betValue, setBetValue] = useState<string>('');
  const [betCoins, setBetCoins] = useState<string>('10');
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [remainingTempBets, setRemainingTempBets] = useState<number>(2);
  const [remainingRainBets, setRemainingRainBets] = useState<number>(3);
  const [isProMode, setIsProMode] = useState<boolean>(false);
  const [bettingAllowed, setBettingAllowed] = useState<boolean>(true);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [betSubmissionTime, setLastBetTime] = useState<number | null>(null);
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState<number>(new Date().getMinutes());
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugTaps, setDebugTaps] = useState<number>(0);

  const MIN_BET_INTERVAL = 3000; // 3 seconds

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadWeatherData();
    checkBettingAllowed();
    formatDate();
    checkRemainingTempBets();
    checkRemainingRainBets();
    setCurrentSeason(getCurrentSeason());
    
    // Actualizar la hora actual cada minuto para refrescar el estado de las apuestas
    const timeInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      if (hour !== currentHour || minute !== currentMinute) {
        setCurrentHour(hour);
        setCurrentMinute(minute);
        checkBettingAllowed(); // Verificar si las apuestas están permitidas cuando cambia la hora
        checkRemainingRainBets(); // Verificar las apuestas restantes cuando cambia la hora
      }
    }, 10000); // Verificar cada 10 segundos
    
    return () => {
      clearInterval(timeInterval);
    };
  }, [selectedDate]);

  // Efecto adicional para verificar si las apuestas están permitidas cuando cambia la hora
  useEffect(() => {
    checkBettingAllowed();
    checkRemainingRainBets();
  }, [currentHour, currentMinute, selectedOption]);

  const loadWeatherData = async () => {
    try {
      const data = await getWeatherForDate(selectedDate);
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };

  const checkBettingAllowed = async () => {
    try {
      console.log('Verificando si las apuestas están permitidas...');
      const allowed = await isBettingAllowed(selectedOption || undefined);
      console.log('Apuestas permitidas:', allowed);
      setBettingAllowed(allowed);
    } catch (error) {
      console.error('Error checking if betting is allowed:', error);
      setBettingAllowed(false);
    }
  };

  const checkRemainingTempBets = async () => {
    try {
      const remaining = await getRemainingTemperatureBets();
      setRemainingTempBets(remaining);
    } catch (error) {
      console.error('Error checking remaining temperature bets:', error);
      setRemainingTempBets(0);
    }
  };

  const checkRemainingRainBets = async () => {
    try {
      const remaining = await getRemainingRainBets();
      console.log('Remaining rain bets:', remaining);
      setRemainingRainBets(remaining);
    } catch (error) {
      console.error('Error checking remaining rain bets:', error);
      setRemainingRainBets(0);
    }
  };

  const formatDate = () => {
    const date = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setFormattedDate(date.toLocaleDateString('es-ES', options));
  };

  // New calculation: if the value is <=0, use getRainOdds(0) explicitly.
  const calculateOdds = (): number => {
    if (!selectedOption) return 1;

    if (selectedOption === 'rain_amount') {
      const value = parseFloat(betValue);
      if (isNaN(value) || value <= 0) {
        return getRainOdds(0);
      } else {
        return getRainOdds(value);
      }
    } else if (selectedOption === 'temp_min' || selectedOption === 'temp_max') {
      const value = parseFloat(betValue);
      return isNaN(value) ? 1 : getTemperatureOdds(value);
    } else if (selectedOption === 'wind_max') {
      const value = parseFloat(betValue);
      return isNaN(value) ? 1 : getWindOdds(value);
    } else if (selectedOption === 'rain_yes') {
      return getRainYesOdds();
    } else if (selectedOption === 'rain_no') {
      return getRainNoOdds();
    }
    return 1;
  };

  const calculatePotentialWinnings = (): number => {
    const odds = calculateOdds();
    const coins = parseInt(betCoins) || 0;
    return Math.floor(coins * odds);
  };

  const handleOptionSelect = (option: BetOption) => {
    setSelectedOption(option);
    if (option === 'rain_amount') {
      setBetValue('0');
    } else {
      setBetValue('');
    }
    checkBettingAllowed();
  };

  const handleBetSubmit = async () => {
    try {
      const now = Date.now();
      if (betSubmissionTime && now - betSubmissionTime < MIN_BET_INTERVAL) {
        Alert.alert('Demasiado rápido', 'Por favor, espera unos segundos antes de realizar otra apuesta.');
        return;
      }
      if (!selectedOption) {
        Alert.alert('Error', 'Por favor, selecciona una opción de apuesta.');
        return;
      }
      if (['rain_amount', 'temp_min', 'temp_max', 'wind_max'].includes(selectedOption) && !betValue) {
        Alert.alert('Error', 'Por favor, introduce un valor para tu apuesta.');
        return;
      }
      const coinsAmount = parseInt(betCoins);
      if (isNaN(coinsAmount) || coinsAmount < 10 || coinsAmount > 1000) {
        Alert.alert('Error', 'La cantidad de monedas debe estar entre 10 y 1000.');
        return;
      }
      if (coinsAmount > coins) {
        Alert.alert('Error', 'No tienes suficientes monedas para esta apuesta.');
        return;
      }
      const isRainBet = selectedOption === 'rain_yes' || selectedOption === 'rain_no' || selectedOption === 'rain_amount';
      const isTempBet = selectedOption === 'temp_min' || selectedOption === 'temp_max';
      
      // Verificar nuevamente si las apuestas están permitidas justo antes de enviar
      if (isRainBet) {
        const allowed = await isBettingAllowed('rain');
        if (!allowed) {
          Alert.alert('Apuestas no disponibles', 'No se pueden realizar apuestas en este momento.');
          return;
        }
        if (remainingRainBets <= 0) {
          Alert.alert('Límite alcanzado', 'Has alcanzado el límite de 3 apuestas de lluvia para esta ventana de tiempo.');
          return;
        }
      }
      if (isTempBet && remainingTempBets <= 0) {
        Alert.alert('Límite alcanzado', 'Has alcanzado el límite de 2 apuestas de temperatura para hoy.');
        return;
      }
      
      setLoading(true);
      const betData: Partial<Bet> = {
        option: selectedOption,
        coins: coinsAmount,
        date: selectedDate,
        timestamp: new Date().toISOString(),
        mode: isProMode ? 'Pro' : 'Simple',
      };
      if (selectedOption === 'rain_amount') {
        betData.rain_mm = parseFloat(betValue);
        betData.value = parseFloat(betValue);
      } else if (selectedOption === 'temp_min') {
        betData.temp_min_c = parseFloat(betValue);
        betData.value = parseFloat(betValue);
      } else if (selectedOption === 'temp_max') {
        betData.temp_max_c = parseFloat(betValue);
        betData.value = parseFloat(betValue);
      } else if (selectedOption === 'wind_max') {
        betData.wind_kmh_max = parseFloat(betValue);
        betData.value = parseFloat(betValue);
      }
      const result = await addBet(betData as Bet);
      if (result) {
        setLastBetTime(Date.now());
        setSelectedOption(null);
        setBetValue('');
        setBetCoins('10');
        if (isTempBet) {
          setRemainingTempBets(prev => Math.max(0, prev - 1));
        }
        if (isRainBet) {
          setRemainingRainBets(prev => Math.max(0, prev - 1));
        }
        Alert.alert('¡Apuesta realizada!', 'Tu apuesta ha sido registrada correctamente. Podrás ver el resultado en tu historial de apuestas.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error submitting bet:', error);
      Alert.alert('Error', error.message || 'Ha ocurrido un error al realizar la apuesta.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCounters = async () => {
    try {
      await resetAllBetCounters();
      Alert.alert('Contadores reiniciados', 'Todos los contadores de apuestas han sido reiniciados.');
      checkRemainingTempBets();
      checkRemainingRainBets();
      checkBettingAllowed();
    } catch (error) {
      console.error('Error resetting counters:', error);
      Alert.alert('Error', 'Ha ocurrido un error al reiniciar los contadores.');
    }
  };

  const handleTitlePress = () => {
    // Activar modo debug después de 5 toques rápidos
    setDebugTaps(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setDebugMode(true);
        return 0;
      }
      // Resetear el contador después de 3 segundos
      setTimeout(() => setDebugTaps(0), 3000);
      return newCount;
    });
  };

  const renderBetOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Tipo de Apuesta:</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'rain_yes' && styles.selectedOption,
              !bettingAllowed && styles.disabledOption
            ]}
            onPress={() => handleOptionSelect('rain_yes')}
            disabled={!bettingAllowed || remainingRainBets <= 0}
          >
            <Text style={styles.optionText}>Lloverá</Text>
            <Text style={styles.optionEmoji}>🌧️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'rain_no' && styles.selectedOption,
              !bettingAllowed && styles.disabledOption
            ]}
            onPress={() => handleOptionSelect('rain_no')}
            disabled={!bettingAllowed || remainingRainBets <= 0}
          >
            <Text style={styles.optionText}>No lloverá</Text>
            <Text style={styles.optionEmoji}>☀️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'rain_amount' && styles.selectedOption,
              !bettingAllowed && styles.disabledOption
            ]}
            onPress={() => handleOptionSelect('rain_amount')}
            disabled={!bettingAllowed || remainingRainBets <= 0}
          >
            <Text style={styles.optionText}>Cantidad lluvia</Text>
            <Text style={styles.optionEmoji}>💧</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'temp_min' && styles.selectedOption,
              remainingTempBets <= 0 && styles.disabledOption
            ]}
            onPress={() => handleOptionSelect('temp_min')}
            disabled={remainingTempBets <= 0}
          >
            <Text style={styles.optionText}>Temp. mínima</Text>
            <Text style={styles.optionEmoji}>❄️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'temp_max' && styles.selectedOption,
              remainingTempBets <= 0 && styles.disabledOption
            ]}
            onPress={() => handleOptionSelect('temp_max')}
            disabled={remainingTempBets <= 0}
          >
            <Text style={styles.optionText}>Temp. máxima</Text>
            <Text style={styles.optionEmoji}>🔥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'wind_max' && styles.selectedOption
            ]}
            onPress={() => handleOptionSelect('wind_max')}
          >
            <Text style={styles.optionText}>Viento máx.</Text>
            <Text style={styles.optionEmoji}>💨</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.remainingBetsContainer}>
          {selectedOption && ['rain_yes', 'rain_no', 'rain_amount'].includes(selectedOption) && (
            <View style={styles.remainingBetsItem}>
              <Text style={styles.remainingBetsText}>
                Apuestas de lluvia restantes: <Text style={styles.remainingBetsCount}>{remainingRainBets}/3</Text>
              </Text>
            </View>
          )}
          {selectedOption && ['temp_min', 'temp_max'].includes(selectedOption) && (
            <View style={styles.remainingBetsItem}>
              <Text style={styles.remainingBetsText}>
                Apuestas de temperatura restantes: <Text style={styles.remainingBetsCount}>{remainingTempBets}/2</Text>
              </Text>
            </View>
          )}
          {selectedOption && ['wind_max'].includes(selectedOption) && (
            <View style={styles.remainingBetsItem}>
              <Text style={styles.remainingBetsText}>
                Puedes realizar hasta 2 apuestas de viento cada 12 horas
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBetValueInput = () => {
    if (!selectedOption) return null;
    if (selectedOption === 'rain_yes' || selectedOption === 'rain_no') return null;
    
    let placeholder = '';
    let keyboardType: 'numeric' | 'decimal-pad' = 'decimal-pad';
    let label = '';
    let unit = '';
    
    if (selectedOption === 'rain_amount') {
      placeholder = '0.0';
      label = 'Cantidad de lluvia';
      unit = 'mm';
    } else if (selectedOption === 'temp_min' || selectedOption === 'temp_max') {
      placeholder = '20.0';
      label = selectedOption === 'temp_min' ? 'Temperatura mínima' : 'Temperatura máxima';
      unit = '°C';
    } else if (selectedOption === 'wind_max') {
      placeholder = '10.0';
      label = 'Velocidad máxima del viento';
      unit = 'km/h';
    }
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}:</Text>
        <View style={styles.valueInputContainer}>
          <TextInput
            style={styles.valueInput}
            placeholder={placeholder}
            value={betValue}
            onChangeText={setBetValue}
            keyboardType={keyboardType}
          />
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      </View>
    );
  };

  const renderCoinsInput = () => {
    if (!selectedOption) return null;
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Monedas a apostar:</Text>
        <View style={styles.coinsInputContainer}>
          <TextInput
            style={styles.coinsInput}
            placeholder="10"
            value={betCoins}
            onChangeText={setBetCoins}
            keyboardType="numeric"
          />
          <Text style={styles.coinsIcon}>🪙</Text>
        </View>
        <View style={styles.quickCoinsContainer}>
          {[10, 50, 100, 500].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickCoinsButton}
              onPress={() => setBetCoins(amount.toString())}
            >
              <Text style={styles.quickCoinsText}>{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderOddsDisplay = () => {
    if (!selectedOption) return null;
    
    if ((selectedOption === 'rain_yes' || selectedOption === 'rain_no') || 
       (selectedOption !== 'rain_yes' && selectedOption !== 'rain_no' && betValue)) {
      const odds = calculateOdds();
      const potentialWinnings = calculatePotentialWinnings();
      
      return (
        <View style={styles.oddsContainer}>
          <Text style={styles.oddsTitle}>Cuota y Ganancias Potenciales:</Text>
          <View style={styles.oddsRow}>
            <Text style={styles.oddsLabel}>Cuota:</Text>
            <Text style={styles.oddsValue}>{odds.toFixed(2)}x</Text>
          </View>
          <View style={styles.oddsRow}>
            <Text style={styles.oddsLabel}>Ganancias potenciales:</Text>
            <Text style={styles.oddsValue}>{potentialWinnings} 🪙</Text>
          </View>
          <Text style={styles.seasonInfo}>{getSeasonalBettingDescription()}</Text>
        </View>
      );
    }
    return null;
  };

  const renderProModeToggle = () => {
    if (!selectedOption) return null;
    
    return (
      <View style={styles.proModeContainer}>
        <Text style={styles.proModeLabel}>Modo Pro:</Text>
        <Switch
          value={isProMode}
          onValueChange={setIsProMode}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={isProMode ? '#fff' : '#f4f3f4'}
        />
        <Text style={styles.proModeDescription}>
          El modo Pro permite apuestas con márgenes más estrechos y mayores ganancias.
        </Text>
      </View>
    );
  };

  const renderSubmitButton = () => {
    if (!selectedOption) return null;
    
    const isRainBet = selectedOption === 'rain_yes' || selectedOption === 'rain_no' || selectedOption === 'rain_amount';
    const isTempBet = selectedOption === 'temp_min' || selectedOption === 'temp_max';
    
    const isDisabled = 
      loading || 
      (isRainBet && (!bettingAllowed || remainingRainBets <= 0)) ||
      (isTempBet && remainingTempBets <= 0) ||
      (parseInt(betCoins) > coins) ||
      (parseInt(betCoins) < 10) ||
      (parseInt(betCoins) > 1000) ||
      (['rain_amount', 'temp_min', 'temp_max', 'wind_max'].includes(selectedOption) && !betValue);
    
    return (
      <View style={styles.submitContainer}>
        <GoldButton
          title="Realizar Apuesta"
          onPress={handleBetSubmit}
          loading={loading}
          disabled={isDisabled}
        />
      </View>
    );
  };

  const renderDebugInfo = () => {
    if (!debugMode) return null;
    
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Modo Debug</Text>
        <Text style={styles.debugText}>Hora actual: {currentHour}:{currentMinute < 10 ? '0' + currentMinute : currentMinute}</Text>
        <Text style={styles.debugText}>Apuestas permitidas: {bettingAllowed ? 'Sí' : 'No'}</Text>
        <Text style={styles.debugText}>Apuestas de lluvia restantes: {remainingRainBets}</Text>
        <Text style={styles.debugText}>Apuestas de temperatura restantes: {remainingTempBets}</Text>
        
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={handleResetCounters}
        >
          <Text style={styles.debugButtonText}>Reiniciar contadores</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => setDebugMode(false)}
        >
          <Text style={styles.debugButtonText}>Cerrar modo debug</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Fecha seleccionada:</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Feather name="calendar" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {showCalendar && (
        <DatePicker
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            setShowCalendar(false);
          }}
        />
      )}
      
      <TouchableOpacity onPress={handleTitlePress} activeOpacity={1}>
        <View style={styles.seasonContainer}>
          <Text style={styles.seasonText}>
            Estación actual: <Text style={styles.seasonName}>{currentSeason}</Text>
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.timeInfoContainer}>
        <Text style={styles.timeInfoText}>
          Hora actual: <Text style={styles.timeInfoValue}>{currentHour}:{currentMinute < 10 ? '0' + currentMinute : currentMinute}</Text>
        </Text>
        <Text style={styles.timeInfoText}>
          Apuestas de lluvia restantes: <Text style={styles.timeInfoValue}>{remainingRainBets}/3</Text>
        </Text>
      </View>
      
      {renderDebugInfo()}
      {renderBetOptions()}
      {renderBetValueInput()}
      {renderCoinsInput()}
      {renderOddsDisplay()}
      {renderProModeToggle()}
      {renderSubmitButton()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  dateContainer: { marginBottom: 20 },
  dateLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8, padding: 12 },
  dateText: { fontSize: 16, color: '#FFFFFF' },
  seasonContainer: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, padding: 10, marginBottom: 16 },
  seasonText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
  seasonName: { fontWeight: 'bold', color: '#FFD700' },
  timeInfoContainer: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, padding: 10, marginBottom: 16 },
  timeInfoText: { color: '#FFFFFF', fontSize: 14, marginBottom: 4 },
  timeInfoValue: { fontWeight: 'bold', color: '#FFD700' },
  timeInfoValueDisabled: { color: '#FF6347' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  optionsContainer: { marginBottom: 20 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionButton: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center' },
  selectedOption: { backgroundColor: 'rgba(255, 215, 0, 0.3)', borderWidth: 2, borderColor: '#FFD700' },
  disabledOption: { opacity: 0.5 },
  optionText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  optionEmoji: { fontSize: 24 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  valueInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 8, paddingHorizontal: 12 },
  valueInput: { flex: 1, height: 50, fontSize: 18, color: '#333333' },
  unitText: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  coinsInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 8, paddingHorizontal: 12 },
  coinsInput: { flex: 1, height: 50, fontSize: 18, color: '#333333' },
  coinsIcon: { fontSize: 20 },
  quickCoinsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  quickCoinsButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, paddingVertical: 6, paddingHorizontal: 12 },
  quickCoinsText: { color: '#FFFFFF', fontWeight: 'bold' },
  oddsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, padding: 12, marginBottom: 20 },
  oddsTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  oddsLabel: { color: '#FFFFFF', fontSize: 14 },
  oddsValue: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  seasonInfo: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  proModeContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, padding: 12 },
  proModeLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginRight: 12 },
  proModeDescription: { fontSize: 14, color: '#FFFFFF', marginTop: 8, width: '100%' },
  submitContainer: { marginBottom: 20 },
  warningContainer: { backgroundColor: 'rgba(255, 87, 34, 0.2)', borderRadius: 8, padding: 12, marginBottom: 20 },
  warningText: { color: '#FFFFFF', textAlign: 'center' },
  remainingBetsContainer: { marginTop: 8, marginBottom: 16 },
  remainingBetsItem: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, padding: 10, marginBottom: 8 },
  remainingBetsText: { color: '#FFFFFF', fontSize: 14 },
  remainingBetsCount: { fontWeight: 'bold', color: '#FFD700' },
  debugContainer: { backgroundColor: 'rgba(255, 0, 0, 0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  debugTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  debugText: { color: '#FFFFFF', fontSize: 14, marginBottom: 4 },
  debugButton: { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8, padding: 10, marginTop: 8 },
  debugButtonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: 'bold' }
});

export default BettingForm;
