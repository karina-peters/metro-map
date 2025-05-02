import { lineColor, backgroundColor, textColor } from "../helpers/colors.js";
// import { getCircuitPosition } from "../helpers/system.js";

const padding = { top: 0, right: 0, bottom: 0, left: 0 };
const barHeight = 60;
const barGap = 4;
const fontSize = 30;
const multiplier = 1;
const textMargin = 40;
const strokeWidth = 0.5;
const strokeColor = "grey";

class MapSketch {
  constructor(data) {
    this.containter = this.data = Array.from(data.entries());
    this.scale = 5;
    this.breakpoint = 600;

    this.setCanvasSize();
  }

  setCanvasSize = () => {
    // Handle breakpoints
    if (window.innerWidth < this.breakpoint) {
    } else {
    }

    // Calculate dimensions
    const width = 1162 * this.scale; // window.innerWidth;
    const height = 930 * this.scale; // window.innerHeight;

    this.canvasSize = { width, height };
  };

  draw = async (p) => {
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

      console.log("MapSketch: p5.js setup function executed!");
    };

    p.draw = () => {
      p.scale(self.scale);
      p.background(backgroundColor);
      p.noFill();

      // Draw map elements with getCircuitPosition()
      // self.data.map(() => {});

      p.stroke(strokeColor); // Red color from the SVG
      p.strokeWeight(strokeWidth); // Stroke width from the SVG

      drawSVGPaths(p);

      console.log("MapSketch: p5.js draw function executed!");
    };
  };
}

