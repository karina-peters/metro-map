import { getTrainPositions, getAllCircuits, getCircuitsInRegion, getLineId, getStationName } from "../system.js";
import { Subject } from "rxjs";

// Set constants
const REFRESH_RATE = 8000;
const REGIONS = {
  ALL: "All",
  DC: "DC",
};

const refresh$ = new Subject();

// Set component state
const state = {
  region: REGIONS.ALL,
  showLabels: false,
  refreshIntervalId: null,
};

// Define component template
const template = () => `
  <button class="btn-back">Back</button>
  <h1>Hello, Map</h1>
  <div class="controls">
    <div class="region-control">
      <label for="region-select">Map Region: </label>
      <select name="regions" id="region-select">
        <option value="${REGIONS.ALL}" ${state.region === REGIONS.ALL ? "selected" : ""}>${REGIONS.ALL}</option>
        <option value="${REGIONS.DC}" ${state.region === REGIONS.DC ? "selected" : ""}>${REGIONS.DC}</option>
      </select>
    </div>
    <div class="label-control">
      <input type="checkbox" id="labels-check" name="labels-check" ${state.showLabels ? "checked" : ""}/>
      <label for="labels-check">Show station labels</label>
    </div>
  </div>
  <div class="content-wrapper"></div>
`;

/**
 * Render component template and setup event listeners
 */
export const renderComponent = async () => {
  // Render main template
  const container = document.querySelector(".container");
  container.innerHTML = template();

  // Draw async content
  await drawMap();

  // Setup refresh subscription
  refresh$.subscribe(async () => {
    await drawMap();
  });

  // Setup periodic refreshes
  state.refreshIntervalId = setInterval(() => refresh$.next(), REFRESH_RATE);

  // Setup event listeners
  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pauseComponent = () => {
  clearInterval(state.refreshIntervalId);
  state.refreshIntervalId = null;
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {
  // Back button
  const backButton = document.querySelector(".btn-back");
  backButton.addEventListener("click", () => window.history.back());

  // Region selector
  const regionSelect = document.querySelector("#region-select");
  regionSelect.addEventListener("change", () => {
    state.region = regionSelect.value;
    refresh$.next();
  });

  // Labels checkbox
  const labelsInput = document.querySelector("#labels-check");
  labelsInput.addEventListener("change", () => {
    state.showLabels = labelsInput.checked;
    refresh$.next();
  });
};

/**
 * Draws map with current train positions
 */
const drawMap = async () => {
  try {
    const circuits = await getAllCircuits();
    const trainPositions = await getTrainPositions();
    const outputList = await formatMetroLines(circuits, trainPositions, state.region);

    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `
      <ul class="metro-lines">
        ${outputList.map((line) => `<li>${line}</li>`).join("")}
      </ul>
    `;
  } catch (error) {
    console.error("Failed to draw map:", error);
    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `<div class="error">Failed to load map data</div>`;
  }
};

/**
 * Formats metro lines with train positions for display
 * @param {Array} circuits - Array of [lineId, circuits] pairs
 * @param {Array} trainPositions - List of current train positions
 * @param {string} region - The region to display
 * @returns {Promise<Array<string>>} Formatted list of metro lines
 */
const formatMetroLines = async (circuits, trainPositions, region) => {
  return Promise.all(
    circuits.map(async ([lineId]) => {
      const regCircuits = await getCircuitsInRegion(lineId, region);
      const circuitList = await formatCircuitList(regCircuits, trainPositions, lineId);

      return `${lineId}: ${circuitList}`;
    })
  );
};

/**
 * Formats circuits with train presence indicators and station names
 * @param {Array} circuits - List of circuits
 * @param {Array} trainPositions - List of train positions
 * @param {string} lineId - The line identifier
 * @returns {Promise<string>} Formatted string of circuits
 */
const formatCircuitList = async (circuits, trainPositions, lineId) => {
  const formattedCircuits = await Promise.all(
    circuits.map(async (circuit) => {
      const hasTrainInCircuit = trainPositions.some(
        ({ CircuitId, LineCode, DirectionNum }) => CircuitId === circuit.id && getLineId(LineCode, DirectionNum) === lineId
      );
      const circuitIndicator = hasTrainInCircuit ? "|" : "·";

      let stationIndicator = "";
      if (circuit.stnCode && state.showLabels) {
        stationIndicator = ` ${await getStationName(circuit.stnCode)}`;
      }

      return `${circuitIndicator}${stationIndicator}`;
    })
  );

  return formattedCircuits.join("");
};
