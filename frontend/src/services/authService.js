import { request } from "./api";

export const authService = {
  login: (email, password) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: (name, email, password) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  getProfile: () => {
    return request("/auth/profile");
  },

  logout: () => {
    return request("/auth/logout", {
      method: "POST",
    });
  },
};