import { Circuit } from "../models/circuit.js";
import { WMATAClient } from "../repositories/wmata.js";
import { getOrInitializeMapValue } from "../utils/helpers.js";

const STATIONS_PATH = "data/stations.json";
const REGIONS_PATH = "data/regions.json";

class System {
  #WMATAClient;
  #stnCodeToName;
  #lineToCktList;
  #lineToCktSeqMap;
  #lineToRegSeqMap;

  constructor() {
    if (!System.instance) {
      this.#WMATAClient = new WMATAClient();

      this.#stnCodeToName = new Map(); // Map< string, string >
      this.#lineToCktList = new Map(); // Map< string, Array< Circuit > >
      this.#lineToCktSeqMap = new Map(); // Map< string, Map< string, string > >
      this.#lineToRegSeqMap = new Map(); // Map< string, Map< string, Object > >

      System.instance = this;
    }

    return System.instance;
  }

  /**
   * Get a line id for the provided line code and direction indicator
   * @param {string} lineCode the line code (e.g. BL)
   * @param {string} lineNum the line direction indicator (1 or 2)
   * @returns a line identifier
   */
  getLineId(lineCode, lineNum) {
    return `${lineCode}-${lineNum}`;
  }

  /**
   * Get a list of all station codes and names
   * @returns {Promise<Array<[string, string]>>} A list of station code-name pairs
   */
  async getAllStations() {
    if (this.#stnCodeToName.size === 0) {
      await this.#populateStations();
    }

    return [...system.#stnCodeToName];
  }

  /**
   * Get the name of a station given its code
   * @param {string} code The station code
   * @returns {Promise<string | undefined>} The station name, or undefined if not found
   */
  async getStationName(code) {
    if (this.#stnCodeToName.size === 0) {
      await this.#populateStations();
    }

    return this.#stnCodeToName.get(code);
  }

  /**
   * Get a list of all circuits for all lines
   * @returns {Promise<Array<[string, Array<Circuit>]>>} A list of line-circuit pairs
   */
  async getAllCircuits() {
    if (this.#lineToCktList.size === 0) {
      await this.#populateLines();
    }

    return [...system.#lineToCktList];
  }

  /**
   * Get the circuits for a specific line
   * @param {string} lineId The line identifier (e.g., "BL-1")
   * @returns {Promise<Array<Circuit> | undefined>} A list of circuits for the given line, or undefined if not found
   */
  async getCircuits(lineId) {
    if (this.#lineToCktList.size === 0) {
      await this.#populateLines();
    }

    return system.#lineToCktList.get(lineId);
  }

  /**
   * Get the circuits for a specific line within a given region
   * @param {string} lineId The line identifier (e.g., "BL-1")
   * @param {string} region The region name (e.g., "All", "DC", etc.)
   * @returns {Promise<Array<Circuit> | undefined>} A list of circuits within the specified region, or undefined if not found
   */
  async getCircuitsInRegion(lineId, region) {
    if (this.#lineToCktList.size === 0) {
      await this.#populateLines();
    }

    const circuits = system.#lineToCktList.get(lineId);
    if (region === "All") {
      return circuits;
    }

    const regBounds = await system.getRegionBounds(region, lineId);
    return circuits?.slice(regBounds.origin, regBounds.terminus);
  }

  /**
   * Get the sequence number of a circuit within a line
   * @param {string} lineId The line identifier (e.g., "BL-1")
   * @param {string} circuitId The circuit identifier
   * @returns {Promise<number | undefined>} The sequence number of the circuit, or undefined if not found
   */
  async getSequenceNum(lineId, circuitId) {
    if (this.#lineToCktSeqMap.size === 0) {
      await this.#populateLines();
    }

    return this.#lineToCktSeqMap.get(lineId)?.get(circuitId);
  }

  /**
   * Get the bounds of a region for a given line
   * @param {string} region The region name (e.g., "All", "DC", etc.)
   * @param {string} lineId The line identifier (e.g., "BL-1")
   * @returns {Promise<{origin: number, terminus: number} | undefined>} The start and end indices of the region, or undefined if not found
   */
  async getRegionBounds(region, lineId) {
    if (this.#lineToRegSeqMap.size === 0) {
      await this.#populateRegions();
    }

    return this.#lineToRegSeqMap.get(region)?.get(lineId);
  }

  /**
   * Retrieve realtime train positions from the WMATA API
   * @returns a list of train positions
   */
  async getTrainPositions() {
    return await this.#WMATAClient.fetchTrainPositions();
  }

  /**
   * Fetch station information and associate station names with codes
   */
  async #populateStations() {
    const stations = await fetch(STATIONS_PATH).then((res) => res.json());

    if (stations === null || stations.length === 0) {
      console.error("Station information is missing!");
    }

    // Populate map with station codes and names
    for (const { Code, Name } of stations) {
      this.#stnCodeToName.set(Code, Name);
    }
  }

  /**
   * Fetch region information and associate region names with sequence bounds
   */
  async #populateRegions() {
    const regions = await fetch(REGIONS_PATH).then((res) => res.json());

    if (regions === null || regions.length === 0) {
      console.error("Region information is missing!");
      return;
    }

    for (const { Name, Lines } of regions) {
      // Add region to map if not yet created
      const seqMap = getOrInitializeMapValue(this.#lineToRegSeqMap, Name, new Map());

      // Populate map with region names and sequence boundaries
      for (const { Code, Track, Origin, Terminus } of Lines) {
        const lineId = this.getLineId(Code, Track);
        seqMap.set(lineId, { origin: Origin, terminus: Terminus });
      }
    }
  }

  /**
   * Fetch route information and associate route lines with circuits
   */
  async #populateLines() {
    const routes = await this.#WMATAClient.fetchRoutes();

    if (routes === null || routes.length === 0) {
      console.error("Route information is missing!");
      return;
    }

    for (const { LineCode, TrackNum, TrackCircuits } of routes) {
      const lineId = this.getLineId(LineCode, TrackNum);

      // Add line if not yet created
      const crktArray = getOrInitializeMapValue(this.#lineToCktList, lineId, []);
      const seqMap = getOrInitializeMapValue(this.#lineToCktSeqMap, lineId, new Map());

      // Ensure circuits are in ascending sequence order
      TrackCircuits.sort((a, b) => a.SeqNum - b.SeqNum);

      // Populate maps with lines, circuit ids and sequence numbers
      for (const { SeqNum, StationCode, CircuitId } of TrackCircuits) {
        crktArray?.push(new Circuit(CircuitId, SeqNum, StationCode, 0, 0));
        seqMap?.set(CircuitId, SeqNum);
      }
    }
  }
}

// Create and export a single instance
export const system = new System();
