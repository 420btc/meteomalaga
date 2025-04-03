import { supabase } from './supabase';
import { Bet, BetResult, BetStatus, BetOption } from '../types/weather';
import { fetchCurrentRainData, fetchCurrentTemperatureData, isWithinBettingWindow } from './weatherService';

// Function to add a new bet to Supabase
export const addBetToSupabase = async (bet: Bet): Promise<Bet | null> => {
  try {
    // Check if betting is allowed (between 23:00 and 00:00 CET)
    if (!isWithinBettingWindow()) {
      throw new Error('Las apuestas están cerradas. Disponibles de 23:00 a 00:00 CET');
    }
    
    // Prepare the bet data for Supabase
    const betData: any = {
      date: bet.date,
      option: bet.option,
      value: bet.value,
      coins: bet.coins,
      leverage: bet.leverage,
      timestamp: bet.timestamp,
      result: bet.result || null,
      won: bet.won || null,
      city: bet.city || 'Málaga',
      mode: bet.mode || 'Simple',
      rain_mm: bet.rain_mm || null,
      resolution_date: bet.resolution_date || (() => {
        // If no resolution date, set to 24h after the bet timestamp
        const betTime = new Date(bet.timestamp);
        const resolutionTime = new Date(betTime);
        resolutionTime.setHours(resolutionTime.getHours() + 24);
        return resolutionTime.toISOString().split('T')[0];
      })(),
      user_id: bet.user_id || 'anonymous',
      status: bet.status || 'pending',
      daily_cutoff: !isWithinBettingWindow(),
      betting_allowed: isWithinBettingWindow()
    };

    // Add new fields for enhanced betting
    betData.bet_type = getBetTypeFromOption(bet.option);
    
    // Set temperature values if applicable
    if (bet.option === 'temp_min') {
      betData.temp_min_c = bet.value;
    } else if (bet.option === 'temp_max') {
      betData.temp_max_c = bet.value;
    }
    
    // Set range values for Pro mode
    if (bet.mode === 'Pro' && bet.value !== null) {
      const margin = getMarginFromLeverage(bet.leverage);
      betData.range_min = Math.max(-50, bet.value - margin);
      betData.range_max = Math.min(999, bet.value + margin);
    }

    const { data, error } = await supabase
      .from('bets_malaga')
      .insert(betData)
      .select();

    if (error) {
      console.error('Error adding bet to Supabase:', error);
      return null;
    }

    if (data && data.length > 0) {
      return {
        ...bet,
        id: data[0].id
      };
    }

    return null;
  } catch (error) {
    console.error('Error in addBetToSupabase:', error);
    return null;
  }
};

// Function to get all bets from Supabase
export const getBetsFromSupabase = async (userId: string = 'anonymous'): Promise<Bet[]> => {
  try {
    const { data, error } = await supabase
      .from('bets_malaga')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching bets from Supabase:', error);
      return [];
    }

    if (data) {
      // Convert to Bet type
      const formattedBets: Bet[] = data.map(item => {
        const bet: Bet = {
          id: item.id,
          date: item.date,
          option: item.option,
          value: item.value,
          coins: item.coins,
          leverage: item.leverage,
          timestamp: item.timestamp,
          result: item.result,
          won: item.won,
          city: item.city || 'Málaga',
          mode: item.mode || 'Simple',
          rain_mm: item.rain_mm,
          resolution_date: item.resolution_date,
          user_id: item.user_id || 'anonymous',
          status: item.status || 'pending'
        };
        
        // Add enhanced betting fields if available
        if (item.bet_type) {
          bet.bet_type = item.bet_type;
        }
        if (item.temp_min_c !== null && item.temp_min_c !== undefined) {
          bet.temp_min_c = item.temp_min_c;
        }
        if (item.temp_max_c !== null && item.temp_max_c !== undefined) {
          bet.temp_max_c = item.temp_max_c;
        }
        if (item.range_min !== null && item.range_min !== undefined) {
          bet.range_min = item.range_min;
        }
        if (item.range_max !== null && item.range_max !== undefined) {
          bet.range_max = item.range_max;
        }
        if (item.daily_temp_bets_count !== null && item.daily_temp_bets_count !== undefined) {
          bet.daily_temp_bets_count = item.daily_temp_bets_count;
        }
        if (item.last_temp_bet_date !== null && item.last_temp_bet_date !== undefined) {
          bet.last_temp_bet_date = item.last_temp_bet_date;
        }
        
        return bet;
      });

      return formattedBets;
    }

    return [];
  } catch (error) {
    console.error('Error in getBetsFromSupabase:', error);
    return [];
  }
};

