import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WeatherIconProps {
  type: 'sun' | 'rain' | 'lightning' | 'cloud' | 'temp-hot' | 'temp-cold';
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({
  type,
  size = 24,
  color = '#FFFFFF',
  style,
}) => {
  const getIconName = (): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'sun':
        return 'sun';
      case 'rain':
        return 'cloud-rain';
      case 'lightning':
        return 'zap';
      case 'cloud':
        return 'cloud';
      case 'temp-hot':
        return 'thermometer';
      case 'temp-cold':
        return 'thermometer';
      default:
        return 'sun';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Feather name={getIconName()} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeatherIcon;
