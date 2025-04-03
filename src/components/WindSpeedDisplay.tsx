import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchCurrentWindData } from '../services/weatherService';

interface WindSpeedDisplayProps {
  onRefresh?: () => Promise<void>;
  speed?: number;
}

const WindSpeedDisplay: React.FC<WindSpeedDisplayProps> = ({ onRefresh, speed }) => {
  const [windData, setWindData] = useState<{ current: number, max: number, direction: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Animated values
  const rotateAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);
  
  useEffect(() => {
    loadWindData();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      loadWindData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const loadWindData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start rotation animation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      }).start();
      
      const data = await fetchCurrentWindData();
      setWindData(data);
      setLastUpdated(new Date());
      
      // Pulse animation on successful data load
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      
      // Call additional refresh function if provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error loading wind data:', error);
      setError('No se pudieron cargar los datos del viento. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      // Reset rotation
      rotateAnim.setValue(0);
    }
  };
  
  const handleRefresh = () => {
    loadWindData();
  };
  
  const getWindDescription = (speed: number): string => {
    if (speed < 5) return 'Calma';
    if (speed < 12) return 'Brisa ligera';
    if (speed < 20) return 'Brisa moderada';
    if (speed < 29) return 'Brisa fresca';
    if (speed < 39) return 'Viento fuerte';
    if (speed < 50) return 'Viento muy fuerte';
    if (speed < 62) return 'Temporal';
    if (speed < 75) return 'Temporal fuerte';
    if (speed < 89) return 'Temporal muy fuerte';
    return 'Huracán';
  };
  
  const getWindDirectionText = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    const index = Math.round(degrees / 22.5);
    return directions[index];
  };
  
  const getWindDirectionEmoji = (degrees: number): string => {
    // Simplify to 8 directions
    const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const arrowRotation = windData ? {
    transform: [{ rotate: `${windData.direction}deg` }]
  } : {};
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Velocidad del Viento Actual</Text>
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={styles.refreshButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dataContainer}>
          <View style={styles.speedContainer}>
            <View style={styles.currentSpeedContainer}>
              <Text style={styles.speedLabel}>Actual</Text>
              <Text style={styles.speedValue}>
                {windData ? `${windData.current.toFixed(1)}` : '--'} 
                <Text style={styles.speedUnit}>km/h</Text>
              </Text>
              <Text style={styles.speedDescription}>
                {windData ? getWindDescription(windData.current) : ''}
              </Text>
            </View>
            
            <View style={styles.maxSpeedContainer}>
              <Text style={styles.speedLabel}>Máxima</Text>
              <Text style={styles.maxSpeedValue}>
                {windData ? `${windData.max.toFixed(1)}` : '--'} 
                <Text style={styles.speedUnit}>km/h</Text>
              </Text>
              <Text style={styles.speedDescription}>
                {windData ? getWindDescription(windData.max) : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.directionContainer}>
            <Text style={styles.directionLabel}>Dirección</Text>
            <View style={styles.directionIndicator}>
              <View style={styles.compassRose}>
                <Text style={[styles.compassPoint, styles.compassN]}>N</Text>
                <Text style={[styles.compassPoint, styles.compassE]}>E</Text>
                <Text style={[styles.compassPoint, styles.compassS]}>S</Text>
                <Text style={[styles.compassPoint, styles.compassW]}>W</Text>
              </View>
              {windData && (
                <Animated.View style={[styles.directionArrow, arrowRotation]}>
                  <Feather name="arrow-up" size={24} color="#FFD700" />
                </Animated.View>
              )}
            </View>
            <Text style={styles.directionText}>
              {windData ? (
                <>
                  {getWindDirectionText(windData.direction)} {getWindDirectionEmoji(windData.direction)} ({windData.direction}°)
                </>
              ) : '--'}
            </Text>
          </View>
        </View>
      )}
      
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Actualizado: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 10,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedContainer: {
    flex: 1,
    marginRight: 10,
  },
  currentSpeedContainer: {
    marginBottom: 8,
  },
  maxSpeedContainer: {
    marginTop: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
  },
  speedValue: {
    fontSize: 48, // Increased from 24 to 48
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  maxSpeedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  speedUnit: {
    fontSize: 18, // Increased from 14 to 18
    color: 'rgba(255, 255, 255, 0.7)',
  },
  speedDescription: {
    fontSize: 14, // Increased from 12 to 14
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  directionContainer: {
    flex: 1,
    alignItems: 'center',
  },
  directionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  directionIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  compassRose: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  compassPoint: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compassN: {
    top: 5,
    left: '50%',
    marginLeft: -5,
  },
  compassE: {
    right: 5,
    top: '50%',
    marginTop: -8,
  },
  compassS: {
    bottom: 5,
    left: '50%',
    marginLeft: -5,
  },
  compassW: {
    left: 5,
    top: '50%',
    marginTop: -8,
  },
  directionArrow: {
    position: 'absolute',
  },
  directionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: 8,
  },
});

export default WindSpeedDisplay;
