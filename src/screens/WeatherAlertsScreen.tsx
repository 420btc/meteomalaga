import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import WeatherAlertsBanner from '../components/WeatherAlertsBanner';
import CreateAlertModal from '../components/CreateAlertModal';
import UserAlertItem from '../components/UserAlertItem';
import { UserAlert, AlertCheckResult } from '../types/alerts';
import { getAlerts, checkAlerts, toggleAlertActive, deleteAlert } from '../services/alertService';
import { useApp } from '../context/AppContext';

const WeatherAlertsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language } = useApp();
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [alertResults, setAlertResults] = useState<AlertCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    loadUserAlerts();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      loadUserAlerts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadUserAlerts = async () => {
    try {
      setLoading(true);
      // Load user alerts
      const userAlertsData = await getAlerts();
      setUserAlerts(userAlertsData);
      
      // Check if any alerts are triggered
      const results = await checkAlerts();
      setAlertResults(results);
    } catch (error) {
      console.error('Error loading user alerts:', error);
    } finally {
      setLoading(false);
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

  const getTriggeredAlertsCount = () => {
    return alertResults.filter(result => result.triggered).length;
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'es' ? 'Alertas Meteorológicas' : 'Weather Alerts'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Feather name="plus-circle" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Official Alerts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="alert-triangle" size={18} color="#F59E0B" />
              <Text style={styles.sectionTitle}>
                {language === 'es' ? 'Alertas Oficiales' : 'Official Alerts'}
              </Text>
            </View>
            <WeatherAlertsBanner />
          </View>

          {/* User Alerts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="bell" size={18} color="#10B981" />
              <Text style={styles.sectionTitle}>
                {language === 'es' ? 'Mis Alertas' : 'My Alerts'}
                {getTriggeredAlertsCount() > 0 && ` (${getTriggeredAlertsCount()} ${language === 'es' ? 'activas' : 'active'})`}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {language === 'es' ? 'Cargando alertas...' : 'Loading alerts...'}
                </Text>
              </View>
            ) : userAlerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="bell-off" size={24} color="#9CA3AF" />
                <Text style={styles.emptyText}>
                  {language === 'es' ? 'No tienes alertas personalizadas' : 'You have no custom alerts'}
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={styles.createButtonText}>
                    {language === 'es' ? 'Crear Alerta' : 'Create Alert'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.alertsList}>
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
            )}
          </View>

          {/* Create Alert Modal */}
          <CreateAlertModal
            visible={createModalVisible}
            onClose={() => setCreateModalVisible(false)}
            onAlertCreated={handleCreateAlert}
          />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  addButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  alertsList: {
    maxHeight: 300,
  },
});

export default WeatherAlertsScreen;
