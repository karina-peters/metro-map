import "./styles/map.css";

import { state$ } from "./state.js";
import { metroSystem } from "./system.js";

import { render as renderHome } from "./components/home.js";
import { pause as pauseMap, render as renderMap } from "./components/map.js";
import { render as renderStations } from "./components/stations.js";
import { render as renderLines } from "./components/lines.js";
import { pause as pauseTrains, render as renderTrains } from "./components/trains.js";

const views = {
  "home": { render: renderHome },
  "map": { render: renderMap, pause: pauseMap },
  "station": { render: renderStations },
  "line": { render: renderLines },
  "train": { render: renderTrains, pause: pauseTrains },
};

let currentViewId = "";

const main = () => {
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

  metroSystem.init();
};

document.addEventListener("DOMContentLoaded", async () => main());
