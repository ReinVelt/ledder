/*
 Tips: 
  - Start out with figuring out of its horizontal or vertical. If you mess this up you'll get garbage, so try the other one. :)
  - After that it should be easy to determine if you need a zigzag or flip as well.

*/


//map x,y to offset number
export default class OffsetMapper extends Array {
    private height: any
    private width: any

    constructor(width, height, horizontal = true) {

        super()
        this.width = width
        this.height = height

        //horizontal ledstrips
        if (horizontal) {
            for (let x = 0; x < width; x++) {
                this.push([])
                for (let y = 0; y < height; y++) {
                    this[x].push(x + y * width)
                }
            }
        }
        //vertical ledstrips
        else {
            for (let x = 0; x < this.width; x++) {
                this.push([])
                for (let y = 0; y < this.height; y++) {
                    this[x].push(x * this.height + y)
                }
            }
        }
    }

    //normal X flip
    flipX() {
        this.reverse()
    }

    //normal Y flip
    flipY() {
        for (let x = 0; x < this.width; x++) {
            this[x].reverse()
        }
    }


    //
    zigZagX() {
        for (let y = 0; y < this.height; y = y + 2) {
            const old = []
            for (let x = 0; x < this.width; x++)
                old.push(this[x][y])

            old.reverse()
            for (let x = 0; x < this.width; x++)
                this[x][y] = old[x]

        }
    }



    zigZagY() {
        for (let x = 0; x < this.width; x = x + 2) {
            this[x].reverse()
        }
    }

    // snake() {
    //     this.length = 0
    //     for (let x = 0; x < this.width; x++) {
    //         this.push([])
    //         for (let y = 0; y < this.height; y++) {
    //             // this[x].push(x + y * this.width)
    //             this[x].push(x * this.height + y)
    //         }
    //     }

    // }


}
