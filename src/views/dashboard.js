import { system } from "../services/system.js";
import { printList } from "../utils/helpers.js";

export class Dashboard {
  constructor() {}

  /**
   * Display a list of station names and codes
   * @param {HTMLElement} parentElement - The element to display the stations in
   */
  async displayStations(parentElement) {
    const stations = await system.getAllStations();
    const outputList = stations.map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

    printList(parentElement, outputList, true);
  }

  /**
   * Display a list of circuit IDs and stations for each line
   * @param {HTMLElement} parentElement - The element to display the circuits in
   */
  async displayLines(parentElement) {
    const circuits = await system.getAllCircuits();
    const outputList = await this.#formatMetroLines(circuits);

    printList(parentElement, outputList, true);
  }

  /**
   * Display a list of updated train positions
   * @param {HTMLElement} parentElement - The element to display the train positions in
   */
  async displayPositionsList(parentElement) {
    const trainPositions = await system.getTrainPositions();
    const outputList = await this.#formatPositionList(trainPositions);

    printList(parentElement, outputList, true);
  }

  /**
   * Format circuit IDs and station names for each line
   * @param {Array} circuits - Array of [lineId, circuits] pairs
   * @returns {Promise<Array<string>>} Formatted list of circuits
   */
  async #formatMetroLines(circuits) {
    return Promise.all(
      circuits.map(async ([lineId, lineCircuits]) => {
        const circuitList = await Promise.all(
          lineCircuits.map(async (circuit) => {
            const stationName = circuit.station ? ` ${await system.getStationName(circuit.station)}` : "";
            return `[${circuit.id}]${stationName}`;
          })
        );
        return `${lineId}: ${circuitList.join(", ")}`;
      })
    );
  }

  /**
   * Format train positions for display
   * @param {Array} trainPositions - Array of train position objects
   * @returns {Promise<Array<string>>} Formatted list of train positions
   */
  async #formatPositionList(trainPositions) {
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
