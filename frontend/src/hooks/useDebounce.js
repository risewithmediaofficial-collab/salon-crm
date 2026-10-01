import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapidly changing values (search queries, filters)
 * @param {any} value
 * @param {number} delay in ms
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
