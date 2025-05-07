import { tap, switchMap, Subject, takeUntil, distinctUntilChanged, of } from "rxjs";

import { backgroundColor, dotColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";
import DotMatrix from "../helpers/dotMatrix.js";

// Sizing (px)
const dotRadius = 4;
const dotGap = 2;
const dotUnit = dotRadius * 2 + dotGap;

// Board Dimensions (dot count)
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 0;
const paddingY = 0;
const msgMargin = 2;

// Table Dimensions (dot count)
const COLUMN_LAYOUT = ["hug", "hug", "fill", "hug"];
const colGap = 4;
const rowGap = 4;
const maxMsgLength = 10;

class StationBoard extends DotMatrix {
  /**
   * Create new StationBoard instance
   * @param {Array<string>} tableHead - Array of column headers
   * @param {Array<string>} msgTable - Array of messages to draw
   * @param {string} lineId - Line id for the color
   * @param {string} trainId - Train id to track changes
   */
  constructor(parentElt, tableHead, msgTable, stationId, hiddenCol = null) {
    super(0, 0, dotRadius, dotGap);

    // Data
    this.data$ = new Subject({ msgTable, stationId });
    this.tableHead = tableHead;
    this.msgTable = msgTable;

    // Table
    this.numTableRows = 4;
    this.numTableCols = this.tableHead.length;
    this.columnToHide = hiddenCol;
    this.columnHidden = false;

    // Sizing
    this.parentElt = parentElt;
    this.numCols = Math.max(this.calcMinBoardWidth(), Math.floor(this.parentElt.clientWidth / dotUnit));
    this.numRows = this.numTableRows * (charHeight + rowGap) - rowGap + 2 * (msgMargin + paddingY);
    this.breakpoint = 1375;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // TODO - Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
      this.columnHidden = true;
    } else {
      this.columnHidden = false;
    }

    this.numCols = Math.max(this.calcMinBoardWidth(), Math.floor(this.parentElt.clientWidth / dotUnit));

    this.setBoardSize(this.numRows, this.numCols);
    this.setTextField({
      top: paddingY + msgMargin,
      right: (this.numCols - paddingX - msgMargin) * dotUnit - dotGap,
      bottom: (this.numRows - paddingY - msgMargin) * dotUnit - dotGap,
      left: (paddingX + msgMargin) * dotUnit,
    });

    const width = this.numCols * dotUnit - dotGap;
    const height = this.numRows * dotUnit - dotGap;

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
      self.data$
        .pipe(
          takeUntil(self.destroy$),
          tap(({ msgTable }) => {
            console.log("updating message table");
            self.msgTable = msgTable;
            p.redraw();
          }),
          distinctUntilChanged((prev, curr) => prev.stationId === curr.stationId),
          switchMap(
            () => of(null)
            // this.doTransition$(p, trainId, lineId).pipe(tap(() => this.startMsgTimer(p)))
          )
        )
        .subscribe();

      // Handle component destruction
      self.destroy$.subscribe(() => {
        console.log("destroying...");
      });

      // console.log("DotMatrixSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      // Draw the current state
      this.drawBoard(p);
      this.drawTable(p);

      // console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  // TODO: what if alternating rows slid in from opposite sides?
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
   * Draw the current message table on the dot matrix board
   * @param {object} p - p5.js instance
   */
  drawTable = (p) => {
    // Draw table headings
    this.renderRow(p, this.tableHead, 0, dotColor.heading);

    // Draw table data rows
    this.msgTable?.entries()?.forEach(([index, row]) => this.renderRow(p, row, index + 1, dotColor.on));
  };

  /**
   *
   * @param {*} p
   * @param {*} row
   * @param {*} rowIndex
   * @param {*} color
   */
  renderRow = (p, row, rowIndex, color) => {
    let adjustedColIndex = 0;

    for (const [colIndex, data] of row.entries()) {
      // Skip rendering the hidden column
      if (this.columnHidden && colIndex === this.columnToHide) {
        continue;
      }

      let { startX, startY } = this.calcStartPos(rowIndex, adjustedColIndex);
      let charStartX = startX;

      for (const char of data.slice(0, maxMsgLength)) {
        this.renderChar(p, char, charStartX, startY, color);
        charStartX += (charWidth + charGap) * dotUnit;
      }

      adjustedColIndex++;
    }
  };

  /**
   * Calculate the starting position for drawing the message based on provided row and column
   * Modified from ChatGPT
   * @returns {Object} Object containing startX and startY coordinates in pixels
   */
  calcStartPos = (row, adjustedCol) => {
    let startX = (paddingX + msgMargin) * dotUnit;
    let startY = (paddingY + msgMargin + row * (charHeight + rowGap)) * dotUnit;

    // Create adjusted layout and headings without the hidden column
    const adjustedLayout = [...COLUMN_LAYOUT].filter((_, i) => !this.columnHidden || this.columnToHide !== i);
    const adjustedHeadings = [...this.tableHead].filter((_, i) => !this.columnHidden || this.columnToHide !== i);

    // Calculate hug widths based on adjusted columns
    const hugWidths = adjustedHeadings.map((text, i) => (adjustedLayout[i] === "hug" ? (this.getMsgLength(text) + colGap) * dotUnit : 0));
    const totalHugWidth = hugWidths.reduce((sum, w) => sum + w, 0);

    // Count fill columns
    const fillCols = adjustedLayout.filter((type) => type === "fill").length;
    const fillWidth = fillCols > 0 ? (this.numCols * dotUnit - totalHugWidth) / fillCols : 0;

    // Compute x offset by summing widths of previous columns
    for (let i = 0; i < adjustedCol; i++) {
      startX += adjustedLayout[i] === "hug" ? hugWidths[i] : fillWidth;
    }

    return { startX, startY };
  };

  calcMinBoardWidth = () => {
    let tableLength = 0;

    // Create adjusted layout and headings without the hidden column
    const adjustedLayout = [...COLUMN_LAYOUT].filter((_, i) => !this.columnHidden || this.columnToHide !== i);
    const adjustedHeadings = [...this.tableHead].filter((_, i) => !this.columnHidden || this.columnToHide !== i);

    const visibleColCount = adjustedHeadings.length;

    for (let i = 0; i < visibleColCount; i++) {
      const message = adjustedLayout[i] === "hug" ? adjustedHeadings[i] : "0".repeat(maxMsgLength);

      tableLength += this.getMsgLength(message);

      if (i < visibleColCount - 1) {
        tableLength += colGap;
      }
    }

    return tableLength + 2 * (paddingX + msgMargin);
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
