import OffsetMapper from "./ledder/server/drivers/OffsetMapper.js"
import {DisplayLedstream} from "./ledder/server/drivers/DisplayLedstream.js"
//import {DisplayRPI} from "./ledder/server/drivers/DisplayRPI.js"

export let displayList=[];

//Raspberry PI with 5 displays next to eachother, the displays are zigzag displays of 8x32 pixels
// (standard ali express stuff)
// This uses https://github.com/psy0rz/rpi-ws281x-smi
// let mapper = new OffsetMapper(32*5, 8, false)
// mapper.zigZagY()
// mapper.flipY()
// displayList.push(new DisplayRPI(32*5, 8, 8*32, mapper))


/////////// normal landscape 75 x 8, left zigzagged ledstream:
let mapper328 = new OffsetMapper(32, 8, true)
mapper328.zigZagX()
mapper328.flipY()
displayList.push(new DisplayQOISudp(mapper328, "192.168.1.169", 65000))

//
// ///////////// display pascal HSD
// mapper = new OffsetMapper(18*4, 18, false)
// mapper.zigZagY()
// // mapper.flipY()
// displayList.push(    new DisplayLedstream( 4, 18*4, 18, ["10.0.0.183"], 65000, mapper))

// /////////// vertical landscape mode 75 x 8, left zigzagged ledstream.
// //For ledder the display now has width 8 and height 75.
// new MulticastSync('239.137.111.1', 65001, 1000)
// let mapper = new OffsetMapper(8, 75, false)
// mapper.zigZagY()
// displayList=[
//     new DisplayLedstream( 2, 8, 75, ["esp32-f008d161492c.local"], 65000, mapper), //painted board
// ]

///////// simple 8x32 x4 matrix zigzag
let mastermatrix=new OffsetMapper(64,16)

let matrixzigzagupper = new OffsetMapper(64, 8,false)
matrixzigzagupper.zigZagY()
matrixzigzagupper.flipY()
mastermatrix.addGrid(matrixzigzagupper,0,0,0);

let matrixzigzaglower= new OffsetMapper(64, 8,false)
matrixzigzaglower.zigZagY()
matrixzigzaglower.flipY()
mastermatrix.addGrid(matrixzigzaglower,0,8,1);

displayList.push(new DisplayQOISudp(mastermatrix, "192.168.1.142", 65000))
//displayList.push(new DisplayQOISudp(matrixzigzag, "10.10.10.169", 65000))





//default animation and preset
export let animation="Tests/TestMatrix/default"

export let brightness=255
export let gamma=2.8
