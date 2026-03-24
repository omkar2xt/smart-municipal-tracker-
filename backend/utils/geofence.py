import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance (in metres) between two GPS coordinates
    using the Haversine formula.
    """
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_within_zone(lat, lon, zone_lat, zone_lon, radius_metres):
    """Return True if the coordinate (lat, lon) is within the circular zone."""
    distance = haversine_distance(lat, lon, zone_lat, zone_lon)
    return distance <= radius_metres, distance
