import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para almacenamiento en caché
const RAIN_DATA_CACHE_KEY = 'rain_data_cache';
const TEMP_DATA_CACHE_KEY = 'temp_data_cache';
const WIND_DATA_CACHE_KEY = 'wind_data_cache';
const HISTORICAL_DATA_CACHE_KEY = 'historical_data_cache';
const CACHE_EXPIRY_KEY = 'weather_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos (reducido de 30 minutos)

// API key para OpenWeatherMap
const OPENWEATHER_API_KEY = '5ae0c9a3137234e18e032e3d6024629e';

// Coordenadas de Málaga
const MALAGA_LAT = 36.7213;
const MALAGA_LON = -4.4213;

// Función para verificar si estamos dentro de la ventana de apuestas (23:00-00:00 CET/CEST)
export const isWithinBettingWindow = (): boolean => {
  // Permitir apuestas en cualquier momento
  return true;
};

// Función para calcular el tiempo hasta la próxima ventana de apuestas o hasta que se cierre la ventana actual
export const getTimeUntilNextBettingWindow = (): { hours: number; minutes: number; seconds: number } => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Si estamos dentro de la ventana de apuestas (23:00-00:00)
    if (currentHour === 23 || currentHour === 0) {
      // Si estamos a las 23, calcular tiempo hasta las 00:00
      if (currentHour === 23) {
        const minutesLeft = 59 - currentMinute;
        const secondsLeft = 59 - currentSecond;
        
        return {
          hours: 0,
          minutes: minutesLeft,
          seconds: secondsLeft
        };
      } 
      // Si estamos a las 00, calcular tiempo hasta las 01:00 (fin de la ventana)
      else {
        const minutesLeft = 59 - currentMinute;
        const secondsLeft = 59 - currentSecond;
        
        return {
          hours: 0,
          minutes: minutesLeft,
          seconds: secondsLeft
        };
      }
    } else {
      // Calcular tiempo hasta las 23:00 (apertura de la ventana)
      let hoursLeft;
      if (currentHour < 23) {
        // Hoy, antes de las 23:00
        hoursLeft = 23 - currentHour - 1; // -1 porque contamos minutos restantes
      } else {
        // Después de medianoche, esperar hasta las 23:00 del día siguiente
        hoursLeft = 23 + (24 - currentHour) - 1; // -1 porque contamos minutos restantes
      }
      
      const minutesLeft = 59 - currentMinute;
      const secondsLeft = 59 - currentSecond;
      
      return {
        hours: hoursLeft,
        minutes: minutesLeft,
        seconds: secondsLeft
      };
    }
  } catch (error) {
    console.error('Error calculating time until next betting window:', error);
    return { hours: 0, minutes: 0, seconds: 0 };
  }
};

// Versión sincrónica para componentes de UI (mantenida por compatibilidad)
export const isWithinBettingWindowSync = (): boolean => {
  return isWithinBettingWindow();
};

// Versión sincrónica para componentes de UI
export const getTimeUntilNextBettingWindowSync = (): { hours?: number; minutes?: number; seconds?: number } => {
  try {
    return getTimeUntilNextBettingWindow();
  } catch (error) {
    console.error('Error in getTimeUntilNextBettingWindowSync:', error);
    return { hours: 0, minutes: 0, seconds: 0 };
  }
};

// Función para obtener la hora actual en España (CET/CEST)
export const getCurrentSpainHour = (): number => {
  try {
    const now = new Date();
    return now.getHours();
  } catch (error) {
    console.error('Error getting current Spain hour:', error);
    return 0;
  }
};

// Función para verificar si estamos en horario de verano
export const isDaylightSavingTime = (): boolean => {
  try {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    
    // Si la diferencia de offset entre enero y julio es 0, no hay cambio de horario
    return jan.getTimezoneOffset() !== jul.getTimezoneOffset();
  } catch (error) {
    console.error('Error checking daylight saving time:', error);
    return false;
  }
};

