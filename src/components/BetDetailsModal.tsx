import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bet } from '../types/weather';
import BetStatusBadge from './BetStatusBadge';
import { useApp } from '../context/AppContext';

interface BetDetailsModalProps {
  visible: boolean;
  bet: Bet | null;
  onClose: () => void;
}

const BetDetailsModal: React.FC<BetDetailsModalProps> = ({ visible, bet, onClose }) => {
  const { evaluateBets } = useApp();
  const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset animations
      slideAnim.setValue(Dimensions.get('window').height);
      fadeAnim.setValue(0);
      
      // Start animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Show confetti if bet is won
      if (bet?.won) {
        setShowConfetti(true);
      }
    } else {
      setShowConfetti(false);
    }
  }, [visible, bet]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
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

  const getResolutionDate = (bet: Bet) => {
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

  const getBetValueText = (bet: Bet) => {
    if (!bet) return '';
    
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

  const getResultText = (bet: Bet) => {
    if (!bet || bet.result === undefined || bet.result === null) return 'Pendiente';
    
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

  const getResolutionTimeText = (bet: Bet) => {
    if (!bet) return '';
    
    if (bet.option === 'temperature' || bet.option === 'temp_min' || bet.option === 'temp_max' || bet.bet_resolution_hours === 12) {
      return '12 horas';
    } else {
      return '24 horas';
    }
  };

  const handleVerifyBet = async () => {
    if (bet && bet.status === 'pending' && typeof evaluateBets === 'function') {
      await evaluateBets();
      closeModal();
    }
  };

  if (!bet) return null;

  const isPending = bet.status === 'pending' || bet.won === null;
  const isVerifiable = isPending && new Date(bet.verificationTime) <= new Date();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={closeModal}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={closeModal}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Detalles de la Apuesta</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado</Text>
              <BetStatusBadge status={bet.status || (bet.won === true ? 'ganada' : bet.won === false ? 'perdida' : 'pending')} />
            </View>
            
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
                <Text style={styles.infoLabel}>Tipo:</Text>
                <Text style={styles.infoValue}>{getBetTypeText(bet.option)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiempo de resolución:</Text>
                <Text style={styles.infoValue}>{getResolutionTimeText(bet)}</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles de la Apuesta</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Predicción:</Text>
                <Text style={styles.infoValue}>{getBetValueText(bet)}</Text>
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
                  {isPending ? 'Pendiente' : getResultText(bet)}
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
                  {getResolutionDate(bet)}
                </Text>
              </View>
              
              {/* Add resolution explanation section */}
              {bet.resolution_explanation && !isPending && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>Explicación:</Text>
                  <Text style={[
                    styles.explanationText,
                    bet.won ? styles.wonExplanation : styles.lostExplanation
                  ]}>
                    {bet.resolution_explanation}
                  </Text>
                </View>
              )}
            </View>
            
            {isPending && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información Adicional</Text>
                <Text style={styles.pendingInfo}>
                  Esta apuesta se resolverá automáticamente {getResolutionTimeText(bet)} después de realizarla.
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
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#1E3A8A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
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
  // New styles for resolution explanation
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  wonExplanation: {
    color: '#4ADE80',
  },
  lostExplanation: {
    color: '#F87171',
  },
});

export default BetDetailsModal;
