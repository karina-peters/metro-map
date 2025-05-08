import { getOrInitializeMapValue } from "./helpers.js";

export const REFRESH_RATE = 8000;
export const REGIONS = {
  ALL: "All",
  DC: "DC",
};

class SystemService {
  constructor() {
    this.dataPromise = null;
    this.dataLoaded = false;

    this.stnCodeToName = new Map(); // Map<string, string>
    this.cktListCache = new Map(); // Map<string, Map<string, Array<string>>
  }

  async init() {
    this.dataPromise = Promise.all([this._loadStationNames(), this._loadCircuits()]).then(() => (this.dataLoaded = true));
  }

  getLineId = (lineCode, lineNum) => `${lineCode}-${lineNum}`;

  async getStationName(code) {
    if (!this.dataLoaded) await this.dataPromise;

    const name = this.stnCodeToName.get(code);
    if (!name) {
      throw new Error("Code not found");
    }

    return name;
  }

  async getNextStationCkt(cktId, lineCode, lineNum) {
    if (!this.dataLoaded) await this.dataPromise;

    const entries = this.cktListCache.get(REGIONS.ALL);
    const lineId = this.getLineId(lineCode, lineNum);
    const circuits = lineNum === 1 ? entries.get(lineId) : Array.from(entries.get(lineId)).reverse();

    const currentCkt = circuits.find((c) => c.id === cktId);
    if (!currentCkt) {
      console.warn(`Circuit [${cktId}] is undefined`);
      return null;
    }

    // TODO: handle circuits beyond terminal station
    const nextStnCkt = circuits.find((c) => {
      let hasStation = c.stnCode !== null;
      if (lineNum === 1) {
        return hasStation && c.seqNum >= currentCkt.seqNum;
      } else {
        return hasStation && c.seqNum <= currentCkt.seqNum;
      }
    });

    if (!nextStnCkt) {
      console.error("Station not found");
    }

    return nextStnCkt;
  }

  async getCircuits(regionId) {
    if (!this.dataLoaded) await this.dataPromise;

    const circuits = this.cktListCache.get(regionId);
    if (!circuits) {
      throw new Error("Code not found");
    }

    return Array.from(circuits.entries().map(([key, value]) => ({ lineId: key, circuits: value })));
  }

  async fetchStations() {
    const response = await fetch("/api/stations", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json().then((r) => r.data);
  }

  async fetchLines() {
    const response = await fetch("/api/lines", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json().then((r) => r.data);
  }

  async fetchCircuits(params = undefined) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`/api/circuits${params ? `?${queryParams}` : ""}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json().then((r) => r.data);
  }

  async fetchTrainPositions() {
    const response = await fetch("/api/trains", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json().then((r) => r.data.filter((t) => t.DestinationStationCode !== null).sort((a, b) => a.TrainId - b.TrainId));
  }

  async fetchArrivals(stations) {
    const response = await fetch(`/api/arrivals/${stations.join(",")}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json().then((r) => r.data);
  }

  async _loadStationNames() {
    const stations = await this.fetchStations();

    if (stations === null || stations.length === 0) {
      console.error("Station information is missing!");
      return;
    }

    // Populate map with station codes and names
    for (const { code, name } of stations) {
      this.stnCodeToName.set(code, name);
    }
  }

  async _loadCircuits() {
    for (const regionId of Object.values(REGIONS)) {
      const cktsByLine = await this.fetchCircuits({ regionId: regionId });

      if (cktsByLine === null || cktsByLine.length === 0) {
        console.error(`Circuit information for region ${regionId} is missing!`);
        return;
      }

      // Populate region map with lines and their circuits
      const regionToLines = getOrInitializeMapValue(this.cktListCache, regionId, new Map());
      for (const { lineId, circuits } of cktsByLine) {
        regionToLines.set(lineId, circuits);
      }
    }
  }
}

const metroSystem = new SystemService();

export { metroSystem };
