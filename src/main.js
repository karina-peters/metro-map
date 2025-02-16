import { Dashboard } from "./views/dashboard.js";
import { MetroMap } from "./views/map.js";
import { clearData } from "./utils/helpers.js";

const map = new MetroMap();
const dashboard = new Dashboard();
let refreshIntervalId = -1;

const positionsListButton = document.querySelector("button#positionsL");
const stationsButton = document.querySelector("button#stations");
const linesButton = document.querySelector("button#lines");
const hideButton = document.querySelector("button#hide");
const helperButton = document.querySelector("button#helper");
const regionSelect = document.querySelector("#region-select");

const dataContainer = document.querySelector("#data");
const sidebarContainer = document.querySelector("#sidebar-data");

function displayMap(region) {
  clearInterval(refreshIntervalId);
  map.displayMap(dataContainer, region);

  // Update every eight seconds
  refreshIntervalId = setInterval(() => map.displayMap(dataContainer, region), 8000);
}

// Setup event handlers
positionsListButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  dashboard.displayPositionsList(sidebarContainer);
});

stationsButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  dashboard.displayStations(sidebarContainer);
});

linesButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  dashboard.displayLines(sidebarContainer);
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
