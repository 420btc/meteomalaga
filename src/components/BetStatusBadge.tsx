import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface BetStatusBadgeProps {
  status: 'ganada' | 'perdida' | 'pending' | string;
}

const BetStatusBadge: React.FC<BetStatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ganada':
        return '#4ADE80';
      case 'perdida':
        return '#F87171';
      case 'pending':
      default:
        return '#FBBF24';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ganada':
        return 'Ganada';
      case 'perdida':
        return 'Perdida';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ganada':
        return 'check-circle';
      case 'perdida':
        return 'x-circle';
      case 'pending':
      default:
        return 'clock';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: `${getStatusColor()}20` }]}>
      <Feather name={getStatusIcon()} size={12} color={getStatusColor()} style={styles.icon} />
      <Text style={[styles.text, { color: getStatusColor() }]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BetStatusBadge;
