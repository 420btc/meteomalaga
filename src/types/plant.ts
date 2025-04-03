export interface Plant {
  id: number;
  name: string;
  type: PlantType;
  stage: PlantStage;
  waterRequirement: number;
  waterAccumulated: number;
  health: number;
  lastWatered: string;
  stageThreshold: number;
  evolutionThreshold: number;
  waterAvailable: number;
  lastFreeWaterCollected: string;
}

export type PlantType = 
  | 'Cactus'
  | 'Suculenta'
  | 'Aloe'
  | 'Lavanda'
  | 'Jade'
  | 'Girasol'
  | 'Rosa'
  | 'Orquídea'
  | 'Monstera'
  | 'Hibisco'
  | 'Bambú'
  | 'Helecho';

export type PlantStage = 'Brote' | 'Joven' | 'Adulta' | 'Florecida';

export interface PlantConfig {
  type: PlantType;
  waterRequirement: number;
  stageThresholds: {
    Brote: number;
    Joven: number;
    Adulta: number;
    Florecida: number;
  };
  evolutionThreshold: number;
}

export interface PlantReward {
  betType: 'rain' | 'temp_min' | 'temp_max';
  waterAmount: number;
}
