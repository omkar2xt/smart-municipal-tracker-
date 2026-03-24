"""
GPS Spoof detection service
Implements rule-based detection for spoofed or anomalous GPS locations
No AI/ML - purely algorithmic detection
"""

from typing import Optional, Dict, Any, List
from math import asin, cos, radians, sin, sqrt


def distance_meters(prev_loc: Dict[str, float], curr_loc: Dict[str, float]) -> float:
    """
    Calculate distance between two GPS points using Haversine formula
    
    Args:
        prev_loc: Dictionary with 'latitude' and 'longitude'
        curr_loc: Dictionary with 'latitude' and 'longitude'
        
    Returns:
        Distance in meters
    """
    lat1 = float(prev_loc.get("latitude", 0))
    lon1 = float(prev_loc.get("longitude", 0))
    lat2 = float(curr_loc.get("latitude", 0))
    lon2 = float(curr_loc.get("longitude", 0))

    earth_radius = 6371000.0  # meters
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return earth_radius * c


def calculate_speed_kmh(distance_m: float, delta_seconds: float) -> float:
    """
    Calculate speed in km/h
    
    Args:
        distance_m: Distance in meters
        delta_seconds: Time difference in seconds
        
    Returns:
        Speed in km/h
    """
    if delta_seconds <= 0:
        return 0
    return (distance_m / delta_seconds) * 3.6


