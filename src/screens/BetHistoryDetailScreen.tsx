import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  Animated,
  Share
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import BetStatusBadge from '../components/BetStatusBadge';
import BetSuccessAnimation from '../components/BetSuccessAnimation';

type BetHistoryDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BetHistoryDetail'>;
type BetHistoryDetailScreenRouteProp = RouteProp<RootStackParamList, 'BetHistoryDetail'>;

const BetHistoryDetailScreen: React.FC = () => {
  const navigation = useNavigation<BetHistoryDetailScreenNavigationProp>();
  const route = useRoute<BetHistoryDetailScreenRouteProp>();
  const { bet } = route.params;
  const { evaluateBets } = useApp();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Animate the content appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    // Show confetti if bet is won
    if (bet.won) {
      setShowConfetti(true);
    }
  }, []);

  const goBack = () => {
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResolutionDate = () => {
    if (!bet || !bet.timestamp) return '';
    
    const creationDate = new Date(bet.timestamp);
    const resolutionDate = new Date(creationDate);
    
    // Set resolution time based on bet type
    if (bet.option === 'temperature' || bet.option === 'temp_min' || bet.option === 'temp_max' || bet.bet_resolution_hours === 12) {
      resolutionDate.setHours(resolutionDate.getHours() + 12);
    } else {
      resolutionDate.setHours(resolutionDate.getHours() + 24);
    }
    
    return formatDate(resolutionDate.toISOString());
  };

  const getBetTypeText = (option: string) => {
    switch (option) {
      case 'rain_yes':
        return 'Lluvia (Sí)';
      case 'rain_no':
        return 'Lluvia (No)';
      case 'rain_amount':
        return 'Cantidad de Lluvia';
      case 'temp_min':
        return 'Temperatura Mínima';
      case 'temp_max':
        return 'Temperatura Máxima';
      case 'temperature':
        return 'Temperatura Actual';
      case 'wind_max':
        return 'Velocidad Máxima del Viento';
      case 'lightning':
        return 'Relámpagos';
      default:
        return option;
    }
  };

  const getBetValueText = () => {
    switch (bet.option) {
      case 'rain_yes':
        return 'Sí lloverá';
      case 'rain_no':
        return 'No lloverá';
      case 'rain_amount':
        return `${bet.rain_mm || bet.value} mm`;
      case 'temp_min':
        return `${bet.temp_min_c || bet.value}°C`;
      case 'temp_max':
        return `${bet.temp_max_c || bet.value}°C`;
      case 'temperature':
        return `${bet.temperature_c || bet.value}°C`;
      case 'wind_max':
        return `${bet.wind_kmh_max || bet.value} km/h`;
      default:
        return `${bet.value}`;
    }
  };

  const getResultText = () => {
    if (bet.result === undefined || bet.result === null) return 'Pendiente';
    
    switch (bet.option) {
      case 'rain_yes':
      case 'rain_no':
        return bet.result > 0 ? 'Sí llovió' : 'No llovió';
      case 'rain_amount':
        return `${bet.result} mm`;
      case 'temp_min':
      case 'temp_max':
      case 'temperature':
        return `${bet.result}°C`;
      case 'wind_max':
        return `${bet.result} km/h`;
      default:
        return `${bet.result}`;
    }
  };

  const getResolutionTimeText = () => {
    if (bet.option === 'temperature' || bet.option === 'temp_min' || bet.option === 'temp_max' || bet.bet_resolution_hours === 12) {
      return '12 horas';
    } else {
      return '24 horas';
    }
  };

  const handleVerifyBet = async () => {
    if (bet.status === 'pending' && typeof evaluateBets === 'function') {
      await evaluateBets();
      navigation.goBack();
    }
  };

  const handleShare = async () => {
    try {
      const betType = getBetTypeText(bet.option);
      const betValue = getBetValueText();
      const result = getResultText();
      const status = bet.won === true ? 'ganada' : bet.won === false ? 'perdida' : 'pendiente';
      
      const message = `¡He ${status === 'ganada' ? 'ganado' : status === 'perdida' ? 'perdido' : 'hecho'} una apuesta en WeatherBet! 🎲\n\n` +
        `Tipo: ${betType}\n` +
        `Predicción: ${betValue}\n` +
        `Monedas: ${bet.coins} 🪙\n` +
        `Multiplicador: x${bet.leverage.toFixed(1)}\n` +
        `Resultado: ${result}\n` +
        `Estado: ${status.charAt(0).toUpperCase() + status.slice(1)}\n\n` +
        `¡Descarga WeatherBet y apuesta sobre el clima de Málaga! 🌦️`;
      
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing bet:', error);
    }
  };

  const isPending = bet.status === 'pending' || bet.won === null;
  const isVerifiable = isPending && bet.verificationTime && new Date(bet.verificationTime) <= new Date();

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        {showConfetti && <BetSuccessAnimation />}
        
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={goBack} 
              style={styles.backButton}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalles de la Apuesta</Text>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Feather name="share-2" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.betTypeContainer}>
                  <Feather 
                    name={
                      bet.option.includes('rain') ? 'cloud-rain' :
                      bet.option.includes('temp') ? 'thermometer' :
                      bet.option.includes('wind') ? 'wind' :
                      'help-circle'
                    } 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.betTypeText}>{getBetTypeText(bet.option)}</Text>
                </View>
                <BetStatusBadge status={bet.status || (bet.won === true ? 'ganada' : bet.won === false ? 'perdida' : 'pending')} />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información General</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{formatDate(bet.timestamp)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ciudad:</Text>
                  <Text style={styles.infoValue}>{bet.city || 'Málaga'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tiempo de resolución:</Text>
                  <Text style={styles.infoValue}>{getResolutionTimeText()}</Text>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles de la Apuesta</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Predicción:</Text>
                  <Text style={styles.infoValue}>{getBetValueText()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Monedas:</Text>
                  <Text style={styles.infoValue}>{bet.coins} 🪙</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Multiplicador:</Text>
                  <Text style={styles.infoValue}>x{bet.leverage.toFixed(1)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Posible Ganancia:</Text>
                  <Text style={styles.infoValue}>{(bet.coins * bet.leverage).toFixed(0)} 🪙</Text>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resultado</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valor Real:</Text>
                  <Text style={styles.infoValue}>
                    {isPending ? 'Pendiente' : getResultText()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ganancia:</Text>
                  <Text style={[
                    styles.infoValue, 
                    bet.won === true ? styles.wonValue : 
                    bet.won === false ? styles.lostValue : 
                    styles.pendingValue
                  ]}>
                    {bet.won === true ? `+${(bet.coins * bet.leverage).toFixed(0)} 🪙` : 
                     bet.won === false ? `-${bet.coins} 🪙` : 
                     'Pendiente'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha Resolución:</Text>
                  <Text style={styles.infoValue}>
                    {getResolutionDate()}
                  </Text>
                </View>
              </View>
              
              {isPending && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información Adicional</Text>
                  <Text style={styles.pendingInfo}>
                    Esta apuesta se resolverá automáticamente {getResolutionTimeText()} después de realizarla.
                  </Text>
                  {isVerifiable && (
                    <TouchableOpacity 
                      style={styles.verifyButton}
                      onPress={handleVerifyBet}
                    >
                      <Feather name="refresh-cw" size={16} color="#FFFFFF" style={styles.verifyIcon} />
                      <Text style={styles.verifyButtonText}>Verificar Ahora</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {bet.won === true && (
                <View style={styles.successContainer}>
                  <Feather name="award" size={24} color="#FFD700" style={styles.successIcon} />
                  <Text style={styles.successText}>
                    ¡Felicidades! Has ganado {(bet.coins * bet.leverage).toFixed(0)} monedas con esta apuesta.
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  betTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  wonValue: {
    color: '#4ADE80',
  },
  lostValue: {
    color: '#F87171',
  },
  pendingValue: {
    color: '#FBBF24',
  },
  pendingInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifyIcon: {
    marginRight: 8,
  },
  successContainer: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  successIcon: {
    marginRight: 12,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default BetHistoryDetailScreen;
