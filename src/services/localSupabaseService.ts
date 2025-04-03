import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bet, BetResult, BetStatus, BetOption } from '../types/weather';
import { fetchCurrentRainData, fetchCurrentTemperatureData, fetchCurrentWindData, isWithinBettingWindow, isWithinBettingWindowSync } from './weatherService';
import { getRainOdds, getTemperatureOdds, getWindOdds } from './oddsService';

// Constants
const LOCAL_BETS_STORAGE_KEY = 'local_bets';
const TEMP_BETS_COUNT_KEY = 'daily_temp_bets';
const WIND_BETS_TIMESTAMP_KEY = 'last_wind_bet_timestamp';
const WIND_BETS_COUNT_KEY = 'wind_bets_count';
const RAIN_BETS_COUNT_KEY = 'rain_bets_count';
const LAST_BET_TIMESTAMP_KEY = 'last_bet_timestamp';
const BET_LOCK_KEY = 'bet_lock';

// Function to add a new bet (replaces addBetToSupabase)
export const addBet = async (bet: Bet): Promise<Bet | null> => {
  try {
    // Prevent rapid consecutive bets (anti-spam protection)
    if (await isBetLocked()) {
      console.log('Bet is locked. Waiting for unlock...');
      // Force unlock if it's been locked for more than 10 seconds
      const lockTimestamp = await AsyncStorage.getItem('bet_lock_timestamp');
      if (lockTimestamp) {
        const lockTime = new Date(lockTimestamp).getTime();
        const now = new Date().getTime();
        if (now - lockTime > 10000) { // 10 seconds
          console.log('Force unlocking bet after 10 seconds');
          await unlockBetting();
        } else {
          throw new Error('Por favor, espera unos segundos antes de realizar otra apuesta');
        }
      } else {
        throw new Error('Por favor, espera unos segundos antes de realizar otra apuesta');
      }
    }
    
    // Lock betting temporarily to prevent rapid consecutive bets
    await lockBetting();
    
    // Check if betting is allowed based on bet type
    const isTemperatureBet = bet.option === 'temperature' || bet.option === 'temp_min' || bet.option === 'temp_max';
    const isWindBet = bet.option === 'wind_max';
    const isRainBet = bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount';
    
    console.log('Bet type check:', { isTemperatureBet, isWindBet, isRainBet, option: bet.option });
    
    // For temperature bets, check daily limit
    if (isTemperatureBet) {
      const remainingBets = await getRemainingTemperatureBets(bet.user_id || 'anonymous');
      if (remainingBets <= 0) {
        // Unlock betting before throwing error
        await unlockBetting();
        throw new Error('Has alcanzado el límite de 2 apuestas de temperatura para hoy');
      }
    }
    
    // For wind bets, check 12-hour limit
    if (isWindBet) {
      const remainingWindBets = await getRemainingWindBets();
      if (remainingWindBets <= 0) {
        // Unlock betting before throwing error
        await unlockBetting();
        throw new Error('Has alcanzado el límite de 2 apuestas de viento cada 12 horas');
      }
    }
    
    // Calculate appropriate odds based on bet type and value
    let calculatedLeverage = 1;
    if (isRainBet && bet.option === 'rain_amount' && bet.value !== null) {
      calculatedLeverage = getRainOdds(bet.value);
    } else if (isTemperatureBet && bet.value !== null) {
      calculatedLeverage = getTemperatureOdds(bet.value);
    } else if (isWindBet && bet.value !== null) {
      calculatedLeverage = getWindOdds(bet.value);
    } else if (bet.option === 'rain_yes') {
      calculatedLeverage = 3.0; // Fixed odds for "will rain" bets
    } else if (bet.option === 'rain_no') {
      calculatedLeverage = 1.2; // Fixed odds for "won't rain" bets
    }
    
    // Prepare the bet data
    const betData: Bet = {
      ...bet,
      id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      date: bet.date || new Date().toISOString().split('T')[0],
      option: bet.option,
      value: bet.value,
      coins: bet.coins,
      leverage: calculatedLeverage, // Use calculated odds
      timestamp: bet.timestamp || new Date().toISOString(),
      result: bet.result || null,
      won: bet.won || null,
      city: bet.city || 'Málaga',
      mode: bet.mode || 'Simple',
      rain_mm: bet.rain_mm || null,
      resolution_date: bet.resolution_date || (() => {
        // If no resolution date, set to 24h after the bet timestamp
        const betTime = new Date(bet.timestamp || new Date().toISOString());
        const resolutionTime = new Date(betTime);
        
        // Set resolution time based on bet type
        if (bet.option === 'wind_max') {
          resolutionTime.setHours(resolutionTime.getHours() + 12);
        } else {
          resolutionTime.setHours(resolutionTime.getHours() + 24);
        }
        
        return resolutionTime.toISOString().split('T')[0];
      })(),
      user_id: bet.user_id || 'anonymous',
      status: bet.status || 'pending',
      verificationTime: (() => {
        // Create verification time (24 hours from now by default, 12 hours for temperature and wind bets)
        const now = new Date();
        const verificationTime = new Date(now);
        
        // Set verification time based on bet type
        const isTemperatureBet = bet.option === 'temperature' || bet.option === 'temp_min' || bet.option === 'temp_max';
        const isWindBet = bet.option === 'wind_max';
        const resolutionHours = isTemperatureBet || isWindBet || bet.bet_resolution_hours === 12 ? 12 : 24;
        
        verificationTime.setHours(verificationTime.getHours() + resolutionHours);
        return verificationTime.toISOString();
      })(),
      verified: false
    };

    // Set bet type
    betData.bet_type = getBetTypeFromOption(bet.option);
    
    // Set temperature values if applicable
    if (bet.option === 'temp_min') {
      betData.temp_min_c = bet.value;
    } else if (bet.option === 'temp_max') {
      betData.temp_max_c = bet.value;
    } else if (bet.option === 'wind_max') {
      betData.wind_kmh_max = bet.value;
    }
    
    // Set range values for Pro mode
    if (bet.mode === 'Pro' && bet.value !== null) {
      const margin = getMarginFromLeverage(bet.leverage);
      betData.range_min = Math.max(-50, bet.value - margin);
      betData.range_max = Math.min(999, bet.value + margin);
    }

    // Get existing bets
    const existingBetsJson = await AsyncStorage.getItem(LOCAL_BETS_STORAGE_KEY);
    const existingBets: Bet[] = existingBetsJson ? JSON.parse(existingBetsJson) : [];
    
    // Add new bet
    const updatedBets = [...existingBets, betData];
    
    // Save updated bets
    await AsyncStorage.setItem(LOCAL_BETS_STORAGE_KEY, JSON.stringify(updatedBets));

    // If it's a temperature bet, update the daily count
    if (bet.option === 'temp_min' || bet.option === 'temp_max') {
      await incrementDailyTemperatureBetCount();
    }
    
    // If it's a wind bet, update the count
    if (bet.option === 'wind_max') {
      await incrementWindBetCount();
    }
    
    // If it's a rain bet, update the count
    if (bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
      await incrementRainBetCount();
    }
    
    // Store last bet timestamp for rate limiting
    await AsyncStorage.setItem(LAST_BET_TIMESTAMP_KEY, new Date().toISOString());
    
    // Unlock betting after successful bet
    setTimeout(async () => {
      await unlockBetting();
    }, 2000);

    return betData;
  } catch (error) {
    console.error('Error in addBet:', error);
    // Make sure to unlock betting in case of error
    await unlockBetting();
    throw error;
  }
};

