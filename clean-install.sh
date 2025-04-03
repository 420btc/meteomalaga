#!/bin/bash

# Script para limpiar y reinstalar dependencias

echo "🧹 Limpiando node_modules..."
rm -rf node_modules

echo "🧹 Limpiando caché de npm..."
npm cache clean --force

echo "🧹 Limpiando caché de Expo..."
npx expo-doctor --fix-dependencies

echo "📦 Reinstalando dependencias..."
npm install

echo "✅ Instalación completada. Ahora puedes ejecutar 'npm start' o 'npm run tunnel' para iniciar la aplicación."
