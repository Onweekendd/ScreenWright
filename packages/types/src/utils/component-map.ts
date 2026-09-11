import type { ActionTypeEnum } from "../types/action";
import { Action2ComponentType, ActionList } from "../types/action";
import type { AllComponentType } from "../types/componentProp";
import type { EncodeEventTypeEnum, EventTypeEnum } from "../types/event";
import { EncodeEvent2ComponentType, EncodeEventList, Event2ComponentType, EventList } from "../types/event";

export const createComponent2EventMapGetter = (() => {
  let singletonGetter: (() => Map<AllComponentType, string>) | null = null;

  return () => {
    if (singletonGetter) {
      return singletonGetter;
    }

    let cache: Map<AllComponentType, string> | null = null;

    singletonGetter = (): Map<AllComponentType, string> => {
      if (cache) {
        return cache;
      }

      const mapping = new Map<AllComponentType, string>();

      Object.entries(Event2ComponentType).forEach(([eventTypeKey, components]) => {
        const eventType = eventTypeKey as EventTypeEnum;
        components.forEach((component) => {
          const currentEvents = mapping.get(component);
          mapping.set(component, currentEvents !== undefined ? `${currentEvents},${eventType}` : eventType);
        });
      });

      cache = mapping;
      return mapping;
    };

    return singletonGetter;
  };
})();

const createEncodeComponent2EventMapGetter = (() => {
  let singletonGetter: (() => Map<AllComponentType, string>) | null = null;

  return () => {
    if (singletonGetter) {
      return singletonGetter;
    }

    let cache: Map<AllComponentType, string> | null = null;

    singletonGetter = (): Map<AllComponentType, string> => {
      if (cache) {
        return cache;
      }

      const mapping = new Map<AllComponentType, string>();

      Object.entries(EncodeEvent2ComponentType).forEach(([eventTypeKey, components]) => {
        const eventType = eventTypeKey as EncodeEventTypeEnum;
        components.forEach((component) => {
          const currentEvents = mapping.get(component as AllComponentType);
          mapping.set(
            component as AllComponentType,
            currentEvents !== undefined ? `${currentEvents},${eventType}` : eventType
          );
        });
      });

      cache = mapping;
      return mapping;
    };

    return singletonGetter;
  };
})();

export const createComponent2ActionMapGetter = (() => {
  let singletonGetter: (() => Map<AllComponentType, string>) | null = null;

  return () => {
    if (singletonGetter) {
      return singletonGetter;
    }

    let cache: Map<AllComponentType, string> | null = null;

    singletonGetter = (): Map<AllComponentType, string> => {
      if (cache) {
        return cache;
      }

      const mapping = new Map<AllComponentType, string>();

      Object.entries(Action2ComponentType).forEach(([actionTypeKey, components]) => {
        const actionType = actionTypeKey as ActionTypeEnum;
        components.forEach((component) => {
          const currentActions = mapping.get(component);
          mapping.set(component, currentActions !== undefined ? `${currentActions},${actionType}` : actionType);
        });
      });

      cache = mapping;
      return mapping;
    };

    return singletonGetter;
  };
})();

export const filterPropToConfig = (componentType: AllComponentType) => {
  const getComponent2EventMap = createComponent2EventMapGetter();
  const getComponent2ActionMap = createComponent2ActionMapGetter();

  const eventsOfComponentType = getComponent2EventMap().get(componentType) || "";
  const actionsOfComponentType = getComponent2ActionMap().get(componentType) || "";

  const eventsToExclude = EventList.filter((item) => !eventsOfComponentType.includes(item.value)).map((a) => a.value);
  const actionToExclude = ActionList.filter((item) => !actionsOfComponentType.includes(item.value)).map((a) => a.value);

  return {
    eventsEx: eventsToExclude.join(","),
    actionEx: actionToExclude.join(",")
  };
};

export const filterPropToEncodeConfig = (componentType: AllComponentType) => {
  const getComponent2EventMap = createEncodeComponent2EventMapGetter();

  const eventsOfComponentType = getComponent2EventMap().get(componentType) || "";

  const eventsToExclude = EncodeEventList.filter((item) => !eventsOfComponentType.includes(item.value)).map(
    (a) => a.value
  );

  return {
    eventsEx: eventsToExclude.join(",")
  };
};
