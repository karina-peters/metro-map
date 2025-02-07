import { System, clearData } from "./modules/system.js";

let system = new System();
let refreshIntervalId = -1;

const positionsListButton = document.querySelector("button#positionsL");
const stationsButton = document.querySelector("button#stations");
const linesButton = document.querySelector("button#lines");
const hideButton = document.querySelector("button#hide");
const helperButton = document.querySelector("button#helper");
const regionSelect = document.querySelector("#region-select");
const sidebarContainer = document.querySelector("#sidebar-data");

function displayMap(region) {
  clearInterval(refreshIntervalId);
  system.displayPositions(region);

  // Update every eight seconds
  refreshIntervalId = setInterval(() => system.displayPositions(region), 8000);
}

// Init
await system.populateLines();
await system.populateStations();
await system.populateRegions();

// Setup event handlers
positionsListButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayPositionsList();
});

stationsButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayStations();
});

linesButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayLines();
});

regionSelect.addEventListener("change", (event) => {
  displayMap(regionSelect.value);
});

hideButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  clearData(sidebarContainer);
});

helperButton.addEventListener("click", (event) => {
  // add stuff to test here
});

// Show map
displayMap(regionSelect.value);
