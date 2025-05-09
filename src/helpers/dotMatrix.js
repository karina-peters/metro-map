import { interval, tap, finalize, Subject, takeUntil, take, last } from "rxjs";

import { dotColor } from "./colors.js";
import { fontData } from "./dotFont.js";

// Dimensions (dot count)
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 0;
const paddingY = 2;
const msgMargin = 2;

class DotMatrix {
  /**
   * Construct new instance of DotMatrix
   * @param {number} numRows - Number of dot rows on board
   * @param {number} numCols - Number of dot columns on board
   * @param {number} dotRadius - Dot radius in pixels
   * @param {number} dotGap - Space between dots in pixels
   */
  constructor(numRows, numCols, dotRadius, dotGap) {
    // Component State
    this.destroy$ = new Subject();

    // Sizing
    this.dotRadius = dotRadius;
    this.dotGap = dotGap;
    this.dotUnit = dotRadius * 2 + dotGap;
    this.numCols = numCols;
    this.numRows = numRows;
    this.textField = {
      top: paddingY * this.dotUnit,
      right: (this.numCols - paddingX - msgMargin) * this.dotUnit - dotGap,
      bottom: (this.numRows - paddingY - msgMargin) * this.dotUnit - dotGap,
      left: (paddingX + msgMargin) * this.dotUnit,
    };
  }

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
  createScrollAnimation = (p, { speed, step, totalDistance, onStep, onFinalize, onStart = () => {} }) => {
    onStart();

    return interval(speed).pipe(
      takeUntil(this.destroy$),
      take(Math.ceil(totalDistance / step)),
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
   * Draw the dot matrix board background with highlight color
   * @param {object} p - p5.js instance
   */
  drawBoard = (p) => {
    let dotX = this.dotRadius;
    let dotY = this.dotRadius;

    for (let i = 0; i < this.numRows; i++) {
      dotX = this.dotRadius;

      for (let j = 0; j < this.numCols; j++) {
        const color = dotColor.off;
        p.fill(color);
        p.ellipseMode(p.RADIUS);
        p.ellipse(dotX, dotY, this.dotRadius, this.dotRadius);

        dotX += this.dotUnit;
      }

      dotY += this.dotUnit;
    }
  };

  /**
   * Render a single character on the dot matrix display
   * Only renders dots within the visible display area
   * @param {Object} p - p5.js instance
   * @param {string} char - Character to render
   * @param {number} startX - Starting X position in pixels
   * @param {number} startY - Starting Y position in pixels
   * @param {string} color - Color to render the char in
   */
  renderChar = (p, char, startX, startY, color) => {
    const charMatrix = fontData[char.toUpperCase()] || fontData[" "]; // Default to space if character not found
    const { top, right, bottom, left } = this.textField;

    let dotY = startY;

    for (const row of charMatrix) {
      let dotX = startX;

      for (const dotVal of row) {
        if (dotVal === 1 && dotY >= top && dotX <= right && dotY <= bottom && dotX >= left) {
          p.fill(color);
          p.ellipseMode(p.RADIUS);
          p.ellipse(dotX, dotY, this.dotRadius, this.dotRadius);
        }

        dotX += this.dotUnit;
      }

      dotY += this.dotUnit;
    }
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
    const visibleWidth = (this.textField.right - this.textField.left + this.dotGap) / this.dotUnit;

    return msgWidth > visibleWidth;
  };
}

export default DotMatrix;
