import { metroSystem } from "../system.js";

const template = () => {
  return `
      <button class="btn-back">Back</button>
      <h1>Hello, Lines</h1>
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
  await drawLines();

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
 * Print a formatted list of circuit IDs and stations for each line to the provided container
 */
const drawLines = async () => {
  try {
    const outputList = await metroSystem.fetchLines();

    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `
      <ul class="metro-lines">
        ${outputList.map((line) => `<li>${line}</li>`).join("")}
      </ul>
    `;
  } catch (error) {
    console.error("Failed to draw lines:", error);
    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `<div class="error">Failed to load line data</div>`;
  }
};
