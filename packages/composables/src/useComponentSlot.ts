import { defineComponent } from "vue";

type KebabToCamel<S extends string> = S extends `${infer P}-${infer C}${infer R}`
  ? `${P}${Uppercase<C>}${KebabToCamel<R>}`
  : S;
function kebabToCamel<S extends string>(str: S): KebabToCamel<S> {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as KebabToCamel<S>;
}

export function useComponentSlot<T extends string>(componentMap: Record<T, any>) {
  function tryLoadComponent(name: T, componentMap: Record<T, any>) {
    const path = `./${kebabToCamel(name as unknown as string)}/index.vue`;
    const component = componentMap[path as keyof typeof componentMap];
    if (!component) {
      return {
        default: defineComponent({
          name: "SlotsInvalidComponent",
          render: () => null
        })
      };
    }
    return component;
  }
  const getSlotsComponent = (name: T) => {
    const component = tryLoadComponent(name, componentMap);
    return defineComponent((component as any).default);
  };
  return {
    getSlotsComponent
  };
}
