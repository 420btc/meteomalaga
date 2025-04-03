import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getSavedCredentials, loginWithSavedCredentials } from '../services/enhancedAuthService';

interface SavedCredential {
  username: string;
  lastUsed: string;
}

export const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<SavedCredential[]>([]);
  const { login, register } = useApp();

  useEffect(() => {
    // Load saved credentials
    const loadSavedCredentials = async () => {
      try {
        const credentials = await getSavedCredentials();
        
        // Map to simplified format for display
        const simplifiedCredentials = credentials.map(cred => ({
          username: cred.username,
          lastUsed: cred.lastUsed
        }));
        
        setSavedCredentials(simplifiedCredentials);
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };
    
    loadSavedCredentials();
  }, []);

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, introduce nombre de usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        // Register new user
        const response = await register(username, password);
        
        if (response.success) {
          navigation.navigate('Main');
        } else {
          Alert.alert('Error', response.message);
        }
      } else {
        // Login existing user
        const response = await login(username, password);
        
        if (response.success) {
          navigation.navigate('Main');
        } else {
          Alert.alert('Error', response.message);
        }
      }
    } catch (error) {
      console.error('Error in authentication:', error);
      Alert.alert('Error', 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    setIsLoading(true);
    try {
      const response = await loginWithSavedCredentials(username);
      
      if (response.success) {
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error in quick login:', error);
      Alert.alert('Error', 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>MeteoPlant</Text>
              </View>
              <Text style={styles.title}>
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsRegistering(!isRegistering)}
              >
                <Text style={styles.switchButtonText}>
                  {isRegistering
                    ? '¿Ya tienes cuenta? Inicia sesión'
                    : '¿No tienes cuenta? Regístrate'}
                </Text>
              </TouchableOpacity>
            </View>

            {savedCredentials.length > 0 && !isRegistering && (
              <View style={styles.savedCredentialsContainer}>
                <Text style={styles.savedCredentialsTitle}>Inicios de sesión recientes</Text>
                {savedCredentials.map((cred, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.savedCredentialItem}
                    onPress={() => handleQuickLogin(cred.username)}
                  >
                    <Text style={styles.savedCredentialText}>{cred.username}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  savedCredentialsContainer: {
    marginTop: 40,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  savedCredentialsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  savedCredentialItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  savedCredentialText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LoginScreen;
