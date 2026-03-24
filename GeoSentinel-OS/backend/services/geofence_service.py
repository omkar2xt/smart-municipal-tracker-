"""
Geofence service for validating if users are within allowed areas
Supports both polygon and circular geofences
"""

from copy import deepcopy
from typing import Dict, List, Optional, Tuple
from utils.helpers import calculate_distance


def point_in_polygon(latitude: float, longitude: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Ray-casting algorithm for polygon containment check
    
    Args:
        latitude: Point latitude
        longitude: Point longitude
        polygon: List of (lat, lon) tuples forming polygon
        
    Returns:
        True if point is inside polygon
    """
    inside = False
    j = len(polygon) - 1

    for i in range(len(polygon)):
        yi, xi = polygon[i]
        yj, xj = polygon[j]

        intersects = ((xi > longitude) != (xj > longitude)) and (
            latitude < (yj - yi) * (longitude - xi) / ((xj - xi) or 1e-12) + yi
        )
        if intersects:
            inside = not inside
        j = i

    return inside


def point_in_circle(latitude: float, longitude: float, center_lat: float, center_lon: float, radius_km: float) -> bool:
    """
    Check if point is inside circular geofence
    
    Args:
        latitude: Point latitude
        longitude: Point longitude
        center_lat: Circle center latitude
        center_lon: Circle center longitude
        radius_km: Radius in kilometers
        
    Returns:
        True if point is inside circle
    """
    distance = calculate_distance(latitude, longitude, center_lat, center_lon)
    return distance <= radius_km


class GeofenceService:
    """Geofence validator supporting both polygon and circular boundaries"""

    # Default geofences for Pune district
    DEFAULT_GEOFENCES: Dict[str, dict] = {
        "pune_taluka": {
            "type": "polygon",
            "coordinates": [
                (18.3174, 73.8620),
                (18.3215, 73.8941),
                (18.5495, 73.8941),
                (18.5495, 73.8620),
            ]
        },
        "baner_balewadi": {
            "type": "circle",
            "center": (18.5620, 73.8060),
            "radius_km": 2.0
        },
        "aundh_market": {
            "type": "circle",
            "center": (18.5589, 73.7987),
            "radius_km": 1.5
        }
    }

    def __init__(self, geofences: Optional[Dict[str, dict]] = None):
        """
        Initialize geofence service
        
        Args:
            geofences: Dictionary of geofence definitions. If None, uses defaults.
        """
        self.geofences = deepcopy(geofences) if geofences is not None else deepcopy(self.DEFAULT_GEOFENCES)

    def is_inside(self, geofence_id: str, latitude: float, longitude: float) -> bool:
        """
        Check if point is inside a geofence
        
        Args:
            geofence_id: ID of geofence to check
            latitude: Point latitude
            longitude: Point longitude
            
        Returns:
            True if inside geofence, False otherwise
        """
        if geofence_id not in self.geofences:
            return False

        geofence = self.geofences[geofence_id]
        geofence_type = geofence.get("type", "polygon")

        if geofence_type == "polygon":
            coordinates = geofence.get("coordinates", [])
            return point_in_polygon(latitude, longitude, coordinates)
        
        elif geofence_type == "circle":
            center = geofence.get("center")
            radius = geofence.get("radius_km", 1.0)
            if center:
                return point_in_circle(latitude, longitude, center[0], center[1], radius)
            return False
        
        return False

    def validate_against_all(self, latitude: float, longitude: float) -> Dict[str, bool]:
        """
        Check point against all geofences
        
        Args:
            latitude: Point latitude
            longitude: Point longitude
            
        Returns:
            Dictionary with geofence_id -> is_inside mapping
        """
        results = {}
        for geofence_id in self.geofences:
            results[geofence_id] = self.is_inside(geofence_id, latitude, longitude)
        return results

    def add_geofence(self, geofence_id: str, geofence_config: dict):
        """Add or update a geofence"""
        self.geofences[geofence_id] = geofence_config

    def remove_geofence(self, geofence_id: str):
        """Remove a geofence"""
        if geofence_id in self.geofences:
            del self.geofences[geofence_id]

    def get_geofence(self, geofence_id: str) -> Optional[dict]:
        """Get geofence configuration"""
        return self.geofences.get(geofence_id)
