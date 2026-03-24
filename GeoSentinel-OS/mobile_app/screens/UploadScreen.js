import React from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { apiRequest } from "../services/apiService";

export default function UploadScreen() {
  const cameraRef = React.useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taskId, setTaskId] = React.useState("");
  const [photoUri, setPhotoUri] = React.useState("");
  const [uploadResult, setUploadResult] = React.useState("");
  const [cameraType, setCameraType] = React.useState("back");
  const [loading, setLoading] = React.useState(false);

  const ensurePermission = async () => {
    if (!permission || permission.status !== "granted") {
      const response = await requestPermission();
      return response?.status === "granted";
    }
    return true;
  };

  const capturePhoto = async () => {
    const granted = await ensurePermission();
    if (!granted) {
      setUploadResult("Camera permission denied");
      return;
    }

    if (!cameraRef.current) {
      setUploadResult("Camera not ready");
      return;
    }

    const shot = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhotoUri(shot.uri);
    setUploadResult("Photo captured. Ready to upload.");
  };

  const submitUpload = async () => {
    if (!taskId.trim() || !photoUri) {
      setUploadResult("Please capture a photo and enter task id.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("post", "/upload", {
        task_id: Number(taskId),
        file_path: photoUri,
      });
      setUploadResult(`Uploaded: ${data.file_path}`);
    } catch (err) {
      setUploadResult(err?.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Task Proof</Text>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={cameraType} />
      </View>

      <View style={styles.row}>
        <Pressable style={styles.smallButton} onPress={capturePhoto}>
          <Text style={styles.buttonText}>Capture</Text>
        </Pressable>
        <Pressable
          style={styles.smallButton}
          onPress={() =>
            setCameraType((prev) =>
              prev === "back" ? "front" : "back"
            )
          }
        >
          <Text style={styles.buttonText}>Flip</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Task ID"
        value={taskId}
        onChangeText={setTaskId}
      />

      <Pressable
        style={[styles.uploadButton, loading && styles.disabled]}
        onPress={submitUpload}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Uploading..." : "Upload"}</Text>
      </Pressable>

      {photoUri ? <Text style={styles.meta}>Photo: {photoUri}</Text> : null}
      {uploadResult ? <Text style={styles.meta}>{uploadResult}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  camera: {
    height: 280,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  smallButton: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadButton: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  meta: {
    color: "#475569",
  },
});
