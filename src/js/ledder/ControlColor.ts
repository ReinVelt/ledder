import {Control} from "./Control.js";
import {ColorInterface} from "./ColorInterface.js";

export class ControlColor extends Control implements ColorInterface {
  r: number;
  g: number;
  b: number;
  a: number;


  constructor(name: string, r: number=128, g: number=128, b: number=128, a: number = 1) {
    super(name);
    this.meta.type='color'
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }



  save() {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    }
  }

  load(values) {
    this.r = values.r;
    this.g = values.g;
    this.b = values.b;
    this.a = values.a;

  }
}