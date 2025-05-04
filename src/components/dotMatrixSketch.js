import {
  timer,
  interval,
  takeWhile,
  tap,
  switchMap,
  finalize,
  Subject,
  takeUntil,
  of,
  take,
  delay,
  distinctUntilChanged,
  iif,
  last,
} from "rxjs";

import { backgroundColor, dotColor, lineColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";

// Timing (ms)
const pauseDuration = 2500;
const scrollPause = 1500;
const scrollSpeed = 50;
const transitionDelay = 200;

// Sizing (px)
const dotRadius = 4;
const dotGap = 2;
const dotUnit = dotRadius * 2 + dotGap;

// Dimensions (dot count)
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 2;
const paddingY = 4;
const numRows = charHeight + 2 * paddingY;
const bumperWidth = 4;
const scrollStep = 1;

// Other
const defaultMsgIndex = 0;

class DotMatrixSketch {
  /**
   * Create new DotMatrixSketch instance
   * @param {Array<string>} msgArray - List of messages to loop through
   * @param {string} lineId - Line id for the color
   * @param {string} trainId - Train id to track changes
   */
  constructor(msgArray, lineId, trainId, parentElt) {
    // Component State
    this.destroy$ = new Subject();
    this.isDestroyed = false;

    // Data
    this.data$ = new Subject({ msgArray, lineId, trainId });
    this.msgArray = msgArray;
    this.currentMsgIndex = defaultMsgIndex;
    this.currentMsg = null;
    this.trainId = null;
    this.bumperColor = lineId && Object.hasOwn(lineColor, lineId) ? lineColor[lineId] : dotColor.off;

    // Board State
    this.timer$ = null;
    this.scrollOffset = 0;
    this.isScrolling = false;
    this.transitionOffset = 0;
    this.isInTransition = true;
    this.transitionPhase = null;

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

      // Start the message timer
      this.data$
        .pipe(
          takeUntil(this.destroy$),
          tap(({ msgArray }) => {
            // Update array with new messages
            console.log("updating message array");
            this.msgArray = msgArray;
          }),
          distinctUntilChanged((prev, curr) => prev.trainId === curr.trainId),
          switchMap(({ trainId, lineId }) => {
            // Start transition for newly selected train
            return this.doTransition$(p, trainId, lineId).pipe(
              delay(transitionDelay),
              tap(() => this.startMsgTimer(p))
            );
          })
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

      if (!this.isInTransition) {
        this.drawMessage(p);
      }

      // console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  /**
   * Start or restart the message display timer
   * Handles static and scrolling display based on message length
   * @param {Object} p - p5.js instance
   */
  startMsgTimer = (p) => {
    this.clearSubscriptions();

    this.scrollOffset = 0;
    this.isScrolling = false;

    p.redraw();

    const needsScroll = this.isMsgOverflow(this.currentMsg);
    const timerDelay = needsScroll ? scrollPause : pauseDuration;

    this.timer$ = timer(timerDelay)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          // Scroll message if overflowing
          iif(() => this.isMsgOverflow(this.currentMsg), this.scrollMessage$(p), of(null))
        ),
        takeWhile(() => !this.isInTransition),
        finalize(() => {
          if (!this.isInTransition && !this.isDestroyed) {
            this.nextMessage(p);
          }
        })
      )
      .subscribe();
  };

  /**
   * Starts transition animation for newly selected train
   * @param {Object} p - p5.js instance
   * @param {string} newTrainId - Train id of the newly selected train
   * @param {string} newLineId - Line id of the newly selected train
   * @returns an Observable of the transition animation
   */
  doTransition$ = (p, newTrainId, newLineId) => {
    console.log("starting transition");
    this.isInTransition = true;
    this.clearSubscriptions();

    return of(null).pipe(
      takeUntil(this.destroy$),
      switchMap(() =>
        // Skip exit animation if no train selected
        iif(() => this.trainId === null, of(null), this.animateBumpers$(p, "out"))
      ),
      tap(() => {
        console.log("changing to", newTrainId);
        this.transitionPhase = "change";

        this.bumperColor = newLineId && Object.hasOwn(lineColor, newLineId) ? lineColor[newLineId] : dotColor.off;
        this.trainId = newTrainId;
        this.currentMsg = this.msgArray[defaultMsgIndex];
      }),
      delay(transitionDelay),
      switchMap(() => this.animateBumpers$(p, "in")),
      finalize(() => {
        console.log("finalizing transition");
        this.transitionOffset = 0;
        this.isInTransition = false;
      })
    );
  };

  /**
   * Start scrolling animation for a message that doesn't fit on the display
   * @param {Object} p - p5.js instance
   */
  scrollMessage$ = (p) => {
    console.log("scrolling...");

    return this.createScrollAnimation(p, {
      totalDistance: this.getMsgLength(this.currentMsg) + bumperWidth + 2 * paddingX,
      onStart: () => {
        this.isScrolling = true;
      },
      onStep: () => {
        this.scrollOffset += scrollStep;
      },
      onFinalize: () => {
        this.scrollOffset = 0;
        this.isScrolling = false;
      },
    });
  };

  /**
   * Start bumper transition animation
   * @param {Object} p - p5.js instance
   * @param {string} phase - Transition phase (in, out)
   * @returns
   */
  animateBumpers$ = (p, phase) => {
    console.log("animating bumpers...");

    return this.createScrollAnimation(p, {
      totalDistance: bumperWidth,
      onStart: () => {
        this.transitionPhase = phase;
      },
      onStep: () => {
        this.transitionOffset += scrollStep;
      },
      onFinalize: () => {
        this.transitionOffset = 0;
      },
    });
  };

  /**
   * Generalized offset animation for scroll or bumper transition
   * (modified from consolidation of previous redundant startScroll and startBumperAnimation functions by ChatGPT)
   * @param {Object} p - p5.js instance
   * @param {Object} options
   * @param {number} options.totalDistance - Total distance to scroll
   * @param {Function} options.onStep - Called each tick to update offset
   * @param {Function} options.onFinalize - Called once when animation completes
   * @param {Function} [options.onStart] - Optional setup at animation start
   */
  createScrollAnimation = (p, { totalDistance, onStep, onFinalize, onStart = () => {} }) => {
    onStart();

    return interval(scrollSpeed).pipe(
      takeUntil(this.destroy$),
      take(Math.ceil(totalDistance / scrollStep)),
      tap(() => {
        onStep();
        p.redraw();
      }),
      last(),
      finalize(() => {
        onFinalize();
      })
    );
  };

  /**
   * Move to the next message in the list
   * @param {Object} p - p5.js instance
   */
  nextMessage = (p) => {
    this.currentMsgIndex = (this.currentMsgIndex + 1) % this.msgArray.length;
    this.currentMsg = this.msgArray[this.currentMsgIndex];

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
    let bumperVisible = bumperWidth;

    // Handle transition bumper animation
    if (this.isInTransition) {
      if (this.transitionPhase === "in") {
        bumperVisible = this.transitionOffset;
      } else if (this.transitionPhase === "out") {
        bumperVisible = bumperWidth - this.transitionOffset;
      } else {
        bumperVisible = 0;
      }
    }

    for (let i = 0; i < numRows; i++) {
      dotX = dotRadius;

      for (let j = 0; j < this.numCols; j++) {
        const color = j < bumperVisible || j >= this.numCols - bumperVisible ? this.bumperColor : dotColor.off;
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
    for (const char of this.currentMsg) {
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
      const scrollStart = (bumperWidth + paddingX) * dotUnit;
      const scrollEnd = (this.numCols - bumperWidth - paddingX) * dotUnit - dotGap;

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
    let startX = dotRadius + bumperWidth * dotUnit;
    let startY = dotUnit * paddingY + dotRadius;
    let msgLength = this.getMsgLength(this.currentMsg);

    if (!this.isMsgOverflow(this.currentMsg)) {
      startX += Math.floor((this.numCols - bumperWidth * 2 - msgLength) / 2) * dotUnit; // Center align
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
    const visibleWidth = this.numCols - (bumperWidth + paddingX) * 2;

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
  };
}

export default DotMatrixSketch;
