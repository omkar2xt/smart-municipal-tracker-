import { apiRequest, setAuthToken } from "./apiService";

export const login = async ({ name, password, role, district, taluka }) => {
  const email = (name || "").trim();
  if (!email) {
    throw new Error("Email is required");
  }

  const payload = {
    email,
    password,
  };

  const data = await apiRequest("post", "/auth/login", payload);
  if (!data?.access_token) {
    throw new Error("Invalid login response from server");
  }

  setAuthToken(data.access_token);

  const serverUser = data.user || {};

  return {
    token: data.access_token,
    user: {
      id: serverUser.id || null,
      name: serverUser.name || email,
      role: serverUser.role || role,
      district: serverUser.district ?? district ?? null,
      taluka: serverUser.taluka ?? taluka ?? null,
      email: serverUser.email || email,
    },
  };
};

export const logout = () => {
  setAuthToken(null);
};
