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

interface RainDataDisplayProps {
  date?: string; // Si no se proporciona, se usa la fecha actual
  onRefresh?: () => void;
}

const RainDataDisplay: React.FC<RainDataDisplayProps> = ({ 
  date = new Date().toISOString().split('T')[0],
  onRefresh
}) => {
  const { getCurrentRainAmount, isOnline } = useApp();
  const [rainAmount, setRainAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    loadRainData();
  }, [date]);

  const loadRainData = async () => {
    setLoading(true);
    try {
      const amount = await getCurrentRainAmount();
      setRainAmount(amount);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading rain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRainData();
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

  // Determinar si la fecha es hoy, ayer o una fecha anterior
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

  const navigateToRainChart = () => {
    navigation.navigate('RainChartScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Datos de Precipitación</Text>
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
                <Text style={styles.dataEmoji}>💧</Text>
              </View>
              <View style={styles.dataTextContainer}>
                <Text style={styles.dataLabel}>LLUVIA ACUMULADA</Text>
                <View style={styles.dataValueRow}>
                  <Text style={styles.dataValue}>
                    {rainAmount !== null ? `${rainAmount.toFixed(2)} mm` : 'No disponible'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.chartButton}
                    onPress={navigateToRainChart}
                    activeOpacity={0.7}
                  >
                    <Feather name="bar-chart-2" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              {isOnline && (
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceText}>Fuente: AEMET / OpenWeatherMap</Text>
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
          Las apuestas se resuelven automáticamente 24 horas después de la fecha seleccionada.
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

export default RainDataDisplay;
