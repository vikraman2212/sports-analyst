/**
 * Unit Tests: BallWeightSelector Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BallWeightSelector } from '@/components/BallWeightSelector';
import { YOUTH_GRAMS } from '@/hooks/useBallWeight';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('BallWeightSelector', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders with standard mode by default', () => {
    render(<BallWeightSelector />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    expect(select).toHaveValue('standard');
    expect(screen.getByText(/Standard – 156g/)).toBeInTheDocument();
  });

  it('switches to youth mode and displays correct weight', () => {
    const onChange = jest.fn();
    render(<BallWeightSelector onChange={onChange} />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'youth' } });
    
    expect(select).toHaveValue('youth');
    expect(onChange).toHaveBeenCalledWith(YOUTH_GRAMS);
  });

  it('switches to custom mode and allows input', () => {
    const onChange = jest.fn();
    render(<BallWeightSelector onChange={onChange} />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'custom' } });
    
    expect(select).toHaveValue('custom');
    
    const input = screen.getByRole('spinbutton', { name: /custom ball weight in grams/i });
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: '140' } });
    expect(onChange).toHaveBeenCalledWith(140);
  });

  it('clamps custom weight to min/max bounds', () => {
    const onChange = jest.fn();
    render(<BallWeightSelector onChange={onChange} />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByRole('spinbutton', { name: /custom ball weight in grams/i });
    
    // Test min bound
    fireEvent.change(input, { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith(50); // Clamped to min
    
    // Test max bound
    fireEvent.change(input, { target: { value: '400' } });
    expect(onChange).toHaveBeenCalledWith(300); // Clamped to max
  });

  it('displays hint banner when weight changes', () => {
    render(<BallWeightSelector />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'youth' } });
    
    const hint = screen.getByTestId('ball-weight-hint');
    expect(hint).toHaveTextContent(/Youth\/Women's/);
    expect(hint).toHaveTextContent(/135g/);
  });

  it('dismisses hint when close button clicked', () => {
    render(<BallWeightSelector />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'youth' } });
    
    const hint = screen.getByTestId('ball-weight-hint');
    const dismissBtn = screen.getByRole('button', { name: /dismiss ball weight hint/i });
    
    fireEvent.click(dismissBtn);
    expect(hint).not.toBeInTheDocument();
  });

  it('persists selection in localStorage', () => {
    render(<BallWeightSelector />);
    
    const select = screen.getByRole('combobox', { name: /select ball weight preset/i });
    fireEvent.change(select, { target: { value: 'youth' } });
    
    const stored = JSON.parse(localStorageMock.getItem('speedometer.ball.mode') || '""');
    expect(stored).toBe('youth');
  });
});
