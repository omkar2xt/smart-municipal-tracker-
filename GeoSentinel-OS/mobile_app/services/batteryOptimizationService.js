import * as Battery from "expo-battery";
import * as Location from "expo-location";

/**
 * Battery optimization strategies
 * Adapts tracking behavior based on battery level
 */

const BATTERY_THRESHOLDS = {
  CRITICAL: 10, // Below 10%
  LOW: 20, // Below 20%
  MEDIUM: 50, // Below 50%
  NORMAL: 100,
};

/**
 * Get current battery level and charging status
 */
export const getBatteryStatus = async () => {
  try {
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();

    return {
      level: Math.round(level * 100),
      state,
      isCharging: state === Battery.BatteryState.CHARGING,
      isLow: level * 100 < BATTERY_THRESHOLDS.LOW,
      isCritical: level * 100 < BATTERY_THRESHOLDS.CRITICAL,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get battery status:", error);
    return {
      level: 100,
      state: "unknown",
      error: error.message,
    };
  }
};

/**
 * Get optimized location accuracy based on battery
 */
export const getOptimizedLocationAccuracy = async () => {
  try {
    const battery = await getBatteryStatus();

    switch (true) {
      case battery.isCritical:
        return {
          accuracy: Location.Accuracy.Low,
          level: "critical",
          description: "Lowest accuracy, minimum power",
          timeInterval: 60000, // 60 seconds
          distanceInterval: 50, // 50 meters
          reason: "Critical battery level",
        };

      case battery.isLow:
        return {
          accuracy: Location.Accuracy.Balanced,
          level: "low",
          description: "Balanced accuracy and power",
          timeInterval: 30000, // 30 seconds
          distanceInterval: 25, // 25 meters
          reason: "Low battery level",
        };

      case battery.level < BATTERY_THRESHOLDS.MEDIUM:
        return {
          accuracy: Location.Accuracy.High,
          level: "medium",
          description: "Good accuracy with power saving",
          timeInterval: 15000, // 15 seconds
          distanceInterval: 10, // 10 meters
          reason: "Medium battery level",
        };

      default:
        return {
          accuracy: Location.Accuracy.Highest,
          level: "normal",
          description: "Maximum accuracy",
          timeInterval: 5000, // 5 seconds
          distanceInterval: 5, // 5 meters
          reason: "Good battery level",
        };
    }
  } catch (error) {
    console.error("Failed to get optimized accuracy:", error);
    return {
      accuracy: Location.Accuracy.Balanced,
      level: "unknown",
      timeInterval: 30000,
      distanceInterval: 25,
      description: "Fallback accuracy",
    };
  }
};

/**
 * Watch battery level changes
 */
export const watchBatteryLevel = (onBatteryChange) => {
  try {
    // Battery API doesn't support listeners, use polling
    const interval = setInterval(async () => {
      const status = await getBatteryStatus();
      if (onBatteryChange) {
        onBatteryChange(status);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  } catch (error) {
    console.error("Failed to watch battery level:", error);
    return () => {};
  }
};

/**
 * Get battery optimization recommendations
 */
export const getBatteryRecommendations = async () => {
  try {
    const battery = await getBatteryStatus();
    const recommendations = [];

    if (battery.isCritical) {
      recommendations.push({
        severity: "critical",
        message: "Battery critically low. Consider charging immediately.",
        action: "STOP_TRACKING",
      });
      recommendations.push({
        severity: "critical",
        message: "Disable background location tracking",
        action: "DISABLE_BACKGROUND",
      });
    } else if (battery.isLow) {
      recommendations.push({
        severity: "warning",
        message: "Battery low. Reduce tracking frequency.",
        action: "REDUCE_FREQUENCY",
      });
      recommendations.push({
        severity: "warning",
        message: "Consider reducing WiFi scanning",
        action: "DISABLE_WIFI_SCAN",
      });
    } else if (battery.level < BATTERY_THRESHOLDS.MEDIUM) {
      recommendations.push({
        severity: "info",
        message: "Battery moderate. Tracking efficiency optimized.",
        action: "OPTIMIZE_ACCURACY",
      });
    }

    if (!battery.isCharging && battery.level < 50) {
      recommendations.push({
        severity: "info",
        message: "Plug in charger when possible for full functionality",
        action: "CHARGE_DEVICE",
      });
    }

    return {
      batteryLevel: battery.level,
      isCharging: battery.isCharging,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get battery recommendations:", error);
    return {
      error: error.message,
      recommendations: [],
    };
  }
};

/**
 * Calculate power consumption estimate for tracking
 */
export const estimatePowerConsumption = async (trackingDuration = 3600) => {
  try {
    const battery = await getBatteryStatus();
    const accuracy = await getOptimizedLocationAccuracy();

    // Rough power consumption estimates (mW)
    const baselineConsumption = 100; // Base device consumption
    const gpsConsumption = accuracy.level === "normal" ? 400 : 200;
    const sensorConsumption = 50;
    const wifiConsumption = 100;
    const bluetoothConsumption = 50;

    const totalConsumption = baselineConsumption + gpsConsumption + sensorConsumption + wifiConsumption + bluetoothConsumption;

    // Estimate battery drain
    const batteryCapacityMah = 3000; // Typical smartphone
    const estimatedDrainPercent = (totalConsumption * trackingDuration) / (batteryCapacityMah * 3600) * 100;

    const estimatedTime = {
      hours: Math.floor((battery.level / estimatedDrainPercent) * (trackingDuration / 3600)),
      minutes: Math.floor(((battery.level / estimatedDrainPercent) * (trackingDuration / 3600) % 1) * 60),
    };

    return {
      batteryLevel: battery.level,
      powerConsumption: {
        baseline: baselineConsumption,
        gps: gpsConsumption,
        sensors: sensorConsumption,
        wifi: wifiConsumption,
        bluetooth: bluetoothConsumption,
        total: totalConsumption,
      },
      estimatedDrainPercent: estimatedDrainPercent.toFixed(2),
      estimatedOperatingTime: estimatedTime,
      accuracy: accuracy.level,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to estimate power consumption:", error);
    return {
      error: error.message,
    };
  }
};

/**
 * Check if device can sustain continuous tracking
 */
export const canSustainTracking = async () => {
  try {
    const battery = await getBatteryStatus();
    const estimate = await estimatePowerConsumption(3600); // Assume 1 hour tracking

    if (battery.isCritical) {
      return {
        canTrack: false,
        reason: "Critical battery level",
        recommendation: "Charge device",
      };
    }

    if (battery.isLow) {
      return {
        canTrack: true,
        degraded: true,
        reason: "Low battery - reduced accuracy",
        recommendation: "Reduce tracking frequency or charge",
      };
    }

    return {
      canTrack: true,
      degraded: false,
      reason: "Sufficient battery",
      recommendation: null,
    };
  } catch (error) {
    console.error("Failed to check tracking sustainability:", error);
    return {
      canTrack: true,
      error: error.message,
    };
  }
};

/**
 * Apply battery-optimized settings
 */
export const applyBatteryOptimization = async (settings = {}) => {
  try {
    const battery = await getBatteryStatus();
    const accuracy = await getOptimizedLocationAccuracy();

    const optimizedSettings = {
      locationTracking: {
        enabled: !battery.isCritical,
        accuracy: accuracy.accuracy,
        timeInterval: accuracy.timeInterval,
        distanceInterval: accuracy.distanceInterval,
        pausesAutomatically: battery.isLow || battery.isCritical,
      },
      sensorMonitoring: {
        enabled: !battery.isCritical,
        updateFrequency: battery.isLow ? 2000 : 1000, // ms
      },
      wifiScanning: {
        enabled: !battery.isLow && !battery.isCritical,
        scanInterval: battery.isLow ? 60000 : 30000, // ms
      },
      bluetoothScanning: {
        enabled: battery.level > BATTERY_THRESHOLDS.MEDIUM,
        scanInterval: 60000, // ms
      },
      backgroundTracking: {
        enabled: battery.level > BATTERY_THRESHOLDS.LOW,
        updateInterval: accuracy.timeInterval,
      },
      syncStrategy: {
        autoSync: battery.isCharging,
        manualSyncRequired: battery.isLow || battery.isCritical,
      },
      ...settings,
    };

    return {
      applied: true,
      settings: optimizedSettings,
      batteryLevel: battery.level,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to apply battery optimization:", error);
    return {
      applied: false,
      error: error.message,
    };
  }
};

/**
 * Get battery health diagnostic
 */
export const getBatteryDiagnostics = async () => {
  try {
    const status = await getBatteryStatus();
    const recommendations = await getBatteryRecommendations();
    const consumption = await estimatePowerConsumption();
    const canTrack = await canSustainTracking();

    return {
      status,
      recommendations,
      consumption,
      trackingCapability: canTrack,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get battery diagnostics:", error);
    return {
      error: error.message,
    };
  }
};
