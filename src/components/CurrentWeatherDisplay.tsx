import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { fetchCurrentWindData } from '../services/weatherService';

interface CurrentWeatherDisplayProps {
  onRefresh?: () => void;
}

const CurrentWeatherDisplay: React.FC<CurrentWeatherDisplayProps> = ({ onRefresh }) => {
  const { getCurrentRainAmount, getWeatherForDate, getCurrentTemperature } = useApp();
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [temperature, setTemperature] = useState<{ min: number; max: number; current: number } | null>(null);
  const [windSpeed, setWindSpeed] = useState<number>(0);

  useEffect(() => {
    loadWeatherData();
    
    // Refresh data every 5 minutes.
    const intervalId = setInterval(() => {
      loadWeatherData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format.
      const today = new Date().toISOString().split('T')[0];
      
      // Get current weather data.
      const weatherData = await getWeatherForDate(today);
      
      // Get current rain amount.
      const rainAmount = await getCurrentRainAmount();
      
      // Get current temperature.
      const tempData = await getCurrentTemperature();
      setTemperature(tempData);
      
      // Fetch current wind data separately to ensure it's real-time.
      const windData = await fetchCurrentWindData();
      setWindSpeed(Number(windData.current.toFixed(2)));
      
      // Combine the data.
      const combinedData = {
        ...weatherData,
        currentRainAmount: rainAmount
      };
      
      setCurrentWeather(combinedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading current weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
    onRefresh && onRefresh();
    // Simulate refresh animation.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tiempo Actual en Málaga 📍</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={loading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Cargando datos... ⏳</Text>
        </View>
      ) : currentWeather ? (
        <View style={styles.weatherContent}>
          <View style={styles.rainHighlight}>
            <Text style={styles.rainValue}>
              {currentWeather.currentRainAmount.toFixed(1)}
              <Text style={styles.rainUnit}>mm</Text>
            </Text>
            <Text style={styles.rainLabel}>LLUVIA ACTUAL</Text>
            <Text style={styles.rainCategory}>
              {currentWeather.currentRainAmount < 1 ? 'Sin lluvia' : 
               currentWeather.currentRainAmount < 2 ? 'Lluvia débil' : 'Lluvia moderada'}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Feather name="cloud-rain" size={16} color="#FFFFFF" />
              <Text style={styles.detailText}>
                {currentWeather.rainChance ? currentWeather.rainChance.toFixed(0) : "0"}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="wind" size={16} color="#FFFFFF" />
              <Text style={styles.detailText}>
                {Number(windSpeed).toFixed(2)}km/h
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.dataBox}>
              <View style={styles.dataIconContainer}>
                <Text style={styles.dataEmoji}>🌡️</Text>
              </View>
              <View style={styles.dataTextContainer}>
                <Text style={styles.dataLabel}>TEMPERATURA</Text>
                <Text style={styles.dataValue}>
                  {temperature ? temperature.current.toFixed(1) : 
                    currentWeather.currentTemp !== undefined 
                      ? currentWeather.currentTemp.toFixed(1)
                      : Math.round((currentWeather.tempMin + currentWeather.tempMax) / 2)}°C
                </Text>
              </View>
            </View>
            <View style={styles.dataBox}>
              <View style={styles.dataIconContainer}>
                <Text style={styles.dataEmoji}>💨</Text>
              </View>
              <View style={styles.dataTextContainer}>
                <Text style={styles.dataLabel}>VIENTO</Text>
                <Text style={styles.dataValue}>
                  {Number(windSpeed).toFixed(2)}km/h
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.locationInfo}>
            <Feather name="map-pin" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.locationText}>Málaga, España</Text>
            {lastUpdated && (
              <Text style={styles.updatedText}>
                Actualizado: {formatTime(lastUpdated)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.errorText}>No se pudieron cargar los datos del tiempo ❌</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  refreshButton: { 
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  weatherContent: {
    alignItems: 'center',
  },
  rainHighlight: {
    alignItems: 'center',
    marginBottom: 4,
  },
  rainValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    lineHeight: 65,
  },
  rainUnit: {
    fontSize: 40,
    fontWeight: 'normal',
  },
  rainLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  rainCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
    width: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  detailText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  dataBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  dataIconContainer: {
    marginRight: 8,
  },
  dataEmoji: {
    fontSize: 20,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    fontWeight: 'bold',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  updatedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  }
});

export default CurrentWeatherDisplay;
