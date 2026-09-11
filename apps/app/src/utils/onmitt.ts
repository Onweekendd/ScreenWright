import mitt from "mitt";

const emitter = mitt();

export const addEventListener = (evtName: string, callback: (payload?: any) => void) => emitter.on(evtName, callback);

export const emitEvent = (evtName: string, payload?: any) => emitter.emit(evtName, payload);

export const offEvent = (evtName: string) => emitter.off(evtName);

export const offEvents = (list: string[]) => {
  list.forEach(offEvent);
};

export const clearEvent = () => emitter.all.clear();