// Function to get all bets (replaces getBetsFromSupabase)
export const getBets = async (userId: string = 'anonymous'): Promise<Bet[]> => {
  try {
    const betsJson = await AsyncStorage.getItem(LOCAL_BETS_STORAGE_KEY);
    const allBets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
    
    // Filter by user ID
    const userBets = allBets.filter(bet => bet.user_id === userId);
    
    // Sort by timestamp (newest first)
    return userBets.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error in getBets:', error);
    return [];
  }
};

// Function to update bet result (replaces updateBetResultInSupabase)
export const updateBetResult = async (betResult: BetResult): Promise<boolean> => {
  try {
    const betsJson = await AsyncStorage.getItem(LOCAL_BETS_STORAGE_KEY);
    const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
    
    // Find the bet to update
    const betIndex = bets.findIndex(bet => bet.id === betResult.betId);
    
    if (betIndex === -1) {
      return false;
    }
    
    // Update the bet
    bets[betIndex] = {
      ...bets[betIndex],
      result: betResult.result,
      won: betResult.won,
      status: betResult.won ? 'ganada' : 'perdida',
      verified: true
    };
    
    // Save updated bets
    await AsyncStorage.setItem(LOCAL_BETS_STORAGE_KEY, JSON.stringify(bets));
    
    return true;
  } catch (error) {
    console.error('Error in updateBetResult:', error);
    return false;
  }
};

