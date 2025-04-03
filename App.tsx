import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import IntroScreen from './src/screens/IntroScreen';
import MainScreen from './src/screens/MainScreen';
import PlayScreen from './src/screens/PlayScreen';
import BettingScreen from './src/screens/BettingScreen';
import BetScreen from './src/screens/BetScreen';
import BetHistoryScreen from './src/screens/BetHistoryScreen';
import BetHistoryDetailScreen from './src/screens/BetHistoryDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RulesScreen from './src/screens/RulesScreen';
import WeatherMapScreen from './src/screens/WeatherMapScreen';
import LiveCamerasScreen from './src/screens/LiveCamerasScreen';
import RainHistoryScreen from './src/screens/RainHistoryScreen';
import RainPredictionScreen from './src/screens/RainPredictionScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import TopWinnersScreen from './src/screens/TopWinnersScreen';
import CountrySelectionScreen from './src/screens/CountrySelectionScreen';
import TemperatureBettingScreen from './src/screens/TemperatureBettingScreen';
import WindBettingScreen from './src/screens/WindBettingScreen';
import RainChartScreen from './src/screens/RainChartScreen';
import TemperatureChartScreen from './src/screens/TemperatureChartScreen';
import WindChartScreen from './src/screens/WindChartScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import CombinedBetScreen from './src/screens/CombinedBetScreen';
import { default as LoginScreen } from './src/screens/LoginScreen';
import UserRegistrationScreen from './src/screens/UserRegistrationScreen';
import WeatherAlertsScreen from './src/screens/WeatherAlertsScreen';
import MeteoPlantScreen from './src/screens/MeteoPlantScreen';
import CoinsScreen from './src/screens/CoinsScreen';
import AuthStatusScreen from './src/screens/AuthStatusScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Intro"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="AuthStatus" component={AuthStatusScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="UserRegistration" component={UserRegistrationScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Play" component={PlayScreen} />
          <Stack.Screen name="Betting" component={BettingScreen} />
          <Stack.Screen name="Bet" component={BetScreen} />
          <Stack.Screen name="CombinedBet" component={CombinedBetScreen} />
          <Stack.Screen name="BetHistory" component={BetHistoryScreen} />
          <Stack.Screen name="BetHistoryDetail" component={BetHistoryDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Rules" component={RulesScreen} />
          <Stack.Screen name="WeatherMap" component={WeatherMapScreen} />
          <Stack.Screen name="LiveCameras" component={LiveCamerasScreen} />
          <Stack.Screen name="RainHistory" component={RainHistoryScreen} />
          <Stack.Screen name="RainPrediction" component={RainPredictionScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="TopWinners" component={TopWinnersScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
          <Stack.Screen name="TemperatureBetting" component={TemperatureBettingScreen} />
          <Stack.Screen name="WindBetting" component={WindBettingScreen} />
          <Stack.Screen name="WindBettingScreen" component={WindBettingScreen} />
          <Stack.Screen name="RainChart" component={RainChartScreen} />
          <Stack.Screen name="TemperatureChart" component={TemperatureChartScreen} />
          <Stack.Screen name="WindChart" component={WindChartScreen} />
          <Stack.Screen name="Charts" component={ChartsScreen} />
          <Stack.Screen name="WeatherAlerts" component={WeatherAlertsScreen} />
          <Stack.Screen name="MeteoPlant" component={MeteoPlantScreen} />
          <Stack.Screen name="Coins" component={CoinsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
