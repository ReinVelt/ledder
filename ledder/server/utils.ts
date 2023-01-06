//run an animation from within another animation.
import Display from "../Display.js"
import AnimationManager from "./AnimationManager.js"
import {mkdir, stat} from "fs/promises"
import path from "path"
import PixelBox from "../PixelBox.js"
import Scheduler from "../Scheduler.js"
import ControlGroup from "../ControlGroup.js"
import {presetStore} from "./PresetStore.js"


/***
 * Get mtime of filename, returns 0 if it doesnt exist.
 * @param fileName
 */
export async function getMtime(fileName: string) {
    try {
        const s = await stat(fileName)
        return (s.mtimeMs)
    } catch (e) {
        return (0)
    }
}

export async function createParentDir(fileName: string) {
    try {
        await mkdir(path.dirname(fileName), {recursive: true})
    } catch (e) {
        //exists
    }

}


/*
 * Pre-render animation non-realtime. (e.g. a preview or static rendered animation)
 * AnimationManager should be prepared, and stopped after returning.
 * Display-class and caller are reponsible for saving the result somewhere.
 */
export async function preRender(display: Display, animationManager: AnimationManager) {

    //set default fps (animation can change this)
    animationManager.scheduler.setDefaultFrameTime(display.defaultFrameTime)

    //skip first frames, just run scheduler
    for (let i = 0; i < animationManager.animationClass.previewSkip; i++)
        //NOTE: await is needed, to allow other microtasks to run!
        await animationManager.scheduler.step()

    //render frames
    let displayTime = 0
    let frameTime = 0
    for (let i = 0; i < animationManager.animationClass.previewFrames; i++) {

        for (let d = 0; d < animationManager.animationClass.previewDivider; d++) {
            //NOTE: await is needed, to allow other microtasks to run!
            frameTime = frameTime + await animationManager.scheduler.step()
        }

        frameTime = ~~(frameTime / display.frameRounding) * display.frameRounding

        //skip frames until frameTime is more than minimum allowed
        if (frameTime >= display.minFrameTime) {
            displayTime += frameTime
            frameTime = 0
            display.render(animationManager.box)
            display.frame(displayTime)
        }
    }

}
//Run an animation, optionally loading a preset.
//Use this to run an Animation from withint another Animation.
//However, if you want to safely stop and cleanup an animation, it might be better to use a full fledged AnimationManager instance.
export async function animationRun(box: PixelBox, scheduler: Scheduler, controls: ControlGroup, animationName, presetName?: string) {

    const animationClass = await presetStore.loadAnimation(animationName)
    const animation = new animationClass()
    if (presetName) {
        const presetValues = await presetStore.load(animationName, presetName)
        controls.load(presetValues.values)
    }
    return animation.run(box, scheduler, controls)

}
