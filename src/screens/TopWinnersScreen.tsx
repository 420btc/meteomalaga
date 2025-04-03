import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

type TopWinnersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TopWinners'>;

interface EmptyPosition {
  id: string;
  position: number;
}

const TopWinnersScreen: React.FC = () => {
  const navigation = useNavigation<TopWinnersScreenNavigationProp>();
  const { user } = useApp();
  const goBack = () => navigation.goBack();

  // Crear posiciones vacías
  const emptyPositions: EmptyPosition[] = [
    { id: '1', position: 1 },
    { id: '2', position: 2 },
    { id: '3', position: 3 },
    { id: '4', position: 4 },
  ];

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Ganadores</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Banner de desarrollo */}
        <View style={styles.developmentBanner}>
          <Feather name="tool" size={24} color="#FFFFFF" />
          <Text style={styles.developmentText}>SECCIÓN EN DESARROLLO</Text>
        </View>
        
        {/* Posiciones vacías */}
        <FlatList
          data={emptyPositions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.emptyPositionItem}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankText}>{item.position}</Text>
              </View>
              <View style={styles.positionContent}>
                <Text style={styles.positionText}>Posición disponible</Text>
                <Text style={styles.comingSoonText}>Próximamente</Text>
              </View>
              <Feather name="lock" size={24} color="#999" />
            </View>
          )}
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>Clasificación Global</Text>
          )}
        />
        
        {/* Posición del usuario actual */}
        {user && (
          <View style={styles.currentUserContainer}>
            <Text style={styles.yourPositionText}>Tu posición actual:</Text>
            <View style={styles.currentUserItem}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankText}>5</Text>
              </View>
              <View style={styles.userContent}>
                <Text style={styles.usernameText}>{user.username} <Text style={styles.youLabel}>(Tú)</Text></Text>
                <Text style={styles.statsText}>{user.wonBets || 0} victorias - {user.coins || 0} monedas</Text>
              </View>
              <View style={styles.trophyContainer}>
                <Feather name="award" size={24} color="#FFD700" />
              </View>
            </View>
          </View>
        )}
        
        {/* Mensaje informativo */}
        <View style={styles.infoContainer}>
          <Feather name="info" size={24} color="#FFFFFF" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Esta sección se desarrollará próximamente cuando se implemente el sistema online multijugador al 100%.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 20 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    fontFamily: 'Arial', 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  placeholder: { 
    width: 50 
  },
  developmentBanner: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  developmentText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyPositionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  positionContent: {
    flex: 1,
  },
  positionText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  currentUserContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  yourPositionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  userContent: {
    flex: 1,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  youLabel: {
    fontStyle: 'italic',
    color: '#1E3A8A',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trophyContainer: {
    padding: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default TopWinnersScreen;
