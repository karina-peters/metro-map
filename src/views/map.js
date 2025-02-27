import { getTrainPositions, getAllCircuits, getCircuitsInRegion, getLineId, getStationName } from "../modules/system.js";

import { printList } from "../utils/helpers.js";
import { TabManager } from "../utils/tabManager.js";

// Data refresh period (ms)
const REFRESH_RATE = 8000;

const tabs = [
  {
    buttonId: "map-vis-btn",
    contentId: "map-vis-content",
    shouldRefresh: true,
    refreshRate: REFRESH_RATE,
    loadData: async (elem) => await fillMap(elem),
  },
];

// Set default region
let region = "All";

/**
 * Initialize map tabs and setup event listeners
 */
export async function initializeMap() {
  // Setup Map tabs
  const tabManager = new TabManager(tabs);
  await tabManager.init(tabs);

  const regionSelect = document.querySelector("#region-select");
  regionSelect.addEventListener("change", async (event) => {
    region = regionSelect.value;
    tabManager.refreshContent();
  });
}

/**
 * Print a map with updated train positions to the provided container
 * @param {string} region - The region to display (All, DC, ...)
 */
export async function fillMap(container) {
  const trainPositions = await getTrainPositions();
  const circuits = await getAllCircuits();
  const outputList = await formatMetroLines(circuits, trainPositions, region);

  printList(container, outputList, true);
}

/**
 * Format metro lines with train positions for display
 * @param {Array} circuits - Array of [lineId, circuits] pairs
 * @param {Array} trainPositions - List of current train positions
 * @param {string} region - The region to display (All, DC, ...)
 * @returns {Promise<Array<string>>} Formatted list of metro lines
 */
async function formatMetroLines(circuits, trainPositions, region) {
  return Promise.all(
    circuits.map(async ([lineId]) => {
      const regCircuits = await getCircuitsInRegion(lineId, region);
      const circuitList = await formatCircuitList(regCircuits, trainPositions, lineId);

      return `${lineId}: ${circuitList}`;
    })
  );
}

/**
 * Format circuits with train presence indicators and station names
 * @param {Array} circuits - List of circuits
 * @param {Array} trainPositions - List of train positions
 * @param {string} lineId - The line identifier
 * @returns {Promise<string>} Formatted string of circuits
 */
async function formatCircuitList(circuits, trainPositions, lineId) {
  const formattedCircuits = await Promise.all(
    circuits.map(async (circuit) => {
      const trainInCircuit = trainPositions.some(({ CircuitId, LineCode, DirectionNum }) => {
        return CircuitId === circuit.id && getLineId(LineCode, DirectionNum) === lineId;
      });

      const circuitIndicator = trainInCircuit ? "|" : "·";
      const stationIndicator = circuit.stnCode ? ` ${await getStationName(circuit.stnCode)}` : "";

      return `${circuitIndicator}${stationIndicator}`;
    })
  );

  return formattedCircuits.join("");
}
