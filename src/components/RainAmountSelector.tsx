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

interface RainAmountSelectorProps {
  initialValue?: number;
  onValueChange: (value: number) => void;
  rainChance?: number;
  currentRainAmount?: number;
}

const RainAmountSelector: React.FC<RainAmountSelectorProps> = ({
  initialValue = 0,
  onValueChange,
  rainChance = 0,
  currentRainAmount = 0
}) => {
  const [value, setValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [odds, setOdds] = useState(1);
  const [probability, setProbability] = useState(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Calculate probability and odds based on the selected value and rain chance
    calculateProbabilityAndOdds(value);
  }, [value, rainChance, currentRainAmount]);

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

  const calculateProbabilityAndOdds = (rainAmount: number) => {
    // Base probability calculation
    let calculatedProbability = 0;
    
    if (rainChance > 0) {
      // Calculate probability based on the difference from current rain amount
      const diff = Math.abs(rainAmount - currentRainAmount);
      
      if (diff === 0) {
        // Exact match with current amount
        calculatedProbability = Math.min(20, rainChance * 0.2);
      } else if (diff <= 1) {
        // Very close to current amount
        calculatedProbability = Math.min(15, rainChance * 0.15);
      } else if (diff <= 5) {
        // Somewhat close to current amount
        calculatedProbability = Math.min(10, rainChance * 0.1);
      } else if (diff <= 10) {
        // Moderately different from current amount
        calculatedProbability = Math.min(5, rainChance * 0.05);
      } else {
        // Very different from current amount
        calculatedProbability = Math.min(2, rainChance * 0.02);
      }
      
      // Special case for predicting 0 when current is 0
      if (rainAmount === 0 && currentRainAmount === 0) {
        calculatedProbability = Math.max(calculatedProbability, 80);
      }
      
      // Special case for predicting rain when there is none
      if (rainAmount > 0 && currentRainAmount === 0) {
        calculatedProbability = Math.min(calculatedProbability, rainChance * 0.1);
      }
    }
    
    // Ensure probability is between 0.1 and 100
    calculatedProbability = Math.max(0.1, Math.min(calculatedProbability, 100));
    
    // Calculate odds (inverse of probability)
    let calculatedOdds = parseFloat((100 / calculatedProbability).toFixed(1));
    
    // Cap the odds at a reasonable maximum
    calculatedOdds = Math.min(Math.max(calculatedOdds, 1.1), 50);
    
    setProbability(calculatedProbability);
    setOdds(calculatedOdds);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    // Convert to number and validate
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 999) { // Increased max to 999
      setValue(numValue);
      onValueChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure the input value is valid when focus is lost
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < 0) {
      setValue(0);
      setInputValue('0');
      onValueChange(0);
    } else if (numValue > 999) { // Increased max to 999
      setValue(999);
      setInputValue('999');
      onValueChange(999);
    }
  };

  // Handlers for incrementing/decrementing the value
  const incrementValue = () => {
    const newValue = Math.min(999, value + 1); // Increased max to 999
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  const decrementValue = () => {
    const newValue = Math.max(0, value - 1);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  // Handlers for incrementing/decrementing the value in larger amounts
  const incrementValueBy10 = () => {
    const newValue = Math.min(999, value + 10); // Increased max to 999
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  const decrementValueBy10 = () => {
    const newValue = Math.max(0, value - 10);
    setValue(newValue);
    setInputValue(newValue.toString());
    onValueChange(newValue);
  };

  const getRainCategory = (amount: number) => {
    if (amount === 0) return 'Sin lluvia';
    if (amount <= 5) return 'Lluvia ligera';
    if (amount <= 15) return 'Lluvia moderada';
    if (amount <= 30) return 'Lluvia intensa';
    if (amount <= 100) return 'Lluvia extrema';
    return 'Diluvio';
  };

  const getRainEmoji = (amount: number) => {
    if (amount === 0) return '☀️';
    if (amount <= 5) return '🌦️';
    if (amount <= 15) return '🌧️';
    if (amount <= 30) return '⛈️';
    if (amount <= 100) return '🌊';
    return '🌪️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Selecciona los mm de lluvia</Text>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueEmoji}>{getRainEmoji(value)}</Text>
            <TextInput
              style={styles.valueInput}
              value={inputValue}
              onChangeText={handleInputChange}
              onBlur={handleInputBlur}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.valueUnit}>mm</Text>
          </View>
        </Animated.View>
      </View>

      {/* Custom slider with buttons and progress bar */}
      <View style={styles.customSliderContainer}>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${(value / 999) * 100}%` } // Changed to use 999 as max
            ]} 
          />
        </View>
        
        <View style={styles.controlsContainer}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={decrementValueBy10}
              accessibilityLabel="Disminuir 10 mm"
            >
              <Text style={styles.controlButtonText}>-10</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={decrementValue}
              accessibilityLabel="Disminuir 1 mm"
            >
              <Text style={styles.controlButtonText}>-1</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.valueDisplay}>{value} mm</Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={incrementValue}
              accessibilityLabel="Aumentar 1 mm"
            >
              <Text style={styles.controlButtonText}>+1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={incrementValueBy10}
              accessibilityLabel="Aumentar 10 mm"
            >
              <Text style={styles.controlButtonText}>+10</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>0mm</Text>
        <Text style={styles.rangeLabel}>500mm</Text>
        <Text style={styles.rangeLabel}>999mm</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Categoría:</Text>
          <Text style={styles.categoryValue}>{getRainCategory(value)}</Text>
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
    marginTop: 0, // Eliminado el espacio superior
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
    width: 50, // Increased width for larger numbers
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
    fontSize: 24, // Increased size for emphasis
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 100, // Ensure consistent width
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
    fontSize: 16, // Increased size for emphasis
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

export default RainAmountSelector;
