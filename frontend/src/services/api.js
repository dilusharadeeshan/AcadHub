// Read from .env file, or fallback to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const request = async (endpoint, options = {}) => {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Always sends cookies with requests
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Throw error with server message so components can catch it
    throw new Error(data.message || "An error occurred");
  }

  return data;
};