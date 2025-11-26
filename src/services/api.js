import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/ojt_monitoring/backend/api",
});

export default api;
