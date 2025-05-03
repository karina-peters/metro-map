import { backgroundColor, dotColor, lineColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";
import { BehaviorSubject, timer } from "rxjs";

const pauseDuration = 4000;

const dotRadius = 4;
const dotGap = 2;
const dotUnit = dotRadius * 2 + dotGap;

// Dot counts
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 5;
const paddingY = 4;
const numRows = charHeight + 2 * paddingY;
const highlightWidth = 3;

class DotMatrixSketch {
  /**
   *
   * @param {Array<string>} msgArray List of messages to loop through
   * @param {string} lineId Line id for the color
   * @param {string} trainId Train id to track changes
   */
  constructor(msgArray, lineId, trainId, parentElt) {
    this.data$ = new BehaviorSubject({ msgArray, lineId, trainId });
    this.msgArray = msgArray;
    this.trainId = trainId;
    this.highlightColor = lineColor[lineId];
    this.currentMsgIndex = 0;
    this.timerSubscription = null;

    this.parentElt = parentElt;
    this.numCols = Math.floor(this.parentElt.clientWidth / dotUnit);
    this.breakpoint = 600;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
    } else {
    }

    // Calculate dimensions
    const width = this.numCols * dotUnit - dotGap;
    const height = numRows * dotUnit - dotGap;

    this.canvasSize = { width, height };
  };

  sketch = async (p) => {
    // Preserve context
    const self = this;

    // Call p5.js functions
    p.setup = () => {
      p.createCanvas(self.canvasSize.width, self.canvasSize.height);
      p.noLoop();

      p.windowResized = () => {
        self.setCanvasSize();

        p.resizeCanvas(self.canvasSize.width, self.canvasSize.height);
        p.redraw();
      };

      self.data$.subscribe(({ msgArray, lineId, trainId }) => {
        // Update internal state
        self.msgArray = msgArray;
        self.highlightColor = lineColor[lineId];

        // If new train id, reset and start new timer
        if (trainId !== self.trainId) {
          console.log(`Train ID changed from ${self.trainId} to ${trainId}`);
          self.trainId = trainId;
          self.currentMsgIndex = 0;

          // Cancel existing timer subscription if it exists
          if (self.timerSubscription) {
            self.timerSubscription.unsubscribe();
          }

          // Force redraw immediately
          self.startMessageTimer(p);
        }
      });

      console.log("DotMatrixSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      // Start the message timer
      self.startMessageTimer(p);

      console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  startMessageTimer = (p) => {
    // Clear existing subscription
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Draw initial state
    this.drawBoard(p);
    this.drawMessage(p);

    // Set up timer for subsequent updates
    this.timerSubscription = timer(pauseDuration, pauseDuration).subscribe(() => {
      this.currentMsgIndex = (this.currentMsgIndex + 1) % this.msgArray.length;
      p.background(backgroundColor);
      this.drawBoard(p);
      this.drawMessage(p);
    });
  };

  drawBoard = (p) => {
    let dotX = dotRadius;
    let dotY = dotRadius;

    for (let i = 0; i < numRows; i++) {
      dotX = dotRadius;

      for (let j = 0; j < this.numCols; j++) {
        const color = j < highlightWidth ? this.highlightColor : dotColor.off;
        p.fill(color);
        p.ellipseMode(p.RADIUS);
        p.ellipse(dotX, dotY, dotRadius, dotRadius);

        dotX += dotUnit;
      }

      dotY += dotUnit;
    }
  };

  drawMessage = (p) => {
    let { startX, startY } = this.calcStartPos();

    let msgWidth = 0;
    for (const char of this.msgArray[this.currentMsgIndex]) {
      // Render visible characters
      if (msgWidth > -charWidth && msgWidth < this.numCols) {
        this.renderChar(p, char, startX, startY);
      }

      msgWidth += charWidth + charGap;
      startX += dotUnit * (charWidth + charGap);
    }
  };

  renderChar = (p, char, startX, startY) => {
    const charMatrix = fontData[char.toUpperCase()] || fontData[" "]; // Default to space if character not found
    let dotY = startY;

    for (const row of charMatrix) {
      let dotX = startX;

      for (const dotVal of row) {
        if (dotVal === 1) {
          p.fill(dotColor.on);
          p.ellipseMode(p.RADIUS);
          p.ellipse(dotX, dotY, dotRadius, dotRadius);
        }

        dotX += dotUnit;
      }

      dotY += dotUnit;
    }
  };

  calcStartPos = () => {
    let msgColCount = this.msgArray[this.currentMsgIndex].length * (charWidth + charGap) - charGap;

    let startX = dotRadius + (highlightWidth + 2) * dotUnit;
    let startY = dotUnit * paddingY + dotRadius;
    if (msgColCount < this.numCols) {
      // Center the message if it fits
      startX += Math.floor((this.numCols - msgColCount) / 2) * dotUnit;
    } else {
      // Left align with padding if not
      startX += paddingX * dotUnit;
    }

    return { startX, startY };
  };

  cleanup = () => {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  };
}

export default DotMatrixSketch;