// Función para obtener datos meteorológicos para una fecha específica
export const getWeatherForDate = async (date: string): Promise<any> => {
  try {
    // Verificar si tenemos datos en caché
    const cachedData = await getCachedWeatherData();
    if (cachedData) {
      return cachedData;
    }
    
    // Si no hay caché o está expirada, obtener datos nuevos
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching weather data');
    }
    
    const data = await response.json();
    
    // Procesar y almacenar los datos
    const weatherData = {
      temperature: data.main.temp,
      tempMin: data.main.temp_min,
      tempMax: data.main.temp_max,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convertir de m/s a km/h
      windDirection: data.wind.deg,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rainAmount: data.rain && data.rain['1h'] ? data.rain['1h'] : 0,
      date: date,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en caché
    await cacheWeatherData(weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Si hay un error, intentar usar datos en caché aunque estén expirados
    const expiredCache = await getCachedWeatherData(true);
    if (expiredCache) {
      return expiredCache;
    }
    
    // Si no hay caché, devolver datos simulados
    return getSimulatedWeatherData(date);
  }
};

// Exportar getWeatherForDate como fetchWeatherData para compatibilidad con AppContext
export const fetchWeatherData = getWeatherForDate;

// Función para obtener datos actuales de lluvia
export const fetchCurrentRainData = async (): Promise<number> => {
  try {
    // Forzar actualización de datos en tiempo real
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching rain data');
    }
    
    const data = await response.json();
    
    // Extraer datos de lluvia (mm en la última hora)
    let rainAmount = 0;
    if (data.rain && data.rain['1h']) {
      rainAmount = data.rain['1h'];
    }
    
    // Guardar en caché
    const rainData = { amount: rainAmount, timestamp: new Date().toISOString() };
    await AsyncStorage.setItem(RAIN_DATA_CACHE_KEY, JSON.stringify(rainData));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
    
    return rainAmount;
  } catch (error) {
    console.error('Error fetching rain data:', error);
    
    // Si hay un error, intentar usar datos en caché aunque estén expirados
    const cachedData = await AsyncStorage.getItem(RAIN_DATA_CACHE_KEY);
    if (cachedData) {
      const rainData = JSON.parse(cachedData);
      return rainData.amount;
    }
    
    // Si no hay caché, devolver datos simulados
    return Math.random() > 0.7 ? Math.random() * 5 : 0;
  }
};

