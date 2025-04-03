import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { DailyReward } from '../types/weather';

interface CountdownProps {
  targetDate: Date;
  onComplete: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft('¡Disponible!');
        onComplete();
        return;
      }
      
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);
  
  return (
    <Text style={styles.countdownText}>{timeLeft}</Text>
  );
};

const DailyRewardsButton: React.FC = () => {
  const { 
    user, 
    claimDailyReward, 
    getNextDailyRewardTime, 
    getDailyRewardStreak 
  } = useApp();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<DailyReward | null>(null);
  const [nextRewardTime, setNextRewardTime] = useState<Date | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const pulseAnim = new Animated.Value(1);
  
  useEffect(() => {
    // Start pulsing animation if reward can be claimed
    if (canClaim) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      // Reset animation if reward cannot be claimed
      pulseAnim.setValue(1);
    }
  }, [canClaim]);
  
  useEffect(() => {
    checkRewardStatus();
  }, [user]);
  
  const checkRewardStatus = async () => {
    if (!user) return;
    
    try {
      const nextTime = await getNextDailyRewardTime();
      const currentStreak = await getDailyRewardStreak();
      
      setStreak(currentStreak);
      
      if (!nextTime) {
        // No previous reward claimed, can claim now
        setCanClaim(true);
        setNextRewardTime(null);
      } else {
        const now = new Date();
        if (now >= nextTime) {
          // Next reward time has passed, can claim now
          setCanClaim(true);
          setNextRewardTime(null);
        } else {
          // Next reward time is in the future, cannot claim yet
          setCanClaim(false);
          setNextRewardTime(nextTime);
        }
      }
    } catch (error) {
      console.error('Error checking reward status:', error);
    }
  };
  
  const handleClaimReward = async () => {
    if (!canClaim || loading) return;
    
    setLoading(true);
    try {
      const claimedReward = await claimDailyReward();
      
      if (claimedReward) {
        setReward(claimedReward);
        setClaimed(true);
        setCanClaim(false);
        
        // Update streak
        const currentStreak = await getDailyRewardStreak();
        setStreak(currentStreak);
        
        // Update next reward time
        const nextTime = await getNextDailyRewardTime();
        setNextRewardTime(nextTime);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenModal = () => {
    setModalVisible(true);
    setClaimed(false);
    setReward(null);
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  const handleCountdownComplete = () => {
    setCanClaim(true);
    setNextRewardTime(null);
  };
  
  const getRewardDay = () => {
    return ((streak % 5) || 5);
  };
  
  const getRewardText = (day: number) => {
    switch (day) {
      case 1: return 'Día 1: 5 Gotas de Agua + 5 Monedas';
      case 2: return 'Día 2: 10 Monedas';
      case 3: return 'Día 3: 10 Gotas de Agua';
      case 4: return 'Día 4: 50 Monedas';
      case 5: return 'Día 5: 50 Monedas + 1 Gota de Agua';
      default: return 'Recompensa diaria';
    }
  };
  
  return (
    <>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            canClaim ? styles.buttonAvailable : styles.buttonUnavailable
          ]}
          onPress={handleOpenModal}
          disabled={loading}
        >
          <Feather 
            name="gift" 
            size={20} 
            color={canClaim ? "#FFFFFF" : "#CCCCCC"} 
            style={styles.buttonIcon} 
          />
          <View>
            <Text style={[
              styles.buttonText,
              canClaim ? styles.buttonTextAvailable : styles.buttonTextUnavailable
            ]}>
              Recompensa Diaria
            </Text>
            {nextRewardTime ? (
              <Countdown 
                targetDate={nextRewardTime} 
                onComplete={handleCountdownComplete} 
              />
            ) : (
              <Text style={styles.buttonSubtext}>
                {canClaim ? '¡Disponible ahora!' : 'Reclamada hoy'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCloseModal}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Recompensa Diaria</Text>
            
            {claimed && reward ? (
              <View style={styles.rewardClaimed}>
                <Feather name="check-circle" size={50} color="#4CAF50" />
                <Text style={styles.rewardClaimedText}>¡Recompensa reclamada!</Text>
                <View style={styles.rewardDetails}>
                  {reward.coins > 0 && (
                    <View style={styles.rewardItem}>
                      <Feather name="dollar-sign" size={24} color="#FFD700" />
                      <Text style={styles.rewardItemText}>{reward.coins} Monedas</Text>
                    </View>
                  )}
                  {reward.waterDrops > 0 && (
                    <View style={styles.rewardItem}>
                      <Feather name="droplet" size={24} color="#3B82F6" />
                      <Text style={styles.rewardItemText}>
                        {reward.waterDrops} {reward.waterDrops === 1 ? 'Gota' : 'Gotas'} de Agua
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.streakText}>
                  Racha actual: {streak} {streak === 1 ? 'día' : 'días'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.rewardCalendar}>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <View 
                      key={day} 
                      style={[
                        styles.calendarDay,
                        day === getRewardDay() && styles.currentDay,
                        day < getRewardDay() && styles.completedDay
                      ]}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        day === getRewardDay() && styles.currentDayText
                      ]}>
                        Día {day}
                      </Text>
                      {day < getRewardDay() && (
                        <Feather name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  ))}
                </View>
                
                <Text style={styles.rewardDescription}>
                  {getRewardText(getRewardDay())}
                </Text>
                
                {nextRewardTime ? (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.nextRewardText}>Próxima recompensa en:</Text>
                    <Countdown 
                      targetDate={nextRewardTime} 
                      onComplete={handleCountdownComplete} 
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.claimButton,
                      !canClaim && styles.claimButtonDisabled
                    ]}
                    onPress={handleClaimReward}
                    disabled={!canClaim || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.claimButtonText}>
                        {canClaim ? 'Reclamar Recompensa' : 'Ya Reclamada'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                
                <Text style={styles.streakText}>
                  Racha actual: {streak} {streak === 1 ? 'día' : 'días'}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  buttonAvailable: {
    backgroundColor: '#4CAF50',
  },
  buttonUnavailable: {
    backgroundColor: '#E0E0E0',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextAvailable: {
    color: '#FFFFFF',
  },
  buttonTextUnavailable: {
    color: '#666666',
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  countdownText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: 'bold',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  rewardCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  calendarDay: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  currentDay: {
    backgroundColor: '#4CAF50',
  },
  currentDayText: {
    color: '#FFFFFF',
  },
  completedDay: {
    backgroundColor: '#3B82F6',
  },
  rewardDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nextRewardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  claimButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardClaimed: {
    alignItems: 'center',
    padding: 20,
  },
  rewardClaimedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 20,
  },
  rewardDetails: {
    marginBottom: 20,
    width: '100%',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  rewardItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
  },
});

export default DailyRewardsButton;
