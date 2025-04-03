import { WeatherData } from './weather';

export type AlertType = 'rain' | 'temperature';
export type AlertCondition = 'above' | 'below' | 'equals';

export interface UserAlert {
  id: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  userId?: string;
  name: string;
}

export interface AlertCheckResult {
  triggered: boolean;
  alert: UserAlert;
  currentValue: number;
}
