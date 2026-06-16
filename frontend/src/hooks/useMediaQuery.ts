import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

/**
 * Custom hook for responsive design using CSS media queries
 * @param query - CSS media query string
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', onStoreChange);

    return () => {
      mediaQuery.removeEventListener('change', onStoreChange);
    };
  }, [query]);

  const getSnapshot = useCallback(() => {
    return typeof window !== 'undefined' && window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;
