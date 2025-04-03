import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchCurrentTemperatureData } from '../services/weatherService';
import { getTemperatureOdds } from '../services/localBetService';

interface TemperatureSelectorProps {
  isMin: boolean;
  onSelect: (value: number) => void;
  selectedValue: number | null;
}

const TemperatureSelector: React.FC<TemperatureSelectorProps> = ({ 
  isMin, 
  onSelect, 
  selectedValue 
}) => {
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate temperature range based on whether it's min or max
  const generateTemperatureRange = () => {
    const range = [];
    const start = isMin ? -5 : 5;
    const end = isMin ? 30 : 45;
    
    for (let temp = start; temp <= end; temp++) {
      range.push(temp);
    }
    return range;
  };

  const temperatureRange = generateTemperatureRange();

  useEffect(() => {
    const loadCurrentTemperature = async () => {
      try {
        setLoading(true);
        const tempData = await fetchCurrentTemperatureData();
        setCurrentTemp(isMin ? tempData.min : tempData.max);
      } catch (error) {
        console.error('Error loading temperature data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentTemperature();
  }, [isMin]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Selecciona la temperatura {isMin ? 'mínima' : 'máxima'} (°C)
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando datos de temperatura...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.currentTemp}>
            Temperatura {isMin ? 'mínima' : 'máxima'} actual: {currentTemp !== null ? `${currentTemp}°C` : 'N/A'}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.temperatureContainer}>
              {temperatureRange.map((temp) => {
                const odds = getTemperatureOdds(temp, isMin);
                return (
                  <TouchableOpacity
                    key={temp}
                    style={[
                      styles.temperatureButton,
                      selectedValue === temp && styles.selectedButton,
                      temp === Math.round(currentTemp || 0) && styles.currentTempButton
                    ]}
                    onPress={() => onSelect(temp)}
                  >
                    <Text style={[
                      styles.temperatureText,
                      selectedValue === temp && styles.selectedText
                    ]}>
                      {temp}°C
                    </Text>
                    <Text style={[
                      styles.oddsText,
                      selectedValue === temp && styles.selectedText
                    ]}>
                      {odds}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.selectedButton]} />
              <Text style={styles.legendText}>Seleccionado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.currentTempButton]} />
              <Text style={styles.legendText}>Temperatura actual</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  currentTemp: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
  },
  scrollView: {
    marginBottom: 15,
  },
  temperatureContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  temperatureButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  currentTempButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  temperatureText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  oddsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default TemperatureSelector;
