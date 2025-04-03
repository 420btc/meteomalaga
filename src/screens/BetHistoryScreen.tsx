import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform,
  Alert,
  Animated
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Bet, BetOption } from '../types/weather';
import BetHistoryItem from '../components/BetHistoryItem';
import { supabase } from '../services/supabase';
import CountdownTimer from '../components/CountdownTimer';
import { isWithinBettingWindow, getTimeUntilNextBettingWindow } from '../services/weatherService';
import { resolveBets } from '../utils/resolveBets'; // Import resolveBets directly as fallback

type BetHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BetHistory'>;

const BetHistoryScreen: React.FC = () => {
  const navigation = useNavigation<BetHistoryScreenNavigationProp>();
  const { bets, isOnline, evaluateBets, checkForResolvedBets } = useApp();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [supabaseBets, setSupabaseBets] = useState<Bet[]>([]);
  const [syncingWithSupabase, setSyncingWithSupabase] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [resolutionDate, setResolutionDate] = useState<string>('');
  const [canBet, setCanBet] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextBettingTime, setNextBettingTime] = useState<string>('');

  // Safe evaluate bets function that handles the case where evaluateBets might be undefined
  const safeEvaluateBets = async () => {
    try {
      if (typeof evaluateBets === 'function') {
        await evaluateBets();
      } else {
        // Fallback to direct usage of resolveBets if evaluateBets is not available
        await resolveBets();
      }
    } catch (error) {
      console.error('Error evaluating bets:', error);
    }
  };

  // Check for resolved bets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (typeof checkForResolvedBets === 'function') {
        checkForResolvedBets();
      } else {
        safeEvaluateBets();
      }
    }, [checkForResolvedBets, safeEvaluateBets])
  );

  useEffect(() => {
    // Animate the content appearance
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
      })
    ]).start();
    
    // Evaluate pending bets when screen loads
    safeEvaluateBets();
    
    if (isOnline) {
      fetchSupabaseBets();
    }

    // Calculate resolution date (24h after current time)
    const now = new Date();
    const resolution = new Date(now);
    resolution.setHours(resolution.getHours() + 24);
    setResolutionDate(resolution.toISOString());
    
    // Check betting window status
    updateBettingWindowStatus();
    
    // Set up interval to update betting window status
    const intervalId = setInterval(updateBettingWindowStatus, 1000);
    
    return () => clearInterval(intervalId);
  }, [isOnline]);

  const updateBettingWindowStatus = () => {
    try {
      // Check if betting is allowed (between 23:00 and 00:00 CET)
      const bettingAllowed = isWithinBettingWindow();
      setCanBet(bettingAllowed);
      
      // Get current time in CET
      const now = new Date();
      const cetTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
      
      // Calculate time until next betting window or until window closes
      const timeUntil = getTimeUntilNextBettingWindow();
      
      if (bettingAllowed) {
        // Betting window is open, show countdown to closing
        setTimeLeft(`Apuestas cierran en: ${timeUntil.minutes}m ${timeUntil.seconds}s`);
        setNextBettingTime('');
      } else {
        // Betting window is closed, show countdown to next opening
        setTimeLeft(`Apuestas abren en: ${timeUntil.hours}h ${timeUntil.minutes}m ${timeUntil.seconds}s`);
        
        // Calculate and format next betting window time
        const nextBettingDate = new Date();
        if (cetTime.getHours() >= 23) {
          // If it's past 23:00, next window is tomorrow
          nextBettingDate.setDate(nextBettingDate.getDate() + 1);
        }
        nextBettingDate.setHours(23, 0, 0, 0);
        
        setNextBettingTime(`Próxima ventana de apuestas: ${nextBettingDate.toLocaleDateString()} a las 23:00 CET`);
      }
    } catch (error) {
      console.error('Error updating betting window status:', error);
      setTimeLeft('Error al calcular tiempo de apuestas');
    }
  };

  const fetchSupabaseBets = async () => {
    try {
      setSyncingWithSupabase(true);
      const { data, error } = await supabase
        .from('bets_malaga')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching bets from Supabase:', error);
        Alert.alert('Error', 'No se pudieron cargar las apuestas desde el servidor.');
      } else if (data) {
        // Convert Supabase data to Bet type
        const formattedBets: Bet[] = data.map(item => ({
          id: item.id,
          date: item.date,
          option: item.option as BetOption,
          value: item.value,
          coins: item.coins,
          leverage: item.leverage,
          timestamp: item.timestamp,
          result: item.result,
          won: item.won,
          city: item.city,
          mode: item.mode,
          rain_mm: item.rain_mm,
          resolution_date: item.resolution_date,
          status: item.status
        }));
        setSupabaseBets(formattedBets);
      }
    } catch (error) {
      console.error('Error in fetchSupabaseBets:', error);
    } finally {
      setSyncingWithSupabase(false);
    }
  };

  // Combine local and Supabase bets, removing duplicates
  const combinedBets = () => {
    const allBets = [...bets];
    
    // Add Supabase bets that aren't in local bets
    supabaseBets.forEach(supabaseBet => {
      const exists = allBets.some(localBet => 
        localBet.id === supabaseBet.id || 
        (localBet.timestamp === supabaseBet.timestamp && 
         localBet.option === supabaseBet.option && 
         localBet.coins === supabaseBet.coins)
      );
      
      if (!exists) {
        allBets.push(supabaseBet);
      }
    });
    
    return allBets;
  };

  // Filter and sort bets
  const getFilteredBets = () => {
    let filteredBets = combinedBets();
    
    // Apply filter
    if (filter === 'won') {
      filteredBets = filteredBets.filter(bet => bet.won === true);
    } else if (filter === 'lost') {
      filteredBets = filteredBets.filter(bet => bet.won === false);
    } else if (filter === 'pending') {
      filteredBets = filteredBets.filter(bet => bet.won === null || bet.status === 'pending');
    }
    
    // Apply sorting
    if (sortBy === 'date') {
      filteredBets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'amount') {
      filteredBets.sort((a, b) => (b.coins * b.leverage) - (a.coins * a.leverage));
    }
    
    return filteredBets;
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderEmptyList = () => (
    <Animated.View 
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Feather name="inbox" size={50} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.emptyText}>No hay apuestas para mostrar 📊</Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CombinedBetScreen')}
      >
        <Text style={styles.emptyButtonText}>Realizar una apuesta 🎲</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBetItem = ({ item, index }: { item: Bet; index: number }) => {
    const animationDelay = index * 100;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: Animated.add(
              slideAnim,
              new Animated.Value(index * 10)
            ) 
          }]
        }}
      >
        <BetHistoryItem 
          bet={item} 
          onPress={() => navigation.navigate('BetHistoryDetail', { bet: item })}
        />
      </Animated.View>
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
            <Text style={styles.headerTitle}>Historial de Apuestas 📊</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                safeEvaluateBets();
                fetchSupabaseBets();
              }}
              disabled={syncingWithSupabase || !isOnline}
            >
              <Feather 
                name="refresh-cw" 
                size={20} 
                color="#FFFFFF" 
                style={syncingWithSupabase ? styles.rotating : undefined} 
              />
            </TouchableOpacity>
          </View>

          {/* Betting Window Status */}
          <View style={[
            styles.clockContainer,
            canBet ? styles.clockContainerActive : styles.clockContainerInactive
          ]}>
            <View style={styles.clockIconContainer}>
              <Feather 
                name={canBet ? "clock" : "alert-circle"} 
                size={20} 
                color={canBet ? "#FFD700" : "#FF6B6B"} 
              />
            </View>
            <View style={styles.clockTextContainer}>
              <Text style={[
                styles.clockStatus,
                canBet ? styles.clockStatusActive : styles.clockStatusInactive
              ]}>
                {canBet ? "Apuestas abiertas" : "Apuestas cerradas"}
              </Text>
              <Text style={styles.clockTime}>{timeLeft}</Text>
              {!canBet && nextBettingTime && (
                <Text style={styles.nextBettingTime}>{nextBettingTime}</Text>
              )}
            </View>
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filtrar:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterButtonText, filter === 'all' && styles.activeFilterButtonText]}>
                  Todas
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, filter === 'won' && styles.activeFilterButton]}
                onPress={() => setFilter('won')}
              >
                <Text style={[styles.filterButtonText, filter === 'won' && styles.activeFilterButtonText]}>
                  Ganadas ✅
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, filter === 'lost' && styles.activeFilterButton]}
                onPress={() => setFilter('lost')}
              >
                <Text style={[styles.filterButtonText, filter === 'lost' && styles.activeFilterButtonText]}>
                  Perdidas ❌
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, filter === 'pending' && styles.activeFilterButton]}
                onPress={() => setFilter('pending')}
              >
                <Text style={[styles.filterButtonText, filter === 'pending' && styles.activeFilterButtonText]}>
                  Pendientes ⏳
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Ordenar por:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                onPress={() => setSortBy('date')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortButtonText]}>
                  Fecha 📅
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'amount' && styles.activeSortButton]}
                onPress={() => setSortBy('amount')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.activeSortButtonText]}>
                  Cantidad 💰
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Cargando apuestas... ⏳</Text>
            </View>
          ) : (
            <FlatList
              data={getFilteredBets()}
              renderItem={renderBetItem}
              keyExtractor={(item, index) => `${item.id || item.timestamp}-${index}`}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{combinedBets().length}</Text>
              <Text style={styles.statLabel}>Total 📊</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {combinedBets().filter(bet => bet.won === true).length}
              </Text>
              <Text style={styles.statLabel}>Ganadas ✅</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {combinedBets().filter(bet => bet.won === false).length}
              </Text>
              <Text style={styles.statLabel}>Perdidas ❌</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {combinedBets().filter(bet => bet.won === null || bet.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pendientes ⏳</Text>
            </View>
          </View>
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  clockContainerActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  clockContainerInactive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  clockIconContainer: {
    marginRight: 12,
  },
  clockTextContainer: {
    flex: 1,
  },
  clockStatus: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  clockStatusActive: {
    color: '#FFD700',
  },
  clockStatusInactive: {
    color: '#FF6B6B',
  },
  clockTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  nextBettingTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  resolutionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resolutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resolutionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  resolutionTimer: {
    alignSelf: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  resolutionDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#FFFFFF',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSortButton: {
    backgroundColor: '#FFFFFF',
  },
  sortButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
});

export default BetHistoryScreen;
