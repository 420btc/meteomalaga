import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type PlantButtonNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface PlantButtonProps {
  style?: object;
}

const PlantButton: React.FC<PlantButtonProps> = ({ style }) => {
  const navigation = useNavigation<PlantButtonNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    // Create a subtle pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  const handlePress = () => {
    navigation.navigate('MeteoPlant');
  };
  
  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [{ scale: scaleAnim }]
        },
        style
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel="Mi Planta"
        accessibilityRole="button"
      >
        <View style={styles.buttonContent}>
          <Text style={styles.plantEmoji}>🪴</Text>
          <Text style={styles.buttonText}>Mi planta</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    height: 30,
    alignSelf: 'flex-start',
  },
  container: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#32CD32',
    backgroundColor: '#4682B4',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  plantEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default PlantButton;
