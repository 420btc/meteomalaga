import AsyncStorage from '@react-native-async-storage/async-storage';
// Fix import to work in Expo Snack
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Constants
const USERS_STORAGE_KEY = 'auth_users';
const CURRENT_USER_KEY = 'auth_current_user';
const SAVED_CREDENTIALS_KEY = 'auth_saved_credentials';
const AUTH_STATE_KEY = 'auth_state';
const USER_INDEX_KEY = 'auth_user_index';

// User interface
export interface User {
  username: string;
  passwordHash: string;
  userId: string;
  createdAt: string;
  displayName?: string;
  email?: string;
  role?: string;
  coins?: number;
  waterDrops?: number;
  totalBets?: number;
  wonBets?: number;
  avatar?: string;
  lastDailyReward?: string;
  dailyRewardStreak?: number;
}

// Login response interface
export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
}

// Saved credentials interface
export interface SavedCredentials {
  username: string;
  password: string;
  userId: string;
  lastUsed: string;
}

// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  currentUserId: string | null;
  lastUpdated: string;
}

// User index interface for efficient lookups
interface UserIndex {
  byUsername: { [username: string]: string }; // username -> userId
  byId: { [userId: string]: boolean }; // userId -> exists
}

/**
 * Hashes a password using SHA-256
 */
export const hashPassword = async (password: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hash;
};

/**
 * Gets or creates the user index for efficient lookups
 */
const getUserIndex = async (): Promise<UserIndex> => {
  try {
    const indexJson = await AsyncStorage.getItem(USER_INDEX_KEY);
    if (indexJson) {
      return JSON.parse(indexJson);
    }
    
    // If no index exists, create one from the users
    const users = await getUsers();
    const index: UserIndex = { byUsername: {}, byId: {} };
    
    for (const user of users) {
      index.byUsername[user.username.toLowerCase()] = user.userId;
      index.byId[user.userId] = true;
    }
    
    // Save the index
    await AsyncStorage.setItem(USER_INDEX_KEY, JSON.stringify(index));
    
    return index;
  } catch (error) {
    console.error('Error getting user index:', error);
    return { byUsername: {}, byId: {} };
  }
};

/**
 * Updates the user index
 */
const updateUserIndex = async (user: User, isDelete: boolean = false): Promise<void> => {
  try {
    const index = await getUserIndex();
    
    if (isDelete) {
      // Remove user from index
      delete index.byUsername[user.username.toLowerCase()];
      delete index.byId[user.userId];
    } else {
      // Add or update user in index
      index.byUsername[user.username.toLowerCase()] = user.userId;
      index.byId[user.userId] = true;
    }
    
    await AsyncStorage.setItem(USER_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Error updating user index:', error);
  }
};

/**
 * Checks if a username exists using the index
 */
const usernameExists = async (username: string): Promise<boolean> => {
  const index = await getUserIndex();
  return !!index.byUsername[username.toLowerCase()];
};

/**
 * Checks if a user ID exists using the index
 */
const userIdExists = async (userId: string): Promise<boolean> => {
  const index = await getUserIndex();
  return !!index.byId[userId];
};

/**
 * Gets a user by username using the index
 */
const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const index = await getUserIndex();
    const userId = index.byUsername[username.toLowerCase()];
    
    if (!userId) {
      return null;
    }
    
    // Get all users and find the one with matching ID
    const users = await getUsers();
    return users.find(user => user.userId === userId) || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

/**
 * Gets a user by ID
 */
const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const index = await getUserIndex();
    
    if (!index.byId[userId]) {
      return null;
    }
    
    // Get all users and find the one with matching ID
    const users = await getUsers();
    return users.find(user => user.userId === userId) || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

/**
 * Registers a new user
 */
export const registerUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Validate username and password
    if (!username || !password) {
      return {
        success: false,
        message: 'El nombre de usuario y la contraseña son obligatorios.'
      };
    }

    if (username.length < 3) {
      return {
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres.'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      };
    }

    // Check if username already exists
    if (await usernameExists(username)) {
      return {
        success: false,
        message: 'El nombre de usuario ya existe. Por favor, elige otro.'
      };
    }

    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create new user
    const newUser: User = {
      username,
      passwordHash,
      userId,
      createdAt: new Date().toISOString(),
      displayName: username, // Set displayName same as username initially
      coins: 100, // Default coins
      waterDrops: 0, // Default water drops
      totalBets: 0,
      wonBets: 0,
      avatar: `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8) + 1}.jpg`
    };
    
    // Add user to storage
    await saveUser(newUser);
    
    // Update user index
    await updateUserIndex(newUser);
    
    // Save credentials for offline login
    await saveCredentials({
      username,
      password,
      userId,
      lastUsed: new Date().toISOString()
    });
    
    // Set as current user
    await setCurrentUser(newUser);
    
    // Update auth state
    await updateAuthState(true, userId);
    
    return {
      success: true,
      message: '¡Registro exitoso!',
      userId: newUser.userId,
      username: newUser.username
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      message: 'Error al registrar usuario. Por favor, inténtalo de nuevo.'
    };
  }
};

