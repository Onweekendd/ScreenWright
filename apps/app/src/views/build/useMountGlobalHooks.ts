import { screenwright } from "@/views/view/exportEntry/sdk/hooks";

export const useMountGlobalHooks = () => {
  const mountGlobalHooks = () => {
    window.screenwright = screenwright;
  };

  return {
    mountGlobalHooks
  };
};
