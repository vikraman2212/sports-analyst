"""
Speed calculation module for cricket ball tracking.

This module provides functions to calculate ball speed from trajectory points
using calibration data to convert pixel distances to real-world meters.
"""

import math
from typing import Dict, List, Any


def calculate_speed(
    trajectory_points: List[Dict[str, Any]],
    calibration: Dict[str, float]
) -> float:
    """
    Calculate ball speed in km/h from trajectory points.
    
    Uses straight-line distance from first to last detection point.
    
    Args:
        trajectory_points: List of dictionaries with keys:
            - pixel_x: X coordinate in pixels
            - pixel_y: Y coordinate in pixels
            - timestamp_ms: Timestamp in milliseconds
        calibration: Dictionary with keys:
            - pitch_length_pixels: Length of cricket pitch in pixels
            - reference_distance_meters: Reference distance in meters (22 yards = 20.12m)
    
    Returns:
        Speed in km/h
    
    Raises:
        ValueError: If trajectory points are insufficient or invalid
        ValueError: If calibration data is invalid
        ValueError: If time duration is zero
    """
    # Validate calibration
    if not calibration:
        raise ValueError("Calibration data is required and cannot be None")
    
    pitch_length_pixels = calibration.get('pitch_length_pixels')
    reference_distance_meters = calibration.get('reference_distance_meters')
    
    if pitch_length_pixels is None or reference_distance_meters is None:
        raise ValueError("Calibration must include pitch_length_pixels and reference_distance_meters")
    
    if pitch_length_pixels <= 0:
        raise ValueError("Calibration invalid: pitch_length_pixels must be positive")
    
    if reference_distance_meters <= 0:
        raise ValueError("Calibration invalid: reference_distance_meters must be positive")
    
    # Validate trajectory points
    if not trajectory_points:
        raise ValueError("Trajectory points are required - at least 2 points needed")
    
    if len(trajectory_points) < 2:
        raise ValueError("Insufficient trajectory points - at least 2 points needed for speed calculation")
    
    # Calculate pixels per meter ratio
    pixels_per_meter = pitch_length_pixels / reference_distance_meters
    
    # Get first and last points
    first_point = trajectory_points[0]
    last_point = trajectory_points[-1]
    
    # Calculate distance along X-axis (pitch length direction)
    # For cricket, the primary motion is along the pitch, so we use X displacement
    dx = abs(last_point['pixel_x'] - first_point['pixel_x'])
    distance_pixels = dx
    
    # Convert distance from pixels to meters
    distance_meters = distance_pixels / pixels_per_meter
    
    # Calculate time duration
    time_duration_ms = last_point['timestamp_ms'] - first_point['timestamp_ms']
    
    if time_duration_ms <= 0:
        raise ValueError("Time duration must be positive - all points have the same timestamp")
    
    # Convert time from milliseconds to seconds
    time_duration_seconds = time_duration_ms / 1000.0
    
    # Calculate speed in meters per second
    speed_mps = distance_meters / time_duration_seconds
    
    # Convert to km/h (multiply by 3.6)
    speed_kmh = speed_mps * 3.6
    
    return speed_kmh


def calculate_average_speed(
    trajectory_points: List[Dict[str, Any]],
    calibration: Dict[str, float]
) -> float:
    """
    Calculate average speed using straight-line distance (faster, less accurate).
    
    Args:
        trajectory_points: List of trajectory point dictionaries
        calibration: Calibration dictionary
    
    Returns:
        Average speed in km/h
    """
    # Validate inputs
    if not trajectory_points or len(trajectory_points) < 2:
        raise ValueError("At least 2 trajectory points required")
    
    pitch_length_pixels = calibration.get('pitch_length_pixels')
    reference_distance_meters = calibration.get('reference_distance_meters')
    
    if not pitch_length_pixels or not reference_distance_meters:
        raise ValueError("Invalid calibration data")
    
    pixels_per_meter = pitch_length_pixels / reference_distance_meters
    
    # Calculate straight-line distance from first to last point
    first_point = trajectory_points[0]
    last_point = trajectory_points[-1]
    
    dx = last_point['pixel_x'] - first_point['pixel_x']
    dy = last_point['pixel_y'] - first_point['pixel_y']
    
    distance_pixels = math.sqrt(dx * dx + dy * dy)
    distance_meters = distance_pixels / pixels_per_meter
    
    # Calculate time duration
    time_duration_ms = last_point['timestamp_ms'] - first_point['timestamp_ms']
    
    if time_duration_ms <= 0:
        raise ValueError("Time duration must be positive")
    
    time_duration_seconds = time_duration_ms / 1000.0
    
    # Calculate speed
    speed_mps = distance_meters / time_duration_seconds
    speed_kmh = speed_mps * 3.6
    
    return speed_kmh