// Function to evaluate pending bets (replaces evaluatePendingBets)
export const evaluatePendingBets = async (userId: string = 'anonymous'): Promise<BetResult[]> => {
  try {
    // Get current date and time
    const now = new Date();
    
    // Get all bets
    const betsJson = await AsyncStorage.getItem(LOCAL_BETS_STORAGE_KEY);
    const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
    
    // Filter pending bets for the user that should be resolved now
    const betsToResolve = bets.filter(bet => 
      bet.status === 'pending' && 
      bet.user_id === userId && 
      !bet.verified && 
      new Date(bet.verificationTime) <= now
    );
    
    if (betsToResolve.length === 0) {
      return [];
    }
    
    // Get current weather data
    const currentRainAmount = await fetchCurrentRainData();
    const currentTemperature = await fetchCurrentTemperatureData();
    const currentWind = await fetchCurrentWindData();
    
    // Evaluate each bet
    const results: BetResult[] = [];
    const updatedBets = [...bets];
    
    for (const bet of betsToResolve) {
      let result = 0;
      let won = false;
      let margin = 0;
      let resolution_explanation = '';
      
      // Determine the actual result based on bet type
      if (bet.bet_type === 'rain' || bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
        result = currentRainAmount;
      } else if (bet.bet_type === 'temp_min' || bet.option === 'temp_min') {
        result = currentTemperature.min;
      } else if (bet.bet_type === 'temp_max' || bet.option === 'temp_max') {
        result = currentTemperature.max;
      } else if (bet.option === 'temperature') {
        result = currentTemperature.current;
      } else if (bet.option === 'wind_max') {
        result = currentWind.max;
      }
      
      // Determine if bet is won based on bet type and mode
      if (bet.mode === 'Simple') {
        // Simple mode: exact match
        if (bet.option === 'rain_yes') {
          won = result > 0;
          if (won) {
            resolution_explanation = `¡Ganaste! Predijiste correctamente que llovería. La cantidad de lluvia registrada fue de ${result} mm.`;
          } else {
            resolution_explanation = `Perdiste. Predijiste que llovería, pero no se registró lluvia (0 mm).`;
          }
        } else if (bet.option === 'rain_no') {
          won = result === 0;
          if (won) {
            resolution_explanation = `¡Ganaste! Predijiste correctamente que no llovería. No se registró lluvia (0 mm).`;
          } else {
            resolution_explanation = `Perdiste. Predijiste que no llovería, pero se registraron ${result} mm de lluvia.`;
          }
        } else if (bet.option === 'rain_amount') {
          const betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
          won = Math.abs((betValue || 0) - result) <= 0.5; // Win if within ±0.5mm
          if (won) {
            resolution_explanation = `¡Ganaste! Tu predicción de ${betValue} mm de lluvia estaba dentro del margen de ±0.5 mm del valor real (${result} mm).`;
          } else {
            resolution_explanation = `Perdiste. Tu predicción de ${betValue} mm de lluvia difería más de ±0.5 mm del valor real (${result} mm).`;
          }
        } else if (bet.option === 'temp_min') {
          const betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
          won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
          if (won) {
            resolution_explanation = `¡Ganaste! Tu predicción de temperatura mínima de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
          } else {
            resolution_explanation = `Perdiste. Tu predicción de temperatura mínima de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
          }
        } else if (bet.option === 'temp_max') {
          const betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
          won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
          if (won) {
            resolution_explanation = `¡Ganaste! Tu predicción de temperatura máxima de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
          } else {
            resolution_explanation = `Perdiste. Tu predicción de temperatura máxima de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
          }
        } else if (bet.option === 'temperature') {
          const betValue = bet.temperature_c !== null ? bet.temperature_c : bet.value;
          won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
          if (won) {
            resolution_explanation = `¡Ganaste! Tu predicción de temperatura actual de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
          } else {
            resolution_explanation = `Perdiste. Tu predicción de temperatura actual de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
          }
        } else if (bet.option === 'wind_max') {
          const betValue = bet.wind_kmh_max !== null ? bet.wind_kmh_max : bet.value;
          won = Math.abs((betValue || 0) - result) <= 3.0; // Win if within ±3.0 km/h
          if (won) {
            resolution_explanation = `¡Ganaste! Tu predicción de velocidad máxima del viento de ${betValue} km/h estaba dentro del margen de ±3.0 km/h del valor real (${result} km/h).`;
          } else {
            resolution_explanation = `Perdiste. Tu predicción de velocidad máxima del viento de ${betValue} km/h difería más de ±3.0 km/h del valor real (${result} km/h).`;
          }
        }
      } else if (bet.mode === 'Pro') {
        // Pro mode: within margin based on leverage
        margin = getMarginFromLeverage(bet.leverage);
        
        // Check if result is within range
        if (bet.range_min !== null && bet.range_max !== null) {
          won = result >= bet.range_min && result <= bet.range_max;
          if (won) {
            resolution_explanation = `¡Ganaste! El valor real (${result}) estaba dentro del rango que predijiste (${bet.range_min} - ${bet.range_max}).`;
          } else {
            resolution_explanation = `Perdiste. El valor real (${result}) estaba fuera del rango que predijiste (${bet.range_min} - ${bet.range_max}).`;
          }
        } else {
          // Fallback to checking if the value is within margin of the target
          let betValue = null;
          
          if (bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
            betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
          } else if (bet.option === 'temp_min') {
            betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
          } else if (bet.option === 'temp_max') {
            betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
          } else if (bet.option === 'temperature') {
            betValue = bet.temperature_c !== null ? bet.temperature_c : bet.value;
          } else if (bet.option === 'wind_max') {
            betValue = bet.wind_kmh_max !== null ? bet.wind_kmh_max : bet.value;
          }
          
          if (betValue !== null) {
            won = Math.abs(result - betValue) <= margin;
            if (won) {
              resolution_explanation = `¡Ganaste! Tu predicción de ${betValue} estaba dentro del margen de ±${margin} del valor real (${result}).`;
            } else {
              resolution_explanation = `Perdiste. Tu predicción de ${betValue} difería más de ±${margin} del valor real (${result}).`;
            }
          }
        }
      }
      
      // Find the bet in the array and update it
      const betIndex = updatedBets.findIndex(b => b.id === bet.id);
      if (betIndex !== -1) {
        updatedBets[betIndex] = {
          ...updatedBets[betIndex],
          result,
          won,
          verified: true,
          status: won ? 'ganada' : 'perdida',
          resolution_explanation
        };
      }
      
      // Add to results
      results.push({
        betId: bet.id,
        result,
        won,
        margin
      });
    }
    
    // Save updated bets
    await AsyncStorage.setItem(LOCAL_BETS_STORAGE_KEY, JSON.stringify(updatedBets));
    
    return results;
  } catch (error) {
    console.error('Error in evaluatePendingBets:', error);
    return [];
  }
};

