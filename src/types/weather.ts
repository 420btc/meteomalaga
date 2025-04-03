export type BetOption = 'rain_yes' | 'rain_no' | 'rain_amount' | 'temperature' | 'temp_min' | 'temp_max' | 'wind_max';
export type BetStatus = 'pending' | 'ganada' | 'perdida' | 'error';
export type BetMode = 'Simple' | 'Pro';

export interface Bet {
  id?: string;
  date: string;
  option: BetOption;
  value: number;
  coins: number;
  leverage: number;
  timestamp: string;
  result?: number | null;
  won?: boolean | null;
  city?: string;
  mode?: BetMode;
  rain_mm?: number | null;
  temp_min_c?: number | null;
  temp_max_c?: number | null;
  temperature_c?: number | null;
  wind_kmh_max?: number | null;
  range_min?: number | null;
  range_max?: number | null;
  resolution_date?: string;
  user_id?: string;
  status?: BetStatus;
  bet_type?: string;
  bet_resolution_hours?: number;
  verificationTime?: string;
  verified?: boolean;
  resolution_explanation?: string;
}

export interface BetResult {
  betId: string;
  result: number;
  won: boolean;
  margin?: number;
}

export interface WeatherData {
  temperature: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  date: string;
  timestamp: string;
  rainAmount?: number;
  simulated?: boolean;
}

export interface TemperatureData {
  current: number;
  min: number;
  max: number;
  timestamp: string;
}

export interface WindData {
  current: number;
  max: number;
  direction: number;
  timestamp: string;
}
