import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PlantType, PlantStage, PlantConfig } from '../types/plant';

const PLANT_STORAGE_KEY = 'meteo_plant_data';
const PLANT_REWARDS_KEY = 'meteo_plant_rewards';
const LAST_ACTIVITY_KEY = 'meteo_last_activity';

// Plant configurations
const plantConfigs: Record<PlantType, PlantConfig> = {
  'Cactus': {
    type: 'Cactus',
    waterRequirement: 2,
    stageThresholds: { Brote: 0, Joven: 11, Adulta: 26, Florecida: 41 },
    evolutionThreshold: 60
  },
  'Suculenta': {
    type: 'Suculenta',
    waterRequirement: 3,
    stageThresholds: { Brote: 0, Joven: 11, Adulta: 26, Florecida: 41 },
    evolutionThreshold: 60
  },
  'Aloe': {
    type: 'Aloe',
    waterRequirement: 3,
    stageThresholds: { Brote: 0, Joven: 11, Adulta: 26, Florecida: 41 },
    evolutionThreshold: 60
  },
  'Lavanda': {
    type: 'Lavanda',
    waterRequirement: 4,
    stageThresholds: { Brote: 0, Joven: 11, Adulta: 26, Florecida: 41 },
    evolutionThreshold: 60
  },
  'Jade': {
    type: 'Jade',
    waterRequirement: 4,
    stageThresholds: { Brote: 0, Joven: 11, Adulta: 26, Florecida: 41 },
    evolutionThreshold: 60
  },
  'Girasol': {
    type: 'Girasol',
    waterRequirement: 5,
    stageThresholds: { Brote: 0, Joven: 21, Adulta: 51, Florecida: 81 },
    evolutionThreshold: 120
  },
  'Rosa': {
    type: 'Rosa',
    waterRequirement: 6,
    stageThresholds: { Brote: 0, Joven: 21, Adulta: 51, Florecida: 81 },
    evolutionThreshold: 120
  },
  'Orquídea': {
    type: 'Orquídea',
    waterRequirement: 6,
    stageThresholds: { Brote: 0, Joven: 21, Adulta: 51, Florecida: 81 },
    evolutionThreshold: 120
  },
  'Monstera': {
    type: 'Monstera',
    waterRequirement: 7,
    stageThresholds: { Brote: 0, Joven: 21, Adulta: 51, Florecida: 81 },
    evolutionThreshold: 120
  },
  'Hibisco': {
    type: 'Hibisco',
    waterRequirement: 7,
    stageThresholds: { Brote: 0, Joven: 21, Adulta: 51, Florecida: 81 },
    evolutionThreshold: 120
  },
  'Bambú': {
    type: 'Bambú',
    waterRequirement: 8,
    stageThresholds: { Brote: 0, Joven: 31, Adulta: 81, Florecida: 151 },
    evolutionThreshold: 250
  },
  'Helecho': {
    type: 'Helecho',
    waterRequirement: 9,
    stageThresholds: { Brote: 0, Joven: 31, Adulta: 81, Florecida: 151 },
    evolutionThreshold: 250
  }
};

// Get plant stage based on water accumulated
const getPlantStage = (plant: Plant): PlantStage => {
  const config = plantConfigs[plant.type];
  const { waterAccumulated } = plant;
  
  if (waterAccumulated >= config.stageThresholds.Florecida) {
    return 'Florecida';
  } else if (waterAccumulated >= config.stageThresholds.Adulta) {
    return 'Adulta';
  } else if (waterAccumulated >= config.stageThresholds.Joven) {
    return 'Joven';
  } else {
    return 'Brote';
  }
};

// Update last activity timestamp
export const updateLastActivity = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, now);
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

// Get last activity timestamp
export const getLastActivity = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
  } catch (error) {
    console.error('Error getting last activity:', error);
    return null;
  }
};

