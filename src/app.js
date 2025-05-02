import "./styles/map.css";
import "./styles.css";

import { state$ } from "./helpers/state.js";
import { metroSystem } from "./helpers/system.js";

import { render as renderHome } from "./views/home.js";
import { pause as pauseMap, render as renderMap } from "./views/map.js";
import { render as renderStations } from "./views/stations.js";
import { render as renderLines } from "./views/lines.js";
import { pause as pauseTrains, render as renderTrains } from "./views/trains.js";

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

      // Show/hide back button
      const backButton = document.querySelector(".btn-back");
      backButton.removeAttribute("hidden");
      state.viewId === "home" ? backButton.setAttribute("hidden", true) : backButton.removeAttribute("hidden");

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

  // Handle back button
  const backButton = document.querySelector(".btn-back");
  backButton.addEventListener("click", () => window.history.back());
  window.onpopstate = (event) => {
    if (event.state) {
      state$.next(event.state);
    }
  };

  metroSystem.init();
};

document.addEventListener("DOMContentLoaded", async () => main());
