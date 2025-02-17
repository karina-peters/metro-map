import { system } from "../services/system.js";

import { printList } from "../utils/helpers.js";
import { TabManager } from "../utils/tabManager.js";

export class Dashboard extends TabManager {
  constructor() {
    super([
      {
        buttonId: "stn-list-btn",
        contentId: "stn-list-content",
        shouldRefresh: false,
        loadData: async (elem) => await this.#fillStations(elem),
      },
      {
        buttonId: "line-list-btn",
        contentId: "line-list-content",
        shouldRefresh: false,
        loadData: async (elem) => await this.#fillLines(elem),
      },
      {
        buttonId: "pos-list-btn",
        contentId: "pos-list-content",
        shouldRefresh: true,
        loadData: async (elem) => await this.#fillPositions(elem),
      },
    ]);
  }

  /**
   * Print a formatted list of station names and codes to the provided container
   */
  #fillStations = async (container) => {
    const stations = await system.getAllStations();
    const outputList = stations.map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

    printList(container, outputList, true);
  };

  /**
   * Print a formatted list of circuit IDs and stations for each line to the provided container
   */
  #fillLines = async (container) => {
    const circuits = await system.getAllCircuits();
    const outputList = await this.#formatMetroLines(circuits);

    printList(container, outputList, true);
  };

  /**
   * Print a list of updated train positions to the provided container
   */
  #fillPositions = async (container) => {
    const trainPositions = await system.getTrainPositions();
    const outputList = await this.#formatTrainPositions(trainPositions);

    printList(container, outputList, true);
  };

  /**
   * Format circuit IDs and station names for each line
   * @param {Array<[string, Array<Circuits>]>} cktPairs - Array of [lineId, circuits] pairs
   * @returns {Promise<Array<string>>} Formatted list of circuits for each metro line
   */
  async #formatMetroLines(cktPairs) {
    return Promise.all(
      cktPairs.map(async ([lineId, lineCircuits]) => {
        const circuitList = await this.#formatCircuitList(lineCircuits);
        return `${lineId}: ${circuitList.join(", ")}`;
      })
    );
  }

  /**
   * Format circuit IDs and station names for display
   * @param {Array<Circuit>} circuits - Array of circuit
   * @returns {Promise<Array<string>>} Formatted list of circuits
   */
  async #formatCircuitList(circuits) {
    return Promise.all(
      circuits.map(async (circuit) => {
        const stationName = circuit.station ? ` ${await system.getStationName(circuit.station)}` : "";
        return `[${circuit.id}]${stationName}`;
      })
    );
  }

  /**
   * Format train positions for display
   * @param {Array} trainPositions - Array of train position objects
   * @returns {Promise<Array<string>>} Formatted list of train positions
   */
  async #formatTrainPositions(trainPositions) {
    return Promise.all(
      trainPositions
        .filter(({ LineCode }) => LineCode !== null)
        .map(async ({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
          const lineId = system.getLineId(LineCode, DirectionNum);
          const seqNum = await system.getSequenceNum(lineId, CircuitId);

          if (seqNum === undefined) {
            console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
          }

          const destination = await system.getStationName(DestinationStationCode);
          return `${TrainId} (${lineId}, DEST: ${destination}): ${CircuitId} [${seqNum}]`;
        })
    );
  }
}
