import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { login } from "../services/authService";

const ROLE_OPTIONS = ["state_admin", "district_admin", "taluka_admin", "worker"];

export default function LoginScreen({ onAuthenticated }) {
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [roleIndex, setRoleIndex] = React.useState(3);
  const [district, setDistrict] = React.useState("");
  const [taluka, setTaluka] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      const role = ROLE_OPTIONS[roleIndex];
      const auth = await login({
        name: name.trim(),
        password,
        role,
        district: district.trim(),
        taluka: taluka.trim(),
      });
      onAuthenticated(auth);
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GeoSentinel OS</Text>
      <Text style={styles.subtitle}>Role-Based Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="District (optional)"
        value={district}
        onChangeText={setDistrict}
      />
      <TextInput
        style={styles.input}
        placeholder="Taluka (optional)"
        value={taluka}
        onChangeText={setTaluka}
      />

      <View style={styles.roleContainer}>
        <Text style={styles.roleLabel}>Role: {ROLE_OPTIONS[roleIndex]}</Text>
        <View style={styles.roleButtonsRow}>
          <Pressable
            style={styles.roleButton}
            onPress={() => setRoleIndex((prev) => (prev + ROLE_OPTIONS.length - 1) % ROLE_OPTIONS.length)}
          >
            <Text style={styles.roleButtonText}>Prev</Text>
          </Pressable>
          <Pressable
            style={styles.roleButton}
            onPress={() => setRoleIndex((prev) => (prev + 1) % ROLE_OPTIONS.length)}
          >
            <Text style={styles.roleButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.loginButton, loading && styles.loginDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>{loading ? "Signing in..." : "Login"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginBottom: 20,
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  roleContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  roleLabel: {
    fontWeight: "600",
    marginBottom: 8,
  },
  roleButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  roleButtonText: {
    fontWeight: "700",
    color: "#0f172a",
  },
  error: {
    color: "#dc2626",
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
