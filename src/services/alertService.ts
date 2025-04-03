import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAlert, AlertCheckResult } from '../types/alerts';
import { fetchCurrentTemperatureData, fetchCurrentRainData } from './weatherService';

const ALERTS_STORAGE_KEY = 'user_weather_alerts';

// Create a new alert
export const createAlert = async (alert: Omit<UserAlert, 'id' | 'createdAt'>): Promise<UserAlert> => {
  try {
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Create the complete alert object
    const newAlert: UserAlert = {
      ...alert,
      id,
      createdAt: new Date().toISOString(),
    };
    
    // Get existing alerts
    const existingAlerts = await getAlerts();
    
    // Add the new alert
    const updatedAlerts = [...existingAlerts, newAlert];
    
    // Save to storage
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
    
    return newAlert;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }
};

// Get all alerts
export const getAlerts = async (): Promise<UserAlert[]> => {
  try {
    const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    
    if (!alertsJson) {
      return [];
    }
    
    return JSON.parse(alertsJson);
  } catch (error) {
    console.error('Error getting alerts:', error);
    return [];
  }
};

// Update an alert
export const updateAlert = async (updatedAlert: UserAlert): Promise<UserAlert> => {
  try {
    const alerts = await getAlerts();
    
    const updatedAlerts = alerts.map(alert => 
      alert.id === updatedAlert.id ? updatedAlert : alert
    );
    
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
    
    return updatedAlert;
  } catch (error) {
    console.error('Error updating alert:', error);
    throw new Error('Failed to update alert');
  }
};

// Delete an alert
export const deleteAlert = async (alertId: string): Promise<void> => {
  try {
    const alerts = await getAlerts();
    
    const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
    
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filteredAlerts));
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw new Error('Failed to delete alert');
  }
};

// Toggle alert active status
export const toggleAlertActive = async (alertId: string): Promise<UserAlert> => {
  try {
    const alerts = await getAlerts();
    
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    const updatedAlert = {
      ...alert,
      active: !alert.active
    };
    
    return await updateAlert(updatedAlert);
  } catch (error) {
    console.error('Error toggling alert:', error);
    throw new Error('Failed to toggle alert');
  }
};

// Check if any alerts are triggered based on current weather data
export const checkAlerts = async (): Promise<AlertCheckResult[]> => {
  try {
    const alerts = await getAlerts();
    const activeAlerts = alerts.filter(alert => alert.active);
    
    if (activeAlerts.length === 0) {
      return [];
    }
    
    // Fetch current weather data
    const temperatureData = await fetchCurrentTemperatureData();
    const rainData = await fetchCurrentRainData();
    
    // Check each alert
    const results: AlertCheckResult[] = [];
    
    for (const alert of activeAlerts) {
      let triggered = false;
      let currentValue = 0;
      
      if (alert.type === 'temperature') {
        currentValue = temperatureData.current;
        
        if (alert.condition === 'above' && currentValue > alert.threshold) {
          triggered = true;
        } else if (alert.condition === 'below' && currentValue < alert.threshold) {
          triggered = true;
        } else if (alert.condition === 'equals' && Math.abs(currentValue - alert.threshold) < 0.5) {
          triggered = true;
        }
      } else if (alert.type === 'rain') {
        currentValue = rainData;
        
        if (alert.condition === 'above' && currentValue > alert.threshold) {
          triggered = true;
        } else if (alert.condition === 'below' && currentValue < alert.threshold) {
          triggered = true;
        } else if (alert.condition === 'equals' && Math.abs(currentValue - alert.threshold) < 0.5) {
          triggered = true;
        }
      }
      
      results.push({
        triggered,
        alert,
        currentValue
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error checking alerts:', error);
    return [];
  }
};
