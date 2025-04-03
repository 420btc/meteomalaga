#!/bin/bash

# Script para resetear la caché de Expo/Metro

echo "🧹 Limpiando caché de Metro..."
npx react-native start --reset-cache

echo "🧹 Limpiando caché de Expo..."
npx expo start -c

echo "✅ Caché limpiada. Ahora puedes ejecutar 'npm start' para iniciar la aplicación."
