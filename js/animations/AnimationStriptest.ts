import {Animation} from "../Animation.js";
import {Matrix} from "../Matrix.js";
import {Pixel} from "../Pixel.js";
import {AnimationBlink} from "../AnimationBlink.js";
import {AnimationMove} from "../AnimationMove.js";

export class AnimationStriptest extends Animation {
  constructor(matrix: Matrix) {
    super(matrix);

    //ends
    new Pixel(matrix, 0, 0, 255, 0, 255);
    new Pixel(matrix, matrix.width - 1, 0, 255, 0, 255);

    //blinkers
    for (let x = 1; x < 4; x++)
      new AnimationBlink(matrix, x , x).addPixel(new Pixel(matrix, x +2, 0, 255, 255, 255));

    //rgb
    new Pixel(matrix, 7,0, 255,0,0);
    new Pixel(matrix, 8,0, 0,255,0);
    new Pixel(matrix, 9,0, 0,0,255);

    //mover to test smoothness
    const m = new Pixel(matrix, 0, 0, 255, 255, 255);
    new AnimationMove(matrix, 1, 1, 0).addPixel(m);
    matrix.scheduler.interval(matrix.width, () => {
      m.x = 0;
    })


  }
}