// Function to check if betting is allowed
export const isBettingAllowed = async (betType?: string): Promise<boolean> => {
  try {
    // Check if betting is locked (anti-spam protection)
    if (await isBetLocked()) {
      console.log('Betting is locked (anti-spam protection)');
      return false;
    }
    
    // Temperature bets are allowed at any time
    if (betType === 'temperature' || betType === 'temp_min' || betType === 'temp_max') {
      console.log('Temperature betting is always allowed');
      return true;
    }
    
    // Wind bets are allowed at any time but limited to twice per 12 hours
    if (betType === 'wind') {
      const remainingWindBets = await getRemainingWindBets();
      console.log('Wind betting check:', remainingWindBets > 0);
      return remainingWindBets > 0;
    }
    
    // Rain bets are allowed at any time but limited to 3 bets per window
    if (betType === 'rain' || betType === 'rain_yes' || betType === 'rain_no' || betType === 'rain_amount') {
      const remainingBets = await getRemainingRainBets();
      console.log('Rain betting allowed check in isBettingAllowed:', true, 'Remaining bets:', remainingBets);
      return remainingBets > 0;
    }
    
    // All other bet types are allowed
    console.log('General betting allowed check in isBettingAllowed:', true, 'Bet type:', betType);
    return true;
  } catch (error) {
    console.error('Error checking if betting is allowed:', error);
    return false;
  }
};