// Initialize a new plant
export const initializePlant = async (): Promise<Plant> => {
  const newPlant: Plant = {
    id: Date.now(),
    name: 'Mi Planta',
    type: 'Cactus',
    stage: 'Brote',
    waterRequirement: plantConfigs['Cactus'].waterRequirement,
    waterAccumulated: 0,
    health: 100,
    lastWatered: new Date().toISOString(),
    stageThreshold: plantConfigs['Cactus'].stageThresholds.Joven,
    evolutionThreshold: plantConfigs['Cactus'].evolutionThreshold,
    waterAvailable: 5, // Start with 5 units of water
    lastFreeWaterCollected: new Date().toISOString()
  };
  
  await savePlant(newPlant);
  await updateLastActivity(); // Initialize last activity
  return newPlant;
};

// Get current plant data
export const getPlant = async (): Promise<Plant | null> => {
  try {
    const plantData = await AsyncStorage.getItem(PLANT_STORAGE_KEY);
    if (!plantData) return null;
    
    const plant: Plant = JSON.parse(plantData);
    
    // Add waterAvailable and lastFreeWaterCollected if they don't exist (for backward compatibility)
    if (plant.waterAvailable === undefined) {
      plant.waterAvailable = 5;
    }
    if (plant.lastFreeWaterCollected === undefined) {
      plant.lastFreeWaterCollected = new Date().toISOString();
    }
    
    // Update plant health based on inactivity
    const updatedPlant = await updatePlantHealthBasedOnInactivity(plant);
    
    return updatedPlant;
  } catch (error) {
    console.error('Error getting plant data:', error);
    return null;
  }
};

// Save plant data
export const savePlant = async (plant: Plant): Promise<void> => {
  try {
    await AsyncStorage.setItem(PLANT_STORAGE_KEY, JSON.stringify(plant));
  } catch (error) {
    console.error('Error saving plant data:', error);
  }
};

// Update plant health based on player inactivity
export const updatePlantHealthBasedOnInactivity = async (plant: Plant): Promise<Plant> => {
  const lastActivityStr = await getLastActivity();
  
  if (!lastActivityStr) {
    // If no last activity is recorded, set it now and return plant unchanged
    await updateLastActivity();
    return plant;
  }
  
  const now = new Date();
  const lastActivity = new Date(lastActivityStr);
  
  // Calculate hours since last activity
  const hoursSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
  
  if (hoursSinceActivity >= 72) {
    // Plant dies after 72 hours of inactivity
    console.log('Plant died due to player inactivity for 72 hours');
    const newPlant = await initializePlant();
    return newPlant;
  }
  
  if (hoursSinceActivity > 0) {
    // Reduce health proportionally to inactivity time (1% per hour)
    const healthReduction = Math.min(plant.health, hoursSinceActivity);
    plant.health -= healthReduction;
    
    // If health reaches 0, reset plant
    if (plant.health <= 0) {
      console.log('Plant died due to health reaching 0 from inactivity');
      const newPlant = await initializePlant();
      return newPlant;
    }
    
    await savePlant(plant);
  }
  
  // Update last activity to current time
  await updateLastActivity();
  
  return plant;
};

// Update plant health based on daily water requirement and check for plant death
export const updatePlantHealth = async (): Promise<Plant | null> => {
  const plant = await getPlant();
  if (!plant) return null;
  
  const now = new Date();
  const lastWatered = new Date(plant.lastWatered);
  
  // Check if 72 hours (3 days) have passed since last watering
  const hoursPassed = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60));
  
  if (hoursPassed >= 72) {
    // Plant dies after 72 hours without water
    console.log('Plant died due to lack of water for 72 hours');
    const newPlant = await initializePlant();
    return newPlant;
  }
  
  // Check if a day has passed since last update
  const daysPassed = Math.floor(hoursPassed / 24);
  
  if (daysPassed > 0) {
    // Reduce health by 20% for each day without meeting water requirement
    const healthReduction = Math.min(plant.health, 20 * daysPassed);
    plant.health -= healthReduction;
    
    // If health reaches 0, reset plant
    if (plant.health <= 0) {
      const newPlant = await initializePlant();
      return newPlant;
    }
    
    plant.lastWatered = now.toISOString();
    await savePlant(plant);
  }
  
  return plant;
};

