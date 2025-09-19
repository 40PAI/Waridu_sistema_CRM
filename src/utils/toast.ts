import { toast } from "sonner";

const DEFAULT_DURATION = 4000; // 4 seconds

export const showSuccess = (message: string) => {
  toast.success(message, { duration: DEFAULT_DURATION });
};

export const showError = (message: string) => {
  toast.error(message, { duration: DEFAULT_DURATION });
};

export const showLoading = (message: string) => {
  return toast.loading(message, { duration: DEFAULT_DURATION });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};