import { Circuit } from "./circuit.js";
import { WMATAClient } from "./wmata.js";

export class System {
  constructor() {
    this.WMATAClient = new WMATAClient();

    this.lines = {}; // Map< string, Map< string, Array<Circuit> > >

    this.stnCodeToName = {}; // Map< string, string >
    this.cktIdToSeq = {}; // Map< string, Map< string, string > >
    this.regToSeq = {}; // Map< string, Array< Map< string, string > > >
  }

  /**
   * Fetch station info and associate their names with codes
   */
  populateStations() {
    fetch("data/stations.json")
      .then((res) => res.json())
      .then((json) => {
        json.forEach(({ Code, Name }) => {
          this.stnCodeToName[Code] = Name;
        });
      })
      .catch((error) => alert(`Something went wrong: ${error}`));
  }

  /**
   * Fetch region info and associate their names with sequence bounds
   */
  populateRegions() {
    fetch("data/regions.json")
      .then((res) => res.json())
      .then((json) => {
        json.forEach(({ name, lines }) => {
          // Add region if not yet created
          this.regToSeq[name] = this.regToSeq[name] || {};

          lines.forEach(({ code, track, origin, terminus }) => {
            const lineId = this.#getLineId(code, track);
            this.regToSeq[name][lineId] = { origin, terminus };
          });
        });
      })
      .catch((error) => alert(`Something went wrong: ${error}`));
  }

  /**
   * Fetch route information and associate their lines with circuits
   */
  populateLines() {
    this.WMATAClient.fetchRoutes()
      .then((json) => {
        json["StandardRoutes"].forEach(({ LineCode, TrackNum, TrackCircuits }) => {
          // Add line if not yet created
          const lineId = this.#getLineId(LineCode, TrackNum);
          this.lines[lineId] = this.lines[lineId] || [];
          this.cktIdToSeq[lineId] = this.cktIdToSeq[lineId] || {};

          TrackCircuits.forEach(({ SeqNum, StationCode, CircuitId }) => {
            this.lines[lineId].splice(SeqNum, 0, new Circuit(CircuitId, SeqNum, StationCode, 0, 0));
            this.cktIdToSeq[lineId][CircuitId] = SeqNum;
          });
        });
      })
      .catch((error) => alert(`Something went wrong: ${error}`));
  }

  /**
   * Display a list of station names and codes
   */
  displayStations() {
    const dataElement = document.getElementById("data");
    clearData(dataElement);

    for (let code of Object.keys(this.stnCodeToName)) {
      const output = `${this.stnCodeToName[code]} (${code})`;
      printParagraph(dataElement, output);
    }
  }

  /**
   * Display a list of circuit ids and stations for each line
   */
  displayLines() {
    const dataElement = document.getElementById("data");
    clearData(dataElement);

    for (let lineId of Object.keys(this.lines)) {
      const outputList = this.lines[lineId]
        .map((circuit) => {
          let output = `[${circuit.id}]`;

          // This is a station
          if (circuit.station != null) {
            output += ` ${this.stnCodeToName[circuit.station]}`;
          }

          return output;
        })
        .join(", ");

      printParagraph(dataElement, `${lineId}: ${outputList}`);
    }
  }

  /**
   * Fetch and display a list of updated train positions
   */
  displayPositionsList() {
    this.WMATAClient.fetchTrainPositions()
      .then((json) => json["TrainPositions"])
      .then((positions) => {
        const dataElement = document.getElementById("data");
        clearData(dataElement);

        const outputList = positions
          .filter(({ LineCode }) => LineCode !== null)
          .map(({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
            const lineId = this.#getLineId(LineCode, DirectionNum);
            const seqNum = this.cktIdToSeq[lineId]?.[CircuitId];

            // Log undefined circuits
            if (seqNum === undefined) {
              console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
            }

            return `${TrainId} (${lineId}, DEST: ${this.stnCodeToName[DestinationStationCode]}): ${CircuitId} [${seqNum}]`;
          })
          .join("<br>");

        printParagraph(dataElement, outputList);
      });
  }

  /**
   * Fetch and display a map of updated train positions
   * @param {string} region the region to display (All, DC, ...)
   */
  displayPositions(region = "All") {
    this.WMATAClient.fetchTrainPositions()
      .then((json) => json["TrainPositions"])
      .then((positions) => {
        // Clear old data
        const dataElement = document.getElementById("data");
        clearData(dataElement);

        for (const lineId of Object.keys(this.lines)) {
          // Extract relevant track segment for the region
          const bounds = this.regToSeq[region]?.[lineId];
          const trackCircuits = region !== "All" ? this.lines[lineId]?.slice(bounds.origin, bounds.terminus) : this.lines[lineId];

          // Set circuit output for updated data
          const outputList = trackCircuits
            .map((circuit) => {
              let output = "_";

              // This is a station!
              if (circuit.station != null) {
                output += `${this.stnCodeToName[circuit.station]}`;
              }

              // A train is here!
              if (
                positions.some(({ CircuitId, LineCode, DirectionNum }) => {
                  return CircuitId === circuit.id && this.#getLineId(LineCode, DirectionNum) === lineId;
                })
              ) {
                output += "*";
              }

              return output;
            })
            .join("");

          printParagraph(dataElement, `${lineId}: ${outputList}`);
        }
      });
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

export function printParagraph(parent, output) {
  const newChild = document.createElement("p");
  newChild.innerHTML = output;

  parent.appendChild(newChild);
}
