import { merge, Subject, takeUntil, timer } from "rxjs";
import p5 from "p5";

import { REFRESH_RATE } from "../helpers/system.js";
import { metroSystem } from "../helpers/system.js";
import StationBoard from "../components/stationBoard.js";

const headingText = "Stations";

const manualRefresh$ = new Subject();
const pauseRefresh$ = new Subject();
const timer$ = timer(0, REFRESH_RATE).pipe(takeUntil(pauseRefresh$));

// Store board instances in a map by group ID
const stationBoards = {};
const header = ["LINE", "CAR", "DEST", "MIN"];
let selectedCode = "E09"; // All
let arrivals = { "1": [], "2": [] };

const template = () => {
  return `
  <div class="station-label"></div>
  <div class="board-target" id="board-1"></div>
  <div class="board-target" id="board-2"></div>
  <div class="list-target"></div>
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

  // Draw async content
  await drawStationBoard("1");
  await drawStationBoard("2");

  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pause = () => {
  Object.values(stationBoards).forEach((board) => {
    if (board) board.destroy$.next();
  });

  pauseRefresh$.next();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {};

/**
 * Draw a station board for the given group
 * @param {string} groupId - Group to display
 */
const drawStationBoard = async (groupId) => {
  try {
    const boardTarget = document.querySelector(`.board-target#board-${groupId}`);
    let msgTable = getCurrentMsgTable(groupId);
    stationBoards[groupId] = new StationBoard(boardTarget, header, msgTable, selectedCode, 1);

    // Initialize p5 sketch
    new p5(stationBoards[groupId].sketch, boardTarget);

    // Configure data subscriptions
    subscribeToUpdates(groupId);
  } catch (error) {
    console.error(`Failed to draw station board ${groupId}:`, error);
    const container = document.querySelector(`.board-target#board-${groupId}`);
    container.innerHTML = `<div class="error">Failed to load position data</div>`;
  }
};

/**
 * Configure subscriptions for board data updates
 * @param {string} groupId - Group to display
 */
const subscribeToUpdates = (groupId) => {
  const board = stationBoards[groupId];

  if (!board) {
    return;
  }

  // Update table for selected train
  merge(timer$, manualRefresh$).subscribe(async () => {
    arrivals = await getUpdatedArrivals();
    const msgTable = getCurrentMsgTable(groupId);
    board.data$.next({ msgTable, stationId: selectedCode });
  });
};

/**
 * Fetch updated arrivals data
 */
const getUpdatedArrivals = async () => {
  const arrivalData = await metroSystem.fetchArrivals(selectedCode);
  return Object.groupBy(arrivalData, ({ Group }) => (Group === "1" ? "1" : "2"));
};

/**
 * Constructs a nested array of arrival messages based on data for the provided station id
 * @param {string} groupId - Group to display
 * @returns an Array of message strings
 */
const getCurrentMsgTable = (groupId) => {
  const arrivalsForGroup = arrivals[groupId] && Array.isArray(arrivals[groupId]) ? arrivals[groupId] : [];
  return arrivalsForGroup.map((a) => {
    return [a.Line, a.Car, a.Destination, a.Min];
  });
};

/**
 * Draw list of station names and codes
 */
// const drawStations = async () => {
//   try {
//     const stations = await metroSystem.fetchStations();
//     const outputList = stations.map(({ code, name }) => `${name} (${code})`);

//     const container = document.querySelector(".content-wrapper");
//     container.innerHTML = `
//       <ul class="metro-stations">
//         ${outputList.map((station) => `<li>${station}</li>`).join("")}
//       </ul>
//     `;
//   } catch (error) {
//     console.error("Failed to draw stations:", error);
//     const container = document.querySelector(".content-wrapper");
//     container.innerHTML = `<div class="error">Failed to load station data</div>`;
//   }
// };
