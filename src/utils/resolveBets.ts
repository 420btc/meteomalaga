import { Bet } from '../types/weather';
import { fetchCurrentRainData, fetchCurrentTemperatureData, fetchCurrentWindData } from '../services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para almacenamiento local
const PENDING_RESOLUTIONS_KEY = 'pendingBetResolutions';
const FAILED_RESOLUTIONS_KEY = 'failedBetResolutions';
const RESOLUTION_ATTEMPTS_KEY = 'betResolutionAttempts';
const MAX_RETRY_ATTEMPTS = 5;

// Función para resolver una apuesta individual
export const resolveBet = async (bet: Bet): Promise<Bet> => {
  try {
    // Omitir si la apuesta ya está resuelta
    if (bet.verified || bet.status === 'ganada' || bet.status === 'perdida') {
      return bet;
    }
    
    // Verificar si es momento de resolver la apuesta
    const now = new Date();
    const verificationTime = new Date(bet.verificationTime || '');
    
    if (isNaN(verificationTime.getTime())) {
      console.error('Tiempo de verificación inválido para la apuesta:', bet.id);
      await logResolutionError(bet, 'Tiempo de verificación inválido');
      return {
        ...bet,
        resolution_explanation: 'No se pudo resolver: tiempo de verificación inválido. Se reintentará más tarde.'
      };
    }
    
    if (now < verificationTime) {
      return bet; // Aún no es tiempo de resolver
    }
    
    // Registrar intento de resolución
    await recordResolutionAttempt(bet);
    
    // Obtener datos meteorológicos actuales
    const [currentRainAmount, currentTemperature, currentWind] = await Promise.all([
      fetchCurrentRainData().catch(error => {
        console.error('Error al obtener datos de lluvia:', error);
        return null;
      }),
      fetchCurrentTemperatureData().catch(error => {
        console.error('Error al obtener datos de temperatura:', error);
        return null;
      }),
      fetchCurrentWindData().catch(error => {
        console.error('Error al obtener datos de viento:', error);
        return null;
      })
    ]);
    
    // Verificar si se obtuvieron los datos necesarios
    if (
      (bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') && currentRainAmount === null ||
      (bet.option === 'temp_min' || bet.option === 'temp_max' || bet.option === 'temperature') && currentTemperature === null ||
      (bet.option === 'wind_max') && currentWind === null
    ) {
      console.error('Datos meteorológicos no disponibles para resolver la apuesta:', bet.id);
      await addToPendingResolutions(bet);
      return {
        ...bet,
        resolution_explanation: 'Resolución pendiente: no se pudieron obtener datos meteorológicos. Se reintentará automáticamente.'
      };
    }
    
    // Determinar el resultado real según el tipo de apuesta
    let result = 0;
    let won = false;
    let resolution_explanation = '';
    
    if (bet.option === 'rain_yes' || bet.option === 'rain_no' || bet.option === 'rain_amount') {
      result = currentRainAmount || 0;
      
      if (bet.option === 'rain_yes') {
        won = result > 0;
        if (won) {
          resolution_explanation = `¡Ganaste! Predijiste correctamente que llovería. La cantidad de lluvia registrada fue de ${result.toFixed(2)} mm.`;
        } else {
          resolution_explanation = `Perdiste. Predijiste que llovería, pero no se registró lluvia (0 mm). Las condiciones estaban secas durante el período de verificación.`;
        }
      } else if (bet.option === 'rain_no') {
        won = result === 0;
        if (won) {
          resolution_explanation = `¡Ganaste! Predijiste correctamente que no llovería. No se registró lluvia (0 mm) durante el período de verificación.`;
        } else {
          resolution_explanation = `Perdiste. Predijiste que no llovería, pero se registraron ${result.toFixed(2)} mm de lluvia durante el período de verificación.`;
        }
      } else if (bet.option === 'rain_amount') {
        const betValue = bet.rain_mm !== null ? bet.rain_mm : bet.value;
        
        // Usar un margen fijo para todos los modos
        const margin = 0.5;
        won = Math.abs((betValue || 0) - result) <= margin; // Ganar si está dentro de ±0.5mm
        if (won) {
          resolution_explanation = `¡Ganaste! Tu predicción de ${betValue} mm de lluvia estaba dentro del margen de ±${margin} mm del valor real (${result.toFixed(2)} mm).`;
        } else {
          const difference = Math.abs((betValue || 0) - result).toFixed(2);
          resolution_explanation = `Perdiste. Tu predicción de ${betValue} mm de lluvia difería ${difference} mm del valor real (${result.toFixed(2)} mm), superando el margen permitido de ±${margin} mm.`;
        }
      }
    } else if (bet.option === 'temp_min') {
      if (!currentTemperature) {
        await addToPendingResolutions(bet);
                return {
          ...bet,
          resolution_explanation: 'Resolución pendiente: no se pudieron obtener datos de temperatura. Se reintentará automáticamente.'
        };
      }
      
      result = currentTemperature.min;
      const betValue = bet.temp_min_c !== null ? bet.temp_min_c : bet.value;
      
      // Usar un margen fijo para todos los modos
      const margin = 1.0;
      won = Math.abs((betValue || 0) - result) <= margin; // Ganar si está dentro de ±1.0°C
      if (won) {
        resolution_explanation = `¡Ganaste! Tu predicción de temperatura mínima de ${betValue}°C estaba dentro del margen de ±${margin}°C del valor real (${result.toFixed(1)}°C).`;
      } else {
        const difference = Math.abs((betValue || 0) - result).toFixed(1);
        resolution_explanation = `Perdiste. Tu predicción de temperatura mínima de ${betValue}°C difería ${difference}°C del valor real (${result.toFixed(1)}°C), superando el margen permitido de ±${margin}°C.`;
      }
    } else if (bet.option === 'temp_max') {
      if (!currentTemperature) {
        await addToPendingResolutions(bet);
        return {
          ...bet,
          resolution_explanation: 'Resolución pendiente: no se pudieron obtener datos de temperatura. Se reintentará automáticamente.'
        };
      }
      
      result = currentTemperature.max;
      const betValue = bet.temp_max_c !== null ? bet.temp_max_c : bet.value;
      
      // Usar un margen fijo para todos los modos
      const margin = 1.0;
      won = Math.abs((betValue || 0) - result) <= margin; // Ganar si está dentro de ±1.0°C
      if (won) {
        resolution_explanation = `¡Ganaste! Tu predicción de temperatura máxima de ${betValue}°C estaba dentro del margen de ±${margin}°C del valor real (${result.toFixed(1)}°C).`;
      } else {
        const difference = Math.abs((betValue || 0) - result).toFixed(1);
        resolution_explanation = `Perdiste. Tu predicción de temperatura máxima de ${betValue}°C difería ${difference}°C del valor real (${result.toFixed(1)}°C), superando el margen permitido de ±${margin}°C.`;
      }
    } else if (bet.option === 'temperature') {
      if (!currentTemperature) {
        await addToPendingResolutions(bet);
        return {
          ...bet,
          resolution_explanation: 'Resolución pendiente: no se pudieron obtener datos de temperatura. Se reintentará automáticamente.'
        };
      }
      
      result = currentTemperature.current;
      const betValue = bet.temperature_c !== null ? bet.temperature_c : bet.value;
      
      // Usar un margen fijo para todos los modos
      const margin = 1.0;
      won = Math.abs((betValue || 0) - result) <= margin; // Ganar si está dentro de ±1.0°C
      if (won) {
        resolution_explanation = `¡Ganaste! Tu predicción de temperatura actual de ${betValue}°C estaba dentro del margen de ±${margin}°C del valor real (${result.toFixed(1)}°C).`;
      } else {
        const difference = Math.abs((betValue || 0) - result).toFixed(1);
        resolution_explanation = `Perdiste. Tu predicción de temperatura actual de ${betValue}°C difería ${difference}°C del valor real (${result.toFixed(1)}°C), superando el margen permitido de ±${margin}°C.`;
      }
    } else if (bet.option === 'wind_max') {
      if (!currentWind) {
        await addToPendingResolutions(bet);
        return {
          ...bet,
          resolution_explanation: 'Resolución pendiente: no se pudieron obtener datos de viento. Se reintentará automáticamente.'
        };
      }
      
      result = currentWind.max;
      const betValue = bet.wind_kmh_max !== null ? bet.wind_kmh_max : bet.value;
      
      // Usar un margen fijo para todos los modos
      const margin = 3.0;
      won = Math.abs((betValue || 0) - result) <= margin; // Ganar si está dentro de ±3.0 km/h
      if (won) {
        resolution_explanation = `¡Ganaste! Tu predicción de velocidad máxima del viento de ${betValue} km/h estaba dentro del margen de ±${margin} km/h del valor real (${result.toFixed(1)} km/h).`;
      } else {
        const difference = Math.abs((betValue || 0) - result).toFixed(1);
        resolution_explanation = `Perdiste. Tu predicción de velocidad máxima del viento de ${betValue} km/h difería ${difference} km/h del valor real (${result.toFixed(1)} km/h), superando el margen permitido de ±${margin} km/h.`;
      }
    }
    
    // Actualizar la apuesta con el resultado
    const resolvedBet: Bet = {
      ...bet,
      result,
      won,
      verified: true,
      status: won ? 'ganada' : 'perdida',
      resolution_explanation
    };
    
    // Eliminar de las resoluciones pendientes si estaba allí
    await removeFromPendingResolutions(bet.id);
    
    return resolvedBet;
  } catch (error) {
    console.error('Error al resolver la apuesta:', error, bet.id);
    await logResolutionError(bet, error.message || 'Error desconocido');
    await addToPendingResolutions(bet);
    
    return {
      ...bet,
      resolution_explanation: 'Error al resolver la apuesta. Se reintentará automáticamente.'
    };
  }
};

// Función para resolver todas las apuestas pendientes
export const resolveAllPendingBets = async (): Promise<void> => {
  try {
    // Obtener todas las apuestas del almacenamiento local
    const betsJson = await AsyncStorage.getItem('local_bets');
    if (!betsJson) return;
    
    const bets: Bet[] = JSON.parse(betsJson);
    const now = new Date();
    
    // Filtrar apuestas pendientes que deberían resolverse
    const pendingBets = bets.filter(bet => 
      bet.status === 'pending' && 
      !bet.verified && 
      new Date(bet.verificationTime || '').getTime() <= now.getTime()
    );
    
    if (pendingBets.length === 0) return;
    
    // Resolver cada apuesta pendiente
    const updatedBets = [...bets];
    let hasChanges = false;
    
    for (const bet of pendingBets) {
      const resolvedBet = await resolveBet(bet);
      
      // Si la apuesta cambió, actualizar en el array
      if (
        resolvedBet.verified !== bet.verified || 
        resolvedBet.status !== bet.status || 
        resolvedBet.result !== bet.result || 
        resolvedBet.won !== bet.won
      ) {
        const index = updatedBets.findIndex(b => b.id === bet.id);
        if (index !== -1) {
          updatedBets[index] = resolvedBet;
          hasChanges = true;
        }
      }
    }
    
    // Guardar las apuestas actualizadas si hubo cambios
    if (hasChanges) {
      await AsyncStorage.setItem('local_bets', JSON.stringify(updatedBets));
    }
    
    // Intentar resolver apuestas pendientes anteriores
    await retryPendingResolutions();
  } catch (error) {
    console.error('Error al resolver apuestas pendientes:', error);
  }
};

// Función para agregar una apuesta a las resoluciones pendientes
const addToPendingResolutions = async (bet: Bet): Promise<void> => {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_RESOLUTIONS_KEY);
    const pendingBets: string[] = pendingJson ? JSON.parse(pendingJson) : [];
    
    // Agregar el ID de la apuesta si no está ya
    if (!pendingBets.includes(bet.id)) {
      pendingBets.push(bet.id);
      await AsyncStorage.setItem(PENDING_RESOLUTIONS_KEY, JSON.stringify(pendingBets));
    }
  } catch (error) {
    console.error('Error al agregar a resoluciones pendientes:', error);
  }
};

