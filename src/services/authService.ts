import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Constants
const USERS_STORAGE_KEY = 'auth_users';
const CURRENT_USER_KEY = 'auth_current_user';
const SAVED_CREDENTIALS_KEY = 'auth_saved_credentials';
const AUTH_STATE_KEY = 'auth_state';

// User interface
export interface User {
  username: string;
  passwordHash: string;
  userId: string;
  createdAt: string;
  displayName?: string;
  email?: string;
  role?: string;
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
    const users = await getUsers();
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
      return {
        success: false,
        message: 'El nombre de usuario ya existe. Por favor, elige otro.'
      };
    }

    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create new user
    const newUser: User = {
      username,
      passwordHash,
      userId,
      createdAt: new Date().toISOString(),
      displayName: username // Set displayName same as username initially
    };
    
    // Add user to storage
    await saveUser(newUser);
    
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
    // Get all users
    const users = await getUsers();
    
    // Find user by username (case insensitive)
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
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
    
    // Verify user exists in users list
    const users = await getUsers();
    const existingUser = users.find(u => u.userId === user.userId);
    
    if (!existingUser) {
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
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      // Don't allow these to be updated
      userId: users[userIndex].userId,
      createdAt: users[userIndex].createdAt
    };
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // If this is the current user, update current user as well
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      await setCurrentUser(users[userIndex]);
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
    
    // Limit to last 99 users for scalability (increased from 20)
    const limitedCredentials = savedCredentials
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 99);
    
    // Save to storage
    await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(limitedCredentials));
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
      // Check if user already exists
      const existingIndex = updatedUsers.findIndex(u => 
        u.userId === user.userId || 
        u.username.toLowerCase() === user.username.toLowerCase()
      );
      
      if (existingIndex === -1) {
        // Add new user
        updatedUsers.push({
          ...user,
          passwordHash,
          createdAt: user.createdAt || new Date().toISOString()
        });
        importedCount++;
      }
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
    const existingUsers = await getUsers();
    const passwordHash = await hashPassword(defaultPassword);
    
    let registeredCount = 0;
    const updatedUsers = [...existingUsers];
    
    for (const username of usernames) {
      // Skip empty usernames
      if (!username.trim()) continue;
      
      // Check if username already exists
      if (updatedUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        continue;
      }
      
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create new user
      const newUser: User = {
        username,
        passwordHash,
        userId,
        createdAt: new Date().toISOString(),
        displayName: username
      };
      
      updatedUsers.push(newUser);
      registeredCount++;
    }
    
    // Save all users
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
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
