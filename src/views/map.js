import { system } from "../services/system.js";
import { printList } from "../utils/helpers.js";

export class MetroMap {
  constructor() {}

  /**
   * Fetch and display a map with updated train positions
   * @param {HTMLElement} parentElement - The element to display the positions in
   * @param {string} region - The region to display (All, DC, ...)
   */
  async displayMap(parentElement, region = "All") {
    const trainPositions = await system.getTrainPositions();
    const circuits = await system.getAllCircuits();
    const outputList = await this.#formatMetroLines(circuits, trainPositions, region);

    printList(parentElement, outputList, true);
  }

  /**
   * Format metro lines with train positions for display
   * @param {Array} circuits - Array of [lineId, circuits] pairs
   * @param {Array} trainPositions - List of current train positions
   * @param {string} region - The region to display (All, DC, ...)
   * @returns {Promise<Array<string>>} Formatted metro lines
   */
  async #formatMetroLines(circuits, trainPositions, region) {
    return Promise.all(
      circuits.map(async ([lineId]) => {
        const regCircuits = await system.getCircuitsInRegion(lineId, region);
        const circuitList = await this.#formatCircuitList(regCircuits, trainPositions, lineId);

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
  async #formatCircuitList(circuits, trainPositions, lineId) {
    const formattedCircuits = await Promise.all(
      circuits.map(async (circuit) => {
        const trainInCircuit = trainPositions.some(({ CircuitId, LineCode, DirectionNum }) => {
          return CircuitId === circuit.id && system.getLineId(LineCode, DirectionNum) === lineId;
        });

        const circuitIndicator = trainInCircuit ? "|" : "·";
        const stationIndicator = circuit.station ? ` ${await system.getStationName(circuit.station)}` : "";

        return `${circuitIndicator}${stationIndicator}`;
      })
    );

    return formattedCircuits.join("");
  }
}
