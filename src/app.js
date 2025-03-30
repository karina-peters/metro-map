import "./styles/map.css";

import { state$ } from "./state.js";

import { renderComponent as renderHome } from "./components/home.js";
import { pauseComponent as pauseMap, renderComponent as renderMap } from "./components/map.js";
import { renderComponent as renderStations } from "./components/stations.js";
import { renderComponent as renderLines } from "./components/lines.js";
import { renderComponent as renderTrains } from "./components/trains.js";

const views = {
  "home": { route: "", render: renderHome },
  "map": { route: "", render: renderMap, pause: pauseMap },
  "station": { route: "", render: renderStations },
  "line": { route: "", render: renderLines },
  "train": { route: "", render: renderTrains },
};

let currentViewId = "";

// Render new view on state change
state$.subscribe(async (state) => {
  const newView = views[state.viewId];
  if (newView && state.viewId != currentViewId) {
    // Pause current view, if needed
    const currentView = views[currentViewId];
    if (currentView && Object.hasOwn(currentView, "pause")) {
      currentView.pause();
    }

    // Render new view
    await newView.render();
    currentViewId = state.viewId;

    // Update browser history
    const historyMethod = history.state ? "pushState" : "replaceState";
    history[historyMethod](state, null, newView.route);
  }
});

// Set default view
state$.next({ viewId: "home" });

// Handle browser back button
window.onpopstate = (event) => {
  if (event.state) {
    state$.next(event.state);
  }
};
