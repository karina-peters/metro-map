import { metroSystem, REFRESH_RATE } from "../helpers/system.js";
import { Subject, takeUntil, timer } from "rxjs";

const pauseRefresh$ = new Subject();
const headingText = "Trains";

const template = () => {
  return `
    <div class=content-wrapper></div>
  `;
};

(() => {
  // Fetch data
  // Handle state/routing
})();

export const render = async () => {
  // Render heading
  const textElement = document.querySelector(".header-target .heading-text");
  textElement.textContent = headingText;

  // Render main template
  const container = document.querySelector(".content-target");
  container.innerHTML = template();

  // Refresh content
  timer(0, REFRESH_RATE)
    .pipe(takeUntil(pauseRefresh$))
    .subscribe(async () => {
      await drawPositions();
    });

  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pause = () => {
  pauseRefresh$.next();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {};

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
