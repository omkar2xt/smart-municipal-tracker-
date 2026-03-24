import { apiRequest, setAuthToken } from "./apiService";

export const login = async ({ email, password, role, district, taluka }) => {
  const validEmail = (email || "").trim();
  const validPassword = (password || "").trim();

  if (!validEmail) {
    throw new Error("Email is required");
  }

  if (!validPassword) {
    throw new Error("Password is required");
  }

  const payload = {
    email: validEmail,
    password: validPassword,
  };

  const data = await apiRequest("post", "/auth/login", payload);
  if (!data?.access_token) {
    throw new Error("Invalid login response from server");
  }

  setAuthToken(data.access_token);

  const serverUser = data.user ?? {};

  if (!serverUser.role) {
    throw new Error("Invalid server response: role missing");
  }

  return {
    token: data.access_token,
    user: {
      id: serverUser.id ?? null,
      name: serverUser.name ?? validEmail,
      role: serverUser.role,
      district: serverUser.district ?? null,
      taluka: serverUser.taluka ?? null,
      email: serverUser.email ?? validEmail,
    },
  };
};

export const logout = () => {
  setAuthToken(null);
};
