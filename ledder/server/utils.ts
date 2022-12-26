//run an animation from within another animation.
import PixelBox from "../PixelBox.js"
import Scheduler from "../Scheduler.js"
import ControlGroup from "../ControlGroup.js"
import {PresetStore} from "./PresetStore.js"

export async function animationRun(box: PixelBox, scheduler: Scheduler, controls: ControlGroup, animationName, presetName?: string) {
    const presetStore = new PresetStore()
    const animationClass = await presetStore.loadAnimation(animationName)
    const animation = new animationClass()
    if (presetName) {
        const presetValues = await presetStore.load(animationName, presetName)
        controls.load(presetValues.values)
    }
    return animation.run(box, scheduler, controls)

}