class SpoofDetectionService:
    """
    Rule-based GPS spoof detection
    
    Detects:
    1. GPS jumps (impossible distances)
    2. Speed violations (unrealistic speed)
    3. Sensor-movement mismatch (GPS moved but no acceleration)
    4. Stationary mismatch (GPS static but device accelerating)
    """

    # Configuration thresholds
    MAX_SPEED_KMH = 120.0  # Realistic max speed for vehicles
    JUMP_THRESHOLD_M = 500.0  # Flag jumps > 500m
    LOW_ACCELERATION_THRESHOLD = 0.1  # m/s²
    HIGH_ACCELERATION_THRESHOLD = 15.0  # m/s²
    MOVEMENT_THRESHOLD_M = 50.0  # Movement distance in meters
    MIN_STATIONARY_THRESHOLD_M = 10.0  # GPS within 10m = stationary

    def __init__(self, config: Optional[Dict[str, float]] = None):
        """
        Initialize spoof detection service
        
        Args:
            config: Optional configuration dictionary to override defaults
        """
        if config:
            self.MAX_SPEED_KMH = config.get("max_speed_kmh", self.MAX_SPEED_KMH)
            self.JUMP_THRESHOLD_M = config.get("jump_threshold_m", self.JUMP_THRESHOLD_M)
            self.LOW_ACCELERATION_THRESHOLD = config.get("low_accel_threshold", self.LOW_ACCELERATION_THRESHOLD)
            self.HIGH_ACCELERATION_THRESHOLD = config.get("high_accel_threshold", self.HIGH_ACCELERATION_THRESHOLD)

    def detect_gps_jump(self, distance_m: float) -> bool:
        """Detect impossible GPS jumps"""
        return distance_m > self.JUMP_THRESHOLD_M

    def detect_speed_violation(self, speed_kmh: float) -> bool:
        """Detect unrealistic speed"""
        return speed_kmh > self.MAX_SPEED_KMH

    def detect_sensor_movement_mismatch(
        self, distance_m: float, acceleration_magnitude: float
    ) -> bool:
        """
        Detect GPS moved significantly but no acceleration from sensors
        Indicates spoofed GPS while device is stationary
        """
        return (
            distance_m > self.MOVEMENT_THRESHOLD_M
            and acceleration_magnitude < self.LOW_ACCELERATION_THRESHOLD
        )

    def detect_stationary_movement_mismatch(
        self, distance_m: float, acceleration_magnitude: float
    ) -> bool:
        """
        Detect GPS stationary but device is accelerating
        Indicates spoofed GPS while device is actually moving
        """
        return (
            distance_m < self.MIN_STATIONARY_THRESHOLD_M
            and acceleration_magnitude > self.HIGH_ACCELERATION_THRESHOLD
        )

    def detect_location_replay(
        self, current_loc: Dict[str, float],
        location_history: List[Dict[str, float]],
        replay_threshold_m: float = 50.0,
        replay_count: int = 5
    ) -> bool:
        """
        Detect location replay (same location submitted multiple times)
        
        Args:
            current_loc: Current location
            location_history: List of recent locations
            replay_threshold_m: Distance threshold to consider same location
            replay_count: Minimum count in same area to flag
            
        Returns:
            True if replay detected
        """
        if not location_history or len(location_history) < replay_count:
            return False

        # Count how many recent locations are within replay threshold
        count_in_area = 0
        for hist_loc in location_history[-replay_count:]:
            dist = distance_meters(current_loc, hist_loc)
            if dist < replay_threshold_m:
                count_in_area += 1

        return count_in_area >= replay_count - 1

    def analyze_spoof_risk(
        self,
        prev_location: Optional[Dict[str, Any]],
        curr_location: Dict[str, Any],
        accelerometer_magnitude: Optional[float] = None,
        time_delta_seconds: Optional[float] = None,
        location_history: Optional[List[Dict[str, float]]] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive spoof detection analysis
        
        Args:
            prev_location: Previous GPS location
            curr_location: Current GPS location
            accelerometer_magnitude: Magnitude of acceleration (m/s²)
            time_delta_seconds: Time since previous location
            location_history: Recent location history
            
        Returns:
            Dictionary with:
            - is_spoofed: bool
            - risk_level: 'safe', 'warning', 'danger'
            - score: 0-100 risk score
            - detections: list of triggered detections
            - details: detailed analysis
        """
        detections = []
        risk_score = 0
        details = []

        # No previous location = cannot detect spoofing
        if not prev_location:
            return {
                "is_spoofed": False,
                "risk_level": "safe",
                "score": 0,
                "detections": [],
                "details": ["No previous location to compare"]
            }

        # Calculate distance and speed
        distance_m = distance_meters(prev_location, curr_location)
        speed_kmh = 0.0

        if time_delta_seconds and time_delta_seconds > 0:
            speed_kmh = calculate_speed_kmh(distance_m, time_delta_seconds)

        # Detection 1: GPS Jump
        if self.detect_gps_jump(distance_m):
            detections.append("gps_jump")
            risk_score += 40
            details.append(f"Impossible GPS jump: {distance_m:.0f}m")

        # Detection 2: Speed Violation
        if self.detect_speed_violation(speed_kmh):
            detections.append("speed_violation")
            risk_score += 30
            details.append(f"Unrealistic speed: {speed_kmh:.1f} km/h")

        # Detection 3: Sensor-Movement Mismatch
        if accelerometer_magnitude is not None:
            if self.detect_sensor_movement_mismatch(distance_m, accelerometer_magnitude):
                detections.append("sensor_movement_mismatch")
                risk_score += 25
                details.append(f"GPS moved {distance_m:.0f}m but no acceleration")

            # Detection 4: Stationary-Movement Mismatch
            if self.detect_stationary_movement_mismatch(distance_m, accelerometer_magnitude):
                detections.append("stationary_movement_mismatch")
                risk_score += 20
                details.append(f"GPS static but acceleration: {accelerometer_magnitude:.2f} m/s²")

        # Detection 5: Location Replay
        if location_history and self.detect_location_replay(curr_location, location_history):
            detections.append("location_replay")
            risk_score += 35
            details.append("Location replay pattern detected")

        # Cap risk score at 100
        risk_score = min(risk_score, 100)

        # Determine risk level
        if risk_score >= 50:
            risk_level = "danger"
            is_spoofed = True
        elif risk_score >= 25:
            risk_level = "warning"
            is_spoofed = False
        else:
            risk_level = "safe"
            is_spoofed = False

        return {
            "is_spoofed": is_spoofed,
            "risk_level": risk_level,
            "score": risk_score,
            "detections": detections,
            "details": details,
            "distance_m": distance_m,
            "speed_kmh": speed_kmh,
            "acceleration_m_s2": accelerometer_magnitude
        }

    def quick_spoof_check(
        self,
        prev_location: Optional[Dict[str, float]],
        curr_location: Dict[str, float],
        accelerometer_magnitude: Optional[float] = None
    ) -> bool:
        """
        Quick spoof check (for continuous background tracking)
        Returns True if location is likely spoofed
        """
        if not prev_location:
            return False

        distance_m = distance_meters(prev_location, curr_location)

        # Simple checks
        if distance_m > self.JUMP_THRESHOLD_M:
            return True

        if accelerometer_magnitude is not None:
            if self.detect_sensor_movement_mismatch(distance_m, accelerometer_magnitude):
                return True

        return False


def analyze_location_anomaly(
    prev_loc: Optional[Dict[str, float]],
    curr_loc: Dict[str, float],
    delta_seconds: float,
    accelerometer_magnitude: Optional[float] = None,
    jump_threshold_m: float = 500.0,
    max_speed_kmh: float = 120.0,
) -> Dict[str, Any]:
    """Analyze a location sample for simple anomaly patterns.

    Returns a compact payload used by bulk sync logic.
    """
    if not prev_loc:
        return {
            "anomaly_detected": False,
            "reason": None,
            "distance_m": 0.0,
            "speed_kmh": 0.0,
        }

    reasons: List[str] = []
    dist_m = distance_meters(prev_loc, curr_loc)
    speed_kmh = calculate_speed_kmh(dist_m, delta_seconds)

    if dist_m > jump_threshold_m:
        reasons.append("gps_jump")

    if speed_kmh > max_speed_kmh:
        reasons.append("speed_threshold")

    if accelerometer_magnitude is not None:
        movement = abs(float(accelerometer_magnitude) - 1.0)
        if dist_m > 30 and movement < 0.1:
            reasons.append("movement_mismatch")

    return {
        "anomaly_detected": len(reasons) > 0,
        "reason": ",".join(reasons) if reasons else None,
        "distance_m": dist_m,
        "speed_kmh": speed_kmh,
    }
