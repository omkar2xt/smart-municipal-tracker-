"""
Helper utilities for common operations
"""

from datetime import datetime
from typing import List, Tuple, Optional
import math


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    
    Args:
        lat1, lon1: First coordinate (latitude, longitude)
        lat2, lon2: Second coordinate (latitude, longitude)
        
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance


def calculate_speed(
    lat1: float, lon1: float, lat2: float, lon2: float,
    time1: datetime, time2: datetime
) -> float:
    """
    Calculate speed between two GPS points
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
        time1: First timestamp
        time2: Second timestamp
        
    Returns:
        Speed in km/h
    """
    distance = calculate_distance(lat1, lon1, lat2, lon2)
    time_diff = (time2 - time1).total_seconds() / 3600  # Convert to hours
    
    if time_diff == 0:
        return 0
    
    speed = distance / time_diff
    return speed


def point_in_polygon(lat: float, lon: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Check if a point is inside a polygon using ray casting algorithm
    
    Args:
        lat, lon: Point coordinates
        polygon: List of (lat, lon) tuples forming polygon
        
    Returns:
        True if point is inside polygon, False otherwise
    """
    x, y = lon, lat
    
    inside = False
    p1x, p1y = polygon[0]
    p1x, p1y = p1x, p1y
    
    for i in range(1, len(polygon)):
        p2x, p2y = polygon[i]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside


def get_timestamp() -> datetime:
    """Get current UTC timestamp"""
    return datetime.utcnow()


def format_timestamp(dt: datetime) -> str:
    """Format datetime to ISO format string"""
    return dt.isoformat() if dt else None
