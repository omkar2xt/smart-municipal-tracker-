import * as Network from "expo-network";

/**
 * WiFi network scanning and SSID validation
 */

const TRUSTED_SSIDS = ["Office-Wifi", "GeoSentinel-NET", "Corporate-Network"];

/**
 * Get current WiFi network info
 */
export const getWiFiInfo = async () => {
  try {
    const network = await Network.getNetworkStateAsync();

    return {
      isConnected: network.isConnected,
      isInternetReachable: network.isInternetReachable,
      type: network.type,
      ipAddress: network.ip,
      details: {
        isWifiEnabled: network.isWifiEnabled,
        isAirplaneMode: network.isAirplaneMode,
      },
    };
  } catch (error) {
    console.error("Failed to get WiFi info:", error);
    return {
      isConnected: false,
      isInternetReachable: false,
      error: error.message,
    };
  }
};

/**
 * Check if connected to network
 */
export const isNetworkConnected = async () => {
  try {
    const network = await Network.getNetworkStateAsync();
    return network.isConnected && network.isInternetReachable;
  } catch (error) {
    console.error("Failed to check network connectivity:", error);
    return false;
  }
};

/**
 * Get SSID of current WiFi connection
 * Note: Requires specific permissions on Android 10+
 */
export const getCurrentSSID = async () => {
  try {
    // Note: On Android 10+, you need additional manifest permissions
    // This is a mock implementation - actual SSID detection may require native code
    const network = await Network.getNetworkStateAsync();

    if (network.isWifiEnabled) {
      return {
        ssid: "Unknown-SSID", // Would require native module on Android 10+
        bssid: "00:00:00:00:00:00",
        strength: -50, // dBm (signal strength)
        frequency: 2400, // MHz
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get current SSID:", error);
    return null;
  }
};

/**
 * Validate if current connection is trusted
 */
export const isConnectedToTrustedNetwork = async (trustedSSIDs = TRUSTED_SSIDS) => {
  try {
    const currentSSID = await getCurrentSSID();
    if (!currentSSID) return false;

    return trustedSSIDs.some(
      (ssid) =>
        ssid.toLowerCase() === currentSSID.ssid.toLowerCase() ||
        ssid === currentSSID.bssid
    );
  } catch (error) {
    console.error("Failed to validate trusted network:", error);
    return false;
  }
};

/**
 * Monitor network changes
 */
export const watchNetworkConnectivity = (onNetworkChange) => {
  try {
    // Unfortunately, expo-network doesn't provide a direct listener
    // Use polling instead
    const interval = setInterval(async () => {
      const state = await Network.getNetworkStateAsync();
      if (onNetworkChange) {
        onNetworkChange({
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      }
    }, 5000); // Check every 5 seconds

    // Return cleanup function
    return () => clearInterval(interval);
  } catch (error) {
    console.error("Failed to watch network connectivity:", error);
    return () => {};
  }
};

/**
 * Get network diagnostics
 */
export const getNetworkDiagnostics = async () => {
  try {
    const network = await Network.getNetworkStateAsync();
    const ipAddress = await Network.getIpAddressAsync();

    const diagnostics = {
      connectivity: {
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        type: network.type,
        hasWiFi: network.type === "wifi",
        hasCellular: network.type === "cellular" || network.type === "2g" || network.type === "3g" || network.type === "4g",
      },
      network: {
        ipAddress,
        isWifiEnabled: network.isWifiEnabled,
        isAirplaneMode: network.isAirplaneMode,
      },
      timestamp: new Date().toISOString(),
    };

    return diagnostics;
  } catch (error) {
    console.error("Failed to get network diagnostics:", error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Add trusted SSID to validation list
 */
export const addTrustedSSID = (ssid) => {
  if (!TRUSTED_SSIDS.includes(ssid)) {
    TRUSTED_SSIDS.push(ssid);
  }
};

/**
 * Remove SSID from trusted list
 */
export const removeTrustedSSID = (ssid) => {
  const index = TRUSTED_SSIDS.indexOf(ssid);
  if (index > -1) {
    TRUSTED_SSIDS.splice(index, 1);
  }
};

/**
 * Get trusted SSIDs list
 */
export const getTrustedSSIDs = () => [...TRUSTED_SSIDS];
