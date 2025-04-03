# Meteo Málaga

A weather betting and forecasting application built with React Native and Expo.

## Deployment

This application is configured for deployment on Vercel.

### Deploying to Vercel

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the application:
```bash
npm run deploy
```

Or deploy directly with Vercel CLI:
```bash
vercel
```

## Development

### Running the app locally

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on web
npm run web

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building for production

```bash
# Build for web
npm run build
```

## Project Structure

- `/assets` - Static assets like images
- `/src` - Source code
  - `/components` - Reusable UI components
  - `/context` - React context providers
  - `/screens` - Application screens
  - `/services` - API and service integrations
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions

## Performance Optimizations

The application includes several performance optimizations for web deployment:

- Lazy loading of images
- Preloading of critical resources
- Deferred loading of non-critical JavaScript
- Memoization of expensive calculations
- Debouncing of performance-heavy operations
