import axios from "axios";

export const client = axios.create({
  baseURL: "https://task-tracker-ujsi.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});