/**
 * Logs in a user
 */
export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Find user by username
    const user = await getUserByUsername(username);
    
    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado.'
      };
    }
    
    // Hash the provided password and compare
    const passwordHash = await hashPassword(password);
    
    if (passwordHash !== user.passwordHash) {
      return {
        success: false,
        message: 'Contraseña incorrecta.'
      };
    }
    
    // Save credentials for offline login
    await saveCredentials({
      username,
      password,
      userId: user.userId,
      lastUsed: new Date().toISOString()
    });
    
    // Set as current user
    await setCurrentUser(user);
    
    // Update auth state
    await updateAuthState(true, user.userId);
    
    return {
      success: true,
      message: '¡Inicio de sesión exitoso!',
      userId: user.userId,
      username: user.username
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      success: false,
      message: 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
    };
  }
};

/**
 * Logs out the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    await updateAuthState(false, null);
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

/**
 * Gets the current logged in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    
    // Verify user exists
    if (!(await userIdExists(user.userId))) {
      // User no longer exists in the database
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      await updateAuthState(false, null);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Checks if a user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    // First check the auth state for a quick response
    const authState = await getAuthState();
    if (authState) {
      // Verify the auth state is still valid by checking the current user
      if (authState.isAuthenticated) {
        const user = await getCurrentUser();
        return user !== null;
      }
      return false;
    }
    
    // Fallback to checking current user directly
    const user = await getCurrentUser();
    const isAuth = user !== null;
    
    // Update auth state to match
    await updateAuthState(isAuth, user?.userId || null);
    
    return isAuth;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

/**
 * Gets all registered users
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

/**
 * Saves a user to storage
 */
export const saveUser = async (user: User): Promise<void> => {
  try {
    const users = await getUsers();
    
    // Check if user already exists
    const existingIndex = users.findIndex(u => u.userId === user.userId);
    
    if (existingIndex >= 0) {
      // Update existing user
      users[existingIndex] = {
        ...users[existingIndex],
        ...user,
        // Don't override these fields if they exist
        passwordHash: user.passwordHash || users[existingIndex].passwordHash,
        createdAt: users[existingIndex].createdAt
      };
    } else {
      // Add new user
      users.push(user);
    }
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update user index
    await updateUserIndex(user);
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

/**
 * Updates an existing user
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
  try {
    // Get user directly
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user
    const updatedUser: User = {
      ...user,
      ...updates,
      // Don't allow these to be updated
      userId: user.userId,
      createdAt: user.createdAt
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

/**
 * Sets the current logged in user
 */
export const setCurrentUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting current user:', error);
    throw error;
  }
};

/**
 * Saves user credentials for offline login
 */
export const saveCredentials = async (credentials: SavedCredentials): Promise<void> => {
  try {
    // Get existing saved credentials
    const savedCredentialsJson = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
    const savedCredentials: SavedCredentials[] = savedCredentialsJson 
      ? JSON.parse(savedCredentialsJson) 
      : [];
    
    // Check if credentials for this username already exist
    const existingIndex = savedCredentials.findIndex(
      cred => cred.username.toLowerCase() === credentials.username.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Update existing credentials
      savedCredentials[existingIndex] = credentials;
    } else {
      // Add new credentials
      savedCredentials.push(credentials);
    }
    
    // Sort by last used (most recent first)
    const sortedCredentials = savedCredentials.sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
    
    // Save to storage (no limit on number of saved credentials)
    await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(sortedCredentials));
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
};

/**
 * Gets saved credentials for offline login
 */
export const getSavedCredentials = async (): Promise<SavedCredentials[]> => {
  try {
    const savedCredentialsJson = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
    const savedCredentials: SavedCredentials[] = savedCredentialsJson 
      ? JSON.parse(savedCredentialsJson) 
      : [];
    
    // Sort by last used (most recent first)
    return savedCredentials.sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  } catch (error) {
    console.error('Error getting saved credentials:', error);
    return [];
  }
};

/**
 * Attempts to login with saved credentials
 */
export const loginWithSavedCredentials = async (username: string): Promise<LoginResponse> => {
  try {
    const savedCredentials = await getSavedCredentials();
    const credentials = savedCredentials.find(
      cred => cred.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!credentials) {
      return {
        success: false,
        message: 'No se encontraron credenciales guardadas para este usuario.'
      };
    }
    
    // Login with saved credentials
    return await loginUser(credentials.username, credentials.password);
  } catch (error) {
    console.error('Error logging in with saved credentials:', error);
    return {
      success: false,
      message: 'Error al iniciar sesión con credenciales guardadas.'
    };
  }
};

/**
 * Removes saved credentials for a user
 */
