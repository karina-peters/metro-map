import { navigateTo } from "../state";

const template = () => {
  return `
  <main>
    <div class="button-wrapper">
        <button id="btn-map">Map</button>
        <button id="btn-stn">Stations</button>
        <button id="btn-line">Lines</button>
        <button id="btn-train">Trains</button>
    </div>
  </main>
  `;
};

(() => {
  // Fetch data
  // etc.
})();

export const renderComponent = () => {
  // Render template
  const container = document.querySelector(".container");
  container.innerHTML = template();

  attachEventListeners();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {
  // Map
  const mapButton = document.querySelector("#btn-map");
  mapButton.addEventListener("click", () => {
    navigateTo("map");
  });

  // Stations
  const stationButton = document.querySelector("#btn-stn");
  stationButton.addEventListener("click", () => {
    navigateTo("station");
  });

  // Lines
  const lineButton = document.querySelector("#btn-line");
  lineButton.addEventListener("click", () => {
    navigateTo("line");
  });

  // Trains
  const trainButton = document.querySelector("#btn-train");
  trainButton.addEventListener("click", () => {
    navigateTo("train");
  });
};
