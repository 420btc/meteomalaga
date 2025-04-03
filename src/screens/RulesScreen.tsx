import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';

type RulesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Rules'>;

const RulesScreen: React.FC = () => {
  const navigation = useNavigation<RulesScreenNavigationProp>();

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cómo Jugar</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 ¿Qué es Meteo Málaga?</Text>
              <Text style={styles.paragraph}>
                Meteo Málaga es un juego de predicción meteorológica donde puedes apostar sobre el tiempo en Málaga y ganar monedas virtuales si aciertas.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💧 Apuestas de Lluvia</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🎯</Text>
                <Text style={styles.ruleText}>
                  Predice cuántos milímetros de lluvia caerán en las próximas 24 horas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>💰</Text>
                <Text style={styles.ruleText}>
                  Apuesta entre 10 y 1000 monedas en tu predicción.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>✅</Text>
                <Text style={styles.ruleText}>
                  Ganarás si tu predicción está dentro de ±0.50 mm de la lluvia real.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>3️⃣</Text>
                <Text style={styles.ruleText}>
                  Máximo 3 apuestas de lluvia dentro de su ventana de tiempo correspondiente.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌡️ Apuestas de Temperatura</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🔥</Text>
                <Text style={styles.ruleText}>
                  Predice la temperatura máxima o mínima para las próximas 12 horas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>⏱️</Text>
                <Text style={styles.ruleText}>
                  Las apuestas de temperatura se resuelven cada 12 horas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🔢</Text>
                <Text style={styles.ruleText}>
                  Máximo 2 apuestas de temperatura por día.
                </Text>
              </View>
            </View>

            {/* Nueva sección para apuestas de viento */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💨 Apuestas de Viento</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🌪️</Text>
                <Text style={styles.ruleText}>
                  Predice la velocidad máxima del viento para las próximas 12 horas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>⏰</Text>
                <Text style={styles.ruleText}>
                  Las apuestas de viento se resuelven cada 12 horas automáticamente.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>2️⃣</Text>
                <Text style={styles.ruleText}>
                  Puedes realizar hasta 2 apuestas de viento cada 12 horas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📈</Text>
                <Text style={styles.ruleText}>
                  Las cuotas aumentan con predicciones de viento más extremas.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Horarios de Apuestas</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🕙</Text>
                <Text style={styles.ruleText}>
                  Las apuestas están disponibles de 23:00 a 00:00 CET cada día.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>⌛</Text>
                <Text style={styles.ruleText}>
                  Fuera de este horario, verás un contador que indica cuánto tiempo falta.
                </Text>
              </View>
            </View>

            {/* Nueva sección para monedas diarias */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🪙 Monedas Diarias</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🎁</Text>
                <Text style={styles.ruleText}>
                  Recibe monedas gratis cada día solo por iniciar sesión en la aplicación.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📆</Text>
                <Text style={styles.ruleText}>
                  Las recompensas aumentan con días consecutivos de inicio de sesión.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>⚡</Text>
                <Text style={styles.ruleText}>
                  Pulsa el botón de recompensa diaria en la pantalla principal para reclamar tus monedas.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🤖 Resolución Automática</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🔄</Text>
                <Text style={styles.ruleText}>
                  Las apuestas de lluvia se resuelven automáticamente 24 horas después de realizarlas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🌡️</Text>
                <Text style={styles.ruleText}>
                  Las apuestas de temperatura se resuelven automáticamente 12 horas después.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>💨</Text>
                <Text style={styles.ruleText}>
                  Las apuestas de viento se resuelven automáticamente 12 horas después, comparando tu predicción con la velocidad máxima registrada.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📱</Text>
                <Text style={styles.ruleText}>
                  No necesitas estar conectado para recibir tus ganancias, se acreditarán automáticamente.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Ganancias y Cuotas</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📊</Text>
                <Text style={styles.ruleText}>
                  Las cuotas varían según la dificultad de tu predicción.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🎲</Text>
                <Text style={styles.ruleText}>
                  Predicciones más extremas o precisas tienen cuotas más altas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>💸</Text>
                <Text style={styles.ruleText}>
                  Tus ganancias = Monedas apostadas × Cuota.
                </Text>
              </View>
            </View>

            {/* Nueva sección para logros y recompensas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏅 Logros y Recompensas</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🎯</Text>
                <Text style={styles.ruleText}>
                  Completa logros para desbloquear recompensas especiales y monedas extra.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🔄</Text>
                <Text style={styles.ruleText}>
                  Los logros incluyen rachas de predicciones correctas, cantidad total apostada y más.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>⭐</Text>
                <Text style={styles.ruleText}>
                  Desbloquea niveles de usuario para acceder a funciones exclusivas y mayores recompensas.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🌱</Text>
                <Text style={styles.ruleText}>
                  Cuida tu planta virtual que crece con tus predicciones acertadas.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Consejos Útiles</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>👀</Text>
                <Text style={styles.ruleText}>
                  Consulta las cámaras en vivo para ver el tiempo actual en Málaga.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📈</Text>
                <Text style={styles.ruleText}>
                  Revisa el historial de apuestas para mejorar tus predicciones.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>🏆</Text>
                <Text style={styles.ruleText}>
                  Compite en el ranking para ser el mejor pronosticador.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleEmoji}>📊</Text>
                <Text style={styles.ruleText}>
                  Utiliza las gráficas meteorológicas para analizar tendencias y hacer mejores predicciones.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ¡Buena suerte con tus predicciones! 🍀
              </Text>
            </View>
          </ScrollView>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 22,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ruleEmoji: {
    fontSize: 20,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  ruleText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  footerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default RulesScreen;
