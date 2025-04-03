import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import DatePicker from '../components/DatePicker';
import { useApp } from '../context/AppContext';

type RainPredictionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RainPrediction'>;

interface PredictionRange {
  min: number;
  max: number;
  probability: number;
  odds: number;
}

const RainPredictionScreen: React.FC = () => {
  const navigation = useNavigation<RainPredictionScreenNavigationProp>();
  const { getWeatherForDate } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [predictionRanges, setPredictionRanges] = useState<PredictionRange[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Animate the content appearance
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
  }, [selectedDate]);

  const loadWeatherData = async () => {
    try {
      const data = await getWeatherForDate(selectedDate);
      setWeatherData(data);
      
      // Generate prediction ranges based on the weather data
      generatePredictionRanges(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };

  const generatePredictionRanges = (data: any) => {
    if (!data) return;
    
    const rainChance = data.rainChance;
    const ranges: PredictionRange[] = [];
    
    // No rain (0mm)
    const noRainProb = 100 - rainChance;
    ranges.push({
      min: 0,
      max: 0,
      probability: noRainProb,
      odds: calculateOdds(noRainProb)
    });
    
    // Light rain (0.1-5mm)
    const lightRainProb = rainChance * 0.5;
    ranges.push({
      min: 0.1,
      max: 5,
      probability: lightRainProb,
      odds: calculateOdds(lightRainProb)
    });
    
    // Moderate rain (5.1-15mm)
    const modRainProb = rainChance * 0.3;
    ranges.push({
      min: 5.1,
      max: 15,
      probability: modRainProb,
      odds: calculateOdds(modRainProb)
    });
    
    // Heavy rain (15.1-30mm)
    const heavyRainProb = rainChance * 0.15;
    ranges.push({
      min: 15.1,
      max: 30,
      probability: heavyRainProb,
      odds: calculateOdds(heavyRainProb)
    });
    
    // Extreme rain (>30mm)
    const extremeRainProb = rainChance * 0.05;
    ranges.push({
      min: 30.1,
      max: 100,
      probability: extremeRainProb,
      odds: calculateOdds(extremeRainProb)
    });
    
    setPredictionRanges(ranges);
  };

  const calculateOdds = (probability: number) => {
    // Convert probability to odds (e.g., 25% probability = 4.0 odds)
    if (probability <= 0) return 100;
    return parseFloat((100 / probability).toFixed(1));
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const navigateToBetting = () => {
    navigation.navigate('Betting');
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Predicción de Lluvia</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View 
          style={[
            styles.dateContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.dateLabel}>Fecha seleccionada:</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Text>
            <Feather name="calendar" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {showCalendar && (
            <DatePicker
              date={selectedDate}
              onDateChange={handleDateChange}
              label=""
            />
          )}
        </Animated.View>

        <ScrollView style={styles.content}>
          {weatherData && (
            <View style={styles.weatherSummary}>
              <View style={styles.weatherIconContainer}>
                <Feather 
                  name={weatherData.hasRain ? "cloud-rain" : "sun"} 
                  size={40} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherTemp}>
                  {Math.round((weatherData.tempMin + weatherData.tempMax) / 2)}°C
                </Text>
                <Text style={styles.weatherDesc}>
                  {weatherData.hasRain ? 'Probabilidad de lluvia' : 'Mayormente despejado'}
                </Text>
                <View style={styles.rainChanceContainer}>
                  <View style={[styles.rainChanceBar, { width: `${weatherData.rainChance}%` }]} />
                  <Text style={styles.rainChanceText}>{weatherData.rainChance.toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Predicción por Rangos</Text>
          <Text style={styles.sectionSubtitle}>
            Probabilidad de lluvia por cantidad en milímetros
          </Text>

          {predictionRanges.map((range, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.predictionRangeItem,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(index + 1)) }]
                }
              ]}
            >
              <View style={styles.rangeInfo}>
                <Text style={styles.rangeLabel}>
                  {range.min === 0 && range.max === 0 
                    ? 'Sin lluvia' 
                    : range.min === 30.1 
                      ? `Más de ${range.min.toFixed(1)}mm`
                      : `${range.min.toFixed(1)}-${range.max.toFixed(1)}mm`}
                </Text>
                <Text style={styles.rangeProbability}>{range.probability.toFixed(1)}%</Text>
              </View>
              
              <View style={styles.oddsContainer}>
                <Text style={styles.oddsLabel}>Cuota</Text>
                <Text style={styles.oddsValue}>{range.odds}x</Text>
              </View>
              
              <View style={styles.probabilityBarContainer}>
                <View 
                  style={[
                    styles.probabilityBar, 
                    { 
                      width: `${range.probability}%`,
                      backgroundColor: index === 0 
                        ? '#10B981' 
                        : index === 1 
                          ? '#3B82F6' 
                          : index === 2 
                            ? '#6366F1' 
                            : index === 3 
                              ? '#8B5CF6' 
                              : '#EF4444'
                    }
                  ]} 
                />
              </View>
            </Animated.View>
          ))}

          <TouchableOpacity 
            style={styles.betButton}
            onPress={navigateToBetting}
          >
            <Feather name="dollar-sign" size={20} color="#FFFFFF" />
            <Text style={styles.betButtonText}>Realizar Apuesta</Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
            <Text style={styles.infoText}>
              Las predicciones se basan en datos históricos y modelos meteorológicos. 
              Las cuotas se calculan en función de la probabilidad de cada rango de lluvia.
              Cuanto menor sea la probabilidad, mayor será la cuota y el potencial premio.
            </Text>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Consejos para Apostar</Text>
            
            <View style={styles.tipItem}>
              <Feather name="trending-up" size={16} color="#3B82F6" />
              <Text style={styles.tipText}>
                Consulta el historial de lluvias para identificar patrones.
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Feather name="eye" size={16} color="#3B82F6" />
              <Text style={styles.tipText}>
                Observa las cámaras en vivo para ver las condiciones actuales.
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Feather name="map" size={16} color="#3B82F6" />
              <Text style={styles.tipText}>
                Revisa el mapa meteorológico para ver los sistemas de lluvia cercanos.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  dateContainer: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  weatherSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  weatherIconContainer: {
    marginRight: 15,
    justifyContent: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  weatherDesc: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  rainChanceContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  rainChanceBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  rainChanceText: {
    fontSize: 12,
    color: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 15,
  },
  predictionRangeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  rangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  rangeProbability: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  oddsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  oddsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  oddsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  probabilityBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  probabilityBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  betButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  betButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
});

export default RainPredictionScreen;
