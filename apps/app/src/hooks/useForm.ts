import type { Ref } from "vue";
import { ref } from "vue";

// import { login } from "@/api/login"
import type { FormInstance, FormRules } from "element-plus";

interface LoginProps<T extends Record<string, any>> {
  loginForm: Ref<T>;
  rules: Ref<FormRules<T>>;
}

export const useForm = <T extends Record<string, any>>(props: LoginProps<T>) => {
  const { loginForm, rules } = props;
  const validateForm = ref<FormInstance | null>(null);

  const checkValidate = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!validateForm.value) {
        return;
      }
      validateForm.value.validate((valid) => {
        if (valid) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  };

  return {
    loginForm,
    validateForm,
    rules,
    checkValidate
  };
};