// Add water to plant from successful bets
export const addWaterFromBet = async (betType: 'rain' | 'temp_min' | 'temp_max', success: boolean): Promise<Plant | null> => {
  if (!success) return await getPlant();
  
  let plant = await getPlant();
  if (!plant) {
    plant = await initializePlant();
  }
  
  // Water amounts for different bet types
  const waterAmount = betType === 'rain' ? 5 : 10;
  
  // Add water to plant's available water
  plant.waterAvailable += waterAmount;
  
  await savePlant(plant);
  await updateLastActivity(); // Update last activity when adding water from bet
  return plant;
};

// Get next plant type in evolution
const getNextPlantType = (currentType: PlantType): PlantType | null => {
  const evolutionOrder: PlantType[] = [
    'Cactus', 'Suculenta', 'Aloe', 'Lavanda', 'Jade',
    'Girasol', 'Rosa', 'Orquídea', 'Monstera', 'Hibisco',
    'Bambú', 'Helecho'
  ];
  
  const currentIndex = evolutionOrder.indexOf(currentType);
  if (currentIndex === -1 || currentIndex === evolutionOrder.length - 1) {
    return null; // Already at max evolution or invalid type
  }
  
  return evolutionOrder[currentIndex + 1];
};

// Get pending rewards from successful bets
export const getPendingRewards = async (): Promise<number> => {
  try {
    const rewardsData = await AsyncStorage.getItem(PLANT_REWARDS_KEY);
    if (!rewardsData) return 0;
    
    const rewards = JSON.parse(rewardsData);
    return rewards.amount || 0;
  } catch (error) {
    console.error('Error getting pending rewards:', error);
    return 0;
  }
};

// Add pending reward
export const addPendingReward = async (betType: 'rain' | 'temp_min' | 'temp_max', success: boolean): Promise<void> => {
  if (!success) return;
  
  try {
    const waterAmount = betType === 'rain' ? 5 : 10;
    
    const rewardsData = await AsyncStorage.getItem(PLANT_REWARDS_KEY);
    let rewards = { amount: 0 };
    
    if (rewardsData) {
      rewards = JSON.parse(rewardsData);
    }
    
    rewards.amount = (rewards.amount || 0) + waterAmount;
    await AsyncStorage.setItem(PLANT_REWARDS_KEY, JSON.stringify(rewards));
    await updateLastActivity(); // Update last activity when adding pending reward
  } catch (error) {
    console.error('Error adding pending reward:', error);
  }
};

// Claim pending rewards
export const claimPendingRewards = async (): Promise<Plant | null> => {
  try {
    const pendingRewards = await getPendingRewards();
    if (pendingRewards <= 0) return await getPlant();
    
    let plant = await getPlant();
    if (!plant) {
      plant = await initializePlant();
    }
    
    // Add water to plant's available water
    plant.waterAvailable += pendingRewards;
    
    // Reset health to 100% when watered
    plant.health = 100;
    plant.lastWatered = new Date().toISOString();
    
    await savePlant(plant);
    await updateLastActivity(); // Update last activity when claiming rewards
    
    // Clear pending rewards
    await AsyncStorage.setItem(PLANT_REWARDS_KEY, JSON.stringify({ amount: 0 }));
    
    return plant;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return null;
  }
};

// Collect daily free water (1 unit)
export const collectDailyFreeWater = async (): Promise<{plant: Plant | null, collected: boolean}> => {
  let plant = await getPlant();
  if (!plant) {
    plant = await initializePlant();
    return { plant, collected: false };
  }
  
  const now = new Date();
  const lastCollected = new Date(plant.lastFreeWaterCollected);
  
  // Check if 24 hours have passed since last collection
  const hoursPassed = Math.floor((now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60));
  
  if (hoursPassed >= 24) {
    // Add 1 unit of free water
    plant.waterAvailable += 1;
    plant.lastFreeWaterCollected = now.toISOString();
    
    await savePlant(plant);
    await updateLastActivity(); // Update last activity when collecting free water
    return { plant, collected: true };
  }
  
  return { plant, collected: false };
};

