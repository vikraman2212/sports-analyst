"""
Unit tests for speed calculation module.

This test validates that pixel-based trajectory points can be converted
to real-world speed (km/h) using calibration data.

Expected to FAIL until speed_calc module is implemented.
"""

import pytest
from speedometer import speed_calc


class TestSpeedCalculation:
    """Tests for speed calculation from trajectory points."""
    
    def test_calculate_speed_with_known_trajectory(self):
        """Test speed calculation with synthetic trajectory data."""
        # Synthetic trajectory: ball moving 10 meters (pitch pitch is 20.12m)
        # Calibration: 22 yards (20.12m) = 500 pixels
        # Ball travels 250 pixels in 0.5 seconds
        # Expected: (250 pixels / 500 pixels) * 20.12m = 10.06m
        # Speed: 10.06m / 0.5s = 20.12 m/s = 72.43 km/h
        
        trajectory_points = [
            {'pixel_x': 100, 'pixel_y': 200, 'timestamp_ms': 0},
            {'pixel_x': 150, 'pixel_y': 250, 'timestamp_ms': 100},
            {'pixel_x': 200, 'pixel_y': 300, 'timestamp_ms': 200},
            {'pixel_x': 250, 'pixel_y': 350, 'timestamp_ms': 300},
            {'pixel_x': 300, 'pixel_y': 400, 'timestamp_ms': 400},
            {'pixel_x': 350, 'pixel_y': 450, 'timestamp_ms': 500},
        ]
        
        calibration = {
            'pitch_length_pixels': 500,
            'reference_distance_meters': 20.12,  # 22 yards
        }
        
        # This will fail until speed_calc.calculate_speed is implemented
        speed_kmh = speed_calc.calculate_speed(trajectory_points, calibration)
        
        # Allow 5% tolerance per requirements
        expected_speed = 72.43
        tolerance = expected_speed * 0.05
        assert abs(speed_kmh - expected_speed) <= tolerance
    
    def test_calculate_speed_fast_delivery(self):
        """Test speed calculation for a fast bowler (~140 km/h)."""
        # Fast bowler: 140 km/h ≈ 38.89 m/s
        # Distance covered in 0.6s: 23.33m (longer than pitch, includes release point)
        # Calibration: 20.12m = 500 pixels
        # Expected pixels: (23.33 / 20.12) * 500 ≈ 580 pixels
        
        trajectory_points = [
            {'pixel_x': 50, 'pixel_y': 100, 'timestamp_ms': 0},
            {'pixel_x': 150, 'pixel_y': 200, 'timestamp_ms': 100},
            {'pixel_x': 250, 'pixel_y': 300, 'timestamp_ms': 200},
            {'pixel_x': 350, 'pixel_y': 400, 'timestamp_ms': 300},
            {'pixel_x': 450, 'pixel_y': 500, 'timestamp_ms': 400},
            {'pixel_x': 550, 'pixel_y': 600, 'timestamp_ms': 500},
            {'pixel_x': 630, 'pixel_y': 680, 'timestamp_ms': 600},
        ]
        
        calibration = {
            'pitch_length_pixels': 500,
            'reference_distance_meters': 20.12,
        }
        
        speed_kmh = speed_calc.calculate_speed(trajectory_points, calibration)
        
        expected_speed = 140
        tolerance = expected_speed * 0.05  # ±5%
        assert abs(speed_kmh - expected_speed) <= tolerance
    
    def test_calculate_speed_slow_delivery(self):
        """Test speed calculation for a slow bowler (~80 km/h)."""
        # Slow bowler: 80 km/h ≈ 22.22 m/s
        # Distance in 0.8s: 17.78m
        # Pixels: (17.78 / 20.12) * 500 ≈ 442 pixels
        
        trajectory_points = [
            {'pixel_x': 100, 'pixel_y': 150, 'timestamp_ms': 0},
            {'pixel_x': 150, 'pixel_y': 200, 'timestamp_ms': 200},
            {'pixel_x': 250, 'pixel_y': 300, 'timestamp_ms': 400},
            {'pixel_x': 350, 'pixel_y': 400, 'timestamp_ms': 600},
            {'pixel_x': 542, 'pixel_y': 592, 'timestamp_ms': 800},  # Fixed: 542-100=442 pixels
        ]
        
        calibration = {
            'pitch_length_pixels': 500,
            'reference_distance_meters': 20.12,
        }
        
        speed_kmh = speed_calc.calculate_speed(trajectory_points, calibration)
        
        expected_speed = 80
        tolerance = expected_speed * 0.05
        assert abs(speed_kmh - expected_speed) <= tolerance
    
    def test_insufficient_trajectory_points(self):
        """Test error handling for insufficient trajectory points."""
        trajectory_points = [
            {'pixel_x': 100, 'pixel_y': 200, 'timestamp_ms': 0},
        ]
        
        calibration = {
            'pitch_length_pixels': 500,
            'reference_distance_meters': 20.12,
        }
        
        # Should raise ValueError for insufficient points
        with pytest.raises(ValueError, match="insufficient|at least"):
            speed_calc.calculate_speed(trajectory_points, calibration)
    
    def test_invalid_calibration(self):
        """Test error handling for invalid calibration data."""
        trajectory_points = [
            {'pixel_x': 100, 'pixel_y': 200, 'timestamp_ms': 0},
            {'pixel_x': 200, 'pixel_y': 300, 'timestamp_ms': 100},
        ]
        
        invalid_calibration = {
            'pitch_length_pixels': 0,  # Invalid
            'reference_distance_meters': 20.12,
        }
        
        with pytest.raises(ValueError, match="calibration|invalid"):
            speed_calc.calculate_speed(trajectory_points, invalid_calibration)
    
    def test_zero_time_duration(self):
        """Test error handling when all points have same timestamp."""
        trajectory_points = [
            {'pixel_x': 100, 'pixel_y': 200, 'timestamp_ms': 0},
            {'pixel_x': 200, 'pixel_y': 300, 'timestamp_ms': 0},
            {'pixel_x': 300, 'pixel_y': 400, 'timestamp_ms': 0},
        ]
        
        calibration = {
            'pitch_length_pixels': 500,
            'reference_distance_meters': 20.12,
        }
        
        # Should raise ValueError for zero time duration
        with pytest.raises(ValueError, match="duration|time"):
            speed_calc.calculate_speed(trajectory_points, calibration)

import pytest


def test_placeholder():
    """Placeholder test to verify pytest setup works."""
    assert True
