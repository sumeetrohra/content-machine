import { describe, it, expect } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-2', 'text-sm', 'font-bold')).toBe('px-2 text-sm font-bold');
  });

  it('resolves conflicting Tailwind classes via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('skips falsy values', () => {
    expect(cn('block', undefined, null, false, 'text-red-500')).toBe(
      'block text-red-500',
    );
  });
});