// Water plant manually
export const waterPlant = async (amount: number): Promise<{plant: Plant | null, success: boolean}> => {
  let plant = await getPlant();
  if (!plant) {
    plant = await initializePlant();
  }
  
  // Check if user has enough water available
  if (plant.waterAvailable < amount) {
    return { plant, success: false };
  }
  
  // Deduct water from available water
  plant.waterAvailable -= amount;
  
  // Add water to plant
  plant.waterAccumulated += amount;
  
  // Check if plant should evolve to next stage
  const updatedStage = getPlantStage(plant);
  if (updatedStage !== plant.stage) {
    plant.stage = updatedStage;
  }
  
  // Check if plant should evolve to next type
  if (plant.waterAccumulated >= plant.evolutionThreshold) {
    const nextPlantType = getNextPlantType(plant.type);
    if (nextPlantType) {
      plant.type = nextPlantType;
      plant.waterRequirement = plantConfigs[nextPlantType].waterRequirement;
      plant.waterAccumulated = 0;
      plant.stage = 'Brote';
      plant.stageThreshold = plantConfigs[nextPlantType].stageThresholds.Joven;
      plant.evolutionThreshold = plantConfigs[nextPlantType].evolutionThreshold;
    }
  }
  
  // Reset health to 100% when watered
  plant.health = 100;
  plant.lastWatered = new Date().toISOString();
  
  await savePlant(plant);
  await updateLastActivity(); // Update last activity when watering plant
  return { plant, success: true };
};

// Get time until next free water collection
export const getTimeUntilNextFreeWater = (plant: Plant): number => {
  const now = new Date();
  const lastCollected = new Date(plant.lastFreeWaterCollected);
  
  // 24 hours in milliseconds
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Calculate time until next collection
  const nextCollectionTime = new Date(lastCollected.getTime() + oneDayMs);
  const timeUntilNextMs = Math.max(0, nextCollectionTime.getTime() - now.getTime());
  
  // Return hours until next collection
  return Math.ceil(timeUntilNextMs / (60 * 60 * 1000));
};

// Get plant progress percentage for current stage
export const getPlantProgressPercentage = (plant: Plant): number => {
  const config = plantConfigs[plant.type];
  const { stage, waterAccumulated } = plant;
  
  if (stage === 'Brote') {
    return (waterAccumulated / config.stageThresholds.Joven) * 100;
  } else if (stage === 'Joven') {
    const min = config.stageThresholds.Joven;
    const max = config.stageThresholds.Adulta;
    return ((waterAccumulated - min) / (max - min)) * 100;
  } else if (stage === 'Adulta') {
    const min = config.stageThresholds.Adulta;
    const max = config.stageThresholds.Florecida;
    return ((waterAccumulated - min) / (max - min)) * 100;
  } else {
    const min = config.stageThresholds.Florecida;
    const max = config.evolutionThreshold;
    return ((waterAccumulated - min) / (max - min)) * 100;
  }
};

// Get plant evolution progress percentage
export const getPlantEvolutionPercentage = (plant: Plant): number => {
  return (plant.waterAccumulated / plant.evolutionThreshold) * 100;
};

// Get plant image URL based on type and stage
export const getPlantImageUrl = (plant: Plant): string => {
  const baseUrl = 'https://raw.githubusercontent.com/bfloat/meteo-plant-assets/main/';
  return `${baseUrl}${plant.type.toLowerCase()}_${plant.stage.toLowerCase()}.png`;
};

// Get pot image URL
export const getPotImageUrl = (potColor: string = 'default'): string => {
  const baseUrl = 'https://raw.githubusercontent.com/bfloat/meteo-plant-assets/main/';
  return `${baseUrl}pot_${potColor}.png`;
};
