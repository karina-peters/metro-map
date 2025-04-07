import { metroSystem } from "../system.js";

const template = () => {
  return `
      <button class="btn-back">Back</button>
      <h1>Hello, Stations</h1>
      <div class=content-wrapper></div>
    `;
};

(() => {
  // Fetch data
  // Handle state/routing
})();

export const render = async () => {
  // Render main template
  const container = document.querySelector(".container");
  container.innerHTML = template();

  // Draw async content
  await drawStations();

  attachEventListeners();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {
  // Back button
  const backButton = document.querySelector(".btn-back");
  backButton.addEventListener("click", () => window.history.back());
};

/**
 * Draw list of station names and codes
 */
const drawStations = async () => {
  try {
    const stations = await metroSystem.fetchStations();
    const outputList = stations.map(({ code, name }) => `${name} (${code})`);

    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `
      <ul class="metro-stations">
        ${outputList.map((station) => `<li>${station}</li>`).join("")}
      </ul>
    `;
  } catch (error) {
    console.error("Failed to draw stations:", error);
    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `<div class="error">Failed to load station data</div>`;
  }
};
