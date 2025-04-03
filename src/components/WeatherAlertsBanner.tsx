import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import CreateAlertModal from './CreateAlertModal';
import UserAlertItem from './UserAlertItem';
import { UserAlert, AlertCheckResult } from '../types/alerts';
import { getAlerts, checkAlerts, toggleAlertActive, deleteAlert } from '../services/alertService';

interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
  sender_name: string;
  severity: string;
}

interface WeatherAlertsBannerProps {
  isLoading?: boolean;
}

const WeatherAlertsBanner: React.FC<WeatherAlertsBannerProps> = ({ 
  isLoading = false
}) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [alertResults, setAlertResults] = useState<AlertCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'user'>('api');

  useEffect(() => {
    fetchAlerts();
    loadUserAlerts();
    
    // Set up interval to refresh data every 30 minutes
    const intervalId = setInterval(() => {
      fetchAlerts();
      loadUserAlerts();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Use the OpenWeatherMap API 3.0 for Málaga
      const response = await fetch(
        'https://api.openweathermap.org/data/3.0/onecall?lat=36.7213&lon=-4.4213&exclude=minutely,hourly&units=metric&lang=es&appid=5ae0c9a3137234e18e032e3d6024629e'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather alerts');
      }
      
      const data = await response.json();
      
      // Check if there are any alerts
      if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
        setAlerts(data.alerts);
      } else {
        // No alerts, set empty array
        setAlerts([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      setError('Failed to load weather alerts');
      // Generate fallback data for testing if needed
      if (process.env.NODE_ENV === 'development') {
        setAlerts(generateFallbackAlerts());
      } else {
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserAlerts = async () => {
    try {
      // Load user alerts
      const userAlertsData = await getAlerts();
      setUserAlerts(userAlertsData);
      
      // Check if any alerts are triggered
      const results = await checkAlerts();
      setAlertResults(results);
    } catch (error) {
      console.error('Error loading user alerts:', error);
    }
  };

  const handleCreateAlert = async (alert: UserAlert) => {
    setUserAlerts(prev => [...prev, alert]);
    await loadUserAlerts(); // Reload to check if the new alert is triggered
  };

  const handleToggleActive = async (alertId: string) => {
    await toggleAlertActive(alertId);
    await loadUserAlerts();
  };

  const handleDeleteAlert = async (alertId: string) => {
    await deleteAlert(alertId);
    await loadUserAlerts();
  };

  const generateFallbackAlerts = (): WeatherAlert[] => {
    const now = Math.floor(Date.now() / 1000);
    const tomorrow = now + 24 * 60 * 60;
    
    return [
      {
        event: 'Alerta por calor',
        description: 'Se esperan temperaturas superiores a 38°C en la costa de Málaga. Se recomienda evitar la exposición al sol entre las 12:00 y las 16:00.',
        start: now,
        end: tomorrow,
        sender_name: 'AEMET',
        severity: 'moderate'
      },
      {
        event: 'Aviso por vientos fuertes',
        description: 'Rachas de viento de hasta 70 km/h en zonas costeras. Precaución con objetos que puedan desprenderse.',
        start: now,
        end: now + 12 * 60 * 60,
        sender_name: 'Protección Civil',
        severity: 'minor'
      }
    ];
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return '#EF4444'; // Red
      case 'severe':
        return '#F59E0B'; // Orange
      case 'moderate':
        return '#FBBF24'; // Yellow
      case 'minor':
      default:
        return '#10B981'; // Green
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'alert-triangle';
      case 'severe':
        return 'alert-circle';
      case 'moderate':
        return 'alert-octagon';
      case 'minor':
      default:
        return 'info';
    }
  };

  const toggleExpand = (index: number) => {
    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  const getTriggeredAlertsCount = () => {
    return alertResults.filter(result => result.triggered).length;
  };

  if (isLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.loadingText}>Cargando avisos meteorológicos...</Text>
        </View>
      </View>
    );
  }

  const renderApiAlerts = () => {
    if (error && alerts.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (alerts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="check-circle" size={16} color="#10B981" />
          <Text style={styles.emptyText}>Sin avisos meteorológicos activos</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.alertsContainer}>
        {alerts.map((alert, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.alertItem,
              { backgroundColor: `${getSeverityColor(alert.severity)}20` } // 20 is for 12% opacity
            ]}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.7}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertTitleContainer}>
                <Feather 
                  name={getSeverityIcon(alert.severity)} 
                  size={14} 
                  color={getSeverityColor(alert.severity)} 
                  style={styles.alertIcon}
                />
                <Text style={styles.alertTitle} numberOfLines={expanded === index ? undefined : 1}>
                  {alert.event}
                </Text>
              </View>
              <Feather 
                name={expanded === index ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="rgba(255, 255, 255, 0.7)" 
              />
            </View>
            
            {expanded === index && (
              <View style={styles.alertDetails}>
                <Text style={styles.alertDescription}>
                  {alert.description}
                </Text>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTime}>
                    <Feather name="clock" size={10} color="rgba(255, 255, 255, 0.7)" /> {formatDate(alert.start)} - {formatDate(alert.end)}
                  </Text>
                  <Text style={styles.alertSource}>
                    <Feather name="user" size={10} color="rgba(255, 255, 255, 0.7)" /> {alert.sender_name}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderUserAlerts = () => {
    if (userAlerts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="bell-off" size={16} color="#9CA3AF" />
          <Text style={styles.emptyText}>No tienes alertas personalizadas</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.alertsContainer}>
        {userAlerts.map(alert => {
          const result = alertResults.find(r => r.alert.id === alert.id);
          return (
            <UserAlertItem
              key={alert.id}
              alert={alert}
              currentValue={result?.currentValue}
              isTriggered={result?.triggered}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteAlert}
            />
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="alert-circle" size={12} color="#F59E0B" />
          <Text style={styles.titleText}>
            Avisos meteorológicos
            {getTriggeredAlertsCount() > 0 && ` (${getTriggeredAlertsCount()} activos)`}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Feather name="plus-circle" size={16} color="#10B981" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'api' && styles.activeTab]}
          onPress={() => setActiveTab('api')}
        >
          <Text style={[styles.tabText, activeTab === 'api' && styles.activeTabText]}>
            Oficiales ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'user' && styles.activeTab]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
            Mis Alertas ({userAlerts.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'api' ? renderApiAlerts() : renderUserAlerts()}
      
      <CreateAlertModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onAlertCreated={handleCreateAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 6,
    marginTop: 2,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginLeft: 4,
  },
  addButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  alertsContainer: {
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    textAlign: 'center',
    padding: 4,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginLeft: 8,
  },
  alertItem: {
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    marginRight: 6,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
    flex: 1,
  },
  alertDetails: {
    padding: 6,
    paddingTop: 0,
  },
  alertDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  alertSource: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
});

export default WeatherAlertsBanner;
