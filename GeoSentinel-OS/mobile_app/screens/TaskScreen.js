import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiRequest } from "../services/apiService";

export default function TaskScreen() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const fetchTasks = async () => {
    try {
      setError("");
      const data = await apiRequest("get", "/tasks");
      const normalizedTasks = Array.isArray(data)
        ? data
        : Array.isArray(data?.records)
          ? data.records
          : [];
      setTasks(normalizedTasks);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Assigned Tasks</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={() => {
            setRefreshing(true);
            fetchTasks();
          }}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={tasks}
        keyExtractor={(item, index) => `${item.id || index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTasks();
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Assigned By: {item.assigned_by}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tasks assigned yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  refreshButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: {
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  taskTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  meta: {
    color: "#475569",
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
    marginBottom: 10,
  },
});
