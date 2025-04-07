import { REFRESH_RATE, metroSystem } from "../system.js";
import { Subject } from "rxjs";

const refresh$ = new Subject();

// TODO: add this to state manager
const state = {
  refreshIntervalId: null,
};

const template = () => {
  return `
    <button class="btn-back">Back</button>
    <h1>Hello, Trains</h1>
    <div class=content-wrapper></div>
  `;
};

(() => {
  // Fetch data
  // Handle state/routing
})();

export const render = async () => {
  // Render main template
  const container = document.querySelector(".container");
  container.innerHTML = template();

  // Draw async content
  await drawPositions();

  // Setup refresh subscription
  refresh$.subscribe(async () => {
    await drawPositions();
  });

  // Setup periodic refreshes
  state.refreshIntervalId = setInterval(() => refresh$.next(), REFRESH_RATE);
  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pause = () => {
  clearInterval(state.refreshIntervalId);
  state.refreshIntervalId = null;
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {
  // Back button
  const backButton = document.querySelector(".btn-back");
  backButton.addEventListener("click", () => window.history.back());
};

/**
 * Print a list of updated train positions to the provided container
 */
const drawPositions = async () => {
  try {
    const positionData = await metroSystem.fetchTrainPositions();
    const outputList = await formatTrainPositions(positionData);

    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `
    <ul class="metro-trains">
        ${outputList.map((train) => `<li>${train}</li>`).join("")}
    </ul>
    `;
  } catch (error) {
    console.error("Failed to draw train positions:", error);
    const container = document.querySelector(".content-wrapper");
    container.innerHTML = `<div class="error">Failed to load position data</div>`;
  }
};

/**
 * Format train positions for display
 * @param {Array} trainPositions - Array of train position objects
 * @returns {Promise<Array<string>>} Formatted list of train positions
 */
const formatTrainPositions = async (trainPositions) => {
  return Promise.all(
    trainPositions
      .filter(({ LineCode }) => LineCode !== null)
      .map(async ({ TrainId, LineCode, DirectionNum, CircuitId, DestinationStationCode }) => {
        const lineId = metroSystem.getLineId(LineCode, DirectionNum);

        const destination = await metroSystem.getStationName(DestinationStationCode);
        return `${TrainId} (${lineId}, DEST: ${destination}): ${CircuitId}`;
      })
  );
};