// Función para eliminar una apuesta de las resoluciones pendientes
const removeFromPendingResolutions = async (betId: string): Promise<void> => {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_RESOLUTIONS_KEY);
    if (!pendingJson) return;
    
    const pendingBets: string[] = JSON.parse(pendingJson);
    const updatedPending = pendingBets.filter(id => id !== betId);
    
    await AsyncStorage.setItem(PENDING_RESOLUTIONS_KEY, JSON.stringify(updatedPending));
  } catch (error) {
    console.error('Error al eliminar de resoluciones pendientes:', error);
  }
};

// Función para registrar un error de resolución
const logResolutionError = async (bet: Bet, errorMessage: string): Promise<void> => {
  try {
    const failedJson = await AsyncStorage.getItem(FAILED_RESOLUTIONS_KEY);
    const failedResolutions: Record<string, { count: number, lastError: string, timestamp: string }> = 
      failedJson ? JSON.parse(failedJson) : {};
    
    // Actualizar o agregar el registro de error
    failedResolutions[bet.id] = {
      count: (failedResolutions[bet.id]?.count || 0) + 1,
      lastError: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(FAILED_RESOLUTIONS_KEY, JSON.stringify(failedResolutions));
  } catch (error) {
    console.error('Error al registrar error de resolución:', error);
  }
};

// Función para registrar un intento de resolución
const recordResolutionAttempt = async (bet: Bet): Promise<void> => {
  try {
    const attemptsJson = await AsyncStorage.getItem(RESOLUTION_ATTEMPTS_KEY);
    const attempts: Record<string, number> = attemptsJson ? JSON.parse(attemptsJson) : {};
    
    // Incrementar el contador de intentos
    attempts[bet.id] = (attempts[bet.id] || 0) + 1;
    
    await AsyncStorage.setItem(RESOLUTION_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Error al registrar intento de resolución:', error);
  }
};

// Función para reintentar resoluciones pendientes
const retryPendingResolutions = async (): Promise<void> => {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_RESOLUTIONS_KEY);
    if (!pendingJson) return;
    
    const pendingBetIds: string[] = JSON.parse(pendingJson);
    if (pendingBetIds.length === 0) return;
    
    // Obtener todas las apuestas
    const betsJson = await AsyncStorage.getItem('local_bets');
    if (!betsJson) return;
    
    const bets: Bet[] = JSON.parse(betsJson);
    const updatedBets = [...bets];
    let hasChanges = false;
    
    // Obtener intentos de resolución
    const attemptsJson = await AsyncStorage.getItem(RESOLUTION_ATTEMPTS_KEY);
    const attempts: Record<string, number> = attemptsJson ? JSON.parse(attemptsJson) : {};
    
    // Procesar cada apuesta pendiente
    for (const betId of pendingBetIds) {
      // Verificar si se ha excedido el número máximo de intentos
      if ((attempts[betId] || 0) >= MAX_RETRY_ATTEMPTS) {
        console.warn(`Máximo de intentos alcanzado para la apuesta ${betId}. Marcando como fallida.`);
        
        // Marcar la apuesta como fallida después de demasiados intentos
        const index = updatedBets.findIndex(b => b.id === betId);
        if (index !== -1) {
          updatedBets[index] = {
            ...updatedBets[index],
            status: 'error',
            verified: true,
            resolution_explanation: 'No se pudo resolver la apuesta después de múltiples intentos. Por favor, contacta con soporte.'
          };
          hasChanges = true;
        }
        
        // Eliminar de las resoluciones pendientes
        await removeFromPendingResolutions(betId);
        continue;
      }
      
      // Encontrar la apuesta en el array
      const bet = bets.find(b => b.id === betId);
      if (!bet) {
        await removeFromPendingResolutions(betId);
        continue;
      }
      
      // Intentar resolver la apuesta
      const resolvedBet = await resolveBet(bet);
      
      // Si la apuesta se resolvió correctamente, actualizar en el array
      if (resolvedBet.verified && (resolvedBet.status === 'ganada' || resolvedBet.status === 'perdida')) {
        const index = updatedBets.findIndex(b => b.id === betId);
        if (index !== -1) {
          updatedBets[index] = resolvedBet;
          hasChanges = true;
        }
        
        // Eliminar de las resoluciones pendientes
        await removeFromPendingResolutions(betId);
      }
    }
    
    // Guardar las apuestas actualizadas si hubo cambios
    if (hasChanges) {
      await AsyncStorage.setItem('local_bets', JSON.stringify(updatedBets));
    }
  } catch (error) {
    console.error('Error al reintentar resoluciones pendientes:', error);
  }
};

