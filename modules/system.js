import { Circuit } from "./circuit.js";
import { WMATAClient } from "./wmata.js";

const STATIONS_PATH = "data/stations.json";
const REGIONS_PATH = "data/regions.json";

export class System {
  constructor() {
    this.WMATAClient = new WMATAClient();

    this.stnCodeToName = new Map(); // Map< string, string >
    this.lineToCktList = new Map(); // Map< string, Array< Circuit > >
    this.lineToCktSeqMap = new Map(); // Map< string, Map< string, string > >
    this.lineToRegSeqMap = new Map(); // Map< string, Map< string, Object > >
  }

  /**
   * Fetch station information and associate station names with codes
   */
  async populateStations() {
    const stations = await fetch(STATIONS_PATH).then((res) => res.json());

    if (stations === null || stations.length === 0) {
      console.error("Station information is missing!");
    }

    // Populate map with station codes and names
    for (const { Code, Name } of stations) {
      this.stnCodeToName.set(Code, Name);
    }
  }

  /**
   * Fetch region information and associate region names with sequence bounds
   */
  async populateRegions() {
    const regions = await fetch(REGIONS_PATH).then((res) => res.json());

    if (regions === null || regions.length === 0) {
      console.error("Region information is missing!");
      return;
    }

    for (const { Name, Lines } of regions) {
      // Add region to map if not yet created
      const seqMap = getOrInitializeMapValue(this.lineToRegSeqMap, Name, new Map());

      // Populate map with region names and sequence boundaries
      for (const { Code, Track, Origin, Terminus } of Lines) {
        const lineId = this.#getLineId(Code, Track);
        seqMap.set(lineId, { origin: Origin, terminus: Terminus });
      }
    }
  }

  /**
   * Fetch route information and associate route lines with circuits
   */
  async populateLines() {
    const routes = await this.WMATAClient.fetchRoutes();

    if (routes === null || routes.length === 0) {
      console.error("Route information is missing!");
      return;
    }

    for (const { LineCode, TrackNum, TrackCircuits } of routes) {
      const lineId = this.#getLineId(LineCode, TrackNum);

      // Add line if not yet created
      const crktArray = getOrInitializeMapValue(this.lineToCktList, lineId, []);
      const seqMap = getOrInitializeMapValue(this.lineToCktSeqMap, lineId, new Map());

      // Ensure circuits are in ascending sequence order
      TrackCircuits.sort((a, b) => a.SeqNum - b.SeqNum);

      // Populate maps with lines, circuit ids and sequence numbers
      for (const { SeqNum, StationCode, CircuitId } of TrackCircuits) {
        crktArray?.push(new Circuit(CircuitId, SeqNum, StationCode, 0, 0));
        seqMap?.set(CircuitId, SeqNum);
      }
    }
  }

  /**
   * Display a list of station names and codes
   */
  displayStations(parentElement) {
    // Create list of elements to be printed
    const outputList = [...this.stnCodeToName].map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

    // Display stations list
    printList(parentElement, outputList, true);
  }

  /**
   * Display a list of circuit ids and stations for each line
   */
  displayLines(parentElement) {
    // Create list of elements to be printed
    const outputList = [...this.lineToCktList].map(([lineId, circuits]) => {
      const circuitList = circuits
        .map((circuit) => {
          const stationName = circuit.station !== null ? ` ${this.stnCodeToName.get(circuit.station)}` : "";
          return `[${circuit.id}]${stationName}`;
        })
        .join(", ");

      return `${lineId}: ${circuitList}`;
    });

    // Display lines list
    printList(parentElement, outputList, true);
  }

  /**
   * Fetch and display a list of updated train positions
   */
  async displayPositionsList(parentElement) {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    // Create list of elements to be printed
    const outputList = trainPositions
      .filter(({ LineCode }) => LineCode !== null)
      .map(({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
        const lineId = this.#getLineId(LineCode, DirectionNum);
        const seqNum = this.lineToCktSeqMap.get(lineId)?.get(CircuitId);

        // Log undefined circuits
        if (seqNum === undefined) {
          console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
        }

        return `${TrainId} (${lineId}, DEST: ${this.stnCodeToName.get(DestinationStationCode)}): ${CircuitId} [${seqNum}]`;
      });

    // Display positions list
    printList(parentElement, outputList, true);
  }

  /**
   * Fetch and display a map of updated train positions
   * @param {string} region the region to display (All, DC, ...)
   */
  async displayPositions(parentElement, region = "All") {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    // Create list of elements to be printed
    const outputList = [...this.lineToCktList].map(([lineId, circuits]) => {
      // Extract relevant track segment for the region
      const regionBounds = this.lineToRegSeqMap.get(region)?.get(lineId);
      const trackCircuits = region !== "All" ? circuits?.slice(regionBounds.origin, regionBounds.terminus) : circuits;

      // Set circuit output with updated data
      const circuitList = trackCircuits
        .map((circuit) => {
          const circuitHasStation = circuit.station !== null;
          const trainInCircuit = trainPositions.some(({ CircuitId, LineCode, DirectionNum }) => {
            return CircuitId === circuit.id && this.#getLineId(LineCode, DirectionNum) === lineId;
          });

          const circuitIndicator = trainInCircuit ? "|" : "·";
          const stationIndicator = circuitHasStation ? `${this.stnCodeToName.get(circuit.station)}` : "";

          return `${circuitIndicator}${stationIndicator}`;
        })
        .join("");

      return `${lineId}: ${circuitList}`;
    });

    // Display positions map
    printList(parentElement, outputList, true);
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
