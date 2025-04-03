import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import WeatherAlertsBanner from './WeatherAlertsBanner';
import RainIntensityBanner from './RainIntensityBanner';
import ForecastBanner from './ForecastBanner';

interface WeatherInfoPageProps {
  onRefresh?: () => void;
}

interface WeatherDetails {
  pressure: number;
  humidity: number;
  visibility: number;
  uvi: number;
  dewPoint: number;
  clouds: number;
  sunrise: string;
  sunset: string;
}

const WeatherInfoPage: React.FC<WeatherInfoPageProps> = ({ onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherDetails, setWeatherDetails] = useState<WeatherDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchWeatherDetails();
  }, []);

  const fetchWeatherDetails = async () => {
    try {
      setLoading(true);
      
      // OpenWeatherMap API key and coordinates for Málaga
      const OPENWEATHER_API_KEY = '5ae0c9a3137234e18e032e3d6024629e';
      const MALAGA_LAT = 36.7213;
      const MALAGA_LON = -4.4213;
      
      // One Call API 3.0 endpoint
      const ONE_CALL_API_URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
      
      const response = await fetch(ONE_CALL_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather details');
      }
      
      const data = await response.json();
      
      // Format sunrise and sunset times
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      // Extract relevant weather details
      const details: WeatherDetails = {
        pressure: data.current.pressure,
        humidity: data.current.humidity,
        visibility: Math.round(data.current.visibility / 1000), // Convert to km
        uvi: Math.round(data.current.uvi * 10) / 10,
        dewPoint: Math.round(data.current.dew_point * 10) / 10,
        clouds: data.current.clouds,
        sunrise: formatTime(data.current.sunrise),
        sunset: formatTime(data.current.sunset)
      };
      
      setWeatherDetails(details);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching weather details:', error);
      setError('No se pudieron cargar los datos meteorológicos');
      
      // Set fallback data
      setWeatherDetails({
        pressure: 1013,
        humidity: 65,
        visibility: 10,
        uvi: 5.2,
        dewPoint: 15.5,
        clouds: 40,
        sunrise: '07:30',
        sunset: '20:45'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWeatherDetails();
    if (onRefresh) {
      onRefresh();
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUVIndexCategory = (uvi: number) => {
    if (uvi < 3) return { text: 'Bajo', color: '#10B981' };
    if (uvi < 6) return { text: 'Moderado', color: '#F59E0B' };
    if (uvi < 8) return { text: 'Alto', color: '#F97316' };
    if (uvi < 11) return { text: 'Muy alto', color: '#EF4444' };
    return { text: 'Extremo', color: '#7C3AED' };
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#3B82F6"]}
          tintColor="#3B82F6"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Información Meteorológica</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Weather Alerts Banner */}
      <WeatherAlertsBanner isLoading={loading} />

      {/* Rain Intensity Banner */}
      <RainIntensityBanner isLoading={loading} />

      {/* Forecast Banner */}
      <ForecastBanner isLoading={loading} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando datos meteorológicos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : weatherDetails && (
        <>
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Detalles Actuales</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Feather name="thermometer" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Punto de rocío</Text>
                  <Text style={styles.detailValue}>{weatherDetails.dewPoint}°C</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Feather name="droplet" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Humedad</Text>
                  <Text style={styles.detailValue}>{weatherDetails.humidity}%</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Feather name="eye" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Visibilidad</Text>
                  <Text style={styles.detailValue}>{weatherDetails.visibility} km</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Feather name="cloud" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Nubosidad</Text>
                  <Text style={styles.detailValue}>{weatherDetails.clouds}%</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.pressureContainer}>
            <View style={styles.pressureHeader}>
              <Feather name="activity" size={20} color="#FFFFFF" />
              <Text style={styles.pressureTitle}>Presión Atmosférica</Text>
            </View>
            <Text style={styles.pressureValue}>{weatherDetails.pressure} hPa</Text>
            <Text style={styles.pressureDescription}>
              {weatherDetails.pressure > 1013 
                ? 'Alta presión (anticiclón) - Tiempo estable' 
                : 'Baja presión (borrasca) - Posibilidad de precipitaciones'}
            </Text>
          </View>
          
          <View style={styles.uvContainer}>
            <View style={styles.uvHeader}>
              <Feather name="sun" size={20} color="#FFFFFF" />
              <Text style={styles.uvTitle}>Índice UV</Text>
            </View>
            <View style={styles.uvContent}>
              <Text style={[
                styles.uvValue, 
                { color: getUVIndexCategory(weatherDetails.uvi).color }
              ]}>
                {weatherDetails.uvi}
              </Text>
              <Text style={[
                styles.uvCategory,
                { color: getUVIndexCategory(weatherDetails.uvi).color }
              ]}>
                {getUVIndexCategory(weatherDetails.uvi).text}
              </Text>
            </View>
            <View style={styles.uvScale}>
              <View style={[styles.uvScaleSegment, { backgroundColor: '#10B981' }]} />
              <View style={[styles.uvScaleSegment, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.uvScaleSegment, { backgroundColor: '#F97316' }]} />
              <View style={[styles.uvScaleSegment, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.uvScaleSegment, { backgroundColor: '#7C3AED' }]} />
            </View>
          </View>
          
          <View style={styles.sunTimesContainer}>
            <View style={styles.sunTimeItem}>
              <Feather name="sunrise" size={24} color="#F59E0B" />
              <Text style={styles.sunTimeLabel}>Amanecer</Text>
              <Text style={styles.sunTimeValue}>{weatherDetails.sunrise}</Text>
            </View>
            <View style={styles.sunTimeDivider} />
            <View style={styles.sunTimeItem}>
              <Feather name="sunset" size={24} color="#F97316" />
              <Text style={styles.sunTimeLabel}>Atardecer</Text>
              <Text style={styles.sunTimeValue}>{weatherDetails.sunset}</Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Feather name="info" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.infoText}>
              Datos proporcionados por OpenWeatherMap API 3.0 para Málaga (36.72°N, 4.42°W).
              {lastUpdated && ` Actualizado: ${formatTime(lastUpdated)}`}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
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
    padding: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    marginVertical: 12,
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailContent: {
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  pressureContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  pressureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pressureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  pressureValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  pressureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  uvContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  uvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uvTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  uvContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uvValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  uvCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  uvScale: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  uvScaleSegment: {
    flex: 1,
  },
  sunTimesContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sunTimeItem: {
    alignItems: 'center',
  },
  sunTimeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  sunTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  sunTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
});

export default WeatherInfoPage;
