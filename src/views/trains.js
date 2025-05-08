import { Subject, takeUntil, merge, timer } from "rxjs";
import p5 from "p5";

import { metroSystem, REFRESH_RATE } from "../helpers/system.js";
import TrainBoard from "../components/trainBoard.js";

const headingText = "Trains";
const emptyMsg = "No trains running!";
const errorMsg = "Data fetch error :(";

const manualRefresh$ = new Subject();
const pauseRefresh$ = new Subject();
const timer$ = timer(0, REFRESH_RATE).pipe(takeUntil(pauseRefresh$));

let trainBoard = null;
let trainPositions = [];
let selectedId = "";

const template = () => {
  return `
    <div class="train-label"></div>
    <div class="board-target"></div>
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

  // Refresh content
  timer$.subscribe(async () => (trainPositions = await getTrainPositions()));

  await drawTrainSign();
  await drawTrainList();

  attachEventListeners();
};

/**
 * Pauses component updates
 */
export const pause = () => {
  trainBoard.destroy$.next();
  pauseRefresh$.next();
};

/**
 * Attaches all required event listeners
 */
const attachEventListeners = () => {};

const drawTrainSign = async () => {
  try {
    const boardTarget = document.querySelector(".board-target");
    let selectedTrain = trainPositions?.find((t) => t.TrainId === selectedId);

    // Set board messages
    let msgArray = [];
    if (trainPositions === null) {
      msgArray = [errorMsg];
    } else if (trainPositions.length === 0) {
      msgArray = [emptyMsg];
    } else {
      msgArray = await getCurrentMsgList(selectedTrain);
    }

    // Draw board with p5.js
    trainBoard = new TrainBoard(boardTarget, msgArray, selectedTrain?.LineCode, selectedTrain?.trainId);
    new p5(trainBoard.sketch, boardTarget);

    // Update messages for selected train
    merge(timer$, manualRefresh$).subscribe(async () => {
      if (trainPositions === null) {
        msgArray = [errorMsg];
      } else if (trainPositions.length === 0) {
        msgArray = [emptyMsg];
      } else {
        const labelTarget = document.querySelector(".train-label");
        labelTarget.textContent = `Train ${selectedId}`;

        selectedTrain = trainPositions?.find((t) => t.TrainId === selectedId) || trainPositions[0];
      }

      trainBoard.data$.next({ msgArray, lineId: selectedTrain?.LineCode, trainId: selectedTrain?.TrainId });
    });
  } catch (error) {
    console.error("Failed to draw train board:", error);
    const container = document.querySelector(".board-target");
    container.innerHTML = `<div class="error">Failed to load position data</div>`;
  }
};

const drawTrainList = async () => {
  try {
    const listTarget = document.querySelector(".list-target");

    timer$.subscribe(async () => {
      if (trainPositions === null) {
        return;
      }

      listTarget.innerHTML = "";

      // Draw a button for each train
      trainPositions.map((train) => {
        const button = document.createElement("button");
        button.id = `ID${train.TrainId}`;
        button.classList.add("btn-dark", "btn-train", `line-${train.LineCode}`);
        button.textContent = train.TrainId;
        button.value = train.TrainId;

        button.addEventListener("click", (event) => {
          if (event.currentTarget.value !== selectedId) {
            selectButton(event.currentTarget.value);

            manualRefresh$.next();
          }
        });

        listTarget.appendChild(button);
      });

      // Select the button with the default selected id
      selectButton(selectedId);
    });
  } catch (error) {
    console.error("Failed to draw train list:", error);
    const container = document.querySelector(".list-target");
    container.innerHTML = `<div class="error">Failed to load position data</div>`;
  }
};

/**
 * Constructs a list of messages based on the position and destination of the train with the provided id
 * @param {string} trainId - Train to display
 * @returns an Array of message strings
 */
const getCurrentMsgList = async (train) => {
  const msgArray = [];
  if (!train) {
    return null;
  }

  // e.g. [DESTINATION, GREENBELT]
  const destStation = await metroSystem.getStationName(train.DestinationStationCode);
  if (destStation) {
    msgArray.push("Destination", `${destStation}`);
  }

  // e.g. [THIS IS, METRO CENTER]
  const nextStnCkt = await metroSystem.getNextStationCkt(train.CircuitId, train.LineCode, train.DirectionNum);
  if (nextStnCkt) {
    const stationName = await metroSystem.getStationName(nextStnCkt.stnCode);
    const posPhrase = nextStnCkt.id === train.CircuitId ? "This is" : "Next stop is";

    msgArray.push(posPhrase, stationName);
  } else {
    msgArray.push("Position unknown");
  }

  return msgArray;
};

const getTrainPositions = async () => {
  try {
    const positionData = await metroSystem.fetchTrainPositions();
    return positionData;
  } catch {
    return null;
  }
};

/**
 * Deselects currently selected train button and selects button for provided train id
 * @param {string} trainId - Train to display
 */
const selectButton = (trainId) => {
  // Unselect currently selected button if exists
  const selectedBtn = document.querySelector(".btn-train.selected");
  if (selectedBtn) {
    selectedBtn.classList.remove("selected");
  }

  // Select button for train <trainId>
  const button = document.querySelector(`.btn-train#ID${trainId}`);
  if (button) {
    button.classList.add("selected");
  }

  selectedId = trainId;
};

(async () => {
  // Fetch data
  trainPositions = await getTrainPositions();
  selectedId = trainPositions && trainPositions[0] ? trainPositions[0].TrainId : "";
})();
