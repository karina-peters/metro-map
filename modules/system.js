import { Circuit } from "./circuit.js";
import { WMATAClient } from "./wmata.js";

const STATIONS_PATH = "data/stations.json";
const REGIONS_PATH = "data/regions.json";

export class System {
  constructor() {
    this.WMATAClient = new WMATAClient();

    this.lineToCkts = new Map(); // Map< string, Array< Circuit > >
    this.stnCodeToName = new Map(); // Map< string, string >
    this.cktIdToSeq = new Map(); // Map< string, Map< string, string > >
    this.regToSeq = new Map(); // Map< string, Map< string, Object > >
  }

  /**
   * Fetch station information and associate station names with codes
   */
  async populateStations() {
    try {
      const stations = await fetch(STATIONS_PATH).then((res) => res.json());

      // Populate map with station codes and names
      for (const { Code, Name } of stations) {
        this.stnCodeToName.set(Code, Name);
      }
    } catch (error) {
      console.error(`Unable to process stations: ${error}`);
    }
  }

  /**
   * Fetch region information and associate region names with sequence bounds
   */
  async populateRegions() {
    try {
      const regions = await fetch(REGIONS_PATH).then((res) => res.json());

      for (const { Name, Lines } of regions) {
        // Add region to map if not yet created
        const seqMap = getOrInitializeMapValue(this.regToSeq, Name, new Map());

        // Populate map with region names and bounds
        for (const { Code, Track, Origin, Terminus } of Lines) {
          const lineId = this.#getLineId(Code, Track);
          seqMap.set(lineId, { origin: Origin, terminus: Terminus });
        }
      }
    } catch (error) {
      console.error(`Unable to process regions: ${error}`);
    }
  }

  /**
   * Fetch route information and associate route lines with circuits
   */
  async populateLines() {
    try {
      const routes = await this.WMATAClient.fetchRoutes();

      for (const { LineCode, TrackNum, TrackCircuits } of routes) {
        const lineId = this.#getLineId(LineCode, TrackNum);

        // Add line to maps if not yet created
        const crktArray = getOrInitializeMapValue(this.lineToCkts, lineId, []);
        const seqMap = getOrInitializeMapValue(this.cktIdToSeq, lineId, new Map());

        // Ensure circuits are in ascending sequence order
        TrackCircuits.sort((a, b) => a.SeqNum - b.SeqNum);

        // Populate maps with lines, circuit ids and sequence numbers
        for (const { SeqNum, StationCode, CircuitId } of TrackCircuits) {
          crktArray?.push(new Circuit(CircuitId, SeqNum, StationCode, 0, 0));
          seqMap?.set(CircuitId, SeqNum);
        }
      }
    } catch (error) {
      console.error(`Unable to process lines: ${error}`);
    }
  }

  /**
   * Display a list of station names and codes
   */
  displayStations() {
    // Create list of elements to be printed
    const outputList = [...this.stnCodeToName].map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

    // Display stations list
    const dataElement = document.querySelector("#sidebar-data");
    printList(dataElement, outputList, true);
  }

  /**
   * Display a list of circuit ids and stations for each line
   */
  displayLines() {
    // Create list of elements to be printed
    const outputList = [...this.lineToCkts].map(([lineId, circuits]) => {
      const circuitList = circuits
        .map((circuit) => {
          const stationName = circuit.station !== null ? ` ${this.stnCodeToName.get(circuit.station)}` : "";
          return `[${circuit.id}]${stationName}`;
        })
        .join(", ");

      return `${lineId}: ${circuitList}`;
    });

    // Display lines list
    const dataElement = document.querySelector("#sidebar-data");
    printList(dataElement, outputList, true);
  }

  /**
   * Fetch and display a list of updated train positions
   */
  async displayPositionsList() {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    // Create list of elements to be printed
    const outputList = trainPositions
      .filter(({ LineCode }) => LineCode !== null)
      .map(({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
        const lineId = this.#getLineId(LineCode, DirectionNum);
        const seqNum = this.cktIdToSeq.get(lineId)?.get(CircuitId);

        // Log undefined circuits
        if (seqNum === undefined) {
          console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
        }

        return `${TrainId} (${lineId}, DEST: ${this.stnCodeToName.get(DestinationStationCode)}): ${CircuitId} [${seqNum}]`;
      });

    // Display positions list
    const dataElement = document.querySelector("#sidebar-data");
    printList(dataElement, outputList, true);
  }

  /**
   * Fetch and display a map of updated train positions
   * @param {string} region the region to display (All, DC, ...)
   */
  async displayPositions(region = "All") {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    // Create list of elements to be printed
    const outputList = [...this.lineToCkts].map(([lineId, circuits]) => {
      // Extract relevant track segment for the region
      const regionBounds = this.regToSeq.get(region)?.get(lineId);
      const trackCircuits = region !== "All" ? circuits?.slice(regionBounds.origin, regionBounds.terminus) : circuits;

      // Set circuit output with updated data
      const circuitList = trackCircuits
        .map((circuit) => {
          const circuitIndicator = "_";
          const stationIndicator = circuit.station !== null ? `${this.stnCodeToName.get(circuit.station)}` : "";
          const trainIndicator = trainPositions.some(({ CircuitId, LineCode, DirectionNum }) => {
            return CircuitId === circuit.id && this.#getLineId(LineCode, DirectionNum) === lineId;
          })
            ? "*"
            : "";

          return `${circuitIndicator}${stationIndicator}${trainIndicator}`;
        })
        .join("");

      return `${lineId}: ${circuitList}`;
    });

    // Display positions map
    const dataElement = document.getElementById("data");
    printList(dataElement, outputList, true);
  }

  /**
   * Get a line id for the provided line code and direction indicator
   * @param {string} lineCode the line code (e.g. BL)
   * @param {string} lineNum the line direction indicator (1 or 2)
   * @returns a line identifier
   */
  #getLineId(lineCode, lineNum) {
    return `${lineCode}-${lineNum}`;
  }
}

export function clearData(dataElement) {
  dataElement.innerHTML = "";
}

function printParagraph(parent, output, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  const newChild = document.createElement("p");
  newChild.innerHTML = output;

  parent.appendChild(newChild);
}

function printList(parent, outputList, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  for (const element of outputList) {
    printParagraph(parent, element);
  }
}

function getOrInitializeMapValue(map, key, defaultValue) {
  if (!map.has(key)) {
    map.set(key, defaultValue);
  }
  return map.get(key);
}
