import { tap, switchMap, Subject, takeUntil, distinctUntilChanged, of } from "rxjs";

import { backgroundColor, dotColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";
import DotMatrix from "../helpers/dotMatrix.js";

// Sizing (px)
const dotRadius = 4;
const dotGap = 2;
const dotUnit = dotRadius * 2 + dotGap;

// Dimensions (dot count)
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 0;
const paddingY = 2;
const msgMargin = 2;
const numRows = 80;
const numCols = 120;

class StationBoard extends DotMatrix {
  /**
   * Create new DotMatrixSketch instance
   * @param {Array<string>} msgArray - List of messages to loop through
   * @param {string} lineId - Line id for the color
   * @param {string} trainId - Train id to track changes
   */
  constructor(msgArray, stationId, parentElt) {
    super(numRows, numCols, dotRadius, dotGap);

    // Data
    this.data$ = new Subject({ msgArray, stationId });
    this.msgArray = msgArray;
    this.currentMsg = msgArray[0];

    // Sizing
    this.parentElt = parentElt;
    this.numCols = numCols;
    this.breakpoint = 600;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // TODO - Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
    } else {
    }

    this.numCols = Math.floor(this.parentElt.clientWidth / dotUnit);

    this.setBoardSize(numRows, this.numCols);
    this.setTextField({
      top: paddingY + msgMargin,
      right: (this.numCols - paddingX - msgMargin) * dotUnit - dotGap,
      bottom: (numRows - paddingY - msgMargin) * dotUnit - dotGap,
      left: (paddingX + msgMargin) * dotUnit,
    });

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

      // Start the message timer
      this.data$
        .pipe(
          takeUntil(this.destroy$),
          tap(({ msgArray }) => {
            // Update array with new data
          }),
          distinctUntilChanged((prev, curr) => prev.stationId === curr.stationId),
          switchMap(
            () => of(null)
            // Change to new station
          )
        )
        .subscribe();

      // Handle component destruction
      self.destroy$.subscribe(() => {
        console.log("destroying...");
        this.isDestroyed = true;
      });

      // console.log("DotMatrixSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      // Draw the current state
      this.drawBoard(p);
      this.drawMessage(p);

      // console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  slideMessageIn$ = (p, /* TODO */ direction) => {
    console.log("sliding message in...");

    return this.createScrollAnimation(p, {
      speed: scrollSpeed,
      step: scrollStep,
      totalDistance: charHeight + paddingY + msgMargin,
      onStart: () => {
        this.isSliding = true;
      },
      onStep: () => {
        this.slideOffset += scrollStep;
      },
      onFinalize: () => {
        this.isSliding = false;
        this.slideOffset = 0;
      },
    });
  };

  /**
   * Draw the current message on the dot matrix board
   * Handles regular display and scrolling behavior
   * @param {object} p - p5.js instance
   */
  drawMessage = (p) => {
    let { startX, startY } = this.calcStartPos();

    let msgWidth = 0;
    for (const char of this.currentMsg) {
      const charStartX = startX + msgWidth;
      // TODO: change color based on heading or not
      this.renderChar(p, char, charStartX, startY, dotColor.on);

      msgWidth += dotUnit * (charWidth + charGap);
    }
  };

  /**
   * Calculate the starting position for drawing the message
   * Centers short messages and positions overflow messages for scrolling
   * @returns {Object} Object containing startX and startY coordinates in pixels
   */
  calcStartPos = () => {
    let startX = dotRadius + msgMargin * dotUnit;
    let startY = dotUnit * (paddingY + msgMargin) + dotRadius;

    // TODO: calculate position based on row/column

    return { startX, startY };
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
  };
}

export default StationBoard;
