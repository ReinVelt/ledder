import {Matrix} from "./Matrix.js";
import {RpcClient} from "./RpcClient.js";
import * as animations from "./animations/all.js";
import {Control} from "./Control.js";
import $ from "jquery";

/**
 * Browser side runner
 */
export class RunnerBrowser {
  matrix: Matrix
  rpc: RpcClient
  animationName: string
  presetName: string
  animationClass: Animation
  live: boolean;

  constructor(matrix: Matrix, rpc: RpcClient) {
    this.matrix = matrix
    this.rpc = rpc;
    this.live=false;

  }

  /** Send current running animation and preset to server
   *
   */
  async send() {

    await this.rpc.request("runner.run", this.animationName, this.matrix.preset.save());
  }

  updateHtml()
  {

  }

  /**
   * Runs specified animation with specified preset
   *
   * @param animationName
   * @param presetName
   */
  async run(animationName: string, presetName: string) {


    if (animationName in animations) {
      console.log("Runner: starting", animationName, presetName)
      this.matrix.clear()

      this.animationClass=animations[animationName];

      if (presetName)
        {
          // @ts-ignore
          this.matrix.preset.load(await this.rpc.request("presetStore.load", this.animationClass.presetDir, presetName));
        }

      this.animationName = animationName
      this.presetName = presetName

      // @ts-ignore
      new this.animationClass(this.matrix)

      if (this.live)
        await this.send();

      return true
    } else
      return false
  }

  /** Save current preset
   *
   */
  async presetSave()
  {
    let preset=this.matrix.preset.save();

    // @ts-ignore
    await this.rpc.request("presetStore.save", this.animationClass.presetDir, this.presetName, preset);
  }
}
