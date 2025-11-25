import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/ojt_monitoring/backend/api", // adjust to your backend folder path
});

export default api;
