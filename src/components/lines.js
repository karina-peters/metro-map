import { getAllCircuits, getStationName } from "../system";

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

export const renderComponent = async () => {
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
    const circuits = await getAllCircuits();
    const outputList = await formatMetroLines(circuits);

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

/**
 * Format circuit IDs and station names for each line
 * @param {Array<[string, Array<Circuits>]>} cktPairs - Array of [lineId, circuits] pairs
 * @returns {Promise<Array<string>>} Formatted list of circuits for each metro line
 */
const formatMetroLines = async (cktPairs) => {
  return Promise.all(
    cktPairs.map(async ([lineId, lineCircuits]) => {
      const circuitList = await formatCircuitList(lineCircuits);
      return `${lineId}: ${circuitList.join(", ")}`;
    })
  );
};

/**
 * Format circuit IDs and station names for display
 * @param {Array<Circuit>} circuits - Array of circuit
 * @returns {Promise<Array<string>>} Formatted list of circuits
 */
const formatCircuitList = async (circuits) => {
  return Promise.all(
    circuits.map(async (circuit) => {
      const stationName = circuit.stnCode ? ` ${await getStationName(circuit.stnCode)}` : "";
      return `[${circuit.id}]${stationName}`;
    })
  );
};
