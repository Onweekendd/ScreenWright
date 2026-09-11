import { ref } from "vue";

export function useToast() {
  const toast = ref("");

  function showToast(msg: string) {
    toast.value = msg;
    setTimeout(() => (toast.value = ""), 2000);
  }

  return { toast, showToast };
}
