/**
 * Utility functions to optimize web performance
 */

// Lazy load images that are not in the viewport
export const lazyLoadImages = (): void => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.removeAttribute('data-src');
            imageObserver.unobserve(lazyImage);
          }
        }
      });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img: Element) => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.dataset.src) {
        imgElement.src = imgElement.dataset.src;
        imgElement.removeAttribute('data-src');
      }
    });
  }
};

// Defer non-critical JavaScript
export const deferNonCriticalJS = (scriptUrl: string): void => {
  if (typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.defer = true;
    document.body.appendChild(script);
  }
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]): void => {
  if (typeof document !== 'undefined') {
    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.js') ? 'script' : 
                resource.endsWith('.css') ? 'style' : 
                resource.endsWith('.png') || resource.endsWith('.jpg') || resource.endsWith('.jpeg') ? 'image' : 
                'fetch';
      document.head.appendChild(link);
    });
  }
};

// Memoize expensive calculations
export function memoize<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
  const cache = new Map();
  return (...args: any[]): T => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Debounce function for performance-heavy operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
