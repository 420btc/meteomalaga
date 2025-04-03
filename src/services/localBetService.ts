import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bet } from '../types/weather';
import { addPendingReward } from './plantService';

// Constants
const BETS_STORAGE_KEY = 'bets';
const RESOLVED_BETS_STORAGE_KEY = 'recently_resolved_bets';
const VERIFICATION_INTERVAL = 60000; // 1 minute

// Get all local bets
export const getLocalBets = async (): Promise<Bet[]> => {
  try {
    const betsString = await AsyncStorage.getItem(BETS_STORAGE_KEY);
    if (!betsString) return [];
    
    return JSON.parse(betsString);
  } catch (error) {
    console.error('Error getting local bets:', error);
    return [];
  }
};

// Save a bet locally
export const saveBet = async (bet: Bet): Promise<Bet> => {
  try {
    const bets = await getLocalBets();
    
    // Add the new bet
    const newBet = {
      ...bet,
      id: Date.now(), // Use timestamp as ID
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    const updatedBets = [newBet, ...bets];
    await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(updatedBets));
    
    return newBet;
  } catch (error) {
    console.error('Error saving bet:', error);
    throw new Error('Error saving bet');
  }
};

// Resolve a bet with the actual value
export const resolveBet = async (betId: number, actualValue: number) => {
  try {
    const betsString = await AsyncStorage.getItem(BETS_STORAGE_KEY);
    if (!betsString) return;
    
    const bets = JSON.parse(betsString);
    const betIndex = bets.findIndex((bet: any) => bet.id === betId);
    
    if (betIndex === -1) return;
    
    const bet = bets[betIndex];
    
    // Determine if the bet was successful based on the bet type
    let success = false;
    let betType: 'rain' | 'temp_min' | 'temp_max' = 'rain';
    
    if (bet.type === 'rain') {
      // Rain bet: success if within ±2mm
      success = Math.abs(bet.value - actualValue) <= 2;
      betType = 'rain';
    } else if (bet.type === 'temperature_min') {
      // Min temperature bet: success if within ±1°C
      success = Math.abs(bet.value - actualValue) <= 1;
      betType = 'temp_min';
    } else if (bet.type === 'temperature_max') {
      // Max temperature bet: success if within ±1°C
      success = Math.abs(bet.value - actualValue) <= 1;
      betType = 'temp_max';
    }
    
    // Update bet status
    bet.status = success ? 'won' : 'lost';
    bet.actualValue = actualValue;
    bet.resolvedAt = new Date().toISOString();
    
    bets[betIndex] = bet;
    await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(bets));
    
    // Add reward to plant if bet was successful
    if (success) {
      await addPendingReward(betType, true);
    }
    
    return { success, bet };
  } catch (error) {
    console.error('Error resolving bet:', error);
    return { success: false };
  }
};

// Start background verification of bets
export const startBackgroundVerification = (
  callback: (resolvedBets: Bet[], coinsWon: number) => void
) => {
  let intervalId: NodeJS.Timeout;
  
  const verifyBets = async () => {
    try {
      const bets = await getLocalBets();
      const pendingBets = bets.filter(bet => bet.status === 'pending');
      
      if (pendingBets.length === 0) return;
      
      const now = new Date();
      const resolvedBets: Bet[] = [];
      let totalCoinsWon = 0;
      
      for (const bet of pendingBets) {
        const betDate = new Date(bet.date);
        
        // Check if bet date has passed
        if (betDate <= now) {
          // TODO: In a real app, we would fetch actual weather data here
          // For now, we'll use a random value for demonstration
          const actualValue = Math.random() * 30; // Random value between 0 and 30
          
          const { success, bet: resolvedBet } = await resolveBet(bet.id, actualValue) || {};
          
          if (resolvedBet) {
            resolvedBets.push(resolvedBet);
            
            if (success) {
              const winnings = bet.coins * bet.leverage;
              totalCoinsWon += winnings;
            }
          }
        }
      }
      
      if (resolvedBets.length > 0) {
        // Store recently resolved bets
        await storeRecentlyResolvedBets(resolvedBets);
        
        // Call the callback with resolved bets and coins won
        callback(resolvedBets, totalCoinsWon);
      }
    } catch (error) {
      console.error('Error verifying bets:', error);
    }
  };
  
  // Start the interval
  intervalId = setInterval(verifyBets, VERIFICATION_INTERVAL);
  
  // Return a function to stop the interval
  return () => {
    clearInterval(intervalId);
  };
};

