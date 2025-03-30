import { Subject } from "rxjs";

export const state$ = new Subject();

export const navigateTo = (viewId) => {
  state$.next({ viewId });
};
