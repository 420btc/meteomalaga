import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import GradientBackground from '../components/GradientBackground';
import { fetchHourlyHistoricalData, clearWeatherCache } from '../services/weatherService';

const WindChartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language } = useApp();
  const [loading, setLoading] = useState(true);
  const [windData, setWindData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'12h' | '24h'>('24h');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('api');

  useEffect(() => {
    loadWindData();
  }, [timeRange]);

  const loadWindData = async () => {
    setLoading(true);
    try {
      // Limpiar caché para obtener datos frescos
      await clearWeatherCache();
      
      // Get real historical data from OpenWeather API
      const hours = timeRange === '24h' ? 24 : 12;
      const { windData: apiWindData, labels: apiLabels } = await fetchHourlyHistoricalData(hours);
      
      setWindData(apiWindData);
      setLabels(apiLabels);
      setDataSource('api');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading wind chart data:', error);
      setDataSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadWindData();
  };

  // Format the last updated time
  const getLastUpdatedText = () => {
    const formattedTime = lastUpdated.toLocaleTimeString(
      language === 'es' ? 'es-ES' : 'en-US', 
      { hour: '2-digit', minute: '2-digit' }
    );
    
    return language === 'es' 
      ? `Última actualización: ${formattedTime}`
      : `Last updated: ${formattedTime}`;
  };

  // Calculate min and max wind speed for display
  const getMinMaxWind = () => {
    if (windData.length === 0) return { min: 0, max: 0 };
    
    const min = Math.min(...windData);
    const max = Math.max(...windData);
    
    return { min, max };
  };

  const { min, max } = getMinMaxWind();

  // Get wind speed category
  const getWindCategory = (speed: number) => {
    if (speed < 5) return language === 'es' ? 'Calma' : 'Calm';
    if (speed < 12) return language === 'es' ? 'Brisa suave' : 'Light breeze';
    if (speed < 20) return language === 'es' ? 'Brisa moderada' : 'Moderate breeze';
    if (speed < 30) return language === 'es' ? 'Viento fuerte' : 'Strong wind';
    if (speed < 40) return language === 'es' ? 'Viento muy fuerte' : 'Very strong wind';
    return language === 'es' ? 'Temporal' : 'Storm';
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            accessibilityLabel={language === 'es' ? "Volver atrás" : "Go back"}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'es' ? 'Historial de Viento' : 'Wind History'}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            accessibilityLabel={language === 'es' ? "Actualizar datos" : "Refresh data"}
          >
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              timeRange === '12h' && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange('12h')}
            accessibilityLabel={language === 'es' ? "Ver últimas 12 horas" : "View last 12 hours"}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === '12h' && styles.timeRangeTextActive
            ]}>
              {language === 'es' ? '12 horas' : '12 hours'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              timeRange === '24h' && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange('24h')}
            accessibilityLabel={language === 'es' ? "Ver últimas 24 horas" : "View last 24 hours"}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === '24h' && styles.timeRangeTextActive
            ]}>
              {language === 'es' ? '24 horas' : '24 hours'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.chartTitle}>
                {language === 'es' 
                  ? `Velocidad del viento últimas ${timeRange === '24h' ? '24' : '12'} horas (km/h)`
                  : `Wind speed last ${timeRange === '24h' ? '24' : '12'} hours (km/h)`}
              </Text>
              
              <LineChart
                data={{
                  labels: labels,
                  datasets: [
                    {
                      data: windData.length > 0 ? windData : [0],
                      color: (opacity = 1) => `rgba(135, 206, 250, ${opacity})`, // LightSkyBlue color for wind
                      strokeWidth: 2
                    }
                  ]
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: 'rgba(26, 106, 178, 0.8)',
                  backgroundGradientFrom: 'rgba(26, 106, 178, 0.8)',
                  backgroundGradientTo: 'rgba(20, 72, 140, 0.8)',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#4682B4' // SteelBlue
                  },
                  propsForLabels: {
                    fontSize: 10
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
                fromZero={true}
                segments={5}
              />
              
              <View style={styles.minMaxContainer}>
                <View style={styles.minMaxItem}>
                  <Feather name="arrow-down" size={16} color="#80d8ff" />
                  <Text style={styles.minMaxText}>
                    {language === 'es' ? 'Mín: ' : 'Min: '}{min} km/h
                  </Text>
                </View>
                <View style={styles.minMaxItem}>
                  <Feather name="arrow-up" size={16} color="#80d8ff" />
                  <Text style={styles.minMaxText}>
                    {language === 'es' ? 'Máx: ' : 'Max: '}{max} km/h
                  </Text>
                </View>
              </View>
              
              <View style={styles.windCategoryContainer}>
                <Feather name="wind" size={16} color="#FFFFFF" />
                <Text style={styles.windCategoryText}>
                  {language === 'es' ? 'Categoría actual: ' : 'Current category: '}
                  {getWindCategory(windData[windData.length - 1])}
                </Text>
              </View>
              
              <View style={styles.dataSourceContainer}>
                <Text style={styles.dataSourceText}>
                  {language === 'es' ? 'Datos reales de OpenWeather' : 'Real data from OpenWeather'}
                </Text>
                <Text style={styles.lastUpdatedText}>{getLastUpdatedText()}</Text>
              </View>
              
              <View style={styles.infoContainer}>
                <Feather name="info" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.infoText}>
                  {language === 'es'
                    ? 'Los datos mostrados son la velocidad del viento registrada cada hora en kilómetros por hora. Toque el botón de actualizar para obtener los datos más recientes.'
                    : 'The data shown is the wind speed recorded each hour in kilometers per hour. Tap the refresh button to get the most recent data.'}
                </Text>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  timeRangeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
  },
  timeRangeTextActive: {
    color: '#1a6ab2',
  },
  chartContainer: {
    backgroundColor: 'rgba(26, 106, 178, 0.3)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  minMaxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  minMaxText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  windCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  windCategoryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  dataSourceContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 12,
  },
  dataSourceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    flex: 1,
  },
});

export default WindChartScreen;
