import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../types/navigation';

interface TemperatureDataDisplayProps {
  date?: string; // If not provided, use current date
  type: 'temp_min' | 'temp_max'; // Type of temperature to display
  onRefresh?: () => void;
}

const TemperatureDataDisplay: React.FC<TemperatureDataDisplayProps> = ({ 
  date = new Date().toISOString().split('T')[0],
  type,
  onRefresh
}) => {
  const { getCurrentTemperature, isOnline } = useApp();
  const [temperature, setTemperature] = useState<{ min: number; max: number; current: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    loadTemperatureData();
  }, [date, type]);

  const loadTemperatureData = async () => {
    setLoading(true);
    try {
      const temp = await getCurrentTemperature();
      setTemperature(temp);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading temperature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTemperatureData();
    if (onRefresh) {
      onRefresh();
    }
    
    // Simular animación de actualización
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

  // Determine if the date is today, yesterday or an earlier date
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return date === yesterdayStr;
  };

  const navigateToTemperatureChart = () => {
    navigation.navigate('TemperatureChartScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'temp_min' ? 'Temperatura Mínima' : 'Temperatura Máxima'}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={loading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.refreshIconContainer}>
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <View style={styles.dataBox}>
              <View style={styles.dataIconContainer}>
                <Text style={styles.dataEmoji}>
                  {type === 'temp_min' ? '❄️' : '🔥'}
                </Text>
              </View>
              <View style={styles.dataTextContainer}>
                <Text style={styles.dataLabel}>
                  {type === 'temp_min' ? 'TEMPERATURA MÍNIMA' : 'TEMPERATURA MÁXIMA'}
                </Text>
                <View style={styles.dataValueRow}>
                  <Text style={styles.dataValue}>
                    {temperature !== null 
                      ? `${type === 'temp_min' ? temperature.min.toFixed(1) : temperature.max.toFixed(1)}°C` 
                      : 'No disponible'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.chartButton}
                    onPress={navigateToTemperatureChart}
                    activeOpacity={0.7}
                  >
                    <Feather name="bar-chart-2" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {isToday() && temperature && (
              <View style={styles.currentTempContainer}>
                <Text style={styles.currentTempLabel}>Temperatura actual:</Text>
                <Text style={styles.currentTempValue}>{temperature.current.toFixed(1)}°C</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              {isOnline && (
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceText}>Fuente: OpenWeatherMap API</Text>
                </View>
              )}
              
              {lastUpdated && (
                <Text style={styles.updatedText}>
                  Actualizado: {formatTime(lastUpdated)}
                </Text>
              )}
            </View>
            
            {!isToday() && (
              <Text style={styles.historicalNote}>
                Estos son datos históricos finales para esta fecha.
              </Text>
            )}
          </>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Feather name="info" size={14} color="rgba(255, 255, 255, 0.7)" />
        <Text style={styles.infoText}>
          {type === 'temp_min' 
            ? 'La temperatura mínima es el valor más bajo registrado durante el día.'
            : 'La temperatura máxima es el valor más alto registrado durante el día.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  refreshIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 8,
  },
  dataBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  dataIconContainer: {
    marginRight: 12,
  },
  dataEmoji: {
    fontSize: 24,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
  },
  dataValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  currentTempContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  currentTempLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  currentTempValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  updatedText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  historicalNote: {
    fontSize: 12,
    color: '#FFD700',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    flex: 1,
  },
});

export default TemperatureDataDisplay;