// Función para obtener datos actuales de temperatura
export const fetchCurrentTemperatureData = async (): Promise<{ current: number, min: number, max: number }> => {
  try {
    // Forzar actualización de datos en tiempo real
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching temperature data');
    }
    
    const data = await response.json();
    
    // Extraer datos de temperatura
    const tempData = {
      current: data.main.temp,
      min: data.main.temp_min,
      max: data.main.temp_max,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en caché
    await AsyncStorage.setItem(TEMP_DATA_CACHE_KEY, JSON.stringify(tempData));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
    
    return tempData;
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    
    // Si hay un error, intentar usar datos en caché aunque estén expirados
    const cachedData = await AsyncStorage.getItem(TEMP_DATA_CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Si no hay caché, devolver datos simulados
    const currentTemp = 15 + Math.random() * 15; // Entre 15 y 30 grados
    return {
      current: currentTemp,
      min: currentTemp - (2 + Math.random() * 3),
      max: currentTemp + (2 + Math.random() * 3),
      timestamp: new Date().toISOString()
    };
  }
};

// Función para obtener datos actuales de viento
export const fetchCurrentWindData = async (): Promise<{ current: number, max: number, direction: number }> => {
  try {
    // Forzar actualización de datos en tiempo real
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching wind data');
    }
    
    const data = await response.json();
    
    // Extraer datos de viento (convertir de m/s a km/h)
    const windSpeedMps = data.wind.speed;
    const windSpeedKmh = windSpeedMps * 3.6;
    
    // Para la velocidad máxima, usamos un valor ligeramente mayor
    // En datos reales, esto vendría de una API que proporcione máximos históricos
    const maxWindSpeedKmh = windSpeedKmh * (1 + Math.random() * 0.3);
    
    const windData = {
      current: Math.round(windSpeedKmh * 10) / 10,
      max: Math.round(maxWindSpeedKmh * 10) / 10,
      direction: data.wind.deg,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en caché
    await AsyncStorage.setItem(WIND_DATA_CACHE_KEY, JSON.stringify(windData));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
    
    return windData;
  } catch (error) {
    console.error('Error fetching wind data:', error);
    
    // Si hay un error, intentar usar datos en caché aunque estén expirados
    const cachedData = await AsyncStorage.getItem(WIND_DATA_CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Si no hay caché, devolver datos simulados
    const currentWind = 5 + Math.random() * 20; // Entre 5 y 25 km/h
    return {
      current: Math.round(currentWind * 10) / 10,
      max: Math.round((currentWind * (1 + Math.random() * 0.3)) * 10) / 10,
      direction: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString()
    };
  }
};

// Función para obtener datos de pronóstico
export const fetchForecastData = async (): Promise<any[]> => {
  try {
    // Obtener datos de pronóstico para 5 días
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching forecast data');
    }
    
    const data = await response.json();
    
    // Procesar datos de pronóstico
    return data.list.map((item: any) => ({
      date: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      tempMin: item.main.temp_min,
      tempMax: item.main.temp_max,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed * 3.6, // Convertir de m/s a km/h
      windDirection: item.wind.deg,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      rainAmount: item.rain && item.rain['3h'] ? item.rain['3h'] : 0,
    }));
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    return [];
  }
};

// Función para obtener datos históricos por hora (lluvia, temperatura, viento)
export const fetchHourlyHistoricalData = async (hours: number = 24): Promise<{
  rainData: number[];
  tempData: number[];
  windData: number[];
  labels: string[];
}> => {
  try {
    // Verificar si tenemos datos en caché
    const cachedData = await AsyncStorage.getItem(HISTORICAL_DATA_CACHE_KEY);
    const cacheExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cachedData && cacheExpiry && new Date().getTime() < parseInt(cacheExpiry)) {
      const parsedData = JSON.parse(cachedData);
      
      // Asegurarse de que tenemos suficientes datos para el período solicitado
      if (parsedData.rainData.length >= hours && 
          parsedData.tempData.length >= hours && 
          parsedData.windData.length >= hours && 
          parsedData.labels.length >= hours) {
        
        // Devolver solo la cantidad de horas solicitadas
        return {
          rainData: parsedData.rainData.slice(0, hours),
          tempData: parsedData.tempData.slice(0, hours),
          windData: parsedData.windData.slice(0, hours),
          labels: parsedData.labels.slice(0, hours)
        };
      }
    }
    
    // Si no hay caché o está expirada, obtener datos nuevos
    
    // 1. Obtener datos actuales
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!currentResponse.ok) {
      throw new Error('Error fetching current weather data');
    }
    
    const currentData = await currentResponse.json();
    
    // 2. Obtener datos de pronóstico (que incluyen datos de las últimas horas)
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error('Error fetching forecast data');
    }
    
    const forecastData = await forecastResponse.json();
    
    // 3. Crear arrays para almacenar los datos
    const rainData: number[] = [];
    const tempData: number[] = [];
    const windData: number[] = [];
    const labels: string[] = [];
    const timestamps: number[] = [];
    
    // 4. Obtener hora actual
    const now = new Date();
    
    // 5. Añadir datos actuales
    rainData.push(currentData.rain && currentData.rain['1h'] ? currentData.rain['1h'] : 0);
    tempData.push(currentData.main.temp);
    windData.push(currentData.wind.speed * 3.6); // Convertir de m/s a km/h
    labels.push(now.getHours().toString() + 'h');
    timestamps.push(now.getTime());
    
    // 6. Añadir datos de pronóstico (que incluyen datos recientes)
    const forecastList = forecastData.list;
    
    // Ordenar por timestamp (más reciente primero)
    forecastList.sort((a: any, b: any) => b.dt - a.dt);
    
    // Filtrar para obtener solo datos de las últimas 'hours' horas
    for (const item of forecastList) {
      const itemDate = new Date(item.dt * 1000);
      const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      
      // Solo incluir datos que estén dentro del rango de horas solicitado
      // y que no sean duplicados (basados en la hora)
      if (hoursDiff > 0 && hoursDiff <= hours) {
        const itemHour = itemDate.getHours();
        
        // Verificar si ya tenemos datos para esta hora
        if (!labels.includes(itemHour.toString() + 'h')) {
          rainData.push(item.rain && item.rain['3h'] ? item.rain['3h'] / 3 : 0); // Convertir de 3h a 1h
          tempData.push(item.main.temp);
          windData.push(item.wind.speed * 3.6); // Convertir de m/s a km/h
          labels.push(itemHour.toString() + 'h');
          timestamps.push(itemDate.getTime());
        }
      }
    }
    
    // 7. Si no tenemos suficientes datos, completar con datos de la API de contaminación del aire
    // que proporciona datos históricos de las últimas 24 horas
    if (rainData.length < hours) {
      try {
        const airPollutionResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&start=${Math.floor(now.getTime()/1000 - hours*3600)}&end=${Math.floor(now.getTime()/1000)}&appid=${OPENWEATHER_API_KEY}`
        );
        
        if (airPollutionResponse.ok) {
          const airPollutionData = await airPollutionResponse.json();
          
          // Ordenar por timestamp (más reciente primero)
          airPollutionData.list.sort((a: any, b: any) => b.dt - a.dt);
          
          for (const item of airPollutionData.list) {
            const itemDate = new Date(item.dt * 1000);
            const itemHour = itemDate.getHours();
            
            // Verificar si ya tenemos datos para esta hora
            if (!labels.includes(itemHour.toString() + 'h')) {
              // La API de contaminación no proporciona datos de lluvia, temperatura o viento
              // pero podemos usar los datos actuales con pequeñas variaciones
              
              // Variación de temperatura basada en la hora del día
              let tempVariation = 0;
              if (itemHour >= 0 && itemHour < 6) {
                tempVariation = -2;
              } else if (itemHour >= 6 && itemHour < 12) {
                tempVariation = 0;
              } else if (itemHour >= 12 && itemHour < 18) {
                tempVariation = 2;
              } else {
                tempVariation = 0;
              }
              
              // Usar datos actuales con variaciones basadas en la hora
              rainData.push(0); // No tenemos datos históricos de lluvia
              tempData.push(currentData.main.temp + tempVariation);
              windData.push(currentData.wind.speed * 3.6 * (0.7 + Math.random() * 0.6)); // Variación del 70-130%
              labels.push(itemHour.toString() + 'h');
              timestamps.push(itemDate.getTime());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching air pollution data:', error);
      }
    }
    
    // 8. Si aún no tenemos suficientes datos, completar con datos generados
    // basados en los datos actuales y patrones realistas
    while (rainData.length < hours) {
      const missingHour = (now.getHours() - rainData.length + 24) % 24;
      
      // Variación de temperatura basada en la hora del día
      let tempVariation = 0;
      if (missingHour >= 0 && missingHour < 6) {
        tempVariation = -2 - Math.random();
      } else if (missingHour >= 6 && missingHour < 12) {
        tempVariation = -1 + missingHour * 0.2;
      } else if (missingHour >= 12 && missingHour < 18) {
        tempVariation = 2 - (missingHour - 12) * 0.2;
      } else {
        tempVariation = 0 - (missingHour - 18) * 0.3;
      }
      
      // Variación de viento basada en la hora del día
      let windVariation = 1.0; // Factor multiplicador
      if (missingHour >= 10 && missingHour < 16) {
        windVariation = 1.2 + Math.random() * 0.3; // 120-150%
      } else if (missingHour >= 16 && missingHour < 22) {
        windVariation = 1.0 + Math.random() * 0.2; // 100-120%
      } else {
        windVariation = 0.7 + Math.random() * 0.3; // 70-100%
      }
      
      // Probabilidad de lluvia basada en la hora del día
      let rainAmount = 0;
      if (currentData.rain && currentData.rain['1h']) {
        // Si está lloviendo ahora, generar datos históricos con lluvia
        if (missingHour >= 6 && missingHour < 10 || missingHour >= 16 && missingHour < 20) {
          rainAmount = currentData.rain['1h'] * (0.5 + Math.random());
        } else {
          rainAmount = currentData.rain['1h'] * (0.2 + Math.random() * 0.5);
        }
      }
      
      rainData.push(Math.round(rainAmount * 10) / 10);
      tempData.push(Math.round((currentData.main.temp + tempVariation) * 10) / 10);
      windData.push(Math.round((currentData.wind.speed * 3.6 * windVariation) * 10) / 10);
      labels.push(missingHour.toString() + 'h');
      
      const missingDate = new Date(now);
      missingDate.setHours(missingHour);
      timestamps.push(missingDate.getTime());
    }
    
    // 9. Ordenar todos los datos por timestamp (más antiguo primero)
    const sortedIndices = timestamps
      .map((timestamp, index) => ({ timestamp, index }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => item.index);
    
    const sortedRainData = sortedIndices.map(index => rainData[index]);
    const sortedTempData = sortedIndices.map(index => tempData[index]);
    const sortedWindData = sortedIndices.map(index => windData[index]);
    const sortedLabels = sortedIndices.map(index => labels[index]);
    
    // 10. Limitar a las horas solicitadas
    const result = {
      rainData: sortedRainData.slice(-hours),
      tempData: sortedTempData.slice(-hours),
      windData: sortedWindData.slice(-hours),
      labels: sortedLabels.slice(-hours)
    };
    
    // 11. Guardar en caché
    await AsyncStorage.setItem(HISTORICAL_DATA_CACHE_KEY, JSON.stringify(result));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
    
    return result;
  } catch (error) {
    console.error('Error fetching hourly historical data:', error);
    
    // Si hay un error, intentar usar datos en caché aunque estén expirados
    const cachedData = await AsyncStorage.getItem(HISTORICAL_DATA_CACHE_KEY);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // Devolver solo la cantidad de horas solicitadas
      return {
        rainData: parsedData.rainData.slice(0, hours),
        tempData: parsedData.tempData.slice(0, hours),
        windData: parsedData.windData.slice(0, hours),
        labels: parsedData.labels.slice(0, hours)
      };
    }
    
    // Si no hay caché, crear datos basados en patrones realistas
    const rainData: number[] = [];
    const tempData: number[] = [];
    const windData: number[] = [];
    const labels: string[] = [];
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Obtener datos actuales para usarlos como base
    let currentTemp = 20;
    let currentWind = 10;
    let isRaining = false;
    
    try {
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${MALAGA_LAT}&lon=${MALAGA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        currentTemp = currentData.main.temp;
        currentWind = currentData.wind.speed * 3.6;
        isRaining = currentData.rain && currentData.rain['1h'] > 0;
      }
    } catch (e) {
      // Ignorar errores y usar valores predeterminados
    }
    
    // Generar datos para las horas solicitadas
    for (let i = hours - 1; i >= 0; i--) {
      const hourOfDay = (currentHour - i + 24) % 24;
      
      // Variación de temperatura basada en la hora del día
      let tempVariation = 0;
      if (hourOfDay >= 0 && hourOfDay < 6) {
        tempVariation = -2 - Math.random();
      } else if (hourOfDay >= 6 && hourOfDay < 12) {
        tempVariation = -1 + hourOfDay * 0.2;
      } else if (hourOfDay >= 12 && hourOfDay < 18) {
        tempVariation = 2 - (hourOfDay - 12) * 0.2;
      } else {
        tempVariation = 0 - (hourOfDay - 18) * 0.3;
      }
      
      // Variación de viento basada en la hora del día
      let windVariation = 1.0; // Factor multiplicador
      if (hourOfDay >= 10 && hourOfDay < 16) {
        windVariation = 1.2 + Math.random() * 0.3; // 120-150%
      } else if (hourOfDay >= 16 && hourOfDay < 22) {
        windVariation = 1.0 + Math.random() * 0.2; // 100-120%
      } else {
        windVariation = 0.7 + Math.random() * 0.3; // 70-100%
      }
      
      // Probabilidad de lluvia basada en la hora del día
      let rainAmount = 0;
      if (isRaining) {
        if (hourOfDay >= 6 && hourOfDay < 10 || hourOfDay >= 16 && hourOfDay < 20) {
          rainAmount = 1 + Math.random() * 2;
        } else {
          rainAmount = Math.random() * 1.5;
        }
      } else if (Math.random() > 0.8) {
        rainAmount = Math.random() * 0.5;
      }
      
      tempData.push(Math.round((currentTemp + tempVariation) * 10) / 10);
      windData.push(Math.round((currentWind * windVariation) * 10) / 10);
      rainData.push(Math.round(rainAmount * 10) / 10);
      labels.push(hourOfDay.toString() + 'h');
    }
    
    return { rainData, tempData, windData, labels };
  }
};

// Función para almacenar datos meteorológicos en caché
const cacheWeatherData = async (data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem('weather_data_cache', JSON.stringify(data));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
  } catch (error) {
    console.error('Error caching weather data:', error);
  }
};

// Función para obtener datos meteorológicos de la caché
const getCachedWeatherData = async (ignoreExpiry: boolean = false): Promise<any | null> => {
  try {
    const cachedData = await AsyncStorage.getItem('weather_data_cache');
    const cacheExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cachedData) {
      return null;
    }
    
    // Verificar si la caché ha expirado
    if (!ignoreExpiry && cacheExpiry && new Date().getTime() > parseInt(cacheExpiry)) {
      return null;
    }
    
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error getting cached weather data:', error);
    return null;
  }
};

// Función para generar datos meteorológicos simulados (solo como fallback)
const getSimulatedWeatherData = (date: string): any => {
  // Generar datos aleatorios basados en la fecha
  const dateObj = new Date(date);
  const month = dateObj.getMonth(); // 0-11
  
  // Ajustar temperatura según el mes (más cálido en verano, más frío en invierno)
  let baseTemp = 15;
  if (month >= 5 && month <= 8) { // Verano (junio-septiembre)
    baseTemp = 25;
  } else if (month >= 9 || month <= 2) { // Otoño-Invierno (octubre-marzo)
    baseTemp = 12;
  }
  
  // Añadir variación aleatoria
  const temp = baseTemp + (Math.random() * 10 - 5);
  const tempMin = temp - (2 + Math.random() * 3);
  const tempMax = temp + (2 + Math.random() * 3);
  
  // Probabilidad de lluvia según el mes
  let rainProbability = 0.2;
  if (month >= 9 && month <= 11) { // Otoño
    rainProbability = 0.4;
  } else if (month >= 0 && month <= 2) { // Invierno
    rainProbability = 0.5;
  } else if (month >= 3 && month <= 5) { // Primavera
    rainProbability = 0.3;
  }
  
  // Determinar si llueve y cuánto
  const isRaining = Math.random() < rainProbability;
  const rainAmount = isRaining ? Math.random() * 10 : 0;
  
  // Velocidad del viento
  const windSpeed = 5 + Math.random() * 20; // Entre 5 y 25 km/h
  
  return {
    temperature: Math.round(temp * 10) / 10,
    tempMin: Math.round(tempMin * 10) / 10,
    tempMax: Math.round(tempMax * 10) / 10,
    humidity: Math.floor(40 + Math.random() * 40), // Entre 40% y 80%
    windSpeed: Math.round(windSpeed * 10) / 10,
    windDirection: Math.floor(Math.random() * 360),
    description: isRaining ? 'lluvia' : Math.random() > 0.7 ? 'parcialmente nublado' : 'despejado',
    icon: isRaining ? '10d' : Math.random() > 0.7 ? '03d' : '01d',
    rainAmount: Math.round(rainAmount * 100) / 100,
    date: date,
    timestamp: new Date().toISOString(),
    simulated: true
  };
};

// Función para limpiar la caché meteorológica
export const clearWeatherCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('weather_data_cache');
    await AsyncStorage.removeItem(RAIN_DATA_CACHE_KEY);
    await AsyncStorage.removeItem(TEMP_DATA_CACHE_KEY);
    await AsyncStorage.removeItem(WIND_DATA_CACHE_KEY);
    await AsyncStorage.removeItem(HISTORICAL_DATA_CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing weather cache:', error);
  }
};

// Función para obtener datos de radar de lluvia de RainViewer
export const fetchRainViewerData = async () => {
  try {
    // RainViewer API endpoint
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    
    if (!response.ok) {
      throw new Error('Error fetching RainViewer data');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching RainViewer data:', error);
    return null;
  }
};
