import { System, clearData } from "./modules/system.js";

let system = new System();
let refreshIntervalId = -1;

// Init
system.populateLines();
system.populateStations();
system.populateRegions();

// Setup event handlers
const positionsListButton = document.querySelector("button#positionsL");
const positionsButton = document.querySelector("button#positions");
const stationsButton = document.querySelector("button#stations");
const linesButton = document.querySelector("button#lines");
const hideButton = document.querySelector("button#hide");
const helperButton = document.querySelector("button#helper");
const dataContainer = document.querySelector("#data");

positionsListButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayPositionsList();
});

positionsButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayPositions();

  // Update every eight seconds
  refreshIntervalId = setInterval(() => system.displayPositions(), 8000);
});

stationsButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayStations();
});

linesButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayLines();
});

hideButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  clearData(dataContainer);
});

helperButton.addEventListener("click", (event) => {
  clearInterval(refreshIntervalId);
  system.displayPositions("DC");

  // Update every eight seconds
  refreshIntervalId = setInterval(() => system.displayPositions("DC"), 8000);
});
