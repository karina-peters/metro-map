import { getLineId, getTrainPositions, getStationName, getSequenceNum } from "../system";

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

export const renderComponent = async () => {
  // Render main template
  const container = document.querySelector(".container");
  container.innerHTML = template();

  // Draw async content
  await fillPositions();

  attachEventListeners();
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
const fillPositions = async () => {
  try {
    const positionData = await getTrainPositions();
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
        const lineId = getLineId(LineCode, DirectionNum);
        const seqNum = await getSequenceNum(lineId, CircuitId);

        if (seqNum === undefined) {
          console.warn(`Sequence number is undefined for circuit [${CircuitId}]`);
        }

        const destination = await getStationName(DestinationStationCode);
        return `${TrainId} (${lineId}, DEST: ${destination}): ${CircuitId} [${seqNum}]`;
      })
  );
};