// Store recently resolved bets
const storeRecentlyResolvedBets = async (resolvedBets: Bet[]) => {
  try {
    const recentlyResolvedBetsString = await AsyncStorage.getItem(RESOLVED_BETS_STORAGE_KEY);
    let recentlyResolvedBets: Bet[] = [];
    
    if (recentlyResolvedBetsString) {
      recentlyResolvedBets = JSON.parse(recentlyResolvedBetsString);
    }
    
    // Add new resolved bets
    recentlyResolvedBets = [...recentlyResolvedBets, ...resolvedBets];
    
    // Store the updated list
    await AsyncStorage.setItem(RESOLVED_BETS_STORAGE_KEY, JSON.stringify(recentlyResolvedBets));
  } catch (error) {
    console.error('Error storing recently resolved bets:', error);
  }
};

// Get and clear recently resolved bets
export const getAndClearRecentlyResolvedBets = async (): Promise<Bet[]> => {
  try {
    const recentlyResolvedBetsString = await AsyncStorage.getItem(RESOLVED_BETS_STORAGE_KEY);
    
    if (!recentlyResolvedBetsString) {
      return [];
    }
    
    const recentlyResolvedBets: Bet[] = JSON.parse(recentlyResolvedBetsString);
    
    // Clear the list
    await AsyncStorage.setItem(RESOLVED_BETS_STORAGE_KEY, JSON.stringify([]));
    
    return recentlyResolvedBets;
  } catch (error) {
    console.error('Error getting and clearing recently resolved bets:', error);
    return [];
  }
};

// Clean up old bets (older than 30 days)
export const cleanupOldBets = async (): Promise<void> => {
  try {
    const bets = await getLocalBets();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const filteredBets = bets.filter(bet => {
      const betDate = new Date(bet.timestamp);
      return betDate >= thirtyDaysAgo;
    });
    
    if (filteredBets.length !== bets.length) {
      await AsyncStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(filteredBets));
    }
  } catch (error) {
    console.error('Error cleaning up old bets:', error);
  }
};

// Calculate odds for temperature bets
export const getTemperatureOdds = (temperature: number, isMin: boolean): number => {
  // Base odds calculation
  const baseOdds = 1.5;
  
  // Adjust odds based on temperature extremity
  // For minimum temperature, lower values have higher odds
  // For maximum temperature, higher values have higher odds
  const extremityFactor = isMin 
    ? Math.max(0, (20 - temperature) / 10) // Lower min temps get higher odds
    : Math.max(0, (temperature - 20) / 10); // Higher max temps get higher odds
  
  // Calculate final odds (between 1.2 and 3.0)
  return Math.min(3.0, Math.max(1.2, baseOdds + extremityFactor));
};

// Get remaining temperature bets for today
export const getRemainingTemperatureBets = async (): Promise<number> => {
  try {
    const bets = await getLocalBets();
    const today = new Date().toISOString().split('T')[0];
    
    // Count temperature bets made today
    const tempBetsToday = bets.filter(bet => {
      const betDate = new Date(bet.timestamp).toISOString().split('T')[0];
      return betDate === today && (bet.option === 'temp_min' || bet.option === 'temp_max');
    });
    
    // Maximum 2 temperature bets per day
    return Math.max(0, 2 - tempBetsToday.length);
  } catch (error) {
    console.error('Error getting remaining temperature bets:', error);
    return 0;
  }
};

// Show notification about resolved bets
export const showBetResolutionNotification = (resolvedBets: Bet[], coinsWon: number): void => {
  // In a real app, this would show a notification
  // For now, we'll just log to console
  console.log('Bets resolved:', resolvedBets.length);
  console.log('Coins won:', coinsWon);
};
