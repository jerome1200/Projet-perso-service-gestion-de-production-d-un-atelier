import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000", // ton backend NestJS
  headers: { "Content-Type": "application/json" },
});
