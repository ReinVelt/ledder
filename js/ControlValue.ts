import {Control} from "./Control.js";

export class ControlValue extends Control {
    value: number;
    min: number;
    max: number;
    step: number;

    /**
     * Controls a value, step determines the minimum resolution.
     * @param name Name of the control
     * @param value Initial value
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @param step Step size
     */
    constructor(name, value, min, max, step = 1) {
        super(name);

        this.value = value;
        this.min = min;
        this.max = max;
        this.step = step;

    }


}