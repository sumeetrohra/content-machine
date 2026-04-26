import { useState } from 'react';

type TUseExampleOptions = {
  initialValue?: string;
};

type TUseExampleReturn = {
  value: string;
  setValue: (value: string) => void;
  isEmpty: boolean;
  reset: () => void;
};

/**
 * A sample custom hook demonstrating the pattern for creating hooks.
 *
 * Custom hooks should:
 * - Start with "use" prefix
 * - Accept an options object for configuration
 * - Return a typed object (not a tuple) for better readability
 * - Encapsulate related state and logic
 */
export const useExample = (
  options: TUseExampleOptions = {},
): TUseExampleReturn => {
  const { initialValue = '' } = options;
  const [value, setValue] = useState(initialValue);

  const isEmpty = value.trim().length === 0;

  const reset = () => {
    setValue(initialValue);
  };

  return {
    value,
    setValue,
    isEmpty,
    reset,
  };
};
