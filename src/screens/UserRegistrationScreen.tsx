import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Animated, 
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import GoldButton from '../components/GoldButton';
import { useApp } from '../context/AppContext';

type UserRegistrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserRegistration'>;

const UserRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<UserRegistrationScreenNavigationProp>();
  const { setUserId } = useApp();
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoAnim] = useState(new Animated.Value(0));
  
  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const handleContinueAsGuest = () => {
    // Generate a random guest ID
    const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    setUserId(guestId);
    navigation.replace('Main');
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: logoAnim,
                  transform: [
                    { scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })}
                  ]
                }
              ]}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png' }}
                style={styles.logo}
              />
              <Text style={styles.title}>Meteo Málaga</Text>
              <Text style={styles.subtitle}>Predicción y Apuestas Meteorológicas</Text>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.formTitle}>
                ¡Bienvenido!
              </Text>
              
              <Text style={styles.welcomeText}>
                Explora el clima de Málaga y realiza apuestas sobre las condiciones meteorológicas.
              </Text>
              
              <GoldButton
                title="Continuar como Invitado"
                onPress={handleContinueAsGuest}
                style={styles.guestButton}
                icon="arrow-right"
              />
            </Animated.View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>By Carlos Freire</Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Arial',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Arial',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestButton: {
    marginTop: 10,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
});

export default UserRegistrationScreen;
