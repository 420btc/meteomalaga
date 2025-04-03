import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated, SafeAreaView, Platform, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { useApp } from '../context/AppContext';
import { Feather } from '@expo/vector-icons';

type AuthStatusScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthStatus'>;

const AuthStatusScreen: React.FC = () => {
  const navigation = useNavigation<AuthStatusScreenNavigationProp>();
  const { isAuthenticated, user, logout, bets } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonFadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleContinue = () => {
    navigation.replace('Main');
  };

  const logoUrl = isAuthenticated 
    ? 'https://cdn-icons-png.flaticon.com/512/869/869869.png'
    : 'https://cdn-icons-png.flaticon.com/512/1779/1779927.png';

  const totalBets = bets.length;
  const pendingBets = bets.filter(bet => !bet.resolved).length;
  const wonBets = bets.filter(bet => bet.won).length;
  const lostBets = bets.filter(bet => bet.resolved && !bet.won).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Animated.View 
              style={[
                styles.logoContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain"/>
              <Text style={styles.title}>Meteo Málaga</Text>
              <Text style={styles.subtitle}>Estado de Autenticación</Text>
            </Animated.View>
            
            <Animated.View style={[styles.statusContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.statusSection}>
                <View style={styles.statusItem}>
                  <View style={styles.statusLabelContainer}>
                    <Text style={styles.statusLabel}>Estado:</Text>
                  </View>
                  <View style={[styles.statusBadge, isAuthenticated ? styles.connectedBadge : styles.disconnectedBadge]}>
                    <Text style={styles.statusBadgeText}>
                      {isAuthenticated ? 'Conectado' : 'No conectado'}
                    </Text>
                  </View>
                </View>
                {isAuthenticated && user && (
                  <View style={styles.statusItem}>
                    <View style={styles.statusLabelContainer}>
                      <Text style={styles.statusLabel}>Usuario:</Text>
                    </View>
                    <View style={styles.statusValueContainer}>
                      <Text style={styles.statusValue}>{user.username}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.separator}></View>
              
              {isAuthenticated && user && (
                <View style={styles.statusSection}>
                  <View style={styles.coinsStatusItem}>
                    <View style={styles.statusLabelContainer}>
                      <Text style={styles.coinsLabel}>Monedas:</Text>
                    </View>
                    <View style={styles.statusValueContainer}>
                      <Text style={[styles.statusValue, styles.coinsValue]}>
                        <Text style={styles.coinEmoji}>🪙 </Text>
                        {user.coins}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              <View style={styles.separator}></View>
              
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Resumen de Apuestas</Text>
                <View style={styles.betStatsContainer}>
                  <View style={styles.betStatItem}>
                    <Feather name="list" size={20} color="#FFFFFF" />
                    <Text style={styles.betStatValue}>{totalBets}</Text>
                    <Text style={styles.betStatLabel}>Total</Text>
                  </View>
                  <View style={styles.betStatItem}>
                    <Feather name="clock" size={20} color="#FFFFFF" />
                    <Text style={styles.betStatValue}>{pendingBets}</Text>
                    <Text style={styles.betStatLabel}>Pendientes</Text>
                  </View>
                  <View style={styles.betStatItem}>
                    <Feather name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.betStatValue}>{wonBets}</Text>
                    <Text style={styles.betStatLabel}>Ganadas</Text>
                  </View>
                  <View style={styles.betStatItem}>
                    <Feather name="x-circle" size={20} color="#FF5252" />
                    <Text style={styles.betStatValue}>{lostBets}</Text>
                    <Text style={styles.betStatLabel}>Perdidas</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
            
            <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}>
              {isAuthenticated ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.button, styles.rowButton, styles.logoutButton]} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.rowButton]} onPress={handleContinue}>
                    <Text style={styles.buttonText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.button, styles.rowButton]} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.rowButton, styles.continueButton]} onPress={handleContinue}>
                    <Text style={styles.buttonText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>By Carlos Freire</Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </GradientBackground>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 100, // Significant bottom padding
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 60 : 80, // Significantly increased bottom padding
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140, // Further reduced size
    height: 140, // Further reduced size
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Arial',
    fontSize: 32, // Slightly reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Arial',
    fontSize: 16, // Slightly reduced size
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  statusSection: {
    marginVertical: 5,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  coinsStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    marginVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  statusLabelContainer: {
    flex: 1,
  },
  statusValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontFamily: 'Arial',
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  coinsLabel: {
    fontFamily: 'Arial',
    fontSize: 18, // Increased size for emphasis
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statusValue: {
    fontFamily: 'Arial',
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinsValue: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 22, // Increased size for emphasis
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  coinEmoji: {
    fontSize: 22, // Increased size for emphasis
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  connectedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
  },
  disconnectedBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14, // Reduced size
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  separator: {
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  betStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  betStatItem: {
    alignItems: 'center',
    width: '25%',
    paddingVertical: 5,
  },
  betStatValue: {
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  betStatLabel: {
    fontSize: 11, // Reduced size
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14, // Reduced height
    paddingHorizontal: 20, // Reduced horizontal padding
    borderRadius: 25, // Slightly reduced border radius
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rowButton: {
    width: width * 0.4, // 40% of screen width
    maxWidth: 180, // Maximum width
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
  continueButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontFamily: 'Arial',
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  logoutButtonText: {
    fontFamily: 'Arial',
    fontSize: 16, // Reduced size
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default AuthStatusScreen;