// Función para limpiar datos antiguos de resolución
export const cleanupResolutionData = async (): Promise<void> => {
  try {
    // Limpiar intentos de resolución antiguos
    const attemptsJson = await AsyncStorage.getItem(RESOLUTION_ATTEMPTS_KEY);
    if (attemptsJson) {
      const attempts: Record<string, number> = JSON.parse(attemptsJson);
      
      // Obtener apuestas actuales
      const betsJson = await AsyncStorage.getItem('local_bets');
      const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
      const currentBetIds = new Set(bets.map(bet => bet.id));
      
      // Filtrar intentos para mantener solo los de apuestas actuales
      const updatedAttempts: Record<string, number> = {};
      for (const [betId, count] of Object.entries(attempts)) {
        if (currentBetIds.has(betId)) {
          updatedAttempts[betId] = count;
        }
      }
      
      await AsyncStorage.setItem(RESOLUTION_ATTEMPTS_KEY, JSON.stringify(updatedAttempts));
    }
    
    // Limpiar errores de resolución antiguos
    const failedJson = await AsyncStorage.getItem(FAILED_RESOLUTIONS_KEY);
    if (failedJson) {
      const failedResolutions: Record<string, { count: number, lastError: string, timestamp: string }> = 
        JSON.parse(failedJson);
      
      // Obtener apuestas actuales
      const betsJson = await AsyncStorage.getItem('local_bets');
      const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
      const currentBetIds = new Set(bets.map(bet => bet.id));
      
      // Filtrar errores para mantener solo los de apuestas actuales
      const updatedFailedResolutions: Record<string, { count: number, lastError: string, timestamp: string }> = {};
      for (const [betId, data] of Object.entries(failedResolutions)) {
        if (currentBetIds.has(betId)) {
          updatedFailedResolutions[betId] = data;
        }
      }
      
      await AsyncStorage.setItem(FAILED_RESOLUTIONS_KEY, JSON.stringify(updatedFailedResolutions));
    }
    
    // Verificar y limpiar resoluciones pendientes
    const pendingJson = await AsyncStorage.getItem(PENDING_RESOLUTIONS_KEY);
    if (pendingJson) {
      const pendingBetIds: string[] = JSON.parse(pendingJson);
      
      // Obtener apuestas actuales
      const betsJson = await AsyncStorage.getItem('local_bets');
      const bets: Bet[] = betsJson ? JSON.parse(betsJson) : [];
      const currentBetIds = new Set(bets.map(bet => bet.id));
      
      // Filtrar para mantener solo IDs de apuestas actuales
      const updatedPendingBetIds = pendingBetIds.filter(id => currentBetIds.has(id));
      
      await AsyncStorage.setItem(PENDING_RESOLUTIONS_KEY, JSON.stringify(updatedPendingBetIds));
    }
  } catch (error) {
    console.error('Error al limpiar datos de resolución:', error);
  }
};

