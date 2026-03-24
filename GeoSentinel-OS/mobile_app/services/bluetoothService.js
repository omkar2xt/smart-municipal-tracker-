/**
 * Bluetooth scanning and nearby device detection
 * Note: Bluetooth API on React Native/Expo is limited
 * This module provides interfaces for native Bluetooth integration
 */

let bluetoothListener = null;
let scannedDevices = [];

/**
 * Mock Bluetooth device scanning
 * In production, integrate with react-native-ble-plx or native module
 */
export const startBluetoothScan = async (durationMs = 5000) => {
  try {
    console.log("Starting Bluetooth scan...");

    // Reset previous scan
    scannedDevices = [];

    // Simulate scan (would use actual BLE library in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock discovered devices
        scannedDevices = [
          {
            id: "device_1",
            name: "Wireless Headset",
            rssi: -45,
            connectable: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: "device_2",
            name: "Smart Watch",
            rssi: -62,
            connectable: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: "device_3",
            name: "Unknown Device",
            rssi: -78,
            connectable: false,
            timestamp: new Date().toISOString(),
          },
        ];

        console.log(`Bluetooth scan completed: ${scannedDevices.length} devices found`);
        resolve(scannedDevices);
      }, durationMs);
    });
  } catch (error) {
    console.error("Bluetooth scan error:", error);
    throw error;
  }
};

/**
 * Stop Bluetooth scanning
 */
export const stopBluetoothScan = async () => {
  try {
    if (bluetoothListener) {
      bluetoothListener.stop();
      bluetoothListener = null;
    }
    console.log("Bluetooth scan stopped");
  } catch (error) {
    console.error("Failed to stop Bluetooth scan:", error);
  }
};

/**
 * Get scanned devices
 */
export const getScannedDevices = () => {
  return [...scannedDevices];
};

/**
 * Connect to Bluetooth device
 */
export const connectToDevice = async (deviceId) => {
  try {
    console.log(`Connecting to device: ${deviceId}`);

    // Simulate connection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          deviceId,
          status: "connected",
          timestamp: new Date().toISOString(),
        });
      }, 2000);
    });
  } catch (error) {
    console.error("Failed to connect to device:", error);
    throw error;
  }
};

/**
 * Disconnect from device
 */
export const disconnectDevice = async (deviceId) => {
  try {
    console.log(`Disconnecting from device: ${deviceId}`);

    return {
      success: true,
      deviceId,
      status: "disconnected",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to disconnect device:", error);
    throw error;
  }
};

/**
 * Check Bluetooth availability
 */
export const isBluetoothAvailable = async () => {
  try {
    // In production, use react-native-ble-plx
    return true; // Assume available on modern devices
  } catch (error) {
    console.error("Failed to check Bluetooth availability:", error);
    return false;
  }
};

/**
 * Check if Bluetooth is enabled
 */
export const isBluetoothEnabled = async () => {
  try {
    // Would use native module in production
    return true; // Assume enabled
  } catch (error) {
    console.error("Failed to check Bluetooth status:", error);
    return false;
  }
};

/**
 * Get nearby device count
 */
export const getNearbyDeviceCount = async (rssiThreshold = -70) => {
  try {
    const devices = await startBluetoothScan(3000);
    const nearbyDevices = devices.filter((device) => device.rssi > rssiThreshold);
    return {
      total: devices.length,
      nearby: nearbyDevices.length,
      devices: nearbyDevices,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to count nearby devices:", error);
    return { total: 0, nearby: 0, devices: [] };
  }
};

/**
 * Detect Bluetooth anomalies
 * (e.g., sudden disconnections could indicate spoofing)
 */
export const detectBluetoothAnomalies = (previousDevices, currentDevices) => {
  const anomalies = {
    suddenDisconnections: [],
    newDevices: [],
    rssiAnomalies: [],
    totalAnomalies: 0,
  };

  // Check for sudden disconnections
  previousDevices.forEach((prevDevice) => {
    const stillPresent = currentDevices.find((curr) => curr.id === prevDevice.id);
    if (!stillPresent) {
      anomalies.suddenDisconnections.push({
        deviceId: prevDevice.id,
        name: prevDevice.name,
        reason: "device_lost",
      });
      anomalies.totalAnomalies++;
    }
  });

  // Check for new devices
  currentDevices.forEach((currDevice) => {
    const wasPresent = previousDevices.find((prev) => prev.id === currDevice.id);
    if (!wasPresent) {
      anomalies.newDevices.push({
        deviceId: currDevice.id,
        name: currDevice.name,
        rssi: currDevice.rssi,
      });
      anomalies.totalAnomalies++;
    }
  });

  // Check for RSSI anomalies (sudden signal strength change)
  previousDevices.forEach((prevDevice) => {
    const currentDevice = currentDevices.find((curr) => curr.id === prevDevice.id);
    if (currentDevice) {
      const rssiDelta = Math.abs(currentDevice.rssi - prevDevice.rssi);
      if (rssiDelta > 20) {
        // >20 dBm change is significant
        anomalies.rssiAnomalies.push({
          deviceId: currentDevice.id,
          name: currentDevice.name,
          previousRSSI: prevDevice.rssi,
          currentRSSI: currentDevice.rssi,
          delta: rssiDelta,
        });
        anomalies.totalAnomalies++;
      }
    }
  });

  return anomalies;
};

/**
 * Monitor Bluetooth connectivity continuously
 */
export const watchBluetoothConnectivity = async (onDeviceChange) => {
  let previousDevices = [];

  const interval = setInterval(async () => {
    try {
      const currentDevices = await startBluetoothScan(2000);
      const anomalies = detectBluetoothAnomalies(previousDevices, currentDevices);

      if (onDeviceChange) {
        onDeviceChange({
          devices: currentDevices,
          anomalies,
          timestamp: new Date().toISOString(),
        });
      }

      previousDevices = currentDevices;
    } catch (error) {
      console.error("Bluetooth monitoring error:", error);
    }
  }, 10000); // Check every 10 seconds

  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Get Bluetooth diagnostics
 */
export const getBluetoothDiagnostics = async () => {
  try {
    const isAvailable = await isBluetoothAvailable();
    const isEnabled = await isBluetoothEnabled();
    const nearbyInfo = await getNearbyDeviceCount();

    return {
      available: isAvailable,
      enabled: isEnabled,
      nearby: nearbyInfo,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get Bluetooth diagnostics:", error);
    return {
      available: false,
      enabled: false,
      error: error.message,
    };
  }
};
