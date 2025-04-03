import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bet, WeatherData, UserProfile, DailyReward } from '../types/weather';
import { fetchWeatherData, fetchCurrentRainData, fetchCurrentTemperatureData } from '../services/weatherService';
import { 
  getLocalBets, 
  startBackgroundVerification,
  cleanupOldBets,
  getRemainingTemperatureBets as getLocalRemainingTemperatureBets,
  showBetResolutionNotification,
  getAndClearRecentlyResolvedBets
} from '../services/localBetService';
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  isLoggedIn, 
  logoutUser, 
  LoginResponse,
  updateUserCoins,
  updateUserBetStats,
  updateUserWaterDrops,
  updateUserAvatar,
  updateUserDailyReward
} from '../services/enhancedAuthService';
import { resolveBets } from '../utils/resolveBets';
import { addBet, getRemainingTemperatureBets } from '../services/localSupabaseService';
import { updateLastActivity } from '../services/plantService';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  coins: number;
  addCoins: (amount: number) => void;
  waterDrops: number;
  addWaterDrops: (amount: number) => void;
  bets: Bet[];
  addBet: (bet: Bet) => Promise<void>;
  getWeatherForDate: (date: string) => Promise<WeatherData>;
  isLoading: boolean;
  remainingTempBets: number;
  refreshRemainingTempBets: () => Promise<void>;
  login: (username: string, password: string) => Promise<LoginResponse>;
  register: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  isAuthenticated: boolean;
  getCurrentRainAmount: () => Promise<number>;
  getCurrentTemperature: () => Promise<{min: number; max: number; current: number}>;
  language: string;
  setLanguage: (lang: string) => void;
  evaluateBets: () => Promise<void>;
  isOnline: boolean;
  checkForResolvedBets: () => Promise<void>;
  trackActivity: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  claimDailyReward: () => Promise<DailyReward | null>;
  getNextDailyRewardTime: () => Promise<Date | null>;
  getDailyRewardStreak: () => Promise<number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [coins, setCoins] = useState<number>(100);
  const [waterDrops, setWaterDrops] = useState<number>(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remainingTempBets, setRemainingTempBets] = useState<number>(2);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('es');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Track user activity
  const trackActivity = async (): Promise<void> => {
    await updateLastActivity();
  };

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Track initial activity
        await trackActivity();

        // Load language preference
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }

        // Check if user is logged in
        const authenticated = await isLoggedIn();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          // Get current user
          const currentUser = await getCurrentUser();
          if (currentUser) {
            // Convert auth user to UserProfile
            const userProfile: UserProfile = {
              id: currentUser.userId,
              username: currentUser.username,
              coins: currentUser.coins || 100,
              waterDrops: currentUser.waterDrops || 0,
              totalBets: currentUser.totalBets || 0,
              wonBets: currentUser.wonBets || 0,
              avatar: currentUser.avatar,
              lastDailyReward: currentUser.lastDailyReward,
              dailyRewardStreak: currentUser.dailyRewardStreak || 0
            };
            
            setUser(userProfile);
            setCoins(userProfile.coins);
            setWaterDrops(userProfile.waterDrops || 0);
          }
        }

        // Load bets
        const localBets = await getLocalBets();
        setBets(localBets);

        // Check remaining temperature bets
        await refreshRemainingTempBets();

        // Clean up old bets
        await cleanupOldBets();
        
        // Check for resolved bets when app initializes
        await checkForResolvedBets();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Start background verification of bets
    const stopVerification = startBackgroundVerification((resolvedBets, coinsWon) => {
      if (resolvedBets.length > 0) {
        // Update bets state with resolved bets
        setBets(prevBets => {
          const updatedBets = [...prevBets];
          resolvedBets.forEach(resolvedBet => {
            const index = updatedBets.findIndex(bet => bet.timestamp === resolvedBet.timestamp);
            if (index !== -1) {
              updatedBets[index] = resolvedBet;
            }
          });
          return updatedBets;
        });
        
        // Add coins if any bets were won
        if (coinsWon > 0) {
          addCoins(coinsWon);
          
          // Update user bet stats
          if (user) {
            const wonBets = resolvedBets.filter(bet => bet.won);
            if (wonBets.length > 0) {
              updateUserBetStats(user.id, true);
            }
          }
        }
        
        // Show notification about resolved bets
        showBetResolutionNotification(resolvedBets, coinsWon);
      }
    });

    return () => {
      // Clean up verification process
      stopVerification();
    };
  }, []);

  const addCoins = async (amount: number) => {
    const newTotal = coins + amount;
    setCoins(newTotal);
    
    // Update user data
    if (user) {
      const updatedUser = { ...user, coins: newTotal };
      setUser(updatedUser);
      
      // Update user coins in storage
      await updateUserCoins(user.id, newTotal);
    }
    
    // Track activity when adding coins
    await trackActivity();
  };

  const addWaterDrops = async (amount: number) => {
    const newTotal = waterDrops + amount;
    setWaterDrops(newTotal);
    
    // Update user data
    if (user) {
      const updatedUser = { ...user, waterDrops: newTotal };
      setUser(updatedUser);
      
      // Update user water drops in storage
      await updateUserWaterDrops(user.id, amount);
    }
    
    // Track activity when adding water drops
    await trackActivity();
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      
      // Update user avatar in storage
      await updateUserAvatar(user.id, avatarUrl);
      
      // Track activity when updating avatar
      await trackActivity();
    }
  };

  const getDailyRewards = (day: number): DailyReward => {
    const rewards: DailyReward[] = [
      { day: 1, coins: 5, waterDrops: 5 },
      { day: 2, coins: 10, waterDrops: 0 },
      { day: 3, coins: 0, waterDrops: 10 },
      { day: 4, coins: 50, waterDrops: 0 },
      { day: 5, coins: 50, waterDrops: 1 }
    ];
    
    // Get reward for the current day, or default to day 1 if out of range
    return rewards[day - 1] || rewards[0];
  };

  const getNextDailyRewardTime = async (): Promise<Date | null> => {
    if (!user || !user.lastDailyReward) {
      return null;
    }
    
    const lastRewardDate = new Date(user.lastDailyReward);
    const nextRewardDate = new Date(lastRewardDate);
    nextRewardDate.setDate(nextRewardDate.getDate() + 1);
    
    return nextRewardDate;
  };

  const getDailyRewardStreak = async (): Promise<number> => {
    if (!user) {
      return 0;
    }
    
    return user.dailyRewardStreak || 0;
  };

  const claimDailyReward = async (): Promise<DailyReward | null> => {
    if (!user) {
      return null;
    }
    
    const now = new Date();
    let streak = user.dailyRewardStreak || 0;
    let canClaim = true;
    
    // Check if user has claimed a reward before
    if (user.lastDailyReward) {
      const lastRewardDate = new Date(user.lastDailyReward);
      const timeDiff = now.getTime() - lastRewardDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      // If less than 24 hours have passed, can't claim
      if (daysDiff < 1) {
        canClaim = false;
      } 
      // If more than 48 hours have passed, reset streak
      else if (daysDiff > 1) {
        streak = 0;
      }
    }
    
    if (!canClaim) {
      return null;
    }
    
    // Increment streak (max 5)
    streak = (streak % 5) + 1;
    
    // Get reward for current streak day
    const reward = getDailyRewards(streak);
    
    // Add rewards
    if (reward.coins > 0) {
      await addCoins(reward.coins);
    }
    
    if (reward.waterDrops > 0) {
      await addWaterDrops(reward.waterDrops);
    }
    
    // Update user's last reward date and streak
    await updateUserDailyReward(user.id, now.toISOString(), streak);
    
    // Update local user state
    setUser({
      ...user,
      lastDailyReward: now.toISOString(),
      dailyRewardStreak: streak
    });
    
    return reward;
  };

  const addBetHandler = async (bet: Bet) => {
    try {
      // Track activity when placing a bet
      await trackActivity();
      
      // Deduct coins for the bet
      await addCoins(-bet.coins);
      
      // Add user_id to bet if authenticated
      const betWithUser = {
        ...bet,
        user_id: user?.id || 'anonymous'
      };
      
      // Save bet using the local service
      const savedBet = await addBet(betWithUser);
      
      if (!savedBet) {
        throw new Error('Error al guardar la apuesta');
      }
      
      // Update bets state
      setBets(prevBets => [savedBet, ...prevBets]);
      
      // Refresh remaining temperature bets if it's a temperature bet
      if (bet.option === 'temp_min' || bet.option === 'temp_max') {
        await refreshRemainingTempBets();
      }
      
      // Update user bet stats
      if (user) {
        await updateUserBetStats(user.id, false);
      }
    } catch (error) {
      // If there's an error, refund the coins
      await addCoins(bet.coins);
      throw error;
    }
  };

  const getWeatherForDate = async (date: string): Promise<WeatherData> => {
    // Track activity when getting weather data
    await trackActivity();
    return await fetchWeatherData(date);
  };

  const getCurrentRainAmount = async (): Promise<number> => {
    // Track activity when getting current rain data
    await trackActivity();
    return await fetchCurrentRainData();
  };

  const getCurrentTemperature = async (): Promise<{min: number; max: number; current: number}> => {
    // Track activity when getting current temperature data
    await trackActivity();
    return await fetchCurrentTemperatureData();
  };

  const refreshRemainingTempBets = async (): Promise<void> => {
    try {
      // Track activity when refreshing temperature bets
      await trackActivity();
      
      // Use the local service to get remaining temperature bets
      const remaining = user ? 
        await getRemainingTemperatureBets(user.id) : 
        await getLocalRemainingTemperatureBets();
      
      setRemainingTempBets(remaining);
    } catch (error) {
      console.error('Error refreshing remaining temperature bets:', error);
    }
  };

  const evaluateBets = async (): Promise<void> => {
    try {
      // Track activity when evaluating bets
      await trackActivity();
      
      const { resolvedBets, totalCoinsWon } = await resolveBets();
      
      // Update bets state with resolved bets
      if (resolvedBets.length > 0) {
        setBets(prevBets => {
          const updatedBets = [...prevBets];
          resolvedBets.forEach(resolvedBet => {
            const index = updatedBets.findIndex(bet => bet.timestamp === resolvedBet.timestamp);
            if (index !== -1) {
              updatedBets[index] = resolvedBet;
            }
          });
          return updatedBets;
        });
        
        // Add coins if any bets were won
        if (totalCoinsWon > 0) {
          addCoins(totalCoinsWon);
          
          // Update user bet stats
          if (user) {
            const wonBets = resolvedBets.filter(bet => bet.won);
            if (wonBets.length > 0) {
              updateUserBetStats(user.id, true);
            }
          }
          
          // Show notification about resolved bets
          showBetResolutionNotification(resolvedBets, totalCoinsWon);
        }
      }
    } catch (error) {
      console.error('Error evaluating bets:', error);
    }
  };
  
  const checkForResolvedBets = async (): Promise<void> => {
    try {
      // Track activity when checking for resolved bets
      await trackActivity();
      
      // First, check if there are any recently resolved bets
      const recentlyResolvedBets = await getAndClearRecentlyResolvedBets();
      
      if (recentlyResolvedBets.length > 0) {
        // Calculate total coins won
        const totalCoinsWon = recentlyResolvedBets
          .filter(bet => bet.won)
          .reduce((total, bet) => total + (bet.coins * bet.leverage), 0);
        
        // Show notification about resolved bets
        if (totalCoinsWon > 0) {
          showBetResolutionNotification(recentlyResolvedBets, totalCoinsWon);
        }
      }
      
      // Then, evaluate any pending bets
      await evaluateBets();
    } catch (error) {
      console.error('Error checking for resolved bets:', error);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Track activity when logging in
      await trackActivity();
      
      const response = await loginUser(username, password);
      
      if (response.success && response.userId && response.username) {
        // Get current user with all data
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Create user profile
          const userProfile: UserProfile = {
            id: currentUser.userId,
            username: currentUser.username,
            coins: currentUser.coins || 100,
            waterDrops: currentUser.waterDrops || 0,
            totalBets: currentUser.totalBets || 0,
            wonBets: currentUser.wonBets || 0,
            avatar: currentUser.avatar,
            lastDailyReward: currentUser.lastDailyReward,
            dailyRewardStreak: currentUser.dailyRewardStreak || 0
          };
          
          // Update state
          setUser(userProfile);
          setCoins(userProfile.coins);
          setWaterDrops(userProfile.waterDrops || 0);
          setIsAuthenticated(true);
          
          // Load user's bets
          const userBets = await getLocalBets();
          setBets(userBets);
          
          // Refresh remaining temperature bets
          await refreshRemainingTempBets();
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error in login:', error);
      return {
        success: false,
        message: 'Ha ocurrido un error al iniciar sesión. Por favor, inténtalo de nuevo.'
      };
    }
  };

  const register = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Track activity when registering
      await trackActivity();
      
      const response = await registerUser(username, password);
      
      if (response.success && response.userId && response.username) {
        // Get current user with all data
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Create user profile
          const userProfile: UserProfile = {
            id: currentUser.userId,
            username: currentUser.username,
            coins: currentUser.coins || 100,
            waterDrops: currentUser.waterDrops || 0,
            totalBets: currentUser.totalBets || 0,
            wonBets: currentUser.wonBets || 0,
            avatar: currentUser.avatar,
            lastDailyReward: currentUser.lastDailyReward,
            dailyRewardStreak: currentUser.dailyRewardStreak || 0
          };
          
          // Update state
          setUser(userProfile);
          setCoins(userProfile.coins);
          setWaterDrops(userProfile.waterDrops || 0);
          setIsAuthenticated(true);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error in register:', error);
      return {
        success: false,
        message: 'Ha ocurrido un error al registrarse. Por favor, inténtalo de nuevo.'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Track activity when logging out
      await trackActivity();
      
      await logoutUser();
      setUser(null);
      setCoins(0);
      setWaterDrops(0);
      setIsAuthenticated(false);
      setBets([]);
    } catch (error) {
      console.error('Error in logout:', error);
    }
  };

  const refreshAuthState = async (): Promise<void> => {
    try {
      // Track activity when refreshing auth state
      await trackActivity();
      
      const authenticated = await isLoggedIn();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Create user profile
          const userProfile: UserProfile = {
            id: currentUser.userId,
            username: currentUser.username,
            coins: currentUser.coins || 100,
            waterDrops: currentUser.waterDrops || 0,
            totalBets: currentUser.totalBets || 0,
            wonBets: currentUser.wonBets || 0,
            avatar: currentUser.avatar,
            lastDailyReward: currentUser.lastDailyReward,
            dailyRewardStreak: currentUser.dailyRewardStreak || 0
          };
          
          setUser(userProfile);
          setCoins(userProfile.coins);
          setWaterDrops(userProfile.waterDrops || 0);
          
          // Load user's bets
          const userBets = await getLocalBets();
          setBets(userBets);
          
          // Refresh remaining temperature bets
          await refreshRemainingTempBets();
        }
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  const changeLanguage = async (lang: string) => {
    // Track activity when changing language
    await trackActivity();
    
    setLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        coins,
        addCoins,
        waterDrops,
        addWaterDrops,
        bets,
        addBet: addBetHandler,
        getWeatherForDate,
        isLoading,
        remainingTempBets,
        refreshRemainingTempBets,
        login,
        register,
        logout,
        refreshAuthState,
        isAuthenticated,
        getCurrentRainAmount,
        getCurrentTemperature,
        language,
        setLanguage: changeLanguage,
        evaluateBets,
        isOnline,
        checkForResolvedBets,
        trackActivity,
        updateAvatar,
        claimDailyReward,
        getNextDailyRewardTime,
        getDailyRewardStreak
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
