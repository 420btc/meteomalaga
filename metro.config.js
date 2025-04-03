// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Create a custom middleware to handle %PUBLIC_URL% replacement
const createPublicUrlMiddleware = () => {
  return (req, res, next) => {
    const originalUrl = req.url;
    
    // Replace %PUBLIC_URL% with empty string in the URL
    if (originalUrl.includes('%PUBLIC_URL%')) {
      req.url = originalUrl.replace(/%PUBLIC_URL%\//g, '');
    }
    
    // Continue to the next middleware
    next();
  };
};

// Create a custom middleware to serve the index.html with replaced %PUBLIC_URL%
const createIndexHtmlMiddleware = () => {
  return (req, res, next) => {
    if (req.url === '/' || req.url === '/index.html') {
      const indexPath = path.join(__dirname, 'web', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Replace %PUBLIC_URL% with empty string in the content
        content = content.replace(/%PUBLIC_URL%\//g, '');
        
        res.setHeader('Content-Type', 'text/html');
        res.end(content);
        return;
      }
    }
    
    // Continue to the next middleware
    next();
  };
};

const config = getDefaultConfig(__dirname);

// Add polyfills for node.js core modules
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('stream-browserify'),
  'buffer': require.resolve('buffer'),
  'http': require.resolve('stream-http'),
  'https': require.resolve('https-browserify'),
  'path': require.resolve('path-browserify'),
  'util': require.resolve('util/'),
  'process': require.resolve('process/browser'),
  'os': require.resolve('os-browserify/browser'),
  'zlib': require.resolve('browserify-zlib'),
  'vm': false,
  'fs': false,
  'net': false,
  'tls': false,
  'child_process': false,
};

// Add the web folder to watch folders
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'web')
];

// Configure the server middleware to handle %PUBLIC_URL%
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    // Handle %PUBLIC_URL% in paths
    if (req.url && req.url.includes('%PUBLIC_URL%')) {
      req.url = req.url.replace(/%PUBLIC_URL%/g, '');
    }
    
    // Serve files from web directory
    if (req.url && !req.url.includes('__webpack') && !req.url.includes('hot-update')) {
      const webPath = path.join(__dirname, 'web', req.url);
      if (fs.existsSync(webPath) && fs.statSync(webPath).isFile()) {
        // Use fs.readFile instead of res.sendFile since sendFile is not available
        fs.readFile(webPath, (err, data) => {
          if (err) {
            next();
            return;
          }
          
          // Set appropriate content type based on file extension
          const ext = path.extname(webPath).toLowerCase();
          let contentType = 'text/plain';
          
          if (ext === '.html') contentType = 'text/html';
          else if (ext === '.css') contentType = 'text/css';
          else if (ext === '.js') contentType = 'application/javascript';
          else if (ext === '.json') contentType = 'application/json';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          else if (ext === '.ico') contentType = 'image/x-icon';
          
          res.setHeader('Content-Type', contentType);
          res.end(data);
        });
        return;
      }
    }
    
    return middleware(req, res, next);
  };
};

// Configure the transformer to include web-specific options
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

module.exports = config;
