import {Animation} from "../Animation.js";
import {Pixel} from "../Pixel.js";
import {FontSimple8x8} from "../fonts/FontSimple8x8.js";
import {Matrix} from "../Matrix.js";
import {AnimationTwinkle} from "../AnimationTwinkle.js";
import { Color } from "../Color.js";
import {Scheduler} from "../Scheduler.js";
import {PresetControl} from "../PresetControl.js";
import AnimationMarquee2 from "./AnimationMarquee2.js";
import AnimationNyan from "./AnimationNyan.js";
import {fontSelect} from "../fonts.js";
import {CharPixels} from "../CharPixels.js";
import FxRotateLeft from "../fx/FxRotateLeft.js";

export default class HSD extends Animation {

  static title = "HSD"
  static description = ""
  static presetDir = "HSD"
  static category = "HSD"

  async run(matrix: Matrix, scheduler: Scheduler, control: PresetControl) {



    new AnimationNyan(matrix)

    const font = fontSelect(control, 'Font')
    const input = matrix.control.input('Text', "Atari 2600 ", true)
    const colorControl = control.color("Text color", 100,0,0, 1);
    const charPixels=new CharPixels(matrix, font, input.text, 0, 8, colorControl)

    new AnimationTwinkle(matrix, charPixels.pixels)
    if (control.switch('Scroll', false, true).enabled) {
      const rotator = new FxRotateLeft(matrix, "Move")

      await rotator.run(charPixels)
    }



  }

}