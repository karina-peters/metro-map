import { merge, Subject, takeUntil, timer } from "rxjs";
import p5 from "p5";

import { REFRESH_RATE } from "../helpers/system.js";
import { metroSystem } from "../helpers/system.js";
import StationBoard from "../components/stationBoard.js";
import { getOrInitializeMapValue } from "../helpers/helpers.js";

const headingText = "Stations";
const defaultMsg = ":(";

const manualRefresh$ = new Subject();
const pauseRefresh$ = new Subject();
const timer$ = timer(0, REFRESH_RATE).pipe(takeUntil(pauseRefresh$));

// Store board instances in a map by group ID
const header = ["LINE", "CAR", "DEST", "MIN"];
let stationBoard = null;
let selectedId = "E09"; // All
let selectedCodes = ["E09"];
let selectedGroup = 1;
let selectedPlatform = 0;
let stations = [];
let arrivals = new Map();

const template = () => {
  return `
  <div class="station-label"></div>
  <div class="board-target" id="board-1"></div>
  <div class="switch-target">
    <button class="btn-tracks">Switch Tracks</button>
    <button class="btn-platforms" hidden>Switch Platforms</button>
  </div>
  <div class="list-target"></div>
`;
};

export const render = async () => {
  // Render heading
  const textElement = document.querySelector(".header-target .heading-text");
  textElement.textContent = headingText;

  // Render main template
  const container = document.querySelector(".content-target");
  container.innerHTML = template();

  // Draw async content
  await drawStationBoard(selectedGroup);
  await drawStationList();

  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pause = () => {
  stationBoard.destroy$.next();
  pauseRefresh$.next();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {
  const trackButton = document.querySelector(".btn-tracks");
  trackButton.addEventListener("click", () => {
    selectedGroup = selectedGroup === 1 ? 2 : 1;
    manualRefresh$.next();
  });

  const platformButton = document.querySelector(".btn-platforms");
  platformButton.addEventListener("click", () => {
    selectedPlatform = selectedPlatform === 0 ? 1 : 0;
    manualRefresh$.next();
  });
};

/**
 * Draw a station board
 */
const drawStationBoard = async () => {
  try {
    const boardTarget = document.querySelector(`.board-target#board-${selectedGroup}`);

    arrivals = await getUpdatedArrivals();
    let msgTable = getCurrentMsgTable(selectedCodes[selectedPlatform], selectedGroup);
    stationBoard = new StationBoard(boardTarget, header, msgTable, selectedId, 1);

    // Initialize p5 sketch
    new p5(stationBoard.sketch, boardTarget);

    // Update table for selected station group
    merge(timer$, manualRefresh$).subscribe(async () => {
      const station = stations.entries().find(([_, value]) => selectedId === value.join(""));
      const labelTarget = document.querySelector(".station-label");
      labelTarget.textContent = `${station[0]}`;

      const platformButton = document.querySelector(".btn-platforms");
      if (station[1].length > 1) {
        platformButton.removeAttribute("hidden");
      } else {
        platformButton.setAttribute("hidden", true);
      }

      arrivals = await getUpdatedArrivals();
      const msgTable = getCurrentMsgTable(selectedCodes[selectedPlatform], selectedGroup);
      stationBoard.data$.next({ msgTable, stationId: selectedId });
    });
  } catch (error) {
    console.error(`Failed to draw station board ${selectedGroup}:`, error);
    const container = document.querySelector(`.board-target#board-${selectedGroup}`);
    container.innerHTML = `<div class="error">Failed to load position data</div>`;
  }
};

const drawStationList = async () => {
  try {
    const listTarget = document.querySelector(".list-target");

    for (const station of stations) {
      const stationId = station[1].join("");
      const button = document.createElement("button");
      button.id = `ID${stationId}`;
      button.classList.add("btn-dark", "btn-station");
      button.textContent = station[0];
      button.value = stationId;

      button.addEventListener("click", (event) => {
        if (event.currentTarget.value !== selectedId) {
          selectButton(event.currentTarget.value, station[1]);

          manualRefresh$.next();
        }
      });

      listTarget.appendChild(button);
    }

    // Select the button with the default selected id
    // TODO: this seems hacky but oh well - maybe make a function that creates the id
    const defaultStation = stations.entries().find(([_, value]) => selectedId === value.join(""));
    selectButton(selectedId, defaultStation[1]);
  } catch (error) {
    console.error("Failed to draw station list:", error);
    const container = document.querySelector(".list-target");
    container.innerHTML = `<div class="error">Failed to load station data</div>`;
  }
};

/**
 * Fetch updated arrivals data
 */
// TODO: we don't really need to recreate this map every time, just update the inner arrays
const getUpdatedArrivals = async () => {
  const arrivalMap = new Map();

  try {
    const arrivalData = await metroSystem.fetchArrivals(selectedCodes);

    for (const arrival of arrivalData) {
      const stnCodeToGroup = getOrInitializeMapValue(arrivalMap, arrival.LocationCode, new Map());
      const arrivals = getOrInitializeMapValue(stnCodeToGroup, arrival.Group, []);

      arrivals.push(arrival);
    }
  } catch {}

  return arrivalMap;
};

const getStations = async () => {
  const stationData = await metroSystem.fetchStations();
  const stationMap = new Map();

  for (const station of stationData) {
    const stationCodes = getOrInitializeMapValue(stationMap, station.name, []);
    stationCodes.push(station.code);
  }

  return stationMap;
};

/**
 * Constructs a nested array of arrival messages based on data for the provided station id
 * @param {string} groupId - Group to display
 * @returns an Array of message strings
 */
const getCurrentMsgTable = (platformId, groupId) => {
  console.log(platformId, groupId);
  const station = arrivals.get(platformId.toString());
  const group = station?.get(groupId.toString());

  return group ? group.map((a) => [a.Line, a.Car, a.Destination, a.Min]) : [[defaultMsg]];
};

/**
 * Deselects currently selected station button and selects button for provided station code
 * @param {string} stationId - Station to display
 */
const selectButton = (stationId, stationCodes) => {
  // Unselect currently selected button if exists
  const selectedBtn = document.querySelector(".btn-station.selected");
  if (selectedBtn) {
    selectedBtn.classList.remove("selected");
  }

  // Select button for station <stationCode>
  const button = document.querySelector(`.btn-selected#ID${stationId}`);
  if (button) {
    button.classList.add("selected");
  }

  selectedId = stationId;
  selectedCodes = stationCodes;
};

(async () => {
  // Fetch data
  stations = await getStations();
})();
