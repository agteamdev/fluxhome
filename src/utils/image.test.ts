import { describe, expect, it } from 'vitest';
import { fitWithin } from './image';

describe('fitWithin', () => {
  it('scales a large picture down keeping the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 2000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 6000, 2000, 2000)).toEqual({ width: 1000, height: 2000 });
  });
  it('never scales a small picture up', () => {
    expect(fitWithin(800, 600, 2000, 2000)).toEqual({ width: 800, height: 600 });
  });
  it('never returns a zero size', () => {
    expect(fitWithin(5000, 1, 100, 100)).toEqual({ width: 100, height: 1 });
  });
});
