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

interface EnhancedWeatherDisplayProps {
  onRefresh?: () => void;
}

const EnhancedWeatherDisplay: React.FC<EnhancedWeatherDisplayProps> = ({ 
  onRefresh
}) => {
  const { getCurrentRainAmount, getWeatherForDate, isOnline, getCurrentTemperature, getCurrentWindData } = useApp();
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [temperature, setTemperature] = useState<{ min: number; max: number; current: number } | null>(null);
  const [windData, setWindData] = useState<{ current: number; max: number; direction: string } | null>(null);
  const [rainAmount, setRainAmount] = useState<number>(0);

  useEffect(() => {
    loadCurrentWeather();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      loadCurrentWeather();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadCurrentWeather = async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get current weather data
      const weatherData = await getWeatherForDate(today);
      
      // Get current rain amount
      const rainAmount = await getCurrentRainAmount();
      setRainAmount(rainAmount);
      
      // Get current temperature
      const tempData = await getCurrentTemperature();
      setTemperature(tempData);
      
      // Get current wind data
      const windData = await getCurrentWindData();
      setWindData(windData);
      
      // Combine the data
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
    loadCurrentWeather();
    if (onRefresh) {
      onRefresh();
    }
    
    // Simulate refresh animation
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
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Cargando datos... ⏳</Text>
        </View>
      ) : currentWeather ? (
        <View style={styles.weatherContent}>
          {/* Rain Display */}
          <View style={styles.weatherDataRow}>
            <Text style={[
              styles.weatherDataLabel, 
              { color: rainAmount > 0 ? '#FF6B6B' : '#9CA3AF' }
            ]}>
              LLUVIA ACTUAL:
            </Text>
            <Text style={[
              styles.weatherDataValue, 
              { color: rainAmount > 0 ? '#FF6B6B' : '#9CA3AF' }
            ]}>
              {rainAmount.toFixed(2)} mm
            </Text>
          </View>
          
          {/* Wind Display */}
          <View style={styles.weatherDataRow}>
            <Text style={[styles.weatherDataLabel, { color: '#10B981' }]}>
              VIENTO ACTUAL:
            </Text>
            <Text style={[styles.weatherDataValue, { color: '#10B981' }]}>
              {windData ? windData.current.toFixed(1) : '0.0'} km/h
            </Text>
          </View>
          
          {/* Temperature Display */}
          <View style={styles.weatherDataRow}>
            <Text style={[styles.weatherDataLabel, { color: '#3B82F6' }]}>
              TEMPERATURA:
            </Text>
            <Text style={[styles.weatherDataValue, { color: '#3B82F6' }]}>
              {temperature ? temperature.current.toFixed(1) : '0.0'} °C
            </Text>
          </View>
          
          {/* Additional Data */}
          <View style={styles.additionalDataContainer}>
            <View style={styles.additionalDataItem}>
              <Text style={styles.additionalDataLabel}>
                Viento Máx:
              </Text>
              <Text style={styles.additionalDataValue}>
                {windData ? windData.max.toFixed(1) : '0.0'} km/h
              </Text>
            </View>
            
            <View style={styles.additionalDataItem}>
              <Text style={styles.additionalDataLabel}>
                Temp. Mín:
              </Text>
              <Text style={styles.additionalDataValue}>
                {temperature ? temperature.min.toFixed(1) : '0.0'} °C
              </Text>
            </View>
            
            <View style={styles.additionalDataItem}>
              <Text style={styles.additionalDataLabel}>
                Temp. Máx:
              </Text>
              <Text style={styles.additionalDataValue}>
                {temperature ? temperature.max.toFixed(1) : '0.0'} °C
              </Text>
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
      
      {!isOnline && (
        <View style={styles.offlineWarning}>
          <Feather name="wifi-off" size={14} color="#FFD700" />
          <Text style={styles.offlineText}>
            Modo sin conexión: Datos simulados 📊
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 36,
    height: 36,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 16,
  },
  weatherDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherDataLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  weatherDataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  additionalDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  additionalDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  additionalDataLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginBottom: 4,
  },
  additionalDataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  offlineText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
});

export default EnhancedWeatherDisplay;
