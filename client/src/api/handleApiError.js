const handleApiError = (error) => {
  // 🌐 No response = network / CORS / server down
  if (!error.response) {
    return "Network error. Please check your internet connection.";
  }

  const { status, data } = error.response;

  // ✅ Backend ne message bheja → wahi dikhao
  if (data?.message) {
    return data.message;
  }

  // 🔐 Auth errors
  if (status === 401) {
    return "Session expired. Please login again.";
  }

  if (status === 403) {
    return "You are not allowed to perform this action.";
  }

  // ❌ Not found
  if (status === 404) {
    return "Requested resource not found.";
  }

  // 🧪 Validation error
  if (status === 422) {
    return "Invalid data provided.";
  }

  // 🔥 Server crash
  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  // 🧯 Fallback
  return "Something went wrong. Please try again.";
};

export default handleApiError;
