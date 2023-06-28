import PixelBox from "../../PixelBox.js"
import Scheduler from "../../Scheduler.js"
import ControlGroup from "../../ControlGroup.js"
import Animator from "../../Animator.js"
import Pixel from "../../Pixel.js"
import PixelList from "../../PixelList.js"
import FxMovie from "../../fx/FxMovie.js"
import Color from "../../Color.js"
import DrawAsciiArtColor from "../../draw/DrawAsciiArtColor.js"








const car = `
..5rrr5..
..5rrr5..
.00rrr00.
.55rrr55.
.55rrr55.
`

const sky =`
....yyy..............55wwwww55................55ww55..........................55wwwwwwwwwwwww55.......
...yyyyy............55wwwwww55..55wwww......55wwwwwwwwww55....................5wwwwwwwwwwwwwwwww5w5w..
....yyy..............55wwwwwwwwwwwwww55.......55www55...55ww55..................5w5w5wwwwww55wwwwwwww.
`




export default class Planetsgone extends Animator {
    static category = "Gamesdemos"
    static title = "Pole position"
    static description = "inspired by the game"
    

    async run(box: PixelBox, scheduler: Scheduler, controls: ControlGroup) 
    {
        const countControl = 100
        const speedControl = controls.value("speed", 10, 1, 100, 1)
        const intervalControl = controls.value("Animation interval", 1, 1, 10, 0.1)
        let bglist=new PixelList()
        let skylist=new PixelList();
        let carpixelList=new PixelList()
        let roadpixelList=new PixelList()
        box.add(bglist)
        box.add(skylist);
        
        box.add(roadpixelList)
        box.add(carpixelList)
        skylist.wrapX(box)
    
    
        for (let i=0;i<box.height();i++)
        {
          let color=new Color(0,0,255,1)
          for (let j=0; j<box.width();j++)
          {
              if (i<4) { color=new Color(0,0,255,1); }
              if (i>4) { color=new Color(0,255,0,1); }
              bglist.add(new Pixel(j,i,color))
          }
        }
      let time=0;

       let road=[0,0,0,0,-1,-1,-1,0,0,0,0,0,1,2,3,2,3,3,2,3,4,4,4,4,5,5,5,5,6,7,8,9,10,11,12,13,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,-0,-1,-1,-1,-1,-1,1,1,0,0,0,-1,1,-1,1,0,0,0,0,0,0,0,0,0,0,0,0,0]


        

       scheduler.intervalControlled(intervalControl, (frameNr) => {
        carpixelList.clear()
        roadpixelList.clear()
        skylist.clear()
        time=time+speedControl.value;
      
        
        let centerX=box.xMax/2
        let centerY=box.yMax/2

        let width=box.xMax;
        let halfwidth=width/2;
        for (let i=0;i<box.yMax-4;i++)
        {
          //draw road
          let r=Math.round((frameNr+i)/10)%road.length
            for (let k=centerX-halfwidth+road[r];k<centerX+halfwidth+road[r];k++)
            {
              roadpixelList.add(new Pixel(k,box.yMax-i,new Color(64,64,64,1)))
            }
           
            halfwidth=(halfwidth)*0.9
            if (((frameNr/10)+i)%4>2) 
            { 
              //draw road centerline
              roadpixelList.add(new Pixel(centerX+road[r],box.yMax-i,new Color(128,128,128,1))) 
            }
            else
            {
              //draw road sides
              roadpixelList.add(new Pixel(centerX-halfwidth+road[r],box.yMax-i,new Color(128,128,128,1)))
              roadpixelList.add(new Pixel(centerX+halfwidth+road[r],box.yMax-i,new Color(128,128,128,1)))
              roadpixelList.add(new Pixel(centerX+road[r],box.yMax-i,new Color(0,0,0,1))) 
            }
        }


        let skyx=Math.round((frameNr)/10)%road.length
        skylist.add(new DrawAsciiArtColor(road[skyx]*-1,0,  sky))

        
        let carX=centerX-3
        let carY=centerY+4;
        carpixelList.add(new DrawAsciiArtColor(carX+(road[skyx]/2),carY,  car))


        



    
       });
       
    }

    
}
