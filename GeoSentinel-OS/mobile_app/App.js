import React from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AttendanceScreen from "./screens/AttendanceScreen";
import LoginScreen from "./screens/LoginScreen";
import TaskScreen from "./screens/TaskScreen";
import UploadScreen from "./screens/UploadScreen";
import WorkerDashboard from "./screens/WorkerDashboard";

import { setAuthToken } from "./services/apiService";
import * as backgroundLocationService from "./services/backgroundLocationService";
import * as storageService from "./services/storageService";

// Keep splash screen visible while initializing
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [authState, setAuthState] = React.useState({
    token: null,
    user: null,
    isLoading: true,
  });

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize background location service
        backgroundLocationService.defineBackgroundLocationTask(async (location) => {
          try {
            // Queue location updates received in background
            await storageService.queueLocation({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              altitude: location.altitude || 0,
              speed: location.speed || 0,
              heading: location.heading || 0,
            });
          } catch (queueError) {
            console.error("Failed to queue background location:", queueError);
          }
        });

        // Check if there's a stored auth token (implement if needed)
        // For now, require fresh login each time

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      } catch (error) {
        console.error("App initialization error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const handleAuthentication = (nextState) => {
    setAuthState({
      ...nextState,
      isLoading: false,
    });
    if (nextState.token) {
      setAuthToken(nextState.token);
    }
  };

  if (authState.isLoading) {
    return null; // Show splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f8fafc",
          },
          headerTintColor: "#0f172a",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: true,
        }}
      >
        {!authState.token ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => (
              <LoginScreen
                {...props}
                onAuthenticated={handleAuthentication}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              options={{
                title: "GeoSentinel OS",
                headerBackVisible: false,
              }}
            >
              {(props) => (
                <WorkerDashboard
                  {...props}
                  user={authState.user}
                  onLogout={() =>
                    {
                      setAuthToken(null);
                      setAuthState({
                        token: null,
                        user: null,
                        isLoading: false,
                      });
                    }
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Attendance"
              options={{
                title: "Mark Attendance",
              }}
              component={AttendanceScreen}
            />
            <Stack.Screen
              name="Tasks"
              options={{
                title: "My Tasks",
              }}
              component={TaskScreen}
            />
            <Stack.Screen
              name="Upload"
              options={{
                title: "Upload Proof",
              }}
              component={UploadScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
