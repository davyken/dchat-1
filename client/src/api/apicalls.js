import axios from "axios";

const API_URL = `https://localhost:5000`;
const api = axios.create({
  baseURL: API_URL,
});
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
export default api;