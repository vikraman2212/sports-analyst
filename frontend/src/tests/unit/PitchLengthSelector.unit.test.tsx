/**
 * Unit tests for PitchLengthSelector component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PitchLengthSelector } from '@/components/PitchLengthSelector';

describe('PitchLengthSelector', () => {
  it('renders with standard option selected by default', () => {
    render(<PitchLengthSelector />);
    const select = screen.getByLabelText('Select pitch length preset') as HTMLSelectElement;
    expect(select.value).toBe('standard');
  });

  it('calls onChange when switching to youth', () => {
    const onChange = jest.fn();
    render(<PitchLengthSelector onChange={onChange} />);
    const select = screen.getByLabelText('Select pitch length preset') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'youth' } });

    expect(onChange).toHaveBeenCalled();
    const meters = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(meters).toBeCloseTo(16.0, 2);

    // Hint should appear
    expect(screen.getByTestId('pitch-hint')).toBeInTheDocument();
  });

  it('allows entering a custom pitch length', () => {
    const onChange = jest.fn();
    render(<PitchLengthSelector onChange={onChange} />);
    const select = screen.getByLabelText('Select pitch length preset') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'custom' } });

    const input = screen.getByLabelText('Custom pitch length in meters') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '18.5' } });

    const meters = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(meters).toBeCloseTo(18.5, 2);
  });
});
