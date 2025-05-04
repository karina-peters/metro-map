import { BehaviorSubject, timer, interval } from "rxjs";

import { backgroundColor, dotColor, lineColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";

const pauseDuration = 3000;
const scrollPause = 2000;
const scrollSpeed = 50;

const dotRadius = 4;
const dotGap = 2;
const dotUnit = dotRadius * 2 + dotGap;

// Dot counts
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 2;
const paddingY = 4;
const numRows = charHeight + 2 * paddingY;
const highlightWidth = 4;

class DotMatrixSketch {
  /**
   * Create new DotMatrixSketch instance
   * @param {Array<string>} msgArray - List of messages to loop through
   * @param {string} lineId - Line id for the color
   * @param {string} trainId - Train id to track changes
   */
  constructor(msgArray, lineId, trainId, parentElt) {
    // Data
    this.data$ = new BehaviorSubject({ msgArray, lineId, trainId });
    this.msgArray = msgArray;
    this.trainId = trainId;
    this.highlightColor = lineColor[lineId];
    this.currentMsgIndex = 0;

    // Board State
    this.timer$ = null;
    this.scroll$ = null;
    this.scrollOffset = 0;
    this.isScrolling = false;
    this.scrollStep = 1;

    // Sizing
    this.parentElt = parentElt;
    this.numCols = 0;
    this.breakpoint = 600;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // TODO - Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
    } else {
    }

    this.numCols = Math.floor(this.parentElt.clientWidth / dotUnit);

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
        if (this.isScrolling) {
          console.log("scrolling...data update skipped");
          return;
        }

        self.msgArray = msgArray;
        self.highlightColor = lineColor[lineId];

        // If new train id, reset and start new timer
        if (trainId !== self.trainId) {
          self.trainId = trainId;
          self.currentMsgIndex = 0;

          if (self.timer$) {
            self.timer$.unsubscribe();
          }

          self.startMsgTimer(p);
        }
      });

      console.log("DotMatrixSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      // Start the message timer
      self.startMsgTimer(p);

      console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  /**
   * Start or restart the message display timer
   * Handles static and scrolling display based on message length
   * @param {Object} p - p5.js instance
   */
  startMsgTimer = (p) => {
    if (this.timer$) {
      this.timer$.unsubscribe();
    }

    this.scrollOffset = 0;
    this.isScrolling = false;

    this.drawBoard(p);
    this.drawMessage(p);

    const currentMsg = this.msgArray[this.currentMsgIndex];
    if (this.isMsgOverflow(currentMsg)) {
      const msgWidth = this.getMsgLength(currentMsg);

      // Message overflow - pause, then start scroll
      this.timer$ = timer(scrollPause).subscribe(() => {
        this.startScroll(p, msgWidth);
      });
    } else {
      // Message fits - cycle through as usual
      this.timer$ = timer(pauseDuration).subscribe(() => {
        this.nextMessage(p);
      });
    }
  };

  /**
   * Start scrolling animation for a message that doesn't fit on the display
   * @param {Object} p - p5.js instance
   * @param {number} msgWidth - Message width in number of dots
   */
  startScroll = (p, msgWidth) => {
    this.isScrolling = true;
    const scrollDistance = msgWidth + highlightWidth + 2 * paddingX;

    this.scroll$ = interval(scrollSpeed).subscribe(() => {
      this.scrollOffset += this.scrollStep;

      p.background(backgroundColor);
      this.drawBoard(p);
      this.drawMessage(p);

      if (this.scrollOffset >= scrollDistance) {
        this.scroll$.unsubscribe();
        this.nextMessage(p);
      }
    });
  };

  /**
   * Move to the next message in the list
   * @param {Object} p - p5.js instance
   */
  nextMessage = (p) => {
    this.scrollOffset = 0;
    this.isScrolling = false;
    this.currentMsgIndex = (this.currentMsgIndex + 1) % this.msgArray.length;

    this.clearSubscriptions();
    this.startMsgTimer(p);
  };

  /**
   * Draw the dot matrix board background with highlight color
   * @param {object} p - p5.js instance
   */
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

  /**
   * Draw the current message on the dot matrix board
   * Handles regular display and scrolling behavior
   * @param {object} p - p5.js instance
   */
  drawMessage = (p) => {
    let { startX, startY } = this.calcStartPos();

    if (this.isScrolling) {
      startX -= this.scrollOffset * dotUnit;
    }

    let msgWidth = 0;
    for (const char of this.msgArray[this.currentMsgIndex]) {
      const charStartX = startX + msgWidth;

      this.renderChar(p, char, charStartX, startY);

      msgWidth += dotUnit * (charWidth + charGap);
    }
  };

  /**
   * Render a single character on the dot matrix display
   * Only renders dots within the visible display area
   * @param {Object} p - p5.js instance
   * @param {string} char - Character to render
   * @param {number} startX - Starting X position in pixels
   * @param {number} startY - Starting Y position in pixels
   */
  renderChar = (p, char, startX, startY) => {
    const charMatrix = fontData[char.toUpperCase()] || fontData[" "]; // Default to space if character not found
    let dotY = startY;

    for (const row of charMatrix) {
      const scrollStart = (highlightWidth + paddingX) * dotUnit;
      const scrollEnd = (this.numCols - paddingX) * dotUnit - dotGap;

      let dotX = startX;

      for (const dotVal of row) {
        if (dotVal === 1 && dotX >= scrollStart && dotX <= scrollEnd) {
          p.fill(dotColor.on);
          p.ellipseMode(p.RADIUS);
          p.ellipse(dotX, dotY, dotRadius, dotRadius);
        }

        dotX += dotUnit;
      }

      dotY += dotUnit;
    }
  };

  /**
   * Calculate the starting position for drawing the message
   * Centers short messages and positions overflow messages for scrolling
   * @returns {Object} Object containing startX and startY coordinates in pixels
   */
  calcStartPos = () => {
    const message = this.msgArray[this.currentMsgIndex];

    let startX = dotRadius + highlightWidth * dotUnit;
    let startY = dotUnit * paddingY + dotRadius;
    let msgLength = this.getMsgLength(message);

    if (!this.isMsgOverflow(message)) {
      startX += Math.floor((this.numCols - highlightWidth - msgLength) / 2) * dotUnit; // Center align
    } else {
      startX += paddingX * dotUnit; // Left align with padding
    }

    return { startX, startY };
  };

  /**
   * Calculate the length of a message in number of dots
   * @param {string} message - The message to measure
   * @returns {number} Length of the message in dot matrix columns
   */
  getMsgLength = (message) => {
    return message.length * (charWidth + charGap) - charGap;
  };

  /**
   * Check if a message is too long to fit on the display
   * @param {string} message - The message to check
   * @returns {boolean} True if the message needs to scroll, false otherwise
   */
  isMsgOverflow = (message) => {
    const msgWidth = this.getMsgLength(message);
    const visibleWidth = this.numCols - highlightWidth - paddingX * 2;

    return msgWidth > visibleWidth;
  };

  /**
   * Clean up all active subscriptions
   * Should be called when component unmounts or before starting new animations
   */
  clearSubscriptions = () => {
    if (this.timer$) {
      this.timer$.unsubscribe();
      this.timer$ = null;
    }

    if (this.scroll$) {
      this.scroll$.unsubscribe();
      this.scroll$ = null;
    }
  };
}

export default DotMatrixSketch;
