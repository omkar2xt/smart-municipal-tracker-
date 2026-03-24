import { apiRequest, setAuthToken } from "./apiService";

export const login = async ({ email, password, role, district, taluka }) => {
  const validEmail = (email || "").trim();
  if (!validEmail) {
    throw new Error("Email is required");
  }

  const payload = {
    email: validEmail,
    password,
  };

  const data = await apiRequest("post", "/auth/login", payload);
  if (!data?.access_token) {
    throw new Error("Invalid login response from server");
  }

  setAuthToken(data.access_token);

  const serverUser = data.user ?? {};

  return {
    token: data.access_token,
    user: {
      id: serverUser.id ?? null,
      name: serverUser.name ?? validEmail,
      role: serverUser.role ?? role,
      district: serverUser.district ?? district ?? null,
      taluka: serverUser.taluka ?? taluka ?? null,
      email: serverUser.email ?? validEmail,
    },
  };
};

export const logout = () => {
  setAuthToken(null);
};
