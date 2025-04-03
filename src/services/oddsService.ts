import { isWithinBettingWindowSync } from './weatherService';

// Constants for seasonal adjustments
const SUMMER_MONTHS = [6, 7, 8, 9]; // June to September
const WINTER_MONTHS = [12, 1, 2]; // December to February
const SPRING_MONTHS = [3, 4, 5]; // March to May
const AUTUMN_MONTHS = [10, 11]; // October to November

/**
 * Determines if the current month is in summer
 */
export const isSummerMonth = (): boolean => {
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  return SUMMER_MONTHS.includes(currentMonth);
};

/**
 * Determines if the current month is in winter
 */
export const isWinterMonth = (): boolean => {
  const currentMonth = new Date().getMonth() + 1;
  return WINTER_MONTHS.includes(currentMonth);
};

/**
 * Determines if the current month is in spring
 */
export const isSpringMonth = (): boolean => {
  const currentMonth = new Date().getMonth() + 1;
  return SPRING_MONTHS.includes(currentMonth);
};

/**
 * Determines if the current month is in autumn
 */
export const isAutumnMonth = (): boolean => {
  const currentMonth = new Date().getMonth() + 1;
  return AUTUMN_MONTHS.includes(currentMonth);
};

/**
 * Applies seasonal adjustments to odds based on the current month
 * @param odds Base odds value
 * @param betType Type of bet (rain, temperature, wind)
 * @param value The value being bet on
 */
export const applySeasonalAdjustment = (odds: number, betType: string, value: number): number => {
  // Summer adjustments - Málaga is very dry in summer
  if (isSummerMonth()) {
    if (betType === 'rain' && value > 0) {
      // Much higher odds for any rain in summer (very rare)
      return value <= 1 ? odds * 1.5 : odds * 1.8; 
    }
    if (betType === 'rain_yes') {
      // Much higher odds for "will rain" in summer
      return odds * 1.8;
    }
    if (betType === 'rain_no') {
      // Lower odds for "won't rain" in summer (very likely)
      return odds * 0.8;
    }
    if (betType === 'wind' && value > 20) {
      // Higher odds for strong winds in summer
      return odds * 1.3;
    }
    if (betType === 'temperature' && value > 30) {
      return odds * 0.8; // Lower odds for high temperatures in summer (more common)
    }
  }
  
  // Winter adjustments - More rain in winter in Málaga
  if (isWinterMonth()) {
    if (betType === 'rain' && value > 0) {
      // Lower odds for rain in winter (more common)
      return value <= 3 ? odds * 0.7 : odds * 0.8;
    }
    if (betType === 'rain_yes') {
      // Lower odds for "will rain" in winter (more common)
      return odds * 0.7;
    }
    if (betType === 'rain_no') {
      // Higher odds for "won't rain" in winter (less likely than summer)
      return odds * 1.2;
    }
    if (betType === 'wind' && value > 30) {
      // Lower odds for strong winds in winter (more common)
      return odds * 0.8;
    }
    if (betType === 'temperature' && value < 14) {
      return odds * 1.2; // Higher odds for low temperatures in winter
    }
  }
  
  // Autumn adjustments - Rainy season in Málaga
  if (isAutumnMonth()) {
    if (betType === 'rain' && value > 0) {
      // Much lower odds for rain in autumn (very common)
      return value <= 5 ? odds * 0.6 : odds * 0.7;
    }
    if (betType === 'rain_yes') {
      // Much lower odds for "will rain" in autumn (very common)
      return odds * 0.6;
    }
    if (betType === 'rain_no') {
      // Higher odds for "won't rain" in autumn (less likely)
      return odds * 1.4;
    }
    if (betType === 'wind' && value > 25) {
      // Lower odds for strong winds in autumn
      return odds * 0.9;
    }
  }
  
  // Spring adjustments
  if (isSpringMonth()) {
    if (betType === 'rain' && value > 0) {
      // Moderate adjustment for spring rain
      return value <= 3 ? odds * 0.9 : odds;
    }
    if (betType === 'rain_yes') {
      // Moderate adjustment for "will rain" in spring
      return odds * 0.9;
    }
    if (betType === 'rain_no') {
      // Slight adjustment for "won't rain" in spring
      return odds * 1.1;
    }
    if (betType === 'wind' && value > 25) {
      // Spring can be windy in Málaga
      return odds * 0.9;
    }
  }
  
  return odds; // No adjustment for other conditions
};

