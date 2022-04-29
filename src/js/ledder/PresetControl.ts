import {Control} from "./Control.js"
import {ControlValue} from "./ControlValue.js"
import {ControlColor} from "./ControlColor.js"
import {PresetValues} from "./PresetValues.js"
import {ControlInput} from "./ControlInput.js"
import {ControlSwitch} from "./ControlSwitch.js";
import {Choice, ControlSelect} from "./ControlSelect.js";


/**
 * Manages a collection of preset controls, saves and loads values to Preset.
 */
export class PresetControl {
    controls: Record<string, Control>
    presetValues: PresetValues
    //callsbacks are to send control metadata and values to webgui (in WsContext)
    resetCallback: () => void
    addControlCallback: (control) => void
    updateValuesCallback: (controlName, values) => void

    constructor() {

        this.controls = {};
        this.clear();
    }

    clear() {
        this.controls = {}
        this.presetValues = new PresetValues()

        if (this.resetCallback)
        {
            this.resetCallback()
        }
    }


    /**
     * Add control to set
     * @param control
     */
    add(control: Control) {
        this.controls[control.meta.name] = control;

        //already has a preset in values?
        if (control.meta.name in this.presetValues.values)
            control.load(this.presetValues.values[control.meta.name]);

        if (this.updateValuesCallback)
            control.setChangedCallback(this.updateValuesCallback)

        if (this.addControlCallback)
            this.addControlCallback(control)

    }

    /**
     * Get or create value-control with specified name
     * @param name Name of the control
     * @param value Initial value
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @param step Step size
     * @param resetOnChange Reset animation when value has changed
     */
    value(name: string, value: number, min: number, max: number, step: number = 1, resetOnChange:boolean=false): ControlValue {
        if (!(name in this.controls)) {
            this.add(new ControlValue(name, value, min, max, step, resetOnChange));
        }

        // @ts-ignore
        return this.controls[name];
    }

    /**
     * Get or create color-control with specified name
     */
    color(name: string, r: number = 128, g: number = 128, b: number = 128, a: number = 1, resetOnChange:boolean=false): ControlColor {
        if (!(name in this.controls)) {
            this.add(new ControlColor(name, r, g, b, a, resetOnChange));
        }

        // @ts-ignore
        return this.controls[name];
    }

    input(name: string, text:string, resetOnChange:boolean=false): ControlInput {
        if (!(name in this.controls)) {
            this.add(new ControlInput(name, text, resetOnChange));
        }

        // @ts-ignore
        return this.controls[name];
    }

    switch(name: string, enabled:boolean, resetOnChange:boolean=false): ControlSwitch {
        if (!(name in this.controls)) {
            this.add(new ControlSwitch(name, enabled, resetOnChange));
        }

        // @ts-ignore
        return this.controls[name];
    }

    select(name: string, selected:string, choices: Array<Choice>, resetOnChange:boolean=false): ControlSelect {
        if (!(name in this.controls)) {
            this.add(new ControlSelect(name, selected, choices, resetOnChange));
        }

        // @ts-ignore
        return this.controls[name];
    }


    setCallbacks(reset, addControl, updateValues) {
        this.resetCallback = reset
        this.addControlCallback=addControl
        this.updateValuesCallback=updateValues
    }

    /**
     * Return current control values
     * Note: loading and saving is setup in a way so that unused values will never be deleted. It doesnt matter if controls do not yet exists for specific values.
     */
    save() {
        for (const [name, control] of Object.entries(this.controls)) {
            this.presetValues.values[name] = control.save();
        }

        return this.presetValues
    }

    /**
     * Set different preset
     */
    load(preset) {
        this.presetValues = preset;

        //update existing controls
        for (const [name, control] of Object.entries(this.controls)) {
            if (name in this.presetValues.values)
                control.load(this.presetValues.values[name]);
        }

    }

    /**
     * Update values of a specific controlled. (called by browser to update server)
     * @param controlName
     * @param values
     * @return True if animation should be restarted/reset
     */
    updateValue(controlName, values) {
        this.presetValues.values[controlName] = values;
        this.controls[controlName].load(values);

        return (this.controls[controlName].meta.resetOnChange)
    }

}
