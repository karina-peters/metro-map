import { getHeaders, getUrl, getLineId, getOrInitializeMapValue } from "./utils.js";

import regionData from "./data/regions.json" with { type: "json" };

// Data caches
export const lineToCktList = new Map(); // Map< string, Array< Circuit > >
export const lineToRegSeqMap = new Map(); // Map< string, Map< string, Object > >

/**
 * Fetch and store necessary static data from the WMATA API
 */
export const preloadData = async () => {
  await Promise.all([populateLines(), populateRegions()]);
};

/**
 * Fetch and load region information
 * @private
 */
const populateRegions = async () => {
  console.log("populating regions...");

  try {
    const regions = regionData;

    if (!regions || regions.length === 0) {
      throw new Error("Region information is missing or empty");
    }

    for (const { Id, Lines } of regions) {
      // Add region to map if not yet created
      const seqMap = getOrInitializeMapValue(lineToRegSeqMap, Id, new Map());

      // Populate map with region names and sequence boundaries
      for (const { Code, Track, Origin, Terminus } of Lines) {
        const lineId = getLineId(Code, Track);
        seqMap.set(lineId, { origin: Origin, terminus: Terminus });
      }
    }
  } catch (error) {
    console.error("Failed to load region data:", error);
  }
};

/**
 * Fetch and load route and circuit information
 * @private
 */
const populateLines = async () => {
  console.log("populating lines...");

  try {
    const response = await fetch(getUrl("TrainPositions/StandardRoutes", { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
    });

    const routes = await response.json().then((json) => json["StandardRoutes"] || []);
    if (!routes || routes.length === 0) {
      throw new Error("Route information is missing or empty");
    }

    for (const { LineCode, TrackNum, TrackCircuits } of routes) {
      const lineId = getLineId(LineCode, TrackNum);

      // Add line if not yet created
      const crktArray = getOrInitializeMapValue(lineToCktList, lineId, []);

      // Ensure circuits are in ascending sequence order
      const sortedCircuits = [...TrackCircuits].sort((a, b) => a.SeqNum - b.SeqNum);

      // Populate maps with lines, circuit ids and sequence numbers
      for (const { SeqNum, StationCode, CircuitId } of sortedCircuits) {
        crktArray.push({
          id: CircuitId,
          seqNum: SeqNum,
          stnCode: StationCode,
        });
      }
    }
  } catch (error) {
    console.error("Failed to load line data:", error);
  }
};
