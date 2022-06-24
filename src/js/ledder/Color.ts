import {ColorInterface} from "./ColorInterface.js";

export class Color implements ColorInterface {
    r: number
    g: number
    b: number
    a: number

    constructor(r: number=255, g: number=255, b: number=255, a: number=1, immutable=false) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        if (immutable)
            Object.freeze(this)
    }

    //borrowed from color-convert npm
    //hsl are all in range 0-1
    setHsl( h,s,l)
    {

        let t2;
        let t3;
        let val;

        if (s === 0) {
            val = l * 255;
            this.r=l
            this.g=l
            this.b=l
            return ;
        }

        if (l < 0.5) {
            t2 = l * (1 + s);
        } else {
            t2 = l + s - l * s;
        }

        const t1 = 2 * l - t2;

        const rgb = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            t3 = h + 1 / 3 * -(i - 1);
            if (t3 < 0) {
                t3++;
            }

            if (t3 > 1) {
                t3--;
            }

            if (6 * t3 < 1) {
                val = t1 + (t2 - t1) * 6 * t3;
            } else if (2 * t3 < 1) {
                val = t2;
            } else if (3 * t3 < 2) {
                val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
            } else {
                val = t1;
            }

            rgb[i] = val * 255;
        }
        this.r=rgb[0]
        this.g=rgb[1]
        this.b=rgb[2]

    }

    copy()
    {
        return new Color(this.r, this.g, this.b, this.a)
    }
}
