import { type ShallowRef, shallowRef } from "vue";

import { produce } from "immer";

export function useImmer<T>(baseState: T): [ShallowRef<T>, (updater: (draft: T) => void) => void] {
  const state = shallowRef(baseState);
  const update = (updater: (draft: T) => void) => {
    state.value = produce(state.value, updater);
  };

  return [state, update];
}