/**
 * Calculates odds for rain bets based on realistic probabilities for Málaga
 * @param mm Rain amount in millimeters
 */
export const getRainOdds = (mm: number): number => {
  let baseOdds: number;
  
  // Rain odds based on Málaga's climate data
  if (mm === 0 || mm < 0.01) {
    baseOdds = 1.15; // Very high probability of no rain in Málaga (87% chance)
  } else if (mm <= 1) {
    baseOdds = 3.5; // Light rain is uncommon
  } else if (mm <= 3) {
    baseOdds = 5.0; // Moderate rain is rare
  } else if (mm <= 5) {
    baseOdds = 8.0; // Significant rain is very rare
  } else if (mm <= 10) {
    baseOdds = 15.0; // Heavy rain is extremely rare
  } else if (mm <= 15) {
    baseOdds = 25.0; // Very heavy rain is exceptionally rare
  } else if (mm <= 20) {
    baseOdds = 40.0; // Almost never happens
  } else if (mm <= 30) {
    baseOdds = 60.0; // Extremely unlikely
  } else if (mm <= 40) {
    baseOdds = 100.0; // Almost impossible
  } else if (mm <= 50) {
    baseOdds = 150.0; // Practically impossible
  } else if (mm <= 75) {
    baseOdds = 250.0; // Historical record territory
  } else if (mm <= 100) {
    baseOdds = 500.0; // Beyond historical records
  } else {
    baseOdds = 1000.0; // Catastrophic flooding level
  }
  
  // Apply seasonal adjustments
  return applySeasonalAdjustment(baseOdds, 'rain', mm);
};

/**
 * Gets odds for "will rain" bets based on Málaga's climate
 */
export const getRainYesOdds = (): number => {
  // Base odds for "will rain" - Málaga has rain on ~13% of days annually
  const baseOdds = 4.0; // Approximately 1/0.25 = 4.0
  
  // Apply seasonal adjustments
  return applySeasonalAdjustment(baseOdds, 'rain_yes', 1);
};

/**
 * Gets odds for "won't rain" bets based on Málaga's climate
 */
export const getRainNoOdds = (): number => {
  // Base odds for "won't rain" - Málaga has no rain on ~87% of days annually
  const baseOdds = 1.15; // Approximately 1/0.87 = 1.15
  
  // Apply seasonal adjustments
  return applySeasonalAdjustment(baseOdds, 'rain_no', 0);
};

/**
 * Calculates odds for temperature bets based on realistic probabilities and season
 * @param temp Temperature in Celsius
 */
