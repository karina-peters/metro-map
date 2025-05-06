import { timer, takeWhile, tap, switchMap, finalize, Subject, takeUntil, of, delay, distinctUntilChanged, forkJoin } from "rxjs";

import { backgroundColor, dotColor, lineColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";
import DotMatrix from "../helpers/dotMatrix.js";

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
const paddingX = 0;
const paddingY = 2;
const msgMargin = 2;
const numRows = charHeight + 2 * (paddingY + msgMargin);
const numCols = 120;
const bumperWidth = 4;
const scrollStep = 1;

// Other
const defaultMsgIndex = 0;

class TrainBoard extends DotMatrix {
  /**
   * Create new DotMatrixSketch instance
   * @param {Array<string>} msgArray - List of messages to loop through
   * @param {string} lineId - Line id for the color
   * @param {string} trainId - Train id to track changes
   */
  constructor(msgArray, lineId, trainId, parentElt) {
    super(numRows, numCols, dotRadius, dotGap);

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
    this.isInTransition = true;
    this.transitionPhase = null;
    this.slideOffset = 0;
    this.isSliding = false;
    this.bumperOffset = 0;
    this.isBumping = true;

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
      right: (this.numCols - paddingX - bumperWidth - msgMargin) * dotUnit - dotGap,
      bottom: (numRows - paddingY - msgMargin) * dotUnit - dotGap,
      left: (paddingX + bumperWidth + msgMargin) * dotUnit,
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
            // Update array with new messages
            console.log("updating message array");
            this.msgArray = msgArray;
          }),
          distinctUntilChanged((prev, curr) => prev.trainId === curr.trainId),
          switchMap(({ trainId, lineId }) =>
            // Start transition for newly selected train
            this.doTransition$(p, trainId, lineId).pipe(tap(() => this.startMsgTimer(p)))
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

      if (!this.isInTransition || this.transitionPhase === "in") {
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
          needsScroll ? this.scrollMessage$(p) : of(null)
        ),
        takeWhile(() => !this.isInTransition),
        tap(() => this.nextMessage(p))
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
      switchMap(() => {
        this.transitionPhase = "out";

        // Skip exit animation if no train selected
        return this.trainId === null ? of(null) : this.animateBumpers$(p);
      }),
      tap(() => {
        this.transitionPhase = "change";
        console.log(`changing from train ${this.trainId} to ${newTrainId}`);

        this.bumperColor = newLineId && Object.hasOwn(lineColor, newLineId) ? lineColor[newLineId] : dotColor.off;
        this.trainId = newTrainId;
        this.setCurrentMsg(defaultMsgIndex);
      }),
      delay(transitionDelay),
      switchMap(() => {
        this.transitionPhase = "in";
        return forkJoin([this.animateBumpers$(p), this.slideMessageIn$(p)]);
      }),
      finalize(() => {
        this.isInTransition = false;
        this.bumperOffset = 0;
        this.slideOffset = 0;
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
      speed: scrollSpeed,
      step: scrollStep,
      totalDistance: this.getMsgLength(this.currentMsg) + bumperWidth + 2 * msgMargin,
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
   * Start bumper transition animation
   * @param {Object} p - p5.js instance
   * @returns
   */
  animateBumpers$ = (p) => {
    console.log(`animating bumpers ${this.transitionPhase}...`);

    return this.createScrollAnimation(p, {
      speed: scrollSpeed,
      step: scrollStep,
      totalDistance: bumperWidth,
      onStart: () => {
        this.isBumping = true;
      },
      onStep: () => {
        this.bumperOffset += scrollStep;
      },
      onFinalize: () => {
        this.isBumping = false;
        this.bumperOffset = 0;
      },
    });
  };

  /**
   * Move to the next message in the list
   * @param {Object} p - p5.js instance
   */
  nextMessage = (p) => {
    this.setCurrentMsg((this.currentMsgIndex + 1) % this.msgArray.length);
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
    if (this.isBumping) {
      if (this.transitionPhase === "in") {
        bumperVisible = this.bumperOffset;
      } else if (this.transitionPhase === "out") {
        bumperVisible = bumperWidth - this.bumperOffset;
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

    if (this.isSliding) {
      // TODO: handle different directions
      startY = startY + (this.slideOffset - charHeight - msgMargin - paddingY) * dotUnit;
    }

    let msgWidth = 0;
    for (const char of this.currentMsg) {
      const charStartX = startX + msgWidth;
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
    let startX = dotRadius + bumperWidth * dotUnit;
    let startY = dotUnit * (paddingY + msgMargin) + dotRadius;
    let msgLength = this.getMsgLength(this.currentMsg);

    if (!this.isMsgOverflow(this.currentMsg)) {
      startX += Math.floor((this.numCols - bumperWidth * 2 - msgLength) / 2) * dotUnit; // Center align
    } else {
      startX += msgMargin * dotUnit; // Left align with padding
    }

    return { startX, startY };
  };

  /**
   * Update current message to the one at the provided index
   * @param {number} index - Message index
   */
  setCurrentMsg = (index) => {
    this.currentMsgIndex = index;
    this.currentMsg = this.msgArray[index];
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

export default TrainBoard;
