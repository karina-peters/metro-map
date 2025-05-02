import { metroSystem } from "../helpers/system.js";

const headingText = "Stations";

const template = () => {
  return `
      <div class=content-wrapper></div>
    `;
};

(() => {
  // Fetch data
  // Handle state/routing
})();

export const render = async () => {
  // Render heading
  const textElement = document.querySelector(".header-target .heading-text");
  textElement.textContent = headingText;

  // Render main template
  const container = document.querySelector(".content-target");
  container.innerHTML = template();

  // Draw async content
  await drawStations();

  attachEventListeners();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {};

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
