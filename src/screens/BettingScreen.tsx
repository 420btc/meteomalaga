import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import BettingForm from '../components/BettingForm';
import GradientBackground from '../components/GradientBackground';
import { useApp } from '../context/AppContext';
import TemperatureSelector from '../components/TemperatureSelector';

const BettingScreen = () => {
  const navigation = useNavigation();
  const { coins, remainingTempBets } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showTempSelector, setShowTempSelector] = useState<boolean>(false);
  const [isMinTemp, setIsMinTemp] = useState<boolean>(true);
  const [selectedTemp, setSelectedTemp] = useState<number | null>(null);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleShowTempSelector = (isMin: boolean) => {
    if (remainingTempBets <= 0) {
      Alert.alert(
        "Límite alcanzado", 
        "Has alcanzado el límite de 2 apuestas de temperatura para hoy. Vuelve mañana para realizar más apuestas."
      );
      return;
    }
    
    setIsMinTemp(isMin);
    setShowTempSelector(true);
  };

  const handleTempSelect = (temp: number) => {
    setSelectedTemp(temp);
    // You can add additional logic here if needed
  };

  const navigateToTemperatureBetting = () => {
    navigation.navigate('TemperatureBetting');
  };

  const navigateToWindBetting = () => {
    navigation.navigate('WindBetting');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Predicción y Apuestas</Text>
          <View style={styles.coinsContainer}>
            <Feather name="dollar-sign" size={18} color="#FFD700" />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {!showTempSelector ? (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Apuestas de Temperatura y Viento</Text>
                <Text style={styles.infoText}>
                  Puedes realizar hasta 2 apuestas de temperatura al día. 
                  Te quedan <Text style={styles.highlight}>{remainingTempBets}</Text> apuestas hoy.
                </Text>
                
                {/* Botones de Temperatura y Viento */}
                <View style={styles.advancedButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.advancedButton}
                    onPress={navigateToTemperatureBetting}
                  >
                    <Feather name="thermometer" size={24} color="#333" style={styles.buttonIcon} />
                    <Text style={styles.advancedButtonText}>Apuestas de Temperatura</Text>
                    <Text style={styles.buttonSubtext}>¡Resolución cada 12 horas!</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.advancedButton}
                    onPress={navigateToWindBetting}
                  >
                    <Feather name="wind" size={24} color="#333" style={styles.buttonIcon} />
                    <Text style={styles.advancedButtonText}>Apuestas de Viento</Text>
                    <Text style={styles.buttonSubtext}>¡Resolución cada 12 horas!</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.tempButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.tempButton}
                    onPress={() => handleShowTempSelector(true)}
                    disabled={remainingTempBets <= 0}
                  >
                    <Text style={styles.tempButtonText}>Temperatura Mínima</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.tempButton}
                    onPress={() => handleShowTempSelector(false)}
                    disabled={remainingTempBets <= 0}
                  >
                    <Text style={styles.tempButtonText}>Temperatura Máxima</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <BettingForm selectedDate={selectedDate} />
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.backToFormButton}
                onPress={() => setShowTempSelector(false)}
              >
                <Feather name="arrow-left" size={16} color="#3B82F6" />
                <Text style={styles.backToFormText}>Volver al formulario</Text>
              </TouchableOpacity>
              
              <TemperatureSelector 
                isMin={isMinTemp} 
                onSelect={handleTempSelect} 
                selectedValue={selectedTemp}
              />
              
              {selectedTemp !== null && (
                <View style={styles.selectedTempContainer}>
                  <Text style={styles.selectedTempText}>
                    Has seleccionado: <Text style={styles.selectedTempValue}>{selectedTemp}°C</Text>
                  </Text>
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => {
                      // Here you would handle the temperature selection
                      // For example, you could update a form state or navigate to the next step
                      setShowTempSelector(false);
                      // You might want to pass this value to your BettingForm component
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Confirmar selección</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  advancedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  advancedButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E6C200',
  },
  buttonIcon: {
    marginBottom: 5,
  },
  advancedButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 3,
  },
  buttonSubtext: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  tempButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tempButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '48%',
    alignItems: 'center',
  },
  tempButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backToFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backToFormText: {
    color: '#3B82F6',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  selectedTempContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  selectedTempText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  selectedTempValue: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BettingScreen;
