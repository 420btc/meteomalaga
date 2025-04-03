import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { 
  isDaylightSavingTime, 
  isWithinBettingWindowSync, 
  getTimeUntilNextBettingWindowSync,
  getCurrentSpainHour
} from '../services/weatherService';
import { isWeb, isMobile } from '../utils/platformUtils';

interface BettingClockProps {
  onPress?: () => void;
  onCountdownComplete?: () => void;
}

const BettingClock: React.FC<BettingClockProps> = ({ onPress, onCountdownComplete }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00');
  const [canBet, setCanBet] = useState(false);
  const [previousCanBet, setPreviousCanBet] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  // Add resize listener for web
  useEffect(() => {
    if (isWeb()) {
      const handleResize = () => {
        setWindowWidth(Dimensions.get('window').width);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    // Initial check
    const initialBettingAllowed = isWithinBettingWindowSync();
    setCanBet(initialBettingAllowed);
    setPreviousCanBet(initialBettingAllowed);
    
    // Update time every second
    const interval = setInterval(() => {
      try {
        const now = new Date();
        setCurrentTime(now);
        
        // Check if betting is allowed (between 23:00 and 00:00 CET)
        const bettingAllowed = isWithinBettingWindowSync();
        
        // If betting status changed from not allowed to allowed, trigger the callback
        if (!previousCanBet && bettingAllowed && onCountdownComplete) {
          onCountdownComplete();
        }
        
        setPreviousCanBet(canBet);
        setCanBet(bettingAllowed);
        
        // Calculate time remaining until cutoff or next window
        const timeUntil = getTimeUntilNextBettingWindowSync();
        
        if (bettingAllowed) {
          // Format time remaining until betting closes
          if (timeUntil && timeUntil.minutes !== undefined && timeUntil.seconds !== undefined) {
            setTimeRemaining(
              `${timeUntil.minutes.toString().padStart(2, '0')}:${timeUntil.seconds.toString().padStart(2, '0')}`
            );
          } else {
            setTimeRemaining('00:00');
          }
        } else {
          // Format time remaining until next betting window
          if (timeUntil && timeUntil.hours !== undefined && 
              timeUntil.minutes !== undefined && timeUntil.seconds !== undefined) {
            setTimeRemaining(
              `${timeUntil.hours.toString().padStart(2, '0')}:${timeUntil.minutes.toString().padStart(2, '0')}:${timeUntil.seconds.toString().padStart(2, '0')}`
            );
          } else {
            setTimeRemaining('00:00:00');
          }
        }
      } catch (error) {
        console.error('Error in BettingClock interval:', error);
        // In case of error, use a default value instead of '--:--'
        setCanBet(false);
        setTimeRemaining('00:00:00');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [canBet, previousCanBet, onCountdownComplete]);

  // Format current time in local time but display as CET
  const formatCETTime = (): string => {
    try {
      // Use local time directly instead of trying to calculate Spain time
      // This ensures the clock matches the device time
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes} CET`;
    } catch (error) {
      console.error('Error formatting CET time:', error);
      return '00:00 CET'; // Better fallback than '--:-- CET'
    }
  };

  // Determine if we should use compact layout for small screens
  const isCompact = isMobile() || windowWidth < 600;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        canBet ? styles.containerActive : styles.containerInactive,
        isCompact ? styles.containerCompact : styles.containerFull
      ]}
      onPress={onPress}
      disabled={!canBet}
    >
      <View style={[
        styles.timeInfo,
        isCompact ? styles.timeInfoCompact : {}
      ]}>
        <Feather 
          name={canBet ? "clock" : "alert-circle"} 
          size={16} 
          color={canBet ? "#FFD700" : "#FF6B6B"} 
        />
        <Text style={styles.currentTime}>{formatCETTime()}</Text>
      </View>
      
      <View style={[
        styles.statusContainer,
        isCompact ? styles.statusContainerCompact : {}
      ]}>
        <Text style={[
          styles.statusText,
          canBet ? styles.statusTextActive : styles.statusTextInactive
        ]}>
          {canBet ? "Apuestas abiertas" : "Apuestas cerradas"}
        </Text>
        
        <Text style={[
          styles.timeRemaining,
          isCompact ? styles.timeRemainingCompact : {}
        ]}>
          {canBet 
            ? `Cierra en ${timeRemaining}` 
            : `Próxima apertura en ${timeRemaining}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  containerCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  containerFull: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Green background for active
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  containerInactive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)', // Red background for inactive
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeInfoCompact: {
    marginBottom: 8,
    marginRight: 0,
  },
  currentTime: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  statusContainer: {
    flex: 1,
  },
  statusContainerCompact: {
    width: '100%',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  statusTextActive: {
    color: '#10B981', // Green text for active
  },
  statusTextInactive: {
    color: '#FF6B6B', // Red text for inactive
  },
  timeRemaining: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  timeRemainingCompact: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BettingClock;