export const getTemperatureOdds = (temp: number): number => {
  let baseOdds: number;
  
  // Different odds based on season
  if (isSummerMonth()) {
    // Summer temperature odds for Málaga
    if (temp < 20) {
      baseOdds = 8.0; // Very unlikely to be below 20°C in summer
    } else if (temp <= 25) {
      baseOdds = 3.0; // Uncommon but possible
    } else if (temp <= 30) {
      baseOdds = 1.5; // Very common in summer
    } else if (temp <= 35) {
      baseOdds = 2.0; // Common but not everyday
    } else if (temp <= 40) {
      baseOdds = 5.0; // Uncommon heat waves
    } else {
      baseOdds = 15.0; // Extreme heat, very rare
    }
  } else if (isWinterMonth()) {
    // Winter temperature odds for Málaga
    if (temp < 8) {
      baseOdds = 10.0; // Very rare to be this cold
    } else if (temp <= 12) {
      baseOdds = 3.0; // Cold but possible
    } else if (temp <= 16) {
      baseOdds = 1.8; // Common winter temperature
    } else if (temp <= 20) {
      baseOdds = 2.5; // Mild winter day
    } else if (temp <= 25) {
      baseOdds = 6.0; // Unusually warm
    } else {
      baseOdds = 15.0; // Extremely warm for winter
    }
  } else if (isSpringMonth()) {
    // Spring temperature odds
    if (temp < 12) {
      baseOdds = 6.0; // Unusually cold
    } else if (temp <= 16) {
      baseOdds = 2.5; // Cool spring day
    } else if (temp <= 20) {
      baseOdds = 1.8; // Common spring temperature
    } else if (temp <= 25) {
      baseOdds = 2.0; // Warm spring day
    } else if (temp <= 30) {
      baseOdds = 4.0; // Very warm for spring
    } else {
      baseOdds = 10.0; // Extremely hot for spring
    }
  } else {
    // Autumn temperature odds
    if (temp < 12) {
      baseOdds = 7.0; // Unusually cold
    } else if (temp <= 16) {
      baseOdds = 3.0; // Cool autumn day
    } else if (temp <= 20) {
      baseOdds = 1.7; // Common autumn temperature
    } else if (temp <= 25) {
      baseOdds = 2.2; // Warm autumn day
    } else if (temp <= 30) {
      baseOdds = 5.0; // Very warm for autumn
    } else {
      baseOdds = 12.0; // Extremely hot for autumn
    }
  }
  
  // Apply seasonal adjustments
  return applySeasonalAdjustment(baseOdds, 'temperature', temp);
};

/**
 * Calculates odds for wind speed bets based on realistic probabilities for Málaga
 * @param speed Wind speed in km/h
 */
export const getWindOdds = (speed: number): number => {
  let baseOdds: number;
  
  // Wind odds based on Málaga's climate data
  if (speed <= 5) {
    baseOdds = 2.5; // Very light wind is common but not constant
  } else if (speed <= 10) {
    baseOdds = 1.8; // Light breeze is common in Málaga
  } else if (speed <= 15) {
    baseOdds = 2.0; // Gentle breeze is common
  } else if (speed <= 20) {
    baseOdds = 2.5; // Moderate breeze is fairly common
  } else if (speed <= 25) {
    baseOdds = 3.5; // Fresh breeze is less common
  } else if (speed <= 30) {
    baseOdds = 5.0; // Strong breeze is uncommon
  } else if (speed <= 40) {
    baseOdds = 8.0; // Near gale is rare
  } else if (speed <= 50) {
    baseOdds = 15.0; // Gale is very rare
  } else if (speed <= 60) {
    baseOdds = 30.0; // Strong gale is extremely rare
  } else if (speed <= 75) {
    baseOdds = 60.0; // Storm is exceptionally rare
  } else if (speed <= 90) {
    baseOdds = 120.0; // Violent storm almost never happens
  } else {
    baseOdds = 250.0; // Hurricane force is practically impossible in Málaga
  }
  
  // Apply seasonal adjustments
  return applySeasonalAdjustment(baseOdds, 'wind', speed);
};

/**
 * Gets the current season name for display purposes
 */
export const getCurrentSeason = (): string => {
  if (isSummerMonth()) {
    return "Verano";
  } else if (isWinterMonth()) {
    return "Invierno";
  } else if (isSpringMonth()) {
    return "Primavera";
  } else {
    return "Otoño";
  }
};

/**
 * Gets a description of the current betting conditions based on season
 */
export const getSeasonalBettingDescription = (): string => {
  const season = getCurrentSeason();
  
  if (season === "Verano") {
    return "Verano en Málaga: Cuotas muy altas para lluvia, altas para viento fuerte, bajas para temperaturas elevadas.";
  } else if (season === "Invierno") {
    return "Invierno en Málaga: Cuotas más bajas para lluvia, moderadas para viento, altas para temperaturas bajas.";
  } else if (season === "Primavera") {
    return "Primavera en Málaga: Cuotas moderadas para lluvia, ligeramente reducidas para viento, equilibradas para temperatura.";
  } else {
    return "Otoño en Málaga: Cuotas muy bajas para lluvia (temporada de lluvias), moderadas para viento y temperatura.";
  }
};
