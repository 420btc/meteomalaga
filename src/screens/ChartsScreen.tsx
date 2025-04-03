import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import GradientBackground from '../components/GradientBackground';

type ChartsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Charts'>;

const ChartsScreen: React.FC = () => {
  const navigation = useNavigation<ChartsScreenNavigationProp>();
  const { language } = useApp();
  
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'es' ? 'Gráficas Meteorológicas' : 'Weather Charts'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.chartButton}
            onPress={() => navigation.navigate('RainChart')}
          >
            <View style={styles.iconContainer}>
              <Feather name="cloud-rain" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.chartButtonText}>
              {language === 'es' ? 'Historial de Precipitación' : 'Rain History'}
            </Text>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.chartButton}
            onPress={() => navigation.navigate('TemperatureChart')}
          >
            <View style={styles.iconContainer}>
              <Feather name="thermometer" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.chartButtonText}>
              {language === 'es' ? 'Historial de Temperatura' : 'Temperature History'}
            </Text>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.chartButton}
            onPress={() => navigation.navigate('WindChart')}
          >
            <View style={styles.iconContainer}>
              <Feather name="wind" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.chartButtonText}>
              {language === 'es' ? 'Historial de Viento' : 'Wind History'}
            </Text>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Feather name="info" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.infoText}>
            {language === 'es' 
              ? 'Selecciona una gráfica para ver datos históricos de las últimas 24 horas.' 
              : 'Select a chart to view historical data from the last 24 hours.'}
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  chartButton: {
    backgroundColor: 'rgba(26, 106, 178, 0.6)',
    borderRadius: 16,
    padding: 20,
    width: Dimensions.get('window').width - 40,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 15,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    flex: 1,
  },
});

export default ChartsScreen;
