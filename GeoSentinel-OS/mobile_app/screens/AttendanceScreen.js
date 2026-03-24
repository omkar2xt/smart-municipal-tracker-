// Handles attendance capture workflows (location, face, and timestamp).
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AttendanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance (Coming Soon)</Text>
      <Text style={styles.description}>
        Verified attendance capture is under active development.
      </Text>
      <ActivityIndicator size="small" color="#60a5fa" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    marginBottom: 12,
  },
});
