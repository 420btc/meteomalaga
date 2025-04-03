import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UserAlert } from '../types/alerts';

interface UserAlertItemProps {
  alert: UserAlert;
  currentValue?: number;
  isTriggered?: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

const UserAlertItem: React.FC<UserAlertItemProps> = ({
  alert,
  currentValue,
  isTriggered = false,
  onToggleActive,
  onDelete
}) => {
  const getAlertTypeIcon = () => {
    return alert.type === 'temperature' ? 'thermometer' : 'cloud-rain';
  };

  const getConditionText = () => {
    switch (alert.condition) {
      case 'above':
        return 'por encima de';
      case 'below':
        return 'por debajo de';
      case 'equals':
        return 'igual a';
      default:
        return '';
    }
  };

  const getUnitText = () => {
    return alert.type === 'temperature' ? '°C' : 'mm';
  };

  const getBackgroundColor = () => {
    if (!alert.active) {
      return 'rgba(100, 116, 139, 0.2)'; // Inactive
    }
    
    if (isTriggered) {
      return 'rgba(239, 68, 68, 0.2)'; // Triggered (red)
    }
    
    return alert.type === 'temperature' 
      ? 'rgba(249, 115, 22, 0.2)' // Temperature (orange)
      : 'rgba(59, 130, 246, 0.2)'; // Rain (blue)
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather 
            name={getAlertTypeIcon()} 
            size={16} 
            color={isTriggered ? '#EF4444' : '#FFFFFF'} 
            style={styles.icon}
          />
          <Text style={[
            styles.title, 
            isTriggered && styles.triggeredText
          ]}>
            {alert.name}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onToggleActive(alert.id)}
          >
            <Feather 
              name={alert.active ? 'bell' : 'bell-off'} 
              size={16} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onDelete(alert.id)}
          >
            <Feather name="trash-2" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          {alert.type === 'temperature' ? 'Temperatura' : 'Lluvia'} {getConditionText()} {alert.threshold}{getUnitText()}
        </Text>
        
        {currentValue !== undefined && (
          <View style={styles.currentValueContainer}>
            <Text style={styles.currentValueLabel}>Valor actual:</Text>
            <Text style={[
              styles.currentValue,
              isTriggered && styles.triggeredValue
            ]}>
              {currentValue.toFixed(1)}{getUnitText()}
            </Text>
          </View>
        )}
        
        {isTriggered && (
          <View style={styles.alertBadge}>
            <Feather name="alert-triangle" size={12} color="#FFFFFF" />
            <Text style={styles.alertBadgeText}>¡Alerta activada!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  triggeredText: {
    color: '#EF4444',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    padding: 12,
    paddingTop: 0,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginBottom: 8,
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentValueLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginRight: 4,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  triggeredValue: {
    color: '#EF4444',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  alertBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    marginLeft: 4,
  },
});

export default UserAlertItem;
