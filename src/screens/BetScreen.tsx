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
  Image,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { GradientBackground } from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import GoldButton from '../components/GoldButton';
import { useApp } from '../context/AppContext';
import DatePicker from '../components/DatePicker';
import { Bet, BetOption } from '../types/weather';

type BetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BetScreen'>;

interface BetScreenRouteProp {
  params: {
    country: string;
    countryName: string;
  }
}

const leverageOptions = ['1x', '2x', '5x', '10x', '20x', '50x', '100x'];

const BetScreen: React.FC = () => {
  const navigation = useNavigation<BetScreenNavigationProp>();
  const route = useRoute<BetScreenRouteProp>();
  const { country, countryName } = route.params;
  const { coins, addBet, getWeatherForDate } = useApp();
  
  const [selectedOption, setSelectedOption] = useState<'Yes' | 'No' | 'Tornado' | null>(null);
  const [ownCoins, setOwnCoins] = useState<string>('10');
  const [leverage, setLeverage] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  
  // Animation values
  const bonusAnim = new Animated.Value(-50);
  const fadeAnim = new Animated.Value(0);
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(bonusAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    loadWeatherData();
  }, [selectedDate]);

  const loadWeatherData = async () => {
    try {
      const data = await getWeatherForDate(selectedDate);
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };
  
  const calculateApuestaTotal = (own: number, lev: number) => own * lev;
  const calculateLoan = (own: number, lev: number) => (own * lev) - own;
  
  const handleBet = async () => {
    // Validations: minimum 10 coins for Yes and No, 10 fixed for Tornado.
    const own = parseInt(ownCoins, 10);
    if ((selectedOption === 'Yes' || selectedOption === 'No') && own < 10) {
      Alert.alert('Error', 'Debes apostar al menos 10 monedas.');
      return;
    }
    if (selectedOption === 'Tornado' && own !== 10) {
      Alert.alert('Error', 'La apuesta de Tornado son 10 monedas fijas.');
      return;
    }
    if (own > coins) {
      Alert.alert('Error', 'No tienes suficientes monedas para esta apuesta.');
      return;
    }

    setLoading(true);
    
    try {
      const apuestaTotal = calculateApuestaTotal(own, leverage);
      const prestamo = calculateLoan(own, leverage);
      
      // Map the UI option to the BetOption type
      let betOption: BetOption;
      if (selectedOption === 'Yes') {
        betOption = 'rain_yes';
      } else if (selectedOption === 'No') {
        betOption = 'rain_no';
      } else {
        betOption = 'lightning';
      }
      
      const newBet: Bet = {
        date: selectedDate,
        option: betOption,
        value: selectedOption === 'Tornado' ? 1 : null,
        coins: own,
        leverage: leverage,
        timestamp: new Date().toISOString(),
      };
      
      await addBet(newBet);
      
      // Show success message
      Alert.alert(
        '¡Apuesta Realizada!', 
        `Tu apuesta para ${countryName} ha sido registrada con éxito.\n\nApuesta Total: ${apuestaTotal} monedas\nPréstamo: ${prestamo} monedas\n\n¡Buena suerte!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error placing bet:', error);
      Alert.alert('Error', 'Hubo un problema al realizar tu apuesta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <GradientBackground colors={['#87CEEB', '#FFFFFF']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#00008B" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Image 
              source={{ uri: `https://flagpedia.net/data/flags/w160/${country}.png` }}
              style={styles.flag}
            />
            <Text style={styles.headerTitle}>Apuestas en {countryName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <Animated.View 
          style={[
            styles.dateContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: bonusAnim }]
            }
          ]}
        >
          <DatePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            label="Fecha seleccionada:"
          />
        </Animated.View>

        <View style={styles.weatherPreview}>
          {weatherData && (
            <View style={styles.weatherPreviewContent}>
              <Feather 
                name={weatherData.hasRain ? "cloud-rain" : "sun"} 
                size={30} 
                color="#00008B" 
              />
              <View style={styles.weatherPreviewInfo}>
                <Text style={styles.weatherPreviewTemp}>
                  {Math.round((weatherData.tempMin + weatherData.tempMax) / 2)}°C
                </Text>
                <Text style={styles.weatherPreviewDesc}>
                  {weatherData.hasRain ? 'Lluvia' : 'Despejado'} • 
                  {weatherData.rainChance.toFixed(0)}% prob.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionButton, selectedOption === 'Yes' && styles.selectedOption]}
            onPress={() => setSelectedOption('Yes')}
          >
            <Feather name="cloud-rain" size={20} color="#FFFFFF" />
            <Text style={styles.optionText}>Sí, lloverá</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, selectedOption === 'No' && styles.selectedOption]}
            onPress={() => setSelectedOption('No')}
          >
            <Feather name="sun" size={20} color="#FFFFFF" />
            <Text style={styles.optionText}>No, no lloverá</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, selectedOption === 'Tornado' && styles.selectedOption]}
            onPress={() => setSelectedOption('Tornado')}
          >
            <Feather name="zap" size={20} color="#FFFFFF" />
            <Text style={styles.optionText}>Tormenta Relámpago</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {selectedOption === 'Tornado' ? 'Apuesta fija: 10 monedas' : 'Monedas Propias (mín. 10)'}
          </Text>
          {selectedOption !== 'Tornado' && (
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={ownCoins}
              onChangeText={setOwnCoins}
            />
          )}
        </View>

        {selectedOption !== 'Tornado' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nivel de Apalancamiento</Text>
            <View style={styles.leverageContainer}>
              {leverageOptions.map((option, index) => {
                // Parse the string option: remove 'x'
                const lev = parseInt(option.replace('x',''), 10);
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.leverageOption, 
                      leverage === lev && styles.selectedLeverage
                    ]}
                    onPress={() => setLeverage(lev)}
                  >
                    <Text style={[
                      styles.leverageText,
                      leverage === lev && styles.selectedLeverageText
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.potentialWinContainer}>
          <Text style={styles.potentialWinLabel}>Ganancia potencial:</Text>
          <Text style={styles.potentialWinValue}>
            {parseInt(ownCoins || '0', 10) * leverage} monedas
          </Text>
        </View>

        <GoldButton 
          title="Realizar Apuesta"
          onPress={handleBet}
          loading={loading}
          disabled={!selectedOption}
        />

        {/* Bonus: animación de moneda cayendo */}
        <View style={styles.bonusContainer}>
          <Text style={styles.bonusLabel}>Bonus diario +5 monedas</Text>
          <Animated.Text style={[styles.bonusCoin, { transform: [{ translateY: bonusAnim }] }]}>
            🪙
          </Animated.Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    paddingBottom: 40 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: Platform.OS === 'ios' ? 40 : 20, 
    marginBottom: 20 
  },
  backButton: { 
    padding: 8 
  },
  headerTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  flag: { 
    width: 30, 
    height: 20, 
    marginRight: 10 
  },
  headerTitle: { 
    fontFamily: 'Arial', 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#00008B' 
  },
  placeholder: { 
    width: 40 
  },
  dateContainer: {
    marginBottom: 15,
  },
  weatherPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 139, 0.3)',
  },
  weatherPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherPreviewInfo: {
    marginLeft: 12,
  },
  weatherPreviewTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00008B',
  },
  weatherPreviewDesc: {
    fontSize: 14,
    color: '#00008B',
  },
  optionsContainer: { 
    flexDirection: 'column', 
    justifyContent: 'space-around', 
    marginBottom: 20, 
    width: '100%',
    gap: 10
  },
  optionButton: { 
    backgroundColor: '#00008B', 
    paddingVertical: 15, 
    paddingHorizontal: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedOption: { 
    borderColor: '#FFD700', 
    borderWidth: 2 
  },
  optionText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  inputGroup: { 
    width: '100%', 
    marginBottom: 20 
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#00008B', 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    padding: 10, 
    width: 100, 
    textAlign: 'center', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 139, 0.3)',
  },
  leverageContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  leverageOption: { 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderRadius: 8, 
    padding: 10, 
    width: '30%', 
    alignItems: 'center', 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 139, 0.3)',
  },
  selectedLeverage: { 
    borderColor: '#FFD700', 
    borderWidth: 2, 
    backgroundColor: 'rgba(255, 215, 0, 0.2)' 
  },
  leverageText: { 
    fontSize: 16, 
    color: '#00008B', 
    fontWeight: 'bold' 
  },
  selectedLeverageText: { 
    color: '#00008B' 
  },
  potentialWinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  potentialWinLabel: {
    color: '#00008B',
    fontWeight: 'bold',
  },
  potentialWinValue: {
    color: '#00008B',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bonusContainer: { 
    alignItems: 'center', 
    marginTop: 20 
  },
  bonusLabel: { 
    fontSize: 16, 
    color: '#00008B', 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  bonusCoin: { 
    fontSize: 30 
  }
});

export default BetScreen;
