import { Subject } from "rxjs";

const state = {};

export const state$ = new Subject();

export const navigateTo = (viewId) => {
  state.currentView = viewId;

  state$.next({ viewId });
};
