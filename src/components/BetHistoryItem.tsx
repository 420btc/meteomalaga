import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bet } from '../types/weather';
import BetStatusBadge from './BetStatusBadge';

interface BetHistoryItemProps {
  bet: Bet;
  onPress: () => void;
}

const BetHistoryItem: React.FC<BetHistoryItemProps> = ({ bet, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBetTypeIcon = (option: string) => {
    switch (option) {
      case 'rain_yes':
      case 'rain_no':
      case 'rain_amount':
        return 'cloud-rain';
      case 'temp_min':
      case 'temp_max':
      case 'temperature':
        return 'thermometer';
      case 'wind_max':
        return 'wind';
      case 'lightning':
        return 'zap';
      default:
        return 'help-circle';
    }
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
        return 'Velocidad del Viento';
      case 'lightning':
        return 'Relámpagos';
      default:
        return option;
    }
  };

  const getBetValueText = (bet: Bet) => {
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

  const isPending = bet.status === 'pending' || bet.won === null;
  const isVerifiable = isPending && bet.verificationTime && new Date(bet.verificationTime) <= new Date();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isPending ? styles.pendingContainer : 
        bet.won ? styles.wonContainer : styles.lostContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Feather 
          name={getBetTypeIcon(bet.option)} 
          size={24} 
          color={
            isPending ? '#FBBF24' : 
            bet.won ? '#4ADE80' : '#F87171'
          } 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.betType}>{getBetTypeText(bet.option)}</Text>
          <BetStatusBadge status={bet.status || (bet.won === true ? 'ganada' : bet.won === false ? 'perdida' : 'pending')} />
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.betValue}>{getBetValueText(bet)}</Text>
          <Text style={styles.betAmount}>{bet.coins} 🪙 x{bet.leverage.toFixed(1)}</Text>
        </View>
        
        <View style={styles.footerRow}>
          <Text style={styles.date}>{formatDate(bet.timestamp)}</Text>
          <Text style={[
            styles.result,
            isPending ? styles.pendingResult : 
            bet.won ? styles.wonResult : styles.lostResult
          ]}>
            {isPending ? 'Pendiente' : getResultText(bet)}
          </Text>
        </View>
      </View>
      
      {isVerifiable && (
        <View style={styles.verifiableIndicator}>
          <Feather name="refresh-cw" size={16} color="#FBBF24" />
        </View>
      )}
      
      <Feather name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  pendingContainer: {
    borderLeftColor: '#FBBF24',
  },
  wonContainer: {
    borderLeftColor: '#4ADE80',
  },
  lostContainer: {
    borderLeftColor: '#F87171',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  betType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  betValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  betAmount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  result: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingResult: {
    color: '#FBBF24',
  },
  wonResult: {
    color: '#4ADE80',
  },
  lostResult: {
    color: '#F87171',
  },
  verifiableIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default BetHistoryItem;
