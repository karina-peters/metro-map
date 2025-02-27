import { getAllStations, getAllCircuits, getTrainPositions, getStationName, getSequenceNum, getLineId } from "../modules/system.js";

import { printList } from "../utils/helpers.js";
import { TabManager } from "../utils/tabManager.js";

const tabs = [
  {
    buttonId: "stn-list-btn",
    contentId: "stn-list-content",
    shouldRefresh: false,
    loadData: async (elem) => await fillStations(elem),
  },
  {
    buttonId: "line-list-btn",
    contentId: "line-list-content",
    shouldRefresh: false,
    loadData: async (elem) => await fillLines(elem),
  },
  {
    buttonId: "pos-list-btn",
    contentId: "pos-list-content",
    shouldRefresh: true,
    loadData: async (elem) => await fillPositions(elem),
  },
];

/**
 * Initialize dashboard tabs and setup event listeners
 */
export async function initializeDashboard() {
  // Setup Dashboard tabs
  const tabManager = new TabManager(tabs);
  tabManager.init();
}

/**
 * Print a formatted list of station names and codes to the provided container
 */
async function fillStations(container) {
  const stations = await getAllStations();
  const outputList = stations.map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

  printList(container, outputList, true);
}

/**
 * Print a formatted list of circuit IDs and stations for each line to the provided container
 */
async function fillLines(container) {
  const circuits = await getAllCircuits();
  const outputList = await formatMetroLines(circuits);

  printList(container, outputList, true);
}

/**
 * Print a list of updated train positions to the provided container
 */
async function fillPositions(container) {
  const trainPositions = await getTrainPositions();
  const outputList = await formatTrainPositions(trainPositions);

  printList(container, outputList, true);
}

/**
 * Format circuit IDs and station names for each line
 * @param {Array<[string, Array<Circuits>]>} cktPairs - Array of [lineId, circuits] pairs
 * @returns {Promise<Array<string>>} Formatted list of circuits for each metro line
 */
async function formatMetroLines(cktPairs) {
  return Promise.all(
    cktPairs.map(async ([lineId, lineCircuits]) => {
      const circuitList = await formatCircuitList(lineCircuits);
      return `${lineId}: ${circuitList.join(", ")}`;
    })
  );
}

/**
 * Format circuit IDs and station names for display
 * @param {Array<Circuit>} circuits - Array of circuit
 * @returns {Promise<Array<string>>} Formatted list of circuits
 */
async function formatCircuitList(circuits) {
  return Promise.all(
    circuits.map(async (circuit) => {
      const stationName = circuit.stnCode ? ` ${await getStationName(circuit.stnCode)}` : "";
      return `[${circuit.id}]${stationName}`;
    })
  );
}

/**
 * Format train positions for display
 * @param {Array} trainPositions - Array of train position objects
 * @returns {Promise<Array<string>>} Formatted list of train positions
 */
async function formatTrainPositions(trainPositions) {
  return Promise.all(
    trainPositions
      .filter(({ LineCode }) => LineCode !== null)
      .map(async ({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
        const lineId = getLineId(LineCode, DirectionNum);
        const seqNum = await getSequenceNum(lineId, CircuitId);

        if (seqNum === undefined) {
          console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
        }

        const destination = await getStationName(DestinationStationCode);
        return `${TrainId} (${lineId}, DEST: ${destination}): ${CircuitId} [${seqNum}]`;
      })
  );
}
