import {Pixel} from "./Pixel.js";
import BboxInterface from "./BboxInterface.js";
import {monitorEventLoopDelay} from "perf_hooks";
import {random} from "./util.js";
import {Color} from "./Color.js";
import {ColorInterface} from "./ColorInterface.js";

/**
 * A pixeltree. A container is just a simple Set() of Pixels, but can also contain sub PixelContainers.
 * So it cann actually be a tree.
 * This allows us to quickly add or remove a bunch of pixels to a display for example.
 * A single Pixel object can be referenced by multiple pixel containers.
 */
export class PixelContainer extends Set<Pixel | PixelContainer> {


    /* Creates a traditional x/y raster, with seperate pixels that each get a copy of the color object.
    * (Dont use this if you can do it on the more modern ledder-way where each pixel is an object in a container-list)
    * raster[x][y] corresponds to Pixel(x,y)
    * @param YX swap array layout so raster[y][x] corresponds to Pixel(x,y)
    * @param xFlip Flip x axis: 0,0 corresponds to Pixel(xMax,0)
    * @param yFlip Flip y axis: 0,0 corresponds to Pixel(0,yMax)
    * @param data Set arbitrary datafield of new pixels to this
    */
    raster(bbox: BboxInterface,
           color: ColorInterface,
           YX = false,
           xFlip = false,
           yFlip = false,
           copyColor = true, data?:any): Array<Array<Pixel>> {

        //(probably more complicated than it needs to be?)

        let ret: Array<Array<Pixel>>
        ret = []


        let aStart
        let aEnd
        let bStart
        let bEnd

        //YX
        if (YX) {
            aStart = bbox.yMin
            aEnd = bbox.yMax
            bStart = bbox.xMin
            bEnd = bbox.xMax

        }
        //XY
        else {
            aStart = bbox.xMin
            aEnd = bbox.xMax
            bStart = bbox.yMin
            bEnd = bbox.yMax

        }

        let width = bbox.xMax - bbox.xMin
        let height = bbox.yMax - bbox.yMin

        for (let a = aStart; a <= aEnd; a++) {
            ret[a] = []
            for (let b = bStart; b <= bEnd; b++) {
                let c
                if (copyColor)
                    c = color.copy()
                else
                    c = color

                let x
                let y
                if (YX) {
                    y = a
                    x = b
                } else {
                    x = a
                    y = b
                }

                if (xFlip)
                    x = width - x

                if (yFlip)
                    y = height - y

                const p = new Pixel(x, y, color)
                p.data=data
                ret[a][b] = p
                this.add(p)
            }
        }
        return (ret)
    }


    //dump pixeltree in string format, for debugging
    dump(indent = "") {
        let str = ""
        str = str + indent + `pixeltree:\n`
        indent = indent + " "
        if (this.size == 0) {
            str = str + indent + "(empty)"
        } else {
            for (const p of this) {
                if (p instanceof Pixel)
                    str = str + indent + `(${p.x}, ${p.y}) (r${p.color.r}, g${p.color.g}, b${p.color.b}, a${p.color.a})\n`
                else if (p instanceof PixelContainer) {
                    str = str + p.dump(indent)
                } else {
                    str = str + indent + `Illegal object type: ${typeof (p)}`
                }
            }
        }
        return str
    }


    //calls  callbackfn for each pixel in the pixeltree
    forEachPixel(callbackfn: (pixel: Pixel, parent: PixelContainer) => void) {
        // this.recurseForEachPixel(callbackfn, this)
        for (const p of this) {
            if (p instanceof Pixel)
                callbackfn(p, this)
            else
                p.forEachPixel(callbackfn)
        }
    }

    //get a "random" pixel from the tree.
    //note: because it chooses random containers as well, the pixel distribution might not be totally random
    //it also can return undefined if it ends up at and empty tree.
    randomPixel(): Pixel | undefined {
        if (this.size == 0)
            return undefined

        let r = random(0, this.size - 1)
        const i = this.values()
        let p
        while (r >= 0) {
            p = i.next()
            r--
        }

        if (p.value instanceof Pixel)
            return p.value
        else
            return (p.value.randomPixel())

    }

    //Returns a deep copy of the pixeltree.
    //Use copyColor=true to also create copies of the color objects in each pixel
    //NOTE: you should only use copy() if needed, in all other cases just use references
    copy(copyColor = false) {
        let c = new PixelContainer()
        for (const p of this) {
            //NOTE: both Pixel and PixelContainer have the .copy() function, so no if-statement needed here
            c.add(p.copy(copyColor))
        }

        return (c)
    }

    //relatively move all pixels in this tree by this amount
    move(x: number, y: number, round=false) {
        for (const p of this)
            p.move(x, y, round)
    }

    // //get bounding box (override if needed)
    bbox(): BboxInterface {

        let ret = undefined

        this.forEachPixel((p) => {

                if (ret === undefined) {
                    ret = {
                        xMin: p.x,
                        yMin: p.y,
                        xMax: p.x,
                        yMax: p.y
                    }

                } else {

                    if (p.x < ret.xMin)
                        ret.xMin = p.x
                    else if (p.x > ret.xMax)
                        ret.xMax = p.x

                    if (p.y < ret.yMin)
                        ret.yMin = p.y
                    else if (p.y > ret.yMax)
                        ret.yMax = p.y
                }
            }
        )
        return (ret)
    }

    //get centerpoint our pixels [x,y]
    getCenter() {
        const bbox = this.bbox()
        return [(bbox.xMax + bbox.xMin) / 2, (bbox.yMax + bbox.yMin) / 2]

    }

    private getCenterOffsets(bbox: BboxInterface) {
        //our center
        const ourBbox = this.bbox()
        const ourX = (ourBbox.xMax + ourBbox.xMin) / 2
        const ourY = (ourBbox.yMax + ourBbox.yMin) / 2

        //other center
        const x = (bbox.xMax + bbox.xMin) / 2
        const y = (bbox.yMax + bbox.yMin) / 2

        return [Math.round(x - ourX), Math.round(y - ourY)]

    }

    //center our pixels inside specified bbox
    center(bbox: BboxInterface) {
        let offsets = this.getCenterOffsets(bbox)

        this.move(offsets[0], offsets[1])
        return (this)

    }

    //vertical center our pixels indside specified box
    centerV(bbox: BboxInterface) {
        let offsets = this.getCenterOffsets(bbox)

        this.move(0, offsets[1])
        return (this)

    }

    //horizontal center our pixels indside specified box
    centerH(bbox: BboxInterface) {
        let offsets = this.getCenterOffsets(bbox)

        this.move(offsets[0], 0)
        return (this)

    }

}

