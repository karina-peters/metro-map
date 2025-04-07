import { REGIONS, REFRESH_RATE, metroSystem } from "../system.js";
import { Subject } from "rxjs";

const refresh$ = new Subject();

// Set component state
// TODO: add this to state manager
const state = {
  regionId: REGIONS.ALL,
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
        <option value="${REGIONS.ALL}" ${state.regionId === REGIONS.ALL ? "selected" : ""}>${REGIONS.ALL}</option>
        <option value="${REGIONS.DC}" ${state.regionId === REGIONS.DC ? "selected" : ""}>${REGIONS.DC}</option>
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
export const render = async () => {
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
export const pause = () => {
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
    state.regionId = regionSelect.value;
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
    const circuits = await metroSystem.getCircuits(state.regionId);
    const trainPositions = await metroSystem.fetchTrainPositions();
    const outputList = await formatMetroLines(circuits, trainPositions);

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

const formatMetroLines = async (cktsByLine, trainPositions) => {
  return Promise.all(
    cktsByLine.map(async (line) => {
      const circuitList = await Promise.all(line.circuits.map(async (ckt) => getMapSymbol(ckt, line.lineId, trainPositions)));

      return `${line.lineId}: ${circuitList.join("")}`;
    })
  );
};

const getMapSymbol = async (circuit, lineId, trainPositions) => {
  const hasTrainInCircuit = trainPositions.some(
    ({ CircuitId, LineCode, DirectionNum }) => CircuitId === circuit.id && metroSystem.getLineId(LineCode, DirectionNum) === lineId
  );
  const circuitIndicator = hasTrainInCircuit ? "|" : "·";

  let stationIndicator = "";
  if (circuit.stnCode && state.showLabels) {
    stationIndicator = ` ${await metroSystem.getStationName(circuit.stnCode)}`;
  }

  return `${circuitIndicator}${stationIndicator}`;
};
