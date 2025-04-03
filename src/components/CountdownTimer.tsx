import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
  style?: any;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete,
  style
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isComplete: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Make sure targetDate is a valid date
        if (!targetDate || isNaN(new Date(targetDate).getTime())) {
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isComplete: true
          });
          return;
        }
        
        const targetTime = new Date(targetDate).getTime();
        const now = new Date().getTime();
        const difference = targetTime - now;
        
        if (difference <= 0) {
          // Timer has completed
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isComplete: true
          });
          
          if (onComplete) {
            onComplete();
          }
          
          return;
        }
        
        // Calculate remaining time
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isComplete: false
        });
      } catch (error) {
        console.error('Error calculating time left:', error);
        // Set default values in case of error
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isComplete: true
        });
      }
    };
    
    // Calculate immediately
    calculateTimeLeft();
    
    // Set up interval to update every second
    const timerId = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timerId);
  }, [targetDate, onComplete]);

  // Format numbers to always have two digits
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  if (timeLeft.isComplete) {
    return (
      <View style={[styles.container, style]}>
        <Feather name="check-circle" size={16} color="#10B981" />
        <Text style={styles.completedText}>Resolución pendiente</Text>
      </View>
    );
  }

  // Ensure we have valid numbers to display
  const displayDays = isNaN(timeLeft.days) ? 0 : timeLeft.days;
  const displayHours = isNaN(timeLeft.hours) ? 0 : timeLeft.hours;
  const displayMinutes = isNaN(timeLeft.minutes) ? 0 : timeLeft.minutes;
  const displaySeconds = isNaN(timeLeft.seconds) ? 0 : timeLeft.seconds;

  return (
    <View style={[styles.container, style]}>
      <Feather name="clock" size={16} color="#FFD700" />
      <Text style={styles.timerText}>
        {displayDays > 0 ? `${displayDays}d ` : ''}
        {formatNumber(displayHours)}:{formatNumber(displayMinutes)}:{formatNumber(displaySeconds)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  timerText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  completedText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  }
});

export default CountdownTimer;
