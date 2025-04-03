import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  UserRegistration: undefined;
  Intro: undefined;
  AuthStatus: undefined; // New screen for authentication status
  Play: undefined;
  Betting: undefined;
  BetHistory: undefined;
  BetHistoryDetail: { betId: string };
  CombinedBet: undefined;
  Bet: { option: string };
  RainPrediction: undefined;
  WeatherMap: undefined;
  LiveCameras: undefined;
  RainHistory: undefined;
  RainChart: undefined;
  TemperatureChart: undefined;
  WindChart: undefined;
  WeatherAlerts: undefined;
  CountrySelection: undefined;
  Profile: undefined;
  Coins: undefined;
  Rules: undefined;
  Charts: undefined;
  Leaderboard: undefined;
  TopWinners: undefined;
  MeteoPlant: undefined;
  TemperatureBetting: undefined;
  WindBetting: undefined; // Ruta para apuestas de viento
  WindBettingScreen: undefined; // Añadida ruta alternativa para apuestas de viento
};

export type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;
