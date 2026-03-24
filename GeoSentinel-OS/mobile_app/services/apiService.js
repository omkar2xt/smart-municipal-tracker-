import axios from "axios";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${defaultHost}:8000`;

let authToken = null;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const next = { ...config };
  next.headers = { ...(next.headers || {}) };
  if (authToken) {
    next.headers.Authorization = `Bearer ${authToken}`;
  }
  return next;
});

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const apiRequest = async (method, path, data = null, config = {}) => {
  const mergedHeaders = {
    ...(config.headers || {}),
  };

  const response = await client.request({
    method,
    url: path,
    data,
    ...config,
    headers: mergedHeaders,
  });
  return response.data;
};

export const getApiClient = () => client;
