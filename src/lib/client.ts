import axios, { isAxiosError } from "axios";
import { toast } from "sonner";
const url = "https://task-tracker-ujsi.onrender.com";
export const client = axios.create({
  baseURL: url,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "";
    if (isAxiosError(error)) {
      if (error.code == "ERR_NETWORK") {
        message = "Could not connect to server";
      } else {
        message =
          error.response?.data.detail || error.message || "Unknown Error";
      }
    }

    toast.error(message);
    return Promise.reject(error);
  }
);