export const removeSavedCredentials = async (username: string): Promise<void> => {
  try {
    const savedCredentials = await getSavedCredentials();
    const filteredCredentials = savedCredentials.filter(
      cred => cred.username.toLowerCase() !== username.toLowerCase()
    );
    
    await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(filteredCredentials));
  } catch (error) {
    console.error('Error removing saved credentials:', error);
  }
};

/**
 * Gets the current authentication state
 */
export const getAuthState = async (): Promise<AuthState | null> => {
  try {
    const authStateJson = await AsyncStorage.getItem(AUTH_STATE_KEY);
    return authStateJson ? JSON.parse(authStateJson) : null;
  } catch (error) {
    console.error('Error getting auth state:', error);
    return null;
  }
};

/**
 * Updates the authentication state
 */
export const updateAuthState = async (isAuthenticated: boolean, currentUserId: string | null): Promise<void> => {
  try {
    const authState: AuthState = {
      isAuthenticated,
      currentUserId,
      lastUpdated: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
  } catch (error) {
    console.error('Error updating auth state:', error);
  }
};

/**
 * Imports users in bulk (for scalability)
 * @param users Array of users to import
 * @returns Number of users successfully imported
 */
export const importUsers = async (users: Omit<User, 'passwordHash'>[], defaultPassword: string = 'password123'): Promise<number> => {
  try {
    const existingUsers = await getUsers();
    const passwordHash = await hashPassword(defaultPassword);
    
    let importedCount = 0;
    const updatedUsers = [...existingUsers];
    
    for (const user of users) {
      // Check if user already exists using the index
      if (await userIdExists(user.userId) || await usernameExists(user.username)) {
        continue;
      }
      
      // Add new user
      const newUser: User = {
        ...user,
        passwordHash,
        createdAt: user.createdAt || new Date().toISOString()
      };
      
      updatedUsers.push(newUser);
      
      // Update user index
      await updateUserIndex(newUser);
      
      importedCount++;
    }
    
    // Save all users
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    return importedCount;
  } catch (error) {
    console.error('Error importing users:', error);
    return 0;
  }
};

/**
 * Batch register users (for scalability)
 */
export const batchRegisterUsers = async (usernames: string[], defaultPassword: string = 'password123'): Promise<number> => {
  try {
    const passwordHash = await hashPassword(defaultPassword);
    
    let registeredCount = 0;
    const newUsers: User[] = [];
    
    for (const username of usernames) {
      // Skip empty usernames
      if (!username.trim()) continue;
      
      // Check if username already exists
      if (await usernameExists(username)) {
        continue;
      }
      
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create new user
      const newUser: User = {
        username,
        passwordHash,
        userId,
        createdAt: new Date().toISOString(),
        displayName: username,
        coins: 100,
        waterDrops: 0,
        totalBets: 0,
        wonBets: 0,
        avatar: `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8) + 1}.jpg`
      };
      
      newUsers.push(newUser);
      registeredCount++;
    }
    
    // Save all new users
    if (newUsers.length > 0) {
      const existingUsers = await getUsers();
      const updatedUsers = [...existingUsers, ...newUsers];
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      // Update user index for each new user
      for (const user of newUsers) {
        await updateUserIndex(user);
      }
    }
    
    return registeredCount;
  } catch (error) {
    console.error('Error batch registering users:', error);
    return 0;
  }
};

/**
 * Exports all users (for backup/migration)
 */
export const exportUsers = async (): Promise<Omit<User, 'passwordHash'>[]> => {
  try {
    const users = await getUsers();
    
    // Remove sensitive data
    return users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return [];
  }
};

/**
 * Updates user coins
 */
export const updateUserCoins = async (userId: string, coins: number): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user coins
    const updatedUser: User = {
      ...user,
      coins
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user coins:', error);
    return false;
  }
};

/**
 * Updates user water drops
 */
export const updateUserWaterDrops = async (userId: string, waterDrops: number): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user water drops
    const updatedUser: User = {
      ...user,
      waterDrops: (user.waterDrops || 0) + waterDrops
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user water drops:', error);
    return false;
  }
};

/**
 * Updates user avatar
 */
export const updateUserAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user avatar
    const updatedUser: User = {
      ...user,
      avatar: avatarUrl
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return false;
  }
};

/**
 * Updates user daily reward info
 */
export const updateUserDailyReward = async (
  userId: string, 
  lastRewardDate: string, 
  streak: number
): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user daily reward info
    const updatedUser: User = {
      ...user,
      lastDailyReward: lastRewardDate,
      dailyRewardStreak: streak
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user daily reward:', error);
    return false;
  }
};

/**
 * Updates user bet statistics
 */
export const updateUserBetStats = async (userId: string, wonBet: boolean): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // Update user bet stats
    const updatedUser: User = {
      ...user,
      totalBets: (user.totalBets || 0) + 1,
      wonBets: wonBet ? (user.wonBets || 0) + 1 : (user.wonBets || 0)
    };
    
    // Save updated user
    await saveUser(updatedUser);
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user bet stats:', error);
    return false;
  }
};
