import axios from "axios";
import { apiUrl } from "./mockApi";

const axiosClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
