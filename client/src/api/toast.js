// toast.js
import { toast } from "react-toastify";

export const showErrorToast = (message) => {
  toast.error(message || "Something went wrong", {
    position: "top-right",
    autoClose: 3000,
    pauseOnHover: true,
  });
};

export const showSuccessToast = (message) => {
  toast.success(message || "Success", {
    position: "top-right",
    autoClose: 2500,
    pauseOnHover: true,
  });
};
