import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Feather } from '@expo/vector-icons';
import { isBettingAllowed, getRemainingRainBets, getRemainingTemperatureBets, getRemainingWindBets } from '../services/localSupabaseService';

type ForecastBannerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForecastBanner: React.FC = () => {
  const navigation = useNavigation<ForecastBannerNavigationProp>();
  const [bettingAllowed, setBettingAllowed] = useState(false);
  const [remainingRainBets, setRemainingRainBets] = useState(3);
  const [remainingTempBets, setRemainingTempBets] = useState(2);
  const [remainingWindBets, setRemainingWindBets] = useState(2);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    checkBettingStatus();
    
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Set up interval to check betting status every minute
    const intervalId = setInterval(checkBettingStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const checkBettingStatus = async () => {
    try {
      const allowed = await isBettingAllowed('rain');
      setBettingAllowed(allowed);
      
      // Get remaining bets counts
      const rainBets = await getRemainingRainBets();
      const tempBets = await getRemainingTemperatureBets();
      const windBets = await getRemainingWindBets();
      
      setRemainingRainBets(rainBets);
      setRemainingTempBets(tempBets);
      setRemainingWindBets(windBets);
    } catch (error) {
      console.error('Error checking betting status:', error);
    }
  };
  
  const navigateToBetting = () => {
    navigation.navigate('CombinedBet');
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.banner} onPress={navigateToBetting}>
        <View style={styles.iconContainer}>
          <Feather name={bettingAllowed ? "unlock" : "lock"} size={24} color="#FFFFFF" />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>
            {bettingAllowed 
              ? "¡Apuestas de lluvia abiertas!" 
              : "Apuestas de lluvia cerradas"}
          </Text>
          
          <View style={styles.betsInfoContainer}>
            <View style={styles.betTypeInfo}>
              <Text style={styles.betTypeText}>Lluvia: </Text>
              <Text style={styles.betCountText}>{remainingRainBets}/3</Text>
            </View>
            
            <View style={styles.betTypeInfo}>
              <Text style={styles.betTypeText}>Temperatura: </Text>
              <Text style={styles.betCountText}>{remainingTempBets}/2</Text>
            </View>
            
            <View style={styles.betTypeInfo}>
              <Text style={styles.betTypeText}>Viento: </Text>
              <Text style={styles.betCountText}>{remainingWindBets}/2</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  betsInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  betTypeInfo: {
    flexDirection: 'row',
    marginRight: 12,
    alignItems: 'center',
  },
  betTypeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  betCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});

export default ForecastBanner;
