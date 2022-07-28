import {Animation} from "../Animation.js"
import {Display} from "../Display.js"
import {Scheduler} from "../Scheduler.js"
import {ControlGroup} from "../ControlGroup.js"
import {Pixel} from "../Pixel.js"
import {Color} from "../Color.js"
import {PixelContainer} from "../PixelContainer.js"
import {fontSelect} from "../fonts.js"
import DrawText from "../draw/DrawText.js"
import FxBlink from "../fx/FxBlink.js"

export default class Template extends Animation {
    static category = "Misc"
    static title = "Haxogreen"
    static description = "blabla"
    static presetDir = "Misc"

    async run(display: Display, scheduler: Scheduler, controls: ControlGroup) {

        const c=new PixelContainer()
        display.add(c)

        const blinker = new FxBlink(scheduler, controls, 5, 5, 5)

        const font = fontSelect(controls)
        const haxo = new DrawText(0, 0, font, "Haxo", controls.color("haxo"))
        const green = new DrawText(controls.value("offset", 28, 0, 100, 1, true).value, 0, font, "Green", controls.color("green"))



        while (1) {
            await blinker.run(haxo, c)
            c.add(haxo)

            await blinker.run(green, c)
            c.add(green)

        }

    }
}