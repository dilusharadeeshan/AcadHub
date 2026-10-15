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

  updateProfile: (name, email) => {
    return request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ name, email }),
    });
  },

  changePassword: (currentPassword, newPassword) => {
    return request("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  deleteAccount: () => {
    return request("/auth/delete-account", {
      method: "DELETE",
    });
  },

  logout: () => {
    return request("/auth/logout", {
      method: "POST",
    });
  },
};