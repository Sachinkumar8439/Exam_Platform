import apiClient from "./apiClient";
import handleApiError from "./handleApiError";
import { showErrorToast } from "./toast";

const api = async (path, payload = null, options = {}) => {
  try {
    let method = "GET";

    if (options.delete) {
      method = "DELETE";
    } else if (payload) {
      method = options.update ? "PUT" : "POST";
    }

    const response = await apiClient({
      url: "/api" + path,
      method,
      data: method === "POST" || method === "PUT" ? payload : undefined,
      params: method === "GET" ? payload : undefined,
    });

    console.log(response)

    return response.data;
  } catch (error) {
    console.log(error.message);
    const message = handleApiError(error);
    console.log(message);

    // 🔥 AUTO TOAST (ONE TIME)
    showErrorToast(message);

    // ❌ Component ko force nahi kar rahe
    return Promise.reject(); // optional
  }
};

/* Shortcuts */
api.get = (path, params) => api(path, params);
api.post = (path, data) => api(path, data);
api.put = (path, data) => api(path, data, { update: true });
api.delete = (path) => api(path, null, { delete: true });

export default api;