// Function to update bet result in Supabase
export const updateBetResultInSupabase = async (betResult: BetResult): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bets_malaga')
      .update({
        result: betResult.result,
        won: betResult.won,
        status: betResult.won ? 'ganada' : 'perdida'
      })
      .eq('id', betResult.betId);

    if (error) {
      console.error('Error updating bet result in Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBetResultInSupabase:', error);
    return false;
  }
};

// Function to evaluate pending bets
export const evaluatePendingBets = async (userId: string = 'anonymous'): Promise<BetResult[]> => {
  try {
    // Get current date and time
    const now = new Date();
    
    // Get pending bets that should be resolved now (based on resolution_date)
    const { data, error } = await supabase
      .from('bets_malaga')
      .select('*')
      .eq('status', 'pending')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching pending bets:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Filter bets that have passed their resolution time
    const betsToResolve = data.filter(bet => {
      if (bet.resolution_date) {
        // If there's a resolution_date field, use it
        const resolutionDate = new Date(bet.resolution_date);
        return resolutionDate <= now;
      } else {
        // Otherwise use 24h after bet timestamp
        const betTimestamp = new Date(bet.timestamp);
        const resolutionTime = new Date(betTimestamp);
        resolutionTime.setHours(resolutionTime.getHours() + 24);
        return resolutionTime <= now;
      }
    });
    
    if (betsToResolve.length === 0) {
      return [];
    }
    
    // Get current weather data
    const currentRainAmount = await fetchCurrentRainData();
    const currentTemperature = await fetchCurrentTemperatureData();
    
    // Evaluate each bet
    const results: BetResult[] = [];
    
    for (const bet of betsToResolve) {
      let result = 0;
      let won = false;
      let margin = 0;
      
      // Determine the actual result based on bet type
      if (bet.bet_type === 'rain' || bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
        result = currentRainAmount;
      } else if (bet.bet_type === 'temp_min' || bet.option === 'temp_min') {
        result = currentTemperature.min;
      } else if (bet.bet_type === 'temp_max' || bet.option === 'temp_max') {
        result = currentTemperature.max;
      }
      
      // Determine if bet is won based on bet type and mode
      if (bet.mode === 'Simple') {
        // Simple mode: exact match
        if (bet.option === 'rain_yes') {
          won = result > 0;
        } else if (bet.option === 'rain_no') {
          won = result === 0;
        } else if (bet.option === 'rain_amount') {
          const betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
          won = betValue === result;
        } else if (bet.option === 'temp_min') {
          const betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
          won = betValue === result;
        } else if (bet.option === 'temp_max') {
          const betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
          won = betValue === result;
        }
      } else if (bet.mode === 'Pro') {
        // Pro mode: within margin based on leverage
        margin = getMarginFromLeverage(bet.leverage);
        
        // Check if result is within range
        if (bet.range_min !== null && bet.range_max !== null) {
          won = result >= bet.range_min && result <= bet.range_max;
        } else {
          // Fallback to checking if the value is within margin of the target
          let betValue = null;
          
          if (bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
            betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
          } else if (bet.option === 'temp_min') {
            betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
          } else if (bet.option === 'temp_max') {
            betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
          }
          
          if (betValue !== null) {
            won = Math.abs(result - betValue) <= margin;
          }
        }
      }
      
      // Update bet result in Supabase
      const { error: updateError } = await supabase
        .from('bets_malaga')
        .update({
          result,
          won,
          status: won ? 'ganada' : 'perdida'
        })
        .eq('id', bet.id);
      
      if (updateError) {
        console.error(`Error updating bet ${bet.id}:`, updateError);
      } else {
        results.push({
          betId: bet.id,
          result,
          won,
          margin
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in evaluatePendingBets:', error);
    return [];
  }
};

// Function to check if betting is allowed
export const isBettingAllowed = async (): Promise<boolean> => {
  try {
    // Check if betting is allowed based on time (between 23:00 and 00:00 CET)
    return isWithinBettingWindow();
  } catch (error) {
    console.error('Error checking if betting is allowed:', error);
    return false;
  }
};

// Function to check if temperature betting is allowed (max 2 per day)
export const isTemperatureBettingAllowed = async (userId: string = 'anonymous'): Promise<boolean> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get temperature bets made today
    const { data, error } = await supabase
      .from('bets_malaga')
      .select('id')
      .eq('user_id', userId)
      .in('bet_type', ['temp_min', 'temp_max'])
      .eq('last_temp_bet_date', currentDate);
    
    if (error) {
      console.error('Error checking temperature betting limits:', error);
      return false;
    }
    
    // Allow if less than 2 temperature bets today
    return data ? data.length < 2 : true;
  } catch (error) {
    console.error('Error in isTemperatureBettingAllowed:', error);
    return false;
  }
};

// Function to get remaining temperature bets for today
export const getRemainingTemperatureBets = async (userId: string = 'anonymous'): Promise<number> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get temperature bets made today
    const { data, error } = await supabase
      .from('bets_malaga')
      .select('id')
      .eq('user_id', userId)
      .in('bet_type', ['temp_min', 'temp_max'])
      .eq('last_temp_bet_date', currentDate);
    
    if (error) {
      console.error('Error checking temperature betting limits:', error);
      return 0;
    }
    
    // Calculate remaining bets (max 2 per day)
    const betsMade = data ? data.length : 0;
    return Math.max(0, 2 - betsMade);
  } catch (error) {
    console.error('Error in getRemainingTemperatureBets:', error);
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

// Function to calculate odds based on rain amount (mm)
export const getOdds = (mm: number): number => {
  if (mm === 0) return 1.13;
  if (mm <= 5) return 34.6;
  if (mm <= 15) return 180;
  if (mm <= 50) return 1765;
  return 428571;
};

// Function to calculate odds based on temperature (°C)
export const getTemperatureOdds = (temp: number, isMin: boolean): number => {
  // Different odds calculation for min and max temperature
  if (isMin) {
    if (temp < 0) return 50.0;  // Very cold for Málaga
    if (temp <= 5) return 20.0;
    if (temp <= 10) return 5.0;
    if (temp <= 15) return 2.5;
    if (temp <= 20) return 5.0;
    if (temp <= 25) return 20.0;
    return 50.0;  // Very hot minimum
  } else {
    // Max temperature odds
    if (temp < 10) return 50.0;  // Very cold max for Málaga
    if (temp <= 15) return 20.0;
    if (temp <= 20) return 5.0;
    if (temp <= 25) return 2.0;
    if (temp <= 30) return 2.5;
    if (temp <= 35) return 5.0;
    if (temp <= 40) return 20.0;
    return 50.0;  // Extremely hot
  }
};

// Function to resolve bets
export const resolveBets = async (): Promise<void> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all pending bets with resolution dates in the past
    const { data: bets, error } = await supabase
      .from('bets_malaga')
      .select('*')
      .eq('status', 'pending')
      .lt('resolution_date', yesterday.toISOString().split('T')[0]);
    
    if (error || !bets || bets.length === 0) {
      return;
    }
    
    // Get current weather data
    const response = await fetch(
      'https://api.openweathermap.org/data/3.0/onecall?lat=36.7213&lon=-4.4213&appid=5ae0c9a3137234e18e032e3d6024629e&units=metric'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data for bet resolution');
    }
    
    const weatherData = await response.json();
    const actualRain = Math.round(weatherData.daily[1].rain || 0);
    const actualTempMin = Math.round(weatherData.daily[1].temp.min);
    const actualTempMax = Math.round(weatherData.daily[1].temp.max);
    
    // Process each bet
    for (const bet of bets) {
      // Determine if bet is won
      let won = false;
      let result = 0;
      
      if (bet.option === 'rain_amount') {
        result = actualRain;
        won = bet.rain_mm === actualRain;
      } else if (bet.option === 'rain_yes') {
        result = actualRain;
        won = actualRain > 0;
      } else if (bet.option === 'rain_no') {
        result = actualRain;
        won = actualRain === 0;
      } else if (bet.option === 'temp_min') {
        result = actualTempMin;
        const betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
        won = betValue === actualTempMin;
      } else if (bet.option === 'temp_max') {
        result = actualTempMax;
        const betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
        won = betValue === actualTempMax;
      }
      
      // Calculate payout
      const payout = won ? Math.round(bet.coins * bet.leverage) : 0;
      
      // Update bet in database
      await supabase
        .from('bets_malaga')
        .update({ 
          result, 
          won, 
          status: won ? 'ganada' : 'perdida' 
        })
        .eq('id', bet.id);
      
      // If bet is won, update user's coins
      if (won && bet.user_id) {
        // Get user's current coins
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('coins')
          .eq('id', bet.user_id)
          .single();
        
        if (!userError && userData) {
          // Update user's coins
          await supabase
            .from('users')
            .update({ coins: userData.coins + payout })
            .eq('id', bet.user_id);
        }
      }
    }
  } catch (error) {
    console.error('Error resolving bets:', error);
  }
};
