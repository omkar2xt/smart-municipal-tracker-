import React from "react";
import { Camera, CheckCircle2, UploadCloud, XCircle } from "lucide-react";

import { uploadTaskProof, verifyFace } from "../services/api";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function WorkerVerificationPanel({ userId, tasks, onTasksRefresh }) {
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const [cameraError, setCameraError] = React.useState("");
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [captureTarget, setCaptureTarget] = React.useState(null);
  const [faceImage, setFaceImage] = React.useState("");
  const [faceVerified, setFaceVerified] = React.useState(false);
  const [faceStatus, setFaceStatus] = React.useState("Not verified");
  const [taskProofs, setTaskProofs] = React.useState({});
  const [busyTaskId, setBusyTaskId] = React.useState(null);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function openCamera(target) {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API is unavailable on this device/browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      setCaptureTarget(target);
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError(err?.message || "Unable to access camera.");
      setCameraOpen(false);
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCaptureTarget(null);
  }

  function captureImage() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    if (captureTarget?.type === "face") {
      setFaceImage(imageData);
    }

    if (captureTarget?.type === "task") {
      setTaskProofs((prev) => ({
        ...prev,
        [captureTarget.taskId]: {
          ...(prev[captureTarget.taskId] || {}),
          [captureTarget.stage]: imageData,
        },
      }));
    }

    closeCamera();
  }

  async function onSelectFile(taskId, stage, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setTaskProofs((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [stage]: dataUrl,
      },
    }));
  }

  async function submitFaceVerification() {
    if (!faceImage || !userId) return;
    try {
      const result = await verifyFace(userId, faceImage);
      setFaceVerified(Boolean(result?.verified));
      setFaceStatus(result?.message || (result?.verified ? "Verified" : "Not verified"));
    } catch (err) {
      setFaceVerified(false);
      setFaceStatus(err?.response?.data?.detail || err?.message || "Face verification failed");
    }
  }

  async function submitProof(taskId) {
    const proof = taskProofs[taskId] || {};
    if (!proof.before && !proof.after) return;

    setBusyTaskId(taskId);
    try {
      await uploadTaskProof(taskId, proof.before, proof.after);
      if (onTasksRefresh) {
        await onTasksRefresh();
      }
    } catch (err) {
      setCameraError(err?.response?.data?.detail || err?.message || "Proof upload failed");
    } finally {
      setBusyTaskId(null);
    }
  }

  const workerTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-civic-900">Worker Face Verification</h3>
        <p className="mt-2 text-sm text-slate-600">Capture your face before uploading task proof images.</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Verification Status</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${faceVerified ? "bg-eco-100 text-eco-700" : "bg-red-100 text-red-700"}`}>
              {faceVerified ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {faceVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{faceStatus}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => openCamera({ type: "face" })} className="inline-flex items-center gap-2 rounded-lg bg-civic-600 px-3 py-2 text-sm font-semibold text-white">
            <Camera size={16} />
            Verify Face
          </button>
          <button
            type="button"
            onClick={submitFaceVerification}
            disabled={!faceImage}
            className="rounded-lg border border-civic-300 px-3 py-2 text-sm font-semibold text-civic-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Verification
          </button>
        </div>

        {faceImage ? <img src={faceImage} alt="Captured face" className="mt-4 h-40 w-full rounded-xl object-cover" /> : null}
      </div>

      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-civic-900">Task Proof Upload</h3>
        <p className="mt-2 text-sm text-slate-600">Upload before and after images for each assigned task.</p>

        <div className="mt-4 space-y-4">
          {workerTasks.length === 0 ? <p className="text-sm text-slate-500">No assigned tasks found.</p> : null}
          {workerTasks.map((task) => {
            const taskProof = taskProofs[task.id] || {};
            const hasProof = Boolean(taskProof.before || taskProof.after);
            return (
              <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-civic-900">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {String(task.status || "pending")}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                    Upload Before Image
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="mt-1 block w-full text-xs"
                      onChange={(event) => onSelectFile(task.id, "before", event)}
                    />
                  </label>
                  <label className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                    Upload After Image
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="mt-1 block w-full text-xs"
                      onChange={(event) => onSelectFile(task.id, "after", event)}
                    />
                  </label>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openCamera({ type: "task", taskId: task.id, stage: "before" })} className="rounded-lg bg-eco-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Capture Before
                  </button>
                  <button type="button" onClick={() => openCamera({ type: "task", taskId: task.id, stage: "after" })} className="rounded-lg bg-civic-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Capture After
                  </button>
                  <button
                    type="button"
                    disabled={!faceVerified || !hasProof || busyTaskId === task.id}
                    onClick={() => submitProof(task.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-civic-300 px-3 py-1.5 text-xs font-semibold text-civic-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UploadCloud size={14} />
                    {busyTaskId === task.id ? "Uploading..." : "Submit Proof"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cameraOpen ? (
        <div className="glass-card lg:col-span-2 p-4">
          <p className="mb-2 text-sm font-semibold text-civic-900">Live Camera Preview</p>
          <video ref={videoRef} autoPlay playsInline muted className="h-64 w-full rounded-xl bg-black object-cover" />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={captureImage} className="rounded-lg bg-civic-600 px-3 py-2 text-sm font-semibold text-white">Capture</button>
            <button type="button" onClick={closeCamera} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          </div>
        </div>
      ) : null}

      {cameraError ? <div className="lg:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{cameraError}</div> : null}
    </div>
  );
}