// Función para resolver todas las apuestas pendientes y devolver resultados
export const resolveBets = async (): Promise<{ resolvedBets: Bet[], totalCoinsWon: number }> => {
  try {
    const pendingBets = await getPendingBets();
    const resolvedBets: Bet[] = [];
    let totalCoinsWon = 0;
    
    for (const bet of pendingBets) {
      const resolvedBet = await resolveBet(bet);
      
      if (resolvedBet.verified && resolvedBet.status === 'ganada') {
        const winnings = resolvedBet.coins * (resolvedBet.leverage || 1);
        totalCoinsWon += winnings;
      }
      
      if (resolvedBet.verified) {
        resolvedBets.push(resolvedBet);
      }
    }
    
    return { resolvedBets, totalCoinsWon };
  } catch (error) {
    console.error('Error al resolver apuestas:', error);
    return { resolvedBets: [], totalCoinsWon: 0 };
  }
};

// Función auxiliar para obtener apuestas pendientes
const getPendingBets = async (): Promise<Bet[]> => {
  try {
    const betsString = await AsyncStorage.getItem('bets');
    if (!betsString) return [];
    
    const bets: Bet[] = JSON.parse(betsString);
    return bets.filter(bet => !bet.verified && bet.status === 'pending');
  } catch (error) {
    console.error('Error al obtener apuestas pendientes:', error);
    return [];
  }
};
