import { Circuit } from "./circuit.js";
import { WMATAClient } from "./wmata.js";

const STATIONS_PATH = "data/stations.json";
const REGIONS_PATH = "data/regions.json";

export class System {
  constructor() {
    this.WMATAClient = new WMATAClient();

    this.lines = {}; // Map< string, Map< string, Array<Circuit> > >

    this.stnCodeToName = {}; // Map< string, string >
    this.cktIdToSeq = {}; // Map< string, Map< string, string > >
    this.regToSeq = {}; // Map< string, Array< Map< string, string > > >
  }

  /**
   * Fetch station information and associate station names with codes
   */
  async populateStations() {
    try {
      const stations = await fetch(STATIONS_PATH).then((res) => res.json());

      for (const { Code, Name } of stations) {
        this.stnCodeToName[Code] = Name;
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
        // Add region if not yet created
        this.regToSeq[Name] = this.regToSeq[Name] || {};

        for (const { Code, Track, Origin, Terminus } of Lines) {
          const lineId = this.#getLineId(Code, Track);
          this.regToSeq[Name][lineId] = { origin: Origin, terminus: Terminus };
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
        // Add line if not yet created
        const lineId = this.#getLineId(LineCode, TrackNum);
        this.lines[lineId] = this.lines[lineId] || [];
        this.cktIdToSeq[lineId] = this.cktIdToSeq[lineId] || {};

        for (const { SeqNum, StationCode, CircuitId } of TrackCircuits) {
          // TODO: figure out how to do this more safely/efficiently
          this.lines[lineId].splice(SeqNum, 0, new Circuit(CircuitId, SeqNum, StationCode, 0, 0));
          this.cktIdToSeq[lineId][CircuitId] = SeqNum;
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
    const outputList = Object.entries(this.stnCodeToName).map(([stationCode, stationName]) => `${stationName} (${stationCode})`);

    // Display stations list
    const dataElement = document.getElementById("data");
    printList(dataElement, outputList, true);
  }

  /**
   * Display a list of circuit ids and stations for each line
   */
  displayLines() {
    const outputList = Object.entries(this.lines).map(([lineId, circuits]) => {
      const circuitList = circuits
        .map((circuit) => {
          const stationName = circuit.station !== null ? ` ${this.stnCodeToName[circuit.station]}` : "";
          return `[${circuit.id}]${stationName}`;
        })
        .join(", ");

      return `${lineId}: ${circuitList}`;
    });

    // Display lines list
    const dataElement = document.getElementById("data");
    printList(dataElement, outputList, true);
  }

  /**
   * Fetch and display a list of updated train positions
   */
  async displayPositionsList() {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    const outputList = trainPositions
      .filter(({ LineCode }) => LineCode !== null)
      .map(({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
        const lineId = this.#getLineId(LineCode, DirectionNum);
        const seqNum = this.cktIdToSeq[lineId]?.[CircuitId];

        // Log undefined circuits
        if (seqNum === undefined) {
          console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
        }

        return `${TrainId} (${lineId}, DEST: ${this.stnCodeToName[DestinationStationCode]}): ${CircuitId} [${seqNum}]`;
      });

    // Display positions list
    const dataElement = document.getElementById("data");
    printList(dataElement, outputList, true);
  }

  /**
   * Fetch and display a map of updated train positions
   * @param {string} region the region to display (All, DC, ...)
   */
  async displayPositions(region = "All") {
    const trainPositions = await this.WMATAClient.fetchTrainPositions();

    const outputList = Object.entries(this.lines).map(([lineId, circuits]) => {
      // Extract relevant track segment for the region
      const bounds = this.regToSeq[region]?.[lineId];
      const trackCircuits = region !== "All" ? circuits?.slice(bounds.origin, bounds.terminus) : circuits;

      // Set circuit output for updated data
      const circuitList = trackCircuits
        .map((circuit) => {
          const circuitIndicator = "_";
          const stationIndicator = circuit.station !== null ? `${this.stnCodeToName[circuit.station]}` : "";
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

export function printParagraph(parent, output, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  const newChild = document.createElement("p");
  newChild.innerHTML = output;

  parent.appendChild(newChild);
}

export function printList(parent, outputList, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  for (const element of outputList) {
    printParagraph(parent, element);
  }
}
