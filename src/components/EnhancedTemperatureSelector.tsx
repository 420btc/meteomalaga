import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EnhancedTemperatureSelectorProps {
  initialValue?: number;
  onValueChange: (value: number) => void;
  isMin: boolean;
  currentTemperature?: number;
}

const EnhancedTemperatureSelector: React.FC<EnhancedTemperatureSelectorProps> = ({
  initialValue = 20,
  onValueChange,
  isMin,
  currentTemperature = 20
}) => {
  const [value, setValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const pulseAnim = new Animated.Value(1);

  // Define min and max temperature ranges
  const minTemp = isMin ? -10 : 0;
  const maxTemp = isMin ? 35 : 50;

  // Predefined temperature buttons
  const predefinedTemperatures = isMin 
    ? [0, 5, 10, 15, 20, 25, 30] 
    : [15, 20, 25, 30, 35, 40, 45];

  useEffect(() => {
    // Start pulse animation when value changes
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    // Convert to number and validate
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue >= minTemp && numValue <= maxTemp) {
      setValue(numValue);
      onValueChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure the input value is valid when focus is lost
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < minTemp) {
      setValue(minTemp);
      setInputValue(minTemp.toString());
      onValueChange(minTemp);
    } else if (numValue > maxTemp) {
      setValue(maxTemp);
      setInputValue(maxTemp.toString());
      onValueChange(maxTemp);
    }
  };

  // Handlers for incrementing/decrementing the value
  const incrementValue = () => {
    const newValue = Math.min(maxTemp, value + 1);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  const decrementValue = () => {
    const newValue = Math.max(minTemp, value - 1);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  // Handlers for incrementing/decrementing the value in larger amounts
  const incrementValueBy5 = () => {
    const newValue = Math.min(maxTemp, value + 5);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  const decrementValueBy5 = () => {
    const newValue = Math.max(minTemp, value - 5);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueValue(newValue);
  };

  const getTemperatureCategory = (temp: number) => {
    if (isMin) {
      // Categories for minimum temperature
      if (temp < 0) return 'Helada';
      if (temp < 5) return 'Muy frío';
      if (temp < 10) return 'Frío';
      if (temp < 15) return 'Fresco';
      if (temp < 20) return 'Templado';
      if (temp < 25) return 'Cálido';
      return 'Muy cálido';
    } else {
      // Categories for maximum temperature
      if (temp < 15) return 'Frío';
      if (temp < 20) return 'Fresco';
      if (temp < 25) return 'Templado';
      if (temp < 30) return 'Cálido';
      if (temp < 35) return 'Caluroso';
      if (temp < 40) return 'Muy caluroso';
      return 'Extremadamente caluroso';
    }
  };

  const getTemperatureEmoji = (temp: number) => {
    if (temp < 0) return '❄️';
    if (temp < 10) return '🥶';
    if (temp < 20) return '😎';
    if (temp < 30) return '☀️';
    if (temp < 40) return '🔥';
    return '🌋';
  };

  const handlePredefinedTemperature = (temp: number) => {
    setValue(temp);
    setInputValue(temp.toString());
    onValueChange(temp);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Selecciona la temperatura {isMin ? 'mínima' : 'máxima'}
        </Text>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueEmoji}>{getTemperatureEmoji(value)}</Text>
            <TextInput
              style={styles.valueInput}
              value={inputValue}
              onChangeText={handleInputChange}
              onBlur={handleInputBlur}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.valueUnit}>°C</Text>
          </View>
        </Animated.View>
      </View>

      {/* Predefined temperature buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predefinedContainer}>
        {predefinedTemperatures.map((temp) => (
          <TouchableOpacity
            key={temp}
            style={[
              styles.predefinedButton,
              value === temp && styles.selectedPredefinedButton
            ]}
            onPress={() => handlePredefinedTemperature(temp)}
          >
            <Text style={[
              styles.predefinedButtonText,
              value === temp && styles.selectedPredefinedButtonText
            ]}>
              {temp}°C
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom slider with buttons and progress bar */}
      <View style={styles.customSliderContainer}>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${((value - minTemp) / (maxTemp - minTemp)) * 100}%` }
            ]} 
          />
        </View>
        
        <View style={styles.controlsContainer}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={decrementValueBy5}
              accessibilityLabel="Disminuir 5 grados"
            >
              <Text style={styles.controlButtonText}>-5</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={decrementValue}
              accessibilityLabel="Disminuir 1 grado"
            >
              <Text style={styles.controlButtonText}>-1</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.valueDisplay}>{value}°C</Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={incrementValue}
              accessibilityLabel="Aumentar 1 grado"
            >
              <Text style={styles.controlButtonText}>+1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={incrementValueBy5}
              accessibilityLabel="Aumentar 5 grados"
            >
              <Text style={styles.controlButtonText}>+5</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{minTemp}°C</Text>
        <Text style={styles.rangeLabel}>{Math.round((minTemp + maxTemp) / 2)}°C</Text>
        <Text style={styles.rangeLabel}>{maxTemp}°C</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Categoría:</Text>
          <Text style={styles.categoryValue}>{getTemperatureCategory(value)}</Text>
        </View>
      </View>

      <View style={styles.tipContainer}>
        <Feather name="info" size={14} color="rgba(255, 255, 255, 0.7)" />
        <Text style={styles.tipText}>
          Cuanto más precisa sea tu predicción, mayor será la recompensa si aciertas.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  valueEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  valueInput: {
    width: 50,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  valueUnit: {
    color: '#FFFFFF',
    marginLeft: 2,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  predefinedContainer: {
    marginBottom: 16,
  },
  predefinedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedPredefinedButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#FFFFFF',
  },
  predefinedButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedPredefinedButtonText: {
    color: '#FFFFFF',
  },
  // Styles for the custom slider
  customSliderContainer: {
    width: '100%',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  valueDisplay: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 100,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rangeLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  categoryValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  }
});

export default EnhancedTemperatureSelector;
