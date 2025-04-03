import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import { Plant } from '../types/plant';
import {
  getPlant,
  initializePlant,
  updatePlantHealth,
  waterPlant,
  getPlantProgressPercentage,
  getPlantEvolutionPercentage,
  getPendingRewards,
  claimPendingRewards,
  savePlant,
  collectDailyFreeWater,
  getTimeUntilNextFreeWater
} from '../services/plantService';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';

type MeteoPlantScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MeteoPlant'>;
const { width, height } = Dimensions.get('window');

const MeteoPlantScreen: React.FC = () => {
  const navigation = useNavigation<MeteoPlantScreenNavigationProp>();
  const { language, trackActivity } = useApp();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [isWatering, setIsWatering] = useState(false);
  const [potColor, setPotColor] = useState('default');
  const [showTip, setShowTip] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [wateringError, setWateringError] = useState('');
  const [showWateringError, setShowWateringError] = useState(false);
  const [freeWaterCollected, setFreeWaterCollected] = useState(false);

  // Animation refs
  const plantAnimation = useRef(new Animated.Value(1)).current;
  const waterAnimation = useRef(new Animated.Value(0)).current;
  const waterOpacity = useRef(new Animated.Value(0)).current;

  // Eliminados todos los sonidos.

  // Tips for plant care
  const plantTips = [
    language === 'es'
      ? "Gana apuestas de temperatura para obtener más agua para tu planta."
      : "Win temperature bets to get more water for your plant.",
    language === 'es'
      ? "Las plantas evolucionan más rápido cuando las riegas regularmente."
      : "Plants evolve faster when you water them regularly.",
    language === 'es'
      ? "Cada tipo de planta tiene diferentes necesidades de agua."
      : "Each plant type has different water requirements.",
    language === 'es'
      ? "Recoge 1 unidad de agua gratis cada día para mantener tu planta viva."
      : "Collect 1 free water unit each day to keep your plant alive.",
    language === 'es'
      ? "Si no riegas tu planta durante 72 horas, morirá."
      : "If you don't water your plant for 72 hours, it will die.",
    language === 'es'
      ? "La salud de tu planta disminuye con el tiempo de inactividad."
      : "Your plant's health decreases with inactivity time."
  ];

  // Helper functions moved inside the component
  const getHealthColor = (health: number): string => {
    if (health > 70) return '#32CD32';
    if (health > 40) return '#FFA500';
    return '#FF6347';
  };

  const getNextThreshold = (plant: Plant): number => {
    const { type, stage } = plant;
    const plantConfigs: Record<string, any> = {
      'Cactus': { Brote: 11, Joven: 26, Adulta: 41, Florecida: 60 },
      'Suculenta': { Brote: 11, Joven: 26, Adulta: 41, Florecida: 60 },
      'Aloe': { Brote: 11, Joven: 26, Adulta: 41, Florecida: 60 },
      'Lavanda': { Brote: 11, Joven: 26, Adulta: 41, Florecida: 60 },
      'Jade': { Brote: 11, Joven: 26, Adulta: 41, Florecida: 60 },
      'Girasol': { Brote: 21, Joven: 51, Adulta: 81, Florecida: 120 },
      'Rosa': { Brote: 21, Joven: 51, Adulta: 81, Florecida: 120 },
      'Orquídea': { Brote: 21, Joven: 51, Adulta: 81, Florecida: 120 },
      'Monstera': { Brote: 21, Joven: 51, Adulta: 81, Florecida: 120 },
      'Hibisco': { Brote: 21, Joven: 51, Adulta: 81, Florecida: 120 },
      'Bambú': { Brote: 31, Joven: 81, Adulta: 151, Florecida: 250 },
      'Helecho': { Brote: 31, Joven: 81, Adulta: 151, Florecida: 250 }
    };
    if (stage === 'Brote') {
      return plantConfigs[type].Brote;
    } else if (stage === 'Joven') {
      return plantConfigs[type].Joven;
    } else if (stage === 'Adulta') {
      return plantConfigs[type].Adulta;
    } else {
      return plantConfigs[type].Florecida;
    }
  };

  const getNextPlantType = (currentType: string): string | null => {
    const evolutionOrder = [
      'Cactus', 'Suculenta', 'Aloe', 'Lavanda', 'Jade',
      'Girasol', 'Rosa', 'Orquídea', 'Monstera', 'Hibisco',
      'Bambú', 'Helecho'
    ];
    const currentIndex = evolutionOrder.indexOf(currentType);
    if (currentIndex === -1 || currentIndex === evolutionOrder.length - 1) {
      return null;
    }
    return evolutionOrder[currentIndex + 1];
  };

  const translateStage = (stage: string): string => {
    const translations: Record<string, string> = {
      'Brote': 'Sprout',
      'Joven': 'Young',
      'Adulta': 'Adult',
      'Florecida': 'Flowering'
    };
    return translations[stage] || stage;
  };

  // Load plant data (sin sonidos)
  useEffect(() => {
    const loadPlant = async () => {
      setIsLoading(true);
      try {
        // Track activity when loading plant
        await trackActivity();
        
        let plantData = await getPlant();
        if (!plantData) {
          plantData = await initializePlant();
        }
        plantData = await updatePlantHealth() || plantData;
        const rewards = await getPendingRewards();
        setPendingRewards(rewards);
        setPlant(plantData);
      } catch (error) {
        console.error('Error loading plant:', error);
        Alert.alert(
          language === 'es' ? 'Error' : 'Error',
          language === 'es'
            ? 'Hubo un problema al cargar tu planta. Por favor, inténtalo de nuevo.'
            : 'There was a problem loading your plant. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadPlant();
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    startPlantAnimation();
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  // Start gentle swaying animation for plant
  const startPlantAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(plantAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(plantAnimation, {
          toValue: 0.9,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(plantAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Handle watering animation (sin sonido)
  const handleWater = async () => {
    if (isWatering || !plant) return;
    
    // Track activity when watering plant
    await trackActivity();
    
    // Check if user has enough water available
    if (plant.waterAvailable < 1) {
      setWateringError(language === 'es' 
        ? 'No tienes suficiente agua disponible. Gana apuestas o recoge agua gratis diaria.'
        : 'You don\'t have enough water available. Win bets or collect daily free water.');
      setShowWateringError(true);
      setTimeout(() => setShowWateringError(false), 3000);
      return;
    }
    
    setIsWatering(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(waterOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waterAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(waterOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      waterAnimation.setValue(0);
      const { plant: updatedPlant, success } = await waterPlant(1);
      if (updatedPlant && success) {
        setPlant(updatedPlant);
      } else if (updatedPlant && !success) {
        setWateringError(language === 'es' 
          ? 'No tienes suficiente agua disponible. Gana apuestas o recoge agua gratis diaria.'
          : 'You don\'t have enough water available. Win bets or collect daily free water.');
        setShowWateringError(true);
        setTimeout(() => setShowWateringError(false), 3000);
      }
      setIsWatering(false);
    });
  };

  // Handle claiming rewards
  const handleClaimRewards = async () => {
    if (pendingRewards <= 0) return;
    
    // Track activity when claiming rewards
    await trackActivity();
    
    try {
      const updatedPlant = await claimPendingRewards();
      if (updatedPlant) {
        setPlant(updatedPlant);
        setPendingRewards(0);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };
  
  // Handle collecting daily free water
  const handleCollectFreeWater = async () => {
    // Track activity when collecting free water
    await trackActivity();
    
    try {
      const { plant: updatedPlant, collected } = await collectDailyFreeWater();
      if (updatedPlant) {
        setPlant(updatedPlant);
        if (collected) {
          setFreeWaterCollected(true);
          setTimeout(() => setFreeWaterCollected(false), 3000);
        } else {
          const hoursLeft = getTimeUntilNextFreeWater(updatedPlant);
          Alert.alert(
            language === 'es' ? 'Agua Gratis No Disponible' : 'Free Water Not Available',
            language === 'es'
              ? `Ya has recogido tu agua gratis hoy. Vuelve en ${hoursLeft} horas.`
              : `You've already collected your free water today. Come back in ${hoursLeft} hours.`
          );
        }
      }
    } catch (error) {
      console.error('Error collecting free water:', error);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBackgroundColors = (): string[] => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 10) {
      return ['#FFB347', '#FFD700', '#87CEFA'];
    } else if (hour >= 10 && hour < 17) {
      return ['#87CEFA', '#4682B4', '#1E3A8A'];
    } else if (hour >= 17 && hour < 20) {
      return ['#FF7F50', '#FF6347', '#4B0082'];
    } else {
      return ['#191970', '#483D8B', '#000033'];
    }
  };

  const getSoilColor = (): string => {
    if (!plant) return '#8B4513';
    return plant.health > 50 ? '#5C4033' : '#D2B48C';
  };

  // Emoticonos para la planta según su tipo y etapa
  const getPlantEmoji = (plant: Plant): string => {
    if (plant.stage === 'Brote') {
      return '🌱';
    }
    const plantEmojis: Record<string, Record<string, string>> = {
      'Cactus': {
        'Joven': '🌵',
        'Adulta': '🌵',
        'Florecida': '🌵'
      },
      'Suculenta': {
        'Joven': '🪴',
        'Adulta': '🪴',
        'Florecida': '🪴'
      },
      'Aloe': {
        'Joven': '🌿',
        'Adulta': '🌿',
        'Florecida': '🌿'
      },
      'Lavanda': {
        'Joven': '🌱',
        'Adulta': '💐',
        'Florecida': '💐'
      },
      'Jade': {
        'Joven': '🌱',
        'Adulta': '🌿',
        'Florecida': '🌿'
      },
      'Girasol': {
        'Joven': '🌱',
        'Adulta': '🌻',
        'Florecida': '🌻'
      },
      'Rosa': {
        'Joven': '🌱',
        'Adulta': '🌹',
        'Florecida': '🌹'
      },
      'Orquídea': {
        'Joven': '🌱',
        'Adulta': '🌸',
        'Florecida': '🌸'
      },
      'Monstera': {
        'Joven': '🌱',
        'Adulta': '🌿',
        'Florecida': '🌿'
      },
      'Hibisco': {
        'Joven': '🌱',
        'Adulta': '🌺',
        'Florecida': '🌺'
      },
      'Bambú': {
        'Joven': '🌱',
        'Adulta': '🎋',
        'Florecida': '🎋'
      },
      'Helecho': {
        'Joven': '🌱',
        'Adulta': '🌿',
        'Florecida': '🌿'
      }
    };
    return plantEmojis[plant.type]?.[plant.stage] || '🌱';
  };

  const getWeatherEmoji = (): string => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 10) {
      return '🌅';
    } else if (hour >= 10 && hour < 17) {
      return '☀️';
    } else if (hour >= 17 && hour < 20) {
      return '🌇';
    } else {
      return '🌙';
    }
  };

  const getPlantStatusText = (): string => {
    if (!plant) return '';
    if (plant.health < 30) {
      return language === 'es' ? '¡Necesita agua urgentemente!' : 'Needs water urgently!';
    } else if (plant.health < 60) {
      return language === 'es' ? 'Podría usar más agua' : 'Could use more water';
    } else {
      return language === 'es' ? 'Saludable y feliz' : 'Healthy and happy';
    }
  };

  const changeTip = () => {
    // Track activity when changing tip
    trackActivity();
    setCurrentTip((prev) => (prev + 1) % plantTips.length);
  };

  if (isLoading) {
    return (
      <GradientBackground colors={getBackgroundColors()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {language === 'es' ? 'Cargando tu planta...' : 'Loading your plant...'}
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground colors={getBackgroundColors()}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                trackActivity(); // Track activity when navigating back
                navigation.goBack();
              }}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>
                {language === 'es' ? 'Volver' : 'Back'}
              </Text>
            </TouchableOpacity>
            <View style={styles.clockContainer}>
              <Text style={styles.clockText}>{getWeatherEmoji()} {formatTime(currentTime)}</Text>
            </View>
          </View>
          
          {/* Área de la planta - Solo un emoji animado */}
          <View style={styles.plantContainer}>
            <View style={[styles.soil, { backgroundColor: getSoilColor() }]} />
            {plant && (
              <View style={styles.plantWrapper}>
                <Animated.Text 
                  style={[
                    styles.plantEmoji,
                    {
                      transform: [
                        { scale: plantAnimation },
                        { translateY: plantAnimation.interpolate({
                          inputRange: [0.9, 1, 1.1],
                          outputRange: [5, 0, -5]
                        }) }
                      ]
                    }
                  ]}
                >
                  {getPlantEmoji(plant)}
                </Animated.Text>
              </View>
            )}
          </View>
          
          {/* Información de la planta */}
          {plant && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.plantName}>{plant.name}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={async () => {
                    // Track activity when editing plant name
                    await trackActivity();
                    
                    const newName = prompt(
                      language === 'es'
                        ? 'Introduce un nuevo nombre para tu planta:'
                        : 'Enter a new name for your plant:',
                      plant.name
                    );
                    if (newName) {
                      const updatedPlant = { ...plant, name: newName };
                      setPlant(updatedPlant);
                      savePlant(updatedPlant);
                    }
                  }}
                >
                  <Feather name="edit-2" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.plantType}>
                {plant.type} - {language === 'es' ? plant.stage : translateStage(plant.stage)}
              </Text>
              <Text style={styles.plantStatus}>{getPlantStatusText()}</Text>
              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>
                  {language === 'es' ? '❤️ Salud:' : '❤️ Health:'}
                </Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${plant.health}%`, backgroundColor: getHealthColor(plant.health) }
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{plant.health}%</Text>
              </View>
              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>
                  {language === 'es' ? '💧 Agua:' : '💧 Water:'}
                </Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${getPlantProgressPercentage(plant)}%`, backgroundColor: '#ADD8E6' }
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>
                  {plant.waterAccumulated}/{getNextThreshold(plant)}
                </Text>
              </View>
              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>
                  {language === 'es' ? '🚿 Disponible:' : '🚿 Available:'}
                </Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { 
                        width: `${Math.min(100, (plant.waterAvailable / 20) * 100)}%`, 
                        backgroundColor: '#87CEEB' 
                      }
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>
                  {plant.waterAvailable}
                </Text>
              </View>
              <Text style={styles.requirementText}>
                {language === 'es'
                  ? `📅 Necesidad diaria: ${plant.waterRequirement} unidades de agua`
                  : `📅 Daily requirement: ${plant.waterRequirement} water units`}
              </Text>
              {pendingRewards > 0 && (
                <TouchableOpacity
                  style={styles.rewardsButton}
                  onPress={handleClaimRewards}
                >
                  <Text style={styles.rewardsButtonText}>
                    {language === 'es'
                      ? `🎁 ¡Reclama ${pendingRewards} unidades de agua!`
                      : `🎁 Claim ${pendingRewards} water units!`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Banner de consejo */}
          <TouchableOpacity 
            style={styles.tipContainer}
            onPress={changeTip}
          >
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>{plantTips[currentTip]}</Text>
            <Text style={styles.tipChangeText}>
              {language === 'es' ? 'Toca para cambiar' : 'Tap to change'}
            </Text>
          </TouchableOpacity>
          
          {/* Error message for watering */}
          {showWateringError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{wateringError}</Text>
            </View>
          )}
          
          {/* Success message for free water collection */}
          {freeWaterCollected && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                {language === 'es'
                  ? '¡Has recogido 1 unidad de agua gratis!'
                  : 'You collected 1 free water unit!'}
              </Text>
            </View>
          )}
          
          {/* Botones de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCollectFreeWater}
            >
              <Feather name="droplet" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {language === 'es' ? 'Agua Gratis' : 'Free Water'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.waterButton]}
              onPress={handleWater}
              disabled={isWatering}
            >
              <Feather name="cloud-rain" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {language === 'es' ? 'Regar (1 💧)' : 'Water (1 💧)'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                trackActivity(); // Track activity when viewing progress
                setShowProgressModal(true);
              }}
            >
              <Feather name="bar-chart-2" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {language === 'es' ? 'Progreso' : 'Progress'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Animación de agua */}
          {isWatering && (
            <Animated.View
              style={[
                styles.waterDrop,
                {
                  opacity: waterOpacity,
                  transform: [
                    {
                      translateY: waterAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.waterDropText}>💧</Text>
            </Animated.View>
          )}
          
          {/* Modal de progreso */}
          <Modal
            visible={showProgressModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowProgressModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {language === 'es' ? 'Progreso de la Planta' : 'Plant Progress'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      trackActivity(); // Track activity when closing modal
                      setShowProgressModal(false);
                    }}
                  >
                    <Feather name="x" size={24} color="#333333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScrollView}>
                  {plant && (
                    <>
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>
                          {language === 'es' ? 'Etapa Actual' : 'Current Stage'}
                        </Text>
                        <View style={styles.stageContainer}>
                          <Text style={styles.stageEmoji}>{getPlantEmoji(plant)}</Text>
                          <Text style={styles.stageName}>
                            {language === 'es' ? plant.stage : translateStage(plant.stage)}
                          </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <Text style={styles.progressLabel}>
                            {language === 'es' ? 'Progreso de etapa:' : 'Stage progress:'}
                          </Text>
                          <View style={styles.modalProgressBar}>
                            <View
                              style={[
                                styles.modalProgressFill,
                                { width: `${getPlantProgressPercentage(plant)}%` }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressValue}>
                            {plant.waterAccumulated}/{getNextThreshold(plant)} 💧
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>
                          {language === 'es' ? 'Evolución' : 'Evolution'}
                        </Text>
                        <View style={styles.evolutionContainer}>
                          <View style={styles.evolutionItem}>
                            <Text style={styles.evolutionEmoji}>{getPlantEmoji(plant)}</Text>
                            <Text style={styles.evolutionName}>{plant.type}</Text>
                          </View>
                          <Feather name="arrow-right" size={24} color="#666666" />
                          <View style={styles.evolutionItem}>
                            <Text style={styles.evolutionEmoji}>
                              {getNextPlantType(plant.type) ? '❓' : '🏆'}
                            </Text>
                            <Text style={styles.evolutionName}>
                              {getNextPlantType(plant.type) || 
                                (language === 'es' ? 'Planta Final' : 'Final Plant')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <Text style={styles.progressLabel}>
                            {language === 'es' ? 'Progreso de evolución:' : 'Evolution progress:'}
                          </Text>
                          <View style={styles.modalProgressBar}>
                            <View
                              style={[
                                styles.modalProgressFill,
                                { width: `${getPlantEvolutionPercentage(plant)}%` }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressValue}>
                            {plant.waterAccumulated}/{plant.evolutionThreshold} 💧
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>
                          {language === 'es' ? 'Estadísticas' : 'Statistics'}
                        </Text>
                        <View style={styles.statsRow}>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{plant.waterRequirement}</Text>
                            <Text style={styles.statLabel}>
                              {language === 'es' ? 'Necesidad Diaria' : 'Daily Need'}
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{plant.waterAvailable}</Text>
                            <Text style={styles.statLabel}>
                              {language === 'es' ? 'Agua Disponible' : 'Available Water'}
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{plant.health}%</Text>
                            <Text style={styles.statLabel}>
                              {language === 'es' ? 'Salud' : 'Health'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>
                          {language === 'es' ? 'Consejos de Cuidado' : 'Care Tips'}
                        </Text>
                        <View style={styles.tipsList}>
                          <View style={styles.tipItem}>
                            <Feather name="droplet" size={18} color="#4682B4" style={styles.tipIcon} />
                            <Text style={styles.tipItemText}>
                              {language === 'es'
                                ? `Riega tu ${plant.type} regularmente para mantenerla saludable.`
                                : `Water your ${plant.type} regularly to keep it healthy.`}
                            </Text>
                          </View>
                          <View style={styles.tipItem}>
                            <Feather name="sun" size={18} color="#FFA500" style={styles.tipIcon} />
                            <Text style={styles.tipItemText}>
                              {language === 'es'
                                ? 'Gana apuestas para obtener más agua para tu planta.'
                                : 'Win bets to get more water for your plant.'}
                            </Text>
                          </View>
                          <View style={styles.tipItem}>
                            <Feather name="clock" size={18} color="#9370DB" style={styles.tipIcon} />
                            <Text style={styles.tipItemText}>
                              {language === 'es'
                                ? 'Recoge agua gratis cada 24 horas.'
                                : 'Collect free water every 24 hours.'}
                            </Text>
                          </View>
                          <View style={styles.tipItem}>
                            <Feather name="alert-triangle" size={18} color="#FF6347" style={styles.tipIcon} />
                            <Text style={styles.tipItemText}>
                              {language === 'es'
                                ? 'Tu planta morirá si no la riegas durante 72 horas.'
                                : 'Your plant will die if you don\'t water it for 72 hours.'}
                            </Text>
                          </View>
                          <View style={styles.tipItem}>
                            <Feather name="activity" size={18} color="#32CD32" style={styles.tipIcon} />
                            <Text style={styles.tipItemText}>
                              {language === 'es'
                                ? 'La salud de tu planta disminuye con el tiempo de inactividad.'
                                : 'Your plant\'s health decreases with inactivity time.'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 16,
  },
  clockContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clockText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.3,
    marginVertical: 20,
    position: 'relative',
  },
  soil: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 40,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  plantWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
  },
  plantEmoji: {
    fontSize: 100,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  editButton: {
    padding: 8,
  },
  plantType: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 8,
  },
  plantStatus: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    color: '#FFFFFF',
    width: 100,
    fontSize: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    color: '#FFFFFF',
    width: 60,
    textAlign: 'right',
    fontSize: 14,
  },
  requirementText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  rewardsButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  rewardsButtonText: {
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    color: '#333333',
    fontSize: 14,
  },
  tipChangeText: {
    color: '#666666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(50, 205, 50, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  waterButton: {
    backgroundColor: 'rgba(70, 130, 180, 0.8)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 14,
  },
  waterDrop: {
    position: 'absolute',
    top: height * 0.25,
    alignSelf: 'center',
  },
  waterDropText: {
    fontSize: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  stageName: {
    fontSize: 18,
    color: '#333333',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  modalProgressBar: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 8,
  },
  progressValue: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
  },
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  evolutionItem: {
    alignItems: 'center',
    flex: 1,
  },
  evolutionEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  evolutionName: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
});

export default MeteoPlantScreen;