// Function to check if temperature betting is allowed (max 2 per day)
export const isTemperatureBettingAllowed = async (userId: string = 'anonymous'): Promise<boolean> => {
  try {
    // Check if betting is locked (anti-spam protection)
    if (await isBetLocked()) {
      return false;
    }
    
    const count = await getDailyTemperatureBetCount();
    return count < 2;
  } catch (error) {
    console.error('Error in isTemperatureBettingAllowed:', error);
    return false;
  }
};

// Function to get remaining temperature bets for today
export const getRemainingTemperatureBets = async (userId: string = 'anonymous'): Promise<number> => {
  try {
    const count = await getDailyTemperatureBetCount();
    return Math.max(0, 2 - count);
  } catch (error) {
    console.error('Error in getRemainingTemperatureBets:', error);
    return 0;
  }
};

// Function to check if wind betting is allowed (twice per 12 hours)
export const canPlaceWindBetNow = async (): Promise<boolean> => {
  try {
    return await getRemainingWindBets() > 0;
  } catch (error) {
    console.error('Error checking wind bet availability:', error);
    return false;
  }
};

// Function to get remaining wind bets
export const getRemainingWindBets = async (): Promise<number> => {
  try {
    // Check if we need to reset the wind bet count
    await checkAndResetWindBetCount();
    
    // Get current wind bet count
    const countJson = await AsyncStorage.getItem(WIND_BETS_COUNT_KEY);
    const countData = countJson ? JSON.parse(countJson) : { count: 0, timestamp: new Date().toISOString() };
    
    // Maximum 2 wind bets per 12 hours
    return Math.max(0, 2 - countData.count);
  } catch (error) {
    console.error('Error getting remaining wind bets:', error);
    return 0;
  }
};

// Function to get remaining rain bets
export const getRemainingRainBets = async (): Promise<number> => {
  try {
    // Check if we need to reset the rain bet count
    await checkAndResetRainBetCount();
    
    // Get current rain bet count
    const countJson = await AsyncStorage.getItem(RAIN_BETS_COUNT_KEY);
    const countData = countJson ? JSON.parse(countJson) : { count: 0, timestamp: new Date().toISOString() };
    
    console.log('Current rain bet count data:', countData);
    
    // Maximum 3 rain bets per window
    return Math.max(0, 3 - countData.count);
  } catch (error) {
    console.error('Error getting remaining rain bets:', error);
    return 0;
  }
};

