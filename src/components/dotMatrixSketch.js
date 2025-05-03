import { backgroundColor, dotColor } from "../helpers/colors.js";
import { fontData } from "../helpers/dotFont.js";

const dotRadius = 6;
const dotGap = 4;
const dotUnit = dotRadius * 2 + dotGap;

// Dot counts
const charGap = 1;
const charWidth = fontData[0][0].length;
const charHeight = fontData[0].length;
const paddingX = 4;
const paddingY = 2;
const numRows = charHeight + 2 * paddingY;
const numCols = 85;

class DotMatrixSketch {
  constructor(textStrings) {
    this.msgArray = textStrings;
    this.breakpoint = 600;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
    } else {
    }

    // Calculate dimensions
    const width = numCols * dotUnit - dotGap;
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

      console.log("DotMatrixSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      this.drawBoard(p);

      // TODO loop through provided messages
      this.drawMessage(p);

      console.log("DotMatrixSketch: p5.js draw function executed!");
    };
  };

  drawBoard = (p) => {
    let dotX = dotRadius;
    let dotY = dotRadius;

    for (let i = 0; i < numRows; i++) {
      dotX = dotRadius;

      for (let j = 0; j < numCols; j++) {
        p.fill(dotColor.off);
        p.ellipseMode(p.RADIUS);
        p.ellipse(dotX, dotY, dotRadius, dotRadius);

        dotX += dotUnit;
      }

      dotY += dotUnit;
    }
  };

  drawMessage = (p) => {
    let msgColCount = this.msgArray[0].length * (charWidth + charGap) - charGap;

    let startX = dotRadius;
    let startY = dotUnit * paddingY + dotRadius;
    if (msgColCount < numCols) {
      // Center the message if it fits
      startX += Math.floor((numCols - msgColCount) / 2) * dotUnit;
    } else {
      // Left align with padding if not
      startX += paddingX * dotUnit;
    }

    let msgWidth = 0;
    for (const char of this.msgArray[0]) {
      // Render visible characters
      if (msgWidth > -charWidth && msgWidth < numCols) {
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
}

export default DotMatrixSketch;
