import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import DailyRewardsButton from '../components/DailyRewardsButton';
import ProfilePictureSelector from '../components/ProfilePictureSelector';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    user, 
    coins, 
    waterDrops, 
    bets, 
    logout, 
    isAuthenticated,
    trackActivity
  } = useApp();
  
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    trackActivity();
  }, []);
  
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            await logout();
            navigation.navigate('Login' as never);
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await trackActivity();
    setRefreshing(false);
  };
  
  const goBack = () => {
    navigation.goBack();
  };
  
  const totalBets = user?.totalBets || 0;
  const wonBets = user?.wonBets || 0;
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#1E3A8A', '#60A5FA', '#87CEEB']} // Mismo degradado que MainScreen
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a90e2']}
              tintColor="#FFFFFF"
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goBack}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.title}>Mi Perfil</Text>
            
            {isAuthenticated && (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.profileSection}>
            <ProfilePictureSelector currentAvatar={user?.avatar} />
            
            <Text style={styles.username}>
              {user?.username || 'Usuario'}
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Feather name="dollar-sign" size={20} color="#FFD700" />
                <Text style={styles.statValue}>{coins}</Text>
                <Text style={styles.statLabel}>Monedas</Text>
              </View>
              
              <View style={styles.statItem}>
                <Feather name="droplet" size={20} color="#3B82F6" />
                <Text style={styles.statValue}>{waterDrops}</Text>
                <Text style={styles.statLabel}>Gotas</Text>
              </View>
              
              <View style={styles.statItem}>
                <Feather name="percent" size={20} color="#4a90e2" />
                <Text style={styles.statValue}>{winRate}%</Text>
                <Text style={styles.statLabel}>Victorias</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>Recompensas</Text>
            <DailyRewardsButton />
          </View>
          
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{totalBets}</Text>
                <Text style={styles.statCardLabel}>Apuestas totales</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{wonBets}</Text>
                <Text style={styles.statCardLabel}>Apuestas ganadas</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{totalBets - wonBets}</Text>
                <Text style={styles.statCardLabel}>Apuestas perdidas</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{winRate}%</Text>
                <Text style={styles.statCardLabel}>Porcentaje de victorias</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('BetHistory' as never)}
            >
              <Feather name="clock" size={20} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Historial de apuestas</Text>
              <Feather name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Leaderboard' as never)}
            >
              <Feather name="award" size={20} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Clasificación</Text>
              <Feather name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Rules' as never)}
            >
              <Feather name="info" size={20} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Reglas del juego</Text>
              <Feather name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Versión 1.0.0
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700', // Borde amarillo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rewardsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700', // Borde amarillo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700', // Borde amarillo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)', // Borde amarillo más sutil
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700', // Valor en amarillo para destacar
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statCardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700', // Borde amarillo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700', // Borde amarillo
  },
  actionIcon: {
    marginRight: 15,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ProfileScreen;