// Function to get time until next wind bet is allowed
export const getTimeUntilNextWindBet = async (): Promise<number> => {
  try {
    // If there are remaining bets, return 0
    const remainingBets = await getRemainingWindBets();
    if (remainingBets > 0) {
      return 0;
    }
    
    // Get the timestamp of the last wind bet count reset
    const countJson = await AsyncStorage.getItem(WIND_BETS_COUNT_KEY);
    if (!countJson) {
      return 0;
    }
    
    const countData = JSON.parse(countJson);
    const lastResetTime = new Date(countData.timestamp);
    const nextResetTime = new Date(lastResetTime);
    nextResetTime.setHours(nextResetTime.getHours() + 12);
    
    const now = new Date();
    if (nextResetTime <= now) {
      return 0;
    }
    
    // Return minutes until next reset
    return Math.ceil((nextResetTime.getTime() - now.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('Error calculating time until next wind bet:', error);
    return 0;
  }
};

// Helper function to get bet type from option
const getBetTypeFromOption = (option: BetOption): string => {
  if (option === 'rain_yes' || option === 'rain_no' || option === 'rain_amount') {
    return 'rain';
  } else if (option === 'temp_min') {
    return 'temp_min';
  } else if (option === 'temp_max') {
    return 'temp_max';
  } else if (option === 'temperature') {
    return 'temperature';
  } else if (option === 'wind_max') {
    return 'wind';
  } else {
    return 'rain'; // Default
  }
};

// Helper function to get margin from leverage
const getMarginFromLeverage = (leverage: number): number => {
  switch (leverage) {
    case 2: return 5;
    case 5: return 4;
    case 10: return 3;
    case 20: return 2;
    case 50: return 1;
    case 100: return 0;
    default: return 5;
  }
};

// Function to resolve bets
export const resolveBets = async (): Promise<void> => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all bets
    const betsJson = await AsyncStorage.getItem(LOCAL_BETS_STORAGE_KEY);
    const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
    
    // Filter pending bets with resolution dates in the past
    const pendingBets = bets.filter(bet => 
      bet.status === 'pending' && 
      !bet.verified &&
      new Date(bet.verificationTime) <= now
    );
    
    if (pendingBets.length === 0) {
      return;
    }
    
    // Get current weather data
    const currentRainAmount = await fetchCurrentRainData();
    const currentTemperature = await fetchCurrentTemperatureData();
    const currentWind = await fetchCurrentWindData();
    
    // Process each bet
    const updatedBets = [...bets];
    
    for (const bet of pendingBets) {
      // Determine if bet is won
      let won = false;
      let result = 0;
      let resolution_explanation = '';
      
      if (bet.option === 'rain_amount') {
        result = currentRainAmount;
        const betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
        won = Math.abs((betValue || 0) - result) <= 0.5; // Win if within ±0.5mm
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de ${betValue} mm de lluvia estaba dentro del margen de ±0.5 mm del valor real (${result} mm).`;
        } else {
          resolution_explanation = `Perdiste. Tu predicción de ${betValue} mm de lluvia difería más de ±0.5 mm del valor real (${result} mm).`;
        }
      } else if (bet.option === 'rain_yes') {
        result = currentRainAmount;
        won = result > 0;
        if (won) {
          resolution_explanation = `¡Ganaste! Predijiste correctamente que llovería. La cantidad de lluvia registrada fue de ${result} mm.`;
        } else {
          resolution_explanation = `Perdiste. Predijiste que llovería, pero no se registró lluvia (0 mm).`;
        }
      } else if (bet.option === 'rain_no') {
        result = currentRainAmount;
        won = result === 0;
        if (won) {
          resolution_explanation = `¡Ganaste! Predijiste correctamente que no llovería. No se registró lluvia (0 mm).`;
        } else {
          resolution_explanation = `Perdiste. Predijiste que no llovería, pero se registraron ${result} mm de lluvia.`;
        }
      } else if (bet.option === 'temp_min') {
        result = currentTemperature.min;
        const betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
        won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de temperatura mínima de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
        } else {
          resolution_explanation = `Perdiste. Tu predicción de temperatura mínima de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
        }
      } else if (bet.option === 'temp_max') {
        result = currentTemperature.max;
        const betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
        won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de temperatura máxima de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
        } else {
          resolution_explanation = `Perdiste. Tu predicción de temperatura máxima de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
        }
      } else if (bet.option === 'temperature') {
        result = currentTemperature.current;
        const betValue = bet.temperature_c !== null ? bet.temperature_c : bet.value;
        won = Math.abs((betValue || 0) - result) <= 1.0; // Win if within ±1.0°C
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de temperatura actual de ${betValue}°C estaba dentro del margen de ±1.0°C del valor real (${result}°C).`;
        } else {
          resolution_explanation = `Perdiste. Tu predicción de temperatura actual de ${betValue}°C difería más de ±1.0°C del valor real (${result}°C).`;
        }
      } else if (bet.option === 'wind_max') {
        result = currentWind.max;
        const betValue = bet.wind_kmh_max !== null ? bet.wind_kmh_max : bet.value;
        won = Math.abs((betValue || 0) - result) <= 3.0; // Win if within ±3.0 km/h
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de velocidad máxima del viento de ${betValue} km/h estaba dentro del margen de ±3.0 km/h del valor real (${result} km/h).`;
        } else {
          resolution_explanation = `Perdiste. Tu predicción de velocidad máxima del viento de ${betValue} km/h difería más de ±3.0 km/h del valor real (${result} km/h).`;
        }
      }
      
      // Find the bet in the array and update it
      const betIndex = updatedBets.findIndex(b => b.id === bet.id);
      if (betIndex !== -1) {
        updatedBets[betIndex] = {
          ...updatedBets[betIndex],
          result,
          won,
          verified: true,
          status: won ? 'ganada' : 'perdida',
          resolution_explanation
        };
      }
    }
    
    // Save updated bets
    await AsyncStorage.setItem(LOCAL_BETS_STORAGE_KEY, JSON.stringify(updatedBets));
  } catch (error) {
    console.error('Error resolving bets:', error);
  }
};

// Helper functions for daily temperature bet count
const getDailyTemperatureBetCount = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const countJson = await AsyncStorage.getItem(TEMP_BETS_COUNT_KEY);
    const counts = countJson ? JSON.parse(countJson) : {};
    
    return counts[today] || 0;
  } catch (error) {
    console.error('Error getting daily temperature bet count:', error);
    return 0;
  }
};

const incrementDailyTemperatureBetCount = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const countJson = await AsyncStorage.getItem(TEMP_BETS_COUNT_KEY);
    const counts = countJson ? JSON.parse(countJson) : {};
    
    counts[today] = (counts[today] || 0) + 1;
    
    // Clean up old entries (keep only last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const cleanedCounts = {};
    for (const [date, count] of Object.entries(counts)) {
      if (new Date(date) >= sevenDaysAgo) {
        cleanedCounts[date] = count;
      }
    }
    
    await AsyncStorage.setItem(TEMP_BETS_COUNT_KEY, JSON.stringify(cleanedCounts));
  } catch (error) {
    console.error('Error incrementing daily temperature bet count:', error);
  }
};

// Helper functions for wind bet count
const incrementWindBetCount = async (): Promise<void> => {
  try {
    // Check if we need to reset the count first
    await checkAndResetWindBetCount();
    
    // Get current count
    const countJson = await AsyncStorage.getItem(WIND_BETS_COUNT_KEY);
    const countData = countJson ? JSON.parse(countJson) : { count: 0, timestamp: new Date().toISOString() };
    
    // Increment count
    countData.count += 1;
    
    // Save updated count
    await AsyncStorage.setItem(WIND_BETS_COUNT_KEY, JSON.stringify(countData));
  } catch (error) {
    console.error('Error incrementing wind bet count:', error);
  }
};

const checkAndResetWindBetCount = async (): Promise<void> => {
  try {
    const countJson = await AsyncStorage.getItem(WIND_BETS_COUNT_KEY);
    if (!countJson) return;
    
    const countData = JSON.parse(countJson);
    const lastTimestamp = new Date(countData.timestamp);
    const now = new Date();
    
    // Calculate hours difference
    const hoursDiff = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
    
    // Reset if 12 hours have passed
    if (hoursDiff >= 12) {
      await AsyncStorage.setItem(WIND_BETS_COUNT_KEY, JSON.stringify({ count: 0, timestamp: now.toISOString() }));
    }
  } catch (error) {
    console.error('Error checking and resetting wind bet count:', error);
  }
};

// Helper functions for rain bet count
const incrementRainBetCount = async (): Promise<void> => {
  try {
    // Check if we need to reset the count first
    await checkAndResetRainBetCount();
    
    // Get current count
    const countJson = await AsyncStorage.getItem(RAIN_BETS_COUNT_KEY);
    const countData = countJson ? JSON.parse(countJson) : { count: 0, timestamp: new Date().toISOString() };
    
    // Increment count
    countData.count += 1;
    
    console.log('Incrementing rain bet count to:', countData.count);
    
    // Save updated count
    await AsyncStorage.setItem(RAIN_BETS_COUNT_KEY, JSON.stringify(countData));
  } catch (error) {
    console.error('Error incrementing rain bet count:', error);
  }
};

const checkAndResetRainBetCount = async (): Promise<void> => {
  try {
    const countJson = await AsyncStorage.getItem(RAIN_BETS_COUNT_KEY);
    if (!countJson) return;
    
    const countData = JSON.parse(countJson);
    const lastTimestamp = new Date(countData.timestamp);
    const now = new Date();
    
    // Check if we're in a new betting window
    const lastDate = lastTimestamp.toISOString().split('T')[0];
    const currentDate = now.toISOString().split('T')[0];
    
    // Reset if date has changed
    if (lastDate !== currentDate) {
      console.log('Resetting rain bet count - new day');
      await AsyncStorage.setItem(RAIN_BETS_COUNT_KEY, JSON.stringify({ count: 0, timestamp: now.toISOString() }));
    }
  } catch (error) {
    console.error('Error checking and resetting rain bet count:', error);
  }
};

// Anti-spam protection functions
const lockBetting = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BET_LOCK_KEY, 'locked');
    await AsyncStorage.setItem('bet_lock_timestamp', new Date().toISOString());
  } catch (error) {
    console.error('Error locking betting:', error);
  }
};

const unlockBetting = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BET_LOCK_KEY);
    await AsyncStorage.removeItem('bet_lock_timestamp');
  } catch (error) {
    console.error('Error unlocking betting:', error);
  }
};

const isBetLocked = async (): Promise<boolean> => {
  try {
    const lockStatus = await AsyncStorage.getItem(BET_LOCK_KEY);
    return lockStatus === 'locked';
  } catch (error) {
    console.error('Error checking bet lock status:', error);
    return false;
  }
};

// New function to reset all bet counters (for debugging)
export const resetAllBetCounters = async (): Promise<void> => {
  try {
    console.log('Resetting all bet counters');
    
    // Reset temperature bet count
    const today = new Date().toISOString().split('T')[0];
    const tempCounts = { [today]: 0 };
    await AsyncStorage.setItem(TEMP_BETS_COUNT_KEY, JSON.stringify(tempCounts));
    
    // Reset wind bet count
    await AsyncStorage.setItem(WIND_BETS_COUNT_KEY, JSON.stringify({ count: 0, timestamp: new Date().toISOString() }));
    
    // Reset rain bet count
    await AsyncStorage.setItem(RAIN_BETS_COUNT_KEY, JSON.stringify({ count: 0, timestamp: new Date().toISOString() }));
    
    // Unlock betting
    await unlockBetting();
    
    console.log('All bet counters have been reset');
  } catch (error) {
    console.error('Error resetting bet counters:', error);
  }
};

// Export the old odds functions for backward compatibility
export const getOdds = getRainOdds;
export const getTemperatureOddsWrapper: any = (temp: number, isMin: boolean): number => {
  return getTemperatureOdds(temp);
};
// Export the getWindOdds function directly to maintain compatibility
export { getWindOdds };
