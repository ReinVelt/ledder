import Animation from "../Animation.js"
import Scheduler from "../Scheduler.js"
import ControlGroup from "../ControlGroup.js"
import DrawAsciiArtColor from "../draw/DrawAsciiArtColor.js"
import DrawText from "../draw/DrawText.js"
import {fontSelect} from "../fonts.js"
import FxRotate from "../fx/FxRotate.js"
import PixelBox from "../PixelBox.js"
import {runAnimation} from "../util.js"


const logo=`
  rr0rr0rr
  rr0rr0rr
  0rrrrrr0
  0rrrrrr0
  0rrrrrr0
  0rr00rr0
  0rr00rr0
  rrr00rrr
`

export default class HSD extends Animation {
    static category = "Misc"
    static title = "HSD"
    static description = ""


    async run(box: PixelBox, scheduler: Scheduler, controls: ControlGroup) {


        //rotate
        const marquee=new PixelBox(box)
        box.add(marquee)

        box.add(new DrawAsciiArtColor(0, 8, logo))
        box.add(new DrawAsciiArtColor(box.width()-8, 8, logo))

        box.center(box)



        await runAnimation(marquee, scheduler, controls, "Marquee")


    }
}