import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Platform,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

type LeaderboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeaderboardScreen'>;

interface EmptyPosition {
  id: string;
  position: number;
}

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation<LeaderboardScreenNavigationProp>();
  const { user } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Crear posiciones vacías
  const emptyPositions: EmptyPosition[] = [
    { id: '1', position: 1 },
    { id: '2', position: 2 },
    { id: '3', position: 3 },
    { id: '4', position: 4 },
  ];

  useEffect(() => {
    // Animate the leaderboard appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const goBack = () => {
    navigation.goBack();
  };

  const renderEmptyPosition = ({ item }: { item: EmptyPosition }) => {
    return (
      <Animated.View 
        style={[
          styles.leaderboardItem,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{item.position}</Text>
        </View>
        
        <View style={styles.emptyAvatarPlaceholder} />
        
        <View style={styles.userInfoContainer}>
          <Text style={styles.emptyPositionText}>Posición disponible</Text>
        </View>
      </Animated.View>
    );
  };

  const renderCurrentUser = () => {
    if (!user) return null;

    return (
      <View style={styles.currentUserSection}>
        <Text style={styles.currentUserTitle}>Tu posición:</Text>
        <Animated.View 
          style={[
            styles.leaderboardItem,
            styles.currentUserItem,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.rankContainer}>
            <View style={styles.currentUserRankBadge}>
              <Text style={styles.currentUserRankText}>5</Text>
            </View>
          </View>
          
          {user.avatar ? (
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatar}
              accessibilityLabel={`Avatar de ${user.username}`}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarInitial}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          <View style={styles.userInfoContainer}>
            <Text style={styles.username}>
              {user.username} <Text style={styles.currentUserLabel}>(Tú)</Text>
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Feather name="dollar-sign" size={12} color="#6B7280" />
                <Text style={styles.statText}>{user.coins.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Feather name="award" size={12} color="#6B7280" />
                <Text style={styles.statText}>{user.wonBets || 0} victorias</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={goBack} 
              style={styles.backButton}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Top Ganadores</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={emptyPositions}
            renderItem={renderEmptyPosition}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>Clasificación Global</Text>
              </View>
            )}
            ListFooterComponent={() => (
              <>
                {renderCurrentUser()}
                <View style={styles.infoContainer}>
                  <Feather name="info" size={16} color="#6B7280" style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    Esta sección se desarrollará próximamente cuando se implemente el sistema online multijugador al 100%.
                  </Text>
                </View>
              </>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listContainer: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  emptyAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  emptyPositionText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  currentUserSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  currentUserTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentUserRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  currentUserLabel: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#1E3A8A',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default LeaderboardScreen;
