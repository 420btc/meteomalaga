import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import InteractiveMap from '../components/InteractiveMap';

type PlayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Play'>;

const { width } = Dimensions.get('window');

const PlayScreen: React.FC = () => {
  const navigation = useNavigation<PlayScreenNavigationProp>();
  const [selectedTab, setSelectedTab] = useState<'apuestas' | 'mapa'>('apuestas');

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <GradientBackground colors={['#87CEEB', '#FFFFFF']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>JUGAR</Text>
          <View style={styles.placeholder} />
        </View>

        {selectedTab === 'apuestas' ? (
          <View style={styles.betMenuContainer}>
            <TouchableOpacity 
              style={styles.countryButton}
              onPress={() => navigation.navigate('CountrySelection')}
            >
              <Text style={styles.countryButtonText}>Seleccionar País para Apuestas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <InteractiveMap />
        )}

        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'apuestas' && styles.activeTabButton]}
            onPress={() => setSelectedTab('apuestas')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'apuestas' && styles.activeTabButtonText]}>
              Apuestas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'mapa' && styles.activeTabButton]}
            onPress={() => setSelectedTab('mapa')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'mapa' && styles.activeTabButtonText]}>
              Mapa en Vivo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 40 : 20, marginBottom: 20 },
  backButton: { padding: 8 },
  backButtonText: { color: '#00008B', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', color: '#00008B' },
  placeholder: { width: 40 },
  betMenuContainer: { alignItems: 'center', marginVertical: 30 },
  countryButton: {
    backgroundColor: '#00008B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  countryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  tabSelector: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  tabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  activeTabButton: { backgroundColor: '#FFD700' },
  tabButtonText: { color: '#FFFFFF', fontSize: 16 },
  activeTabButtonText: { color: '#00008B', fontWeight: 'bold' }
});

export default PlayScreen;