function drawSVGPaths(p) {
  // Path 1
  p.beginShape();
  p.vertex(109.35, 26.75);
  p.bezierVertex(155.35, 70.75, 190.35, 110.75, 211.35, 128.75); // curve estimation
  p.bezierVertex(212.03, 129.54, 213.33, 130.83, 215.35, 131.75);
  p.bezierVertex(216.95, 132.47, 218.4, 132.69, 219.35, 132.75);
  p.bezierVertex(221.33, 132.75, 223.32, 132.75, 225.3, 132.75);
  p.bezierVertex(226.41, 132.75, 227.76, 133.03, 229.35, 133.75);
  p.bezierVertex(230.72, 134.37, 231.72, 135.16, 232.35, 135.75);
  p.bezierVertex(242.02, 145.75, 251.68, 155.75, 261.35, 165.75);
  p.bezierVertex(262.23, 166.74, 263.47, 168.41, 264.35, 170.75);
  p.bezierVertex(265.1, 172.75, 265.3, 174.52, 265.35, 175.75);
  p.bezierVertex(265.35, 186.42, 265.35, 197.09, 265.35, 207.71);
  p.bezierVertex(265.39, 208.32, 265.68, 211.42, 268.35, 213.75);
  p.bezierVertex(271.18, 216.23, 274.53, 215.94, 275.09, 215.89);
  p.bezierVertex(305.51, 215.84, 335.93, 215.8, 366.35, 215.75);
  p.bezierVertex(367.09, 215.78, 369.91, 215.8, 372.35, 213.75);
  p.bezierVertex(375.89, 210.77, 375.4, 206.12, 375.35, 205.75);
  p.bezierVertex(375.35, 189.08, 375.35, 172.42, 375.35, 155.75);
  p.bezierVertex(375.38, 154.69, 375.29, 152.81, 374.35, 150.75);
  p.bezierVertex(373.73, 149.4, 372.96, 148.4, 372.35, 147.75);
  p.bezierVertex(351.08, 127.18, 329.82, 106.62, 308.55, 86.05);
  p.bezierVertex(307.61, 85.17, 306.34, 83.77, 305.35, 81.75);
  p.bezierVertex(303.71, 78.44, 303.74, 75.35, 303.85, 73.86);
  p.bezierVertex(303.85, 49.24, 303.85, 24.62, 303.85, 0);
  p.endShape();

  // Path 2
  p.beginShape();
  p.vertex(0.35, 126.75);
  p.bezierVertex(61.44, 186.9, 104.82, 229.77, 108.35, 233.75);
  p.bezierVertex(108.77, 234.22, 110.45, 236.21, 113.35, 237.75);
  p.bezierVertex(116.01, 239.16, 118.57, 239.6, 120.35, 239.75);
  p.bezierVertex(138.79, 239.75, 157.24, 239.75, 176.02, 239.75);
  p.bezierVertex(177.2, 239.75, 182.13, 239.59, 186.35, 235.75);
  p.bezierVertex(191.07, 231.44, 191.32, 225.76, 191.35, 224.75);
  p.bezierVertex(191.35, 217.42, 191.35, 210.08, 191.35, 202.75);
  p.bezierVertex(191.47, 201.78, 192.16, 197.12, 196.35, 193.75);
  p.bezierVertex(200.12, 190.72, 204.25, 190.72, 205.35, 190.75);
  p.bezierVertex(229.02, 190.75, 252.68, 190.75, 276.35, 190.75);
  p.bezierVertex(277.21, 190.73, 282.29, 190.69, 286.35, 194.75);
  p.bezierVertex(290.41, 198.81, 290.37, 203.89, 290.35, 204.75);
  p.bezierVertex(290.35, 219.75, 290.35, 234.75, 290.35, 249.75);
  p.bezierVertex(290.35, 250.4, 290.42, 257.91, 296.35, 261.75);
  p.bezierVertex(299.09, 263.53, 301.9, 263.75, 303.35, 263.75);
  p.bezierVertex(326.35, 263.75, 349.35, 263.75, 372.35, 263.75);
  p.bezierVertex(373.76, 263.86, 376.37, 263.88, 379.35, 262.75);
  p.bezierVertex(382.41, 261.59, 384.37, 259.78, 385.35, 258.75);
  p.bezierVertex(387.68, 256.08, 390.02, 253.42, 392.35, 250.75);
  p.bezierVertex(393.38, 249.66, 395.35, 247.88, 398.35, 246.75);
  p.bezierVertex(400.32, 246.01, 402.09, 245.8, 403.35, 245.75);
  p.bezierVertex(444.68, 245.75, 486.02, 245.75, 527.35, 245.75);
  p.endShape();

  // Line
  p.line(120.35, 239.75, 52.4, 239.75);

  // Path 3
  p.beginShape();
  p.vertex(427.35, 245.75);
  p.bezierVertex(429.89, 245.24, 433.54, 244.16, 437.35, 241.75);
  p.bezierVertex(439.43, 240.43, 441.08, 239.01, 442.35, 237.75);
  p.bezierVertex(460.35, 220.08, 478.35, 202.42, 496.35, 184.75);
  p.endShape();

  // Path 4
  p.beginShape();
  p.vertex(191.35, 224.75);
  p.vertex(191.35, 243.75);
  p.bezierVertex(191.35, 247.33, 191.86, 248.99, 192.35, 250.75);
  p.bezierVertex(194.07, 256.98, 197.76, 261.27, 200.35, 263.75);
  p.bezierVertex(213.68, 276.75, 227.02, 289.75, 240.35, 302.75);
  p.bezierVertex(240.69, 303.06, 241.15, 303.51, 241.66, 304.07);
  p.bezierVertex(241.66, 304.07, 243.18, 305.75, 244.35, 307.75);
  p.bezierVertex(245.54, 309.78, 247.05, 314.06, 247.35, 319.75);
  p.bezierVertex(247.35, 330.42, 247.35, 341.08, 247.35, 351.75);
  p.bezierVertex(247.25, 352.48, 246.48, 358.95, 251.35, 363.75);
  p.bezierVertex(255.35, 367.69, 260.35, 367.76, 261.35, 367.75);
  p.bezierVertex(263.43, 367.75, 265.51, 367.75, 267.59, 367.75);
  p.bezierVertex(270.01, 367.75, 272.36, 368.31, 274.35, 369.75);
  p.bezierVertex(278.04, 372.41, 278.32, 377.52, 278.35, 378.75);
  p.bezierVertex(278.35, 406.5, 278.35, 434.25, 278.35, 461.75);
  p.endShape();

  // Path 5
  p.beginShape();
  p.vertex(247.35, 334.75);
  p.bezierVertex(247.51, 331.85, 248.2, 326.84, 251.35, 321.75);
  p.bezierVertex(252.64, 319.66, 254.07, 318.01, 255.35, 316.75);
  p.bezierVertex(262.02, 310.42, 268.68, 304.08, 275.35, 297.75);
  p.bezierVertex(276.03, 296.96, 277.33, 295.67, 279.35, 294.75);
  p.bezierVertex(280.95, 294.03, 282.4, 293.81, 283.35, 293.75);
  p.bezierVertex(294.25, 293.75, 305.15, 293.75, 316.05, 293.75);
  p.bezierVertex(316.68, 293.8, 321.02, 294.09, 324.35, 290.75);
  p.bezierVertex(327.12, 287.97, 327.32, 284.55, 327.35, 283.75);
  p.bezierVertex(327.35, 246.08, 327.35, 208.42, 327.35, 170.75);
  p.bezierVertex(327.22, 169.17, 326.78, 166.92, 325.35, 164.75);
  p.bezierVertex(321.03, 158.19, 311.91, 158.71, 311.35, 158.75);
  p.bezierVertex(311.03, 158.8, 307.58, 159.25, 305.35, 156.75);
  p.bezierVertex(304.22, 155.49, 303.94, 154.06, 303.85, 153.38);
  p.bezierVertex(303.85, 149.27, 303.85, 145.15, 303.85, 140.89);
  p.bezierVertex(303.9, 140.51, 304.24, 138.21, 306.35, 136.75);
  p.bezierVertex(308.07, 135.56, 309.86, 135.7, 310.35, 135.75);
  p.bezierVertex(317.02, 135.75, 323.68, 135.75, 330.35, 135.75);
  p.bezierVertex(331.35, 135.78, 333.24, 135.7, 335.35, 134.75);
  p.bezierVertex(337.41, 133.82, 338.7, 132.51, 339.35, 131.75);
  p.bezierVertex(360.68, 110.42, 382.02, 89.08, 403.35, 67.75);
  p.endShape();

  // Path 6
  p.beginShape();
  p.vertex(327.35, 283.75);
  p.vertex(327.35, 305.77);
  p.bezierVertex(327.35, 306.2, 327.33, 308.73, 329.35, 310.75);
  p.bezierVertex(331.38, 312.78, 333.92, 312.76, 334.35, 312.75);
  p.bezierVertex(346.68, 312.75, 359.02, 312.75, 371.35, 312.75);
  p.bezierVertex(372.58, 312.8, 374.35, 313, 376.35, 313.75);
  p.bezierVertex(378.69, 314.63, 380.36, 315.87, 381.35, 316.75);
  p.bezierVertex(388.02, 323.42, 394.68, 330.08, 401.35, 336.75);
  p.bezierVertex(401.86, 337.17, 404.09, 338.94, 407.35, 338.75);
  p.bezierVertex(409.99, 338.6, 411.76, 337.24, 412.35, 336.75);
  p.bezierVertex(413.35, 335.75, 414.35, 334.75, 415.35, 333.75);
  p.bezierVertex(415.83, 333.35, 418.06, 331.56, 421.35, 331.75);
  p.bezierVertex(424.9, 331.96, 426.99, 334.33, 427.35, 334.75);
  p.bezierVertex(436.35, 344.08, 445.35, 353.42, 454.35, 362.75);
  p.endShape();

  // Path 7
  p.beginShape();
  p.vertex(278.35, 408.46);
  p.bezierVertex(278.29, 409.42, 277.77, 415.66, 272.35, 419.75);
  p.bezierVertex(268.17, 422.9, 263.65, 422.82, 262.35, 422.75);
  p.bezierVertex(238.68, 422.75, 215.02, 422.75, 191.35, 422.75);
  p.bezierVertex(190.1, 422.81, 186.6, 423.13, 183.35, 425.75);
  p.bezierVertex(179.21, 429.09, 178.49, 433.72, 178.35, 434.75);
  p.bezierVertex(178.35, 443.75, 178.35, 452.75, 178.35, 461.75);
  p.endShape();
}

export default MapSketch;
