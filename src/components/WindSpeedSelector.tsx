import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WindSpeedSelectorProps {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

const WindSpeedSelector: React.FC<WindSpeedSelectorProps> = ({
  initialValue = 20,
  minValue = 0,
  maxValue = 100,
  step = 1,
  onValueChange
}) => {
  const [value, setValue] = useState(initialValue);
  
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
  
  const handleIncrement = () => {
    if (value < maxValue) {
      const newValue = Math.min(maxValue, value + step);
      setValue(newValue);
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    }
  };
  
  const handleDecrement = () => {
    if (value > minValue) {
      const newValue = Math.max(minValue, value - step);
      setValue(newValue);
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    }
  };
  
  // Calculate background color based on value
  const getValueColor = () => {
    const percentage = (value - minValue) / (maxValue - minValue);
    
    if (percentage < 0.3) {
      return { color: '#3498db' }; // Blue for low wind
    } else if (percentage < 0.6) {
      return { color: '#2ecc71' }; // Green for moderate wind
    } else if (percentage < 0.8) {
      return { color: '#f1c40f' }; // Yellow for strong wind
    } else {
      return { color: '#e74c3c' }; // Red for very strong wind
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona la Velocidad del Viento 💨</Text>
      
      <View style={styles.valueContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleDecrement}
          disabled={value <= minValue}
        >
          <Feather name="minus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.valueDisplay}>
          <Text style={[styles.valueText, getValueColor()]}>{value}</Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleIncrement}
          disabled={value >= maxValue}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.descriptionText}>
        {getWindDescription(value)}
      </Text>
      
      <View style={styles.speedRangeContainer}>
        <View style={styles.speedRange}>
          <Text style={styles.speedRangeLabel}>Calma</Text>
          <Text style={styles.speedRangeLabel}>Brisa</Text>
          <Text style={styles.speedRangeLabel}>Fuerte</Text>
          <Text style={styles.speedRangeLabel}>Temporal</Text>
        </View>
        <View style={styles.speedRangeBar}>
          <View style={[styles.speedRangeSegment, styles.speedRangeCalm]} />
          <View style={[styles.speedRangeSegment, styles.speedRangeBreeze]} />
          <View style={[styles.speedRangeSegment, styles.speedRangeStrong]} />
          <View style={[styles.speedRangeSegment, styles.speedRangeStorm]} />
        </View>
        <View style={styles.speedRangeValues}>
          <Text style={styles.speedRangeValue}>0</Text>
          <Text style={styles.speedRangeValue}>20</Text>
          <Text style={styles.speedRangeValue}>40</Text>
          <Text style={styles.speedRangeValue}>60</Text>
          <Text style={styles.speedRangeValue}>80+</Text>
        </View>
      </View>
      
      <Text style={styles.instructionText}>
        Usa los botones + y - para ajustar la velocidad del viento
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  valueDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unitText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  descriptionText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  speedRangeContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  speedRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speedRangeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    textAlign: 'center',
  },
  speedRangeBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  speedRangeSegment: {
    flex: 1,
    height: '100%',
  },
  speedRangeCalm: {
    backgroundColor: 'rgba(52, 152, 219, 0.7)',
  },
  speedRangeBreeze: {
    backgroundColor: 'rgba(46, 204, 113, 0.7)',
  },
  speedRangeStrong: {
    backgroundColor: 'rgba(241, 196, 15, 0.7)',
  },
  speedRangeStorm: {
    backgroundColor: 'rgba(231, 76, 60, 0.7)',
  },
  speedRangeValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  speedRangeValue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  instructionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default WindSpeedSelector;
