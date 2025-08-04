// with help from https://github.com/Azleur/mat3/blob/master/src/index.ts
import PixelBox from "../../PixelBox.js"
import Scheduler from "../../Scheduler.js"
import ControlGroup from "../../ControlGroup.js"
import PixelList from "../../PixelList.js"
import Animator from "../../Animator.js"
import Color from "../../Color.js"
import Pixel from "../../Pixel.js"
import DrawLine from "../../draw/DrawLine.js"
import Matrix from "matrix_transformer"

import { random, randomFloat } from "../../utils.js"



export class Vec3 extends Matrix {
    x: number;
    y: number;
    z: number;
    constructor(x:number,y:number,z:number)
    {
        super({x:x,y:y,z:z})
        this.x = x;
        this.y = y;
        this.z = z;
    }
    // Ensure rotate method works and returns Vec3
    rotate(rx:number, ry:number, rz:number): Vec3 {
        // Matrix.rotateX/Y/Z should return a Matrix with x/y/z
        // Defensive: handle if rotateX/Y/Z return plain objects
        let v = super.rotateX(rx)
        v = v.rotateY(ry)
        v = v.rotateZ(rz)
        // Defensive: handle if v is not a Vec3
        return v instanceof Vec3 ? v : new Vec3(v.x, v.y, v.z)
    }
}


export class CoordinateLine {
    p1:number
    p2:number

    constructor(p1:number,p2:number)
    {
        this.p1=p1
        this.p2=p2
    }

}

export class Transformation3D
{

    rotate
    translate
    scale

    constructor()
    {
        this.rotate={x:0,y:0,z:0}
        this.translate=new Matrix({x:0,y:0,z:0})
        this.scale={x:1.0,y:1.0,z:1.0}
    }

}


//3D cube model. xyz is in the center of the object
export class Object3d {
    transformation: Transformation3D
    width:number
    height:number
    depth:number
    scale:number

    points: Vec3[]
    lines: CoordinateLine[]
    color:Color

    constructor(x:number,y:number,z:number, width:number,height:number,depth:number,color:Color)
    {
        this.points = []
        this.lines = []
        this.transformation=new Transformation3D()
        this.transformation.translate=new Matrix({x:x,y:y,z:z})
        this.color=color
        this.width=width
        this.height=height
        this.depth=depth
    }

    setRotation(x:number,y:number,z:number)
    {
        this.transformation.rotate={x:x,y:y,z:z}
    }

    getZProjectionlimits(pointsArr: Vec3[])
    {
        let minDepth=1000
        let maxDepth=-1000
        for (let p=0;p<pointsArr.length;p++)
        {
            let z=pointsArr[p].z
            if (z < minDepth) { minDepth=z}
            if (z > maxDepth) { maxDepth=z}
        }
        let alphaPerZ=1/(maxDepth-minDepth || 1)
        return {zMin:minDepth,zMax:maxDepth, zRange:maxDepth-minDepth, alphaPerZ:alphaPerZ}
    }

    render(box: PixelBox,gameControls)
    {
        let pl=new PixelList()
        let pointBuffer: Vec3[] = []
        let perspectiveBuffer: {x:number,y:number,z:number,a:number}[] = []

        for (let p=0;p<this.points.length;p++)
        {
            let rot = this.transformation.rotate
            let pt = this.points[p].rotate(rot.x, rot.y, rot.z)
            pointBuffer.push(pt)
        }

        let depthLimits=this.getZProjectionlimits(pointBuffer)
        let centerX=box.width()/2
        let centerY=box.height()/2
        //draw points
        for (let p=0;p<pointBuffer.length;p++)
        {  
            let x=pointBuffer[p].x+this.transformation.translate.x
            let y=pointBuffer[p].y+this.transformation.translate.y
            let z=pointBuffer[p].z+this.transformation.translate.z

            //depth correction (perspective)
            let xDiff=x-centerX
            let yDiff=y-centerY
            let depthFactor=Math.pow(gameControls.perspective,z)
            x=centerX+(xDiff*depthFactor)
            y=centerY+(yDiff*depthFactor)
            

            //color (more distance is less alpha)
            let c=this.color.copy()
            c.a=1-Math.max(0.1,(pointBuffer[p].z)*depthLimits.alphaPerZ)
            perspectiveBuffer.push({x:x,y:y,z:z,a:c.a})
   
            //draw point
            pl.add(new Pixel(x,y,c))
        }

        
        if (gameControls.wireframe)
        {
            //drawlines
            for (let l=0;l<this.lines.length;l++)
            {
                let p1=this.lines[l].p1
                let p2=this.lines[l].p2
                let x1=perspectiveBuffer[p1].x
                let y1=perspectiveBuffer[p1].y
               
                let c1=this.color.copy()
                c1.a=perspectiveBuffer[p1].a

                let x2=perspectiveBuffer[p2].x
                let y2=perspectiveBuffer[p2].y
              
                let c2=this.color.copy()
                c2.a=perspectiveBuffer[p2].a

                pl.add(new DrawLine(x1,y1,x2,y2,c1,c2))
            }
        }
        
      
        return pl
    }



}

class Axis3d extends Object3d {
   

    constructor(x:number,y:number,z:number, width:number,height:number,depth:number,color:Color)
    {
        super(x,y,z,width,height,depth,color)

        this.points.push(new Vec3(-1*width/2,0,0))
        this.points.push(new Vec3(1*width/2,0,0))
        this.lines.push(new CoordinateLine(0,1))

        this.points.push(new Vec3(0,-1*height/2,0))
        this.points.push(new Vec3(0,1*height/2,0))
        this.lines.push(new CoordinateLine(2,3))

        this.points.push(new Vec3(0,0,-1*depth/2))
        this.points.push(new Vec3(0,0,1*depth/2))
        this.lines.push(new CoordinateLine(4,5))

    }
}


class Cube3d extends Object3d {
    constructor(x:number,y:number,z:number, width:number,height:number,depth:number,color:Color)
    {
        super(x,y,z,width,height,depth,color)
        let halfWidth=width/2
        let halfHeight=height/2
        let halfDepth=depth/2

        this.points.push(new Vec3(-1*halfWidth,-1*halfHeight,-1*halfDepth)) //top-left-far
        this.points.push(new Vec3(1*halfWidth,-1*halfHeight,-1*halfDepth)) //top-right-far
        this.points.push(new Vec3(-1*halfWidth,-1*halfHeight,1*halfDepth)) //top-left-close
        this.points.push(new Vec3(1*halfWidth,-1*halfHeight,1*halfDepth)) //top-right-close

        this.points.push(new Vec3(-1*halfWidth,1*halfHeight,-1*halfDepth)) //bot-left-far
        this.points.push(new Vec3(1*halfWidth,1*halfHeight,-1*halfDepth)) //bot-right-far
        this.points.push(new Vec3(-1*halfWidth,1*halfHeight,1*halfDepth)) //bot-left-close
        this.points.push(new Vec3(1*halfWidth,1*halfHeight,1*halfDepth)) //bot-right-close

        this.points.push(new Vec3(0,0,0)) //center


        this.lines.push(new CoordinateLine(0,1))
        this.lines.push(new CoordinateLine(1,3))
        this.lines.push(new CoordinateLine(3,2))
        this.lines.push(new CoordinateLine(2,0))

        this.lines.push(new CoordinateLine(4,5))
        this.lines.push(new CoordinateLine(5,7))
        this.lines.push(new CoordinateLine(7,6))
        this.lines.push(new CoordinateLine(6,4))

        this.lines.push(new CoordinateLine(0,4))
        this.lines.push(new CoordinateLine(1,5))
        this.lines.push(new CoordinateLine(3,7))
        this.lines.push(new CoordinateLine(2,6))
    }
}


class Pyramid3d extends Object3d {
    constructor(x:number,y:number,z:number, width:number,height:number,depth:number,color:Color)
    {
        super(x,y,z,width,height,depth,color)
        let halfWidth=width/2
        let halfHeight=height/2
        let halfDepth=depth/2

        this.points.push(new Vec3(-1*halfWidth,-1*halfHeight,-1*halfDepth)) //top-left-far
        this.points.push(new Vec3(1*halfWidth,-1*halfHeight,-1*halfDepth)) //top-right-far
        this.points.push(new Vec3(-1*halfWidth,-1*halfHeight,1*halfDepth)) //top-left-close
        this.points.push(new Vec3(1*halfWidth,-1*halfHeight,1*halfDepth)) //top-right-close

        this.points.push(new Vec3(-1*halfWidth,1*halfHeight,-1*halfDepth)) //bot-left-far
        this.points.push(new Vec3(1*halfWidth,1*halfHeight,-1*halfDepth)) //bot-right-far
        this.points.push(new Vec3(-1*halfWidth,1*halfHeight,1*halfDepth)) //bot-left-close
        this.points.push(new Vec3(1*halfWidth,1*halfHeight,1*halfDepth)) //bot-right-close

        this.points.push(new Vec3(0,0,0)) //center


        this.lines.push(new CoordinateLine(0,1))
        this.lines.push(new CoordinateLine(1,3))
        this.lines.push(new CoordinateLine(3,2))
        this.lines.push(new CoordinateLine(2,0))

        this.lines.push(new CoordinateLine(4,5))
        this.lines.push(new CoordinateLine(5,7))
        this.lines.push(new CoordinateLine(7,6))
        this.lines.push(new CoordinateLine(6,4))

        this.lines.push(new CoordinateLine(0,4))
        this.lines.push(new CoordinateLine(1,5))
        this.lines.push(new CoordinateLine(3,7))
        this.lines.push(new CoordinateLine(2,6))
    }
}

// New classes for map elements
class Wall3d extends Object3d {
    constructor(x:number, y:number, z:number, width:number, height:number, depth:number, color:Color) {
        super(x, y, z, width, height, depth, color)
        // Walls are cubes, but could be optimized for rectangles
        let halfWidth = width/2, halfHeight = height/2, halfDepth = depth/2
        this.points.push(new Vec3(-halfWidth, -halfHeight, -halfDepth))
        this.points.push(new Vec3(halfWidth, -halfHeight, -halfDepth))
        this.points.push(new Vec3(halfWidth, halfHeight, -halfDepth))
        this.points.push(new Vec3(-halfWidth, halfHeight, -halfDepth))
        this.points.push(new Vec3(-halfWidth, -halfHeight, halfDepth))
        this.points.push(new Vec3(halfWidth, -halfHeight, halfDepth))
        this.points.push(new Vec3(halfWidth, halfHeight, halfDepth))
        this.points.push(new Vec3(-halfWidth, halfHeight, halfDepth))
        // Connect lines for cube
        this.lines.push(new CoordinateLine(0,1))
        this.lines.push(new CoordinateLine(1,2))
        this.lines.push(new CoordinateLine(2,3))
        this.lines.push(new CoordinateLine(3,0))
        this.lines.push(new CoordinateLine(4,5))
        this.lines.push(new CoordinateLine(5,6))
        this.lines.push(new CoordinateLine(6,7))
        this.lines.push(new CoordinateLine(7,4))
        this.lines.push(new CoordinateLine(0,4))
        this.lines.push(new CoordinateLine(1,5))
        this.lines.push(new CoordinateLine(2,6))
        this.lines.push(new CoordinateLine(3,7))
    }
}

class Camera3d {
    pos: Vec3;
    dir: Vec3;
    fov: number;
    constructor(x: number, y: number, z: number, dir: Vec3, fov = Math.PI/3) {
        this.pos = new Vec3(x, y, z);
        this.dir = dir;
        this.fov = fov;
    }
}

function intersectBox(rayOrigin: Vec3, rayDir: Vec3, boxMin: Vec3, boxMax: Vec3): number | null {
    // Slab method for AABB intersection
    let tmin = (boxMin.x - rayOrigin.x) / rayDir.x;
    let tmax = (boxMax.x - rayOrigin.x) / rayDir.x;
    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
    let tymin = (boxMin.y - rayOrigin.y) / rayDir.y;
    let tymax = (boxMax.y - rayOrigin.y) / rayDir.y;
    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
    if ((tmin > tymax) || (tymin > tmax)) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;
    let tzmin = (boxMin.z - rayOrigin.z) / rayDir.z;
    let tzmax = (boxMax.z - rayOrigin.z) / rayDir.z;
    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
    if ((tmin > tzmax) || (tzmin > tmax)) return null;
    if (tzmin > tmin) tmin = tzmin;
    if (tzmax < tmax) tmax = tzmax;
    if (tmax < 0) return null;
    return tmin > 0 ? tmin : tmax;
}

class Enemy3d extends Object3d {
    animationPhase: number = 0;
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 8, 20, 8, new Color(200,0,0,1.0))
        this.animationPhase = 0;
        this.initGeometry();
    }
    initGeometry() {
        this.points = [];
        // Advanced humanoid: head (sphere), torso, arms, legs, facial features
        // Head (sphere: 8 points around)
        let headCenter = new Vec3(0, -12, 0);
        let headRadius = 3;
        for (let i = 0; i < 8; i++) {
            let angle = (Math.PI*2*i)/8;
            this.points.push(new Vec3(
                headCenter.x + Math.cos(angle)*headRadius,
                headCenter.y,
                headCenter.z + Math.sin(angle)*headRadius
            )); // 0-7: head circle
        }
        this.points.push(headCenter); // 8: head center
        // Facial features (simple eyes/mouth)
        this.points.push(new Vec3(headCenter.x-1, headCenter.y-1, headCenter.z+1)); // 9: left eye
        this.points.push(new Vec3(headCenter.x+1, headCenter.y-1, headCenter.z+1)); // 10: right eye
        this.points.push(new Vec3(headCenter.x, headCenter.y+1, headCenter.z+1.5)); // 11: mouth
        // Torso
        this.points.push(new Vec3(0, -8, 0)); // 12: neck base
        this.points.push(new Vec3(0, 4, 0)); // 13: hip
        // Animated arms/legs
        let phase = this.animationPhase;
        let armSwing = Math.sin(phase)*4;
        let legSwing = Math.cos(phase)*3;
        // Left arm
        this.points.push(new Vec3(-5, -6 + armSwing, 0)); // 14: left shoulder
        this.points.push(new Vec3(-8, 2 + armSwing, 0)); // 15: left hand
        // Right arm
        this.points.push(new Vec3(5, -6 - armSwing, 0)); // 16: right shoulder
        this.points.push(new Vec3(8, 2 - armSwing, 0)); // 17: right hand
        // Left leg
        this.points.push(new Vec3(-2, 4 + legSwing, 0)); // 18: left hip
        this.points.push(new Vec3(-2, 12 + legSwing, 0)); // 19: left foot
        // Right leg
        this.points.push(new Vec3(2, 4 - legSwing, 0)); // 20: right hip
        this.points.push(new Vec3(2, 12 - legSwing, 0)); // 21: right foot
        // Head bobbing
        let bob = Math.sin(phase*0.5)*1.2;
        for (let i = 0; i < 9; i++) {
            this.points[i].y += bob;
        }
        // Color details: blue pants, brown shoes, yellow face
        this.color = new Color(200,0,0,1.0); // Default: red
        // Color details could be used for advanced rendering, but not needed for wireframe
        this.lines = [];
        // Head outline
        for (let i = 0; i < 8; i++) {
            this.lines.push(new CoordinateLine(i, (i+1)%8));
            this.lines.push(new CoordinateLine(i, 8)); // to center
        }
        // Facial features
        this.lines.push(new CoordinateLine(9,10)); // eyes
        this.lines.push(new CoordinateLine(11,8)); // mouth to center
        // Neck
        this.lines.push(new CoordinateLine(8,12)); // head center to neck base
        // Torso
        this.lines.push(new CoordinateLine(12,13)); // neck base to hip
        // Arms
        this.lines.push(new CoordinateLine(12,14)); // left shoulder
        this.lines.push(new CoordinateLine(14,15)); // left arm
        this.lines.push(new CoordinateLine(12,16)); // right shoulder
        this.lines.push(new CoordinateLine(16,17)); // right arm
        // Legs
        this.lines.push(new CoordinateLine(13,18)); // left hip
        this.lines.push(new CoordinateLine(18,19)); // left leg
        this.lines.push(new CoordinateLine(13,20)); // right hip
        this.lines.push(new CoordinateLine(20,21)); // right leg
    }
    animate(frameNr:number) {
        this.animationPhase = frameNr*0.15;
        this.initGeometry();
    }
    }

class Weapon3d extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 10, 4, 4, new Color(0,200,0,1.0))
        // More realistic: handle, barrel, sight
        // Handle
        this.points.push(new Vec3(-2, 2, 0)); // 0
        this.points.push(new Vec3(2, 2, 0)); // 1
        // Barrel
        this.points.push(new Vec3(-2, -2, 0)); // 2
        this.points.push(new Vec3(2, -2, 0)); // 3
        // Sight
        this.points.push(new Vec3(0, -4, 0)); // 4
        // Connect lines
        this.lines.push(new CoordinateLine(0,1)); // handle
        this.lines.push(new CoordinateLine(0,2)); // left side
        this.lines.push(new CoordinateLine(1,3)); // right side
        this.lines.push(new CoordinateLine(2,3)); // barrel
        this.lines.push(new CoordinateLine(3,4)); // sight
    }
}

class Object3dDecor extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 6, 6, 6, new Color(180,180,0,1.0))
        // Decorative sphere: draw a small 3D star
        this.points.push(new Vec3(0,0,0)); // center
        this.points.push(new Vec3(3,0,0));
        this.points.push(new Vec3(-3,0,0));
        this.points.push(new Vec3(0,3,0));
        this.points.push(new Vec3(0,-3,0));
        this.points.push(new Vec3(0,0,3));
        this.points.push(new Vec3(0,0,-3));
        // Connect lines
        this.lines.push(new CoordinateLine(0,1));
        this.lines.push(new CoordinateLine(0,2));
        this.lines.push(new CoordinateLine(0,3));
        this.lines.push(new CoordinateLine(0,4));
        this.lines.push(new CoordinateLine(0,5));
        this.lines.push(new CoordinateLine(0,6));
    }
}

class HealthPack3d extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 8, 8, 8, new Color(0,255,0,1.0));
        // Draw a 3D cross (health symbol)
        this.points.push(new Vec3(0,0,0)); // center
        this.points.push(new Vec3(0,3,0)); // up
        this.points.push(new Vec3(0,-3,0)); // down
        this.points.push(new Vec3(3,0,0)); // right
        this.points.push(new Vec3(-3,0,0)); // left
        this.points.push(new Vec3(0,0,3)); // front
        this.points.push(new Vec3(0,0,-3)); // back
        // Connect lines for cross
        this.lines.push(new CoordinateLine(1,2));
        this.lines.push(new CoordinateLine(3,4));
        this.lines.push(new CoordinateLine(5,6));
    }
}

class AmmoBox3d extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 8, 8, 8, new Color(255,255,0,1.0));
        // Draw a 3D box with a bullet inside
        // Box corners
        this.points.push(new Vec3(-3,-3,-3)); // 0
        this.points.push(new Vec3(3,-3,-3)); // 1
        this.points.push(new Vec3(3,3,-3)); // 2
        this.points.push(new Vec3(-3,3,-3)); // 3
        this.points.push(new Vec3(-3,-3,3)); // 4
        this.points.push(new Vec3(3,-3,3)); // 5
        this.points.push(new Vec3(3,3,3)); // 6
        this.points.push(new Vec3(-3,3,3)); // 7
        // Bullet (vertical line)
        this.points.push(new Vec3(0,-2,0)); // 8
        this.points.push(new Vec3(0,2,0)); // 9
        // Box edges
        this.lines.push(new CoordinateLine(0,1));
        this.lines.push(new CoordinateLine(1,2));
        this.lines.push(new CoordinateLine(2,3));
        this.lines.push(new CoordinateLine(3,0));
        this.lines.push(new CoordinateLine(4,5));
        this.lines.push(new CoordinateLine(5,6));
        this.lines.push(new CoordinateLine(6,7));
        this.lines.push(new CoordinateLine(7,4));
        this.lines.push(new CoordinateLine(0,4));
        this.lines.push(new CoordinateLine(1,5));
        this.lines.push(new CoordinateLine(2,6));
        this.lines.push(new CoordinateLine(3,7));
        // Bullet
        this.lines.push(new CoordinateLine(8,9));
    }
}

class Door3d extends Object3d {
    constructor(x:number, y:number, z:number, width:number, height:number, depth:number) {
        super(x, y, z, width, height, depth, new Color(160,82,45,1.0));
        let halfWidth = width/2, halfHeight = height/2, halfDepth = depth/2;
        this.points.push(new Vec3(-halfWidth, -halfHeight, -halfDepth));
        this.points.push(new Vec3(halfWidth, -halfHeight, -halfDepth));
        this.points.push(new Vec3(halfWidth, halfHeight, -halfDepth));
        this.points.push(new Vec3(-halfWidth, halfHeight, -halfDepth));
        this.points.push(new Vec3(-halfWidth, -halfHeight, halfDepth));
        this.points.push(new Vec3(halfWidth, -halfHeight, halfDepth));
        this.points.push(new Vec3(halfWidth, halfHeight, halfDepth));
        this.points.push(new Vec3(-halfWidth, halfHeight, halfDepth));
        this.lines.push(new CoordinateLine(0,1));
        this.lines.push(new CoordinateLine(1,2));
        this.lines.push(new CoordinateLine(2,3));
        this.lines.push(new CoordinateLine(3,0));
        this.lines.push(new CoordinateLine(4,5));
        this.lines.push(new CoordinateLine(5,6));
        this.lines.push(new CoordinateLine(6,7));
        this.lines.push(new CoordinateLine(7,4));
        this.lines.push(new CoordinateLine(0,4));
        this.lines.push(new CoordinateLine(1,5));
        this.lines.push(new CoordinateLine(2,6));
        this.lines.push(new CoordinateLine(3,7));
    }
}

class Barrel3d extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 6, 10, 6, new Color(139,69,19,1.0));
        // Draw a cylinder (barrel): top/bottom circle and vertical lines
        for (let i = 0; i < 8; i++) {
            let angle = (Math.PI*2*i)/8;
            this.points.push(new Vec3(Math.cos(angle)*3, -5, Math.sin(angle)*3)); // top circle
            this.points.push(new Vec3(Math.cos(angle)*3, 5, Math.sin(angle)*3)); // bottom circle
        }
        // Connect top circle
        for (let i = 0; i < 8; i++) {
            this.lines.push(new CoordinateLine(i*2, ((i+1)%8)*2));
        }
        // Connect bottom circle
        for (let i = 0; i < 8; i++) {
            this.lines.push(new CoordinateLine(i*2+1, ((i+1)%8)*2+1));
        }
        // Connect vertical lines
        for (let i = 0; i < 8; i++) {
            this.lines.push(new CoordinateLine(i*2, i*2+1));
        }
    }
}

class Player3d extends Object3d {
    constructor(x:number, y:number, z:number) {
        super(x, y, z, 8, 16, 8, new Color(0,0,255,1.0))
        this.points.push(new Vec3(0, -8, 0))
        this.points.push(new Vec3(0, 8, 0))
        this.lines.push(new CoordinateLine(0,1))
    }
}

class Landscape3d {
    points: Vec3[] = []
    colors: Color[] = []
    width: number
    height: number
    spacing: number

    constructor(box: PixelBox, spacing = 12) {
        this.width = box.width()
        this.height = box.height()
        this.spacing = spacing
        // Generate grid of points at z = -12 (ground layer)
        for (let x = spacing; x < this.width; x += spacing) {
            for (let y = spacing; y < this.height; y += spacing) {
                // Add some random height for realism
                let z = -12 + randomFloat(-1, 1)
                this.points.push(new Vec3(x - this.width/2, y - this.height/2, z))
                // Realistic grass/earth color
                let base = randomFloat(0, 1) < 0.7
                let c = base
                    ? new Color(34 + randomFloat(0, 20), 139 + randomFloat(0, 40), 34 + randomFloat(0, 20), 1.0) // grass
                    : new Color(139 + randomFloat(0, 30), 69 + randomFloat(0, 20), 19 + randomFloat(0, 10), 1.0) // earth
                this.colors.push(c)
            }
        }
    }

    render(box: PixelBox, controlSettings) {
        let pl = new PixelList()
        let centerX = box.width()/2
        let centerY = box.height()/2
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i]
            // Always use rotate method
            let rotated = p.rotate(controlSettings.rotation, controlSettings.rotation, 0)
            let x = rotated.x + centerX
            let y = rotated.y + centerY
            let z = rotated.z
            // Perspective
            let xDiff = x - centerX
            let yDiff = y - centerY
            let depthFactor = Math.pow(controlSettings.perspective, z)
            x = centerX + (xDiff * depthFactor)
            y = centerY + (yDiff * depthFactor)
            // Fade with depth
            let c = this.colors[i].copy()
            c.a = 0.8 - Math.max(0, (z+12)*0.03)
            pl.add(new Pixel(x, y, c))
        }
        return pl
    }
}

// Map3d holds all objects
class Map3d {
    walls: Wall3d[] = []
    enemies: Enemy3d[] = []
    weapons: Weapon3d[] = []
    objects: Object3dDecor[] = []
    healthpacks: HealthPack3d[] = []
    ammoboxes: AmmoBox3d[] = []
    doors: Door3d[] = []
    barrels: Barrel3d[] = []
    player: Player3d
    landscape: Landscape3d

    // Track which items have been picked up
    pickedHealth: Set<number> = new Set();
    pickedAmmo: Set<number> = new Set();

    // Player movement state
    playerTarget: Vec3 | null = null;
    playerSpeed: number = 2.5;
    playerPath: Vec3[] = [];

    constructor(box: PixelBox) {
        // Castle layout: outer walls, inner rooms, doors
        let w = box.width(), h = box.height()
        let wallColor = new Color(120,120,120,1.0)
        // Outer walls
        this.walls.push(new Wall3d(w/2, 10, 0, w-10, 10, 10, wallColor)) // top
        this.walls.push(new Wall3d(w/2, h-10, 0, w-10, 10, 10, wallColor)) // bottom
        this.walls.push(new Wall3d(10, h/2, 0, 10, h-10, 10, wallColor)) // left
        this.walls.push(new Wall3d(w-10, h/2, 0, 10, h-10, 10, wallColor)) // right
        // Inner room
        this.walls.push(new Wall3d(w/2, h/2, 0, w/3, 10, 10, wallColor)) // horizontal
        this.walls.push(new Wall3d(w/2, h/2, 0, 10, h/3, 10, wallColor)) // vertical
        // Doorways (just gaps, not rendered)
        this.doors.push(new Door3d(box.width()/2, 30, 0, 20, 30, 5))
        this.doors.push(new Door3d(box.width()/2, box.height()-30, 0, 20, 30, 5))
        // Add health packs
        this.healthpacks.push(new HealthPack3d(box.width()/2-50, box.height()/2, 0))
        this.healthpacks.push(new HealthPack3d(box.width()/2+50, box.height()/2, 0))
        // Add ammo boxes
        this.ammoboxes.push(new AmmoBox3d(box.width()/2, box.height()/2-50, 0))
        this.ammoboxes.push(new AmmoBox3d(box.width()/2, box.height()/2+50, 0))
        // Add barrels
        this.barrels.push(new Barrel3d(box.width()/2-60, box.height()/2-60, 0))
        this.barrels.push(new Barrel3d(box.width()/2+60, box.height()/2+60, 0))
        // Player
        this.player = new Player3d(w/2, h/2, 0)
        this.landscape = new Landscape3d(box)

        // Set up path to all items (health packs then ammo boxes)
        this.playerPath = [];
        for (let i = 0; i < this.healthpacks.length; i++) {
            let hp = this.healthpacks[i];
            this.playerPath.push(new Vec3(hp.transformation.translate.x, hp.transformation.translate.y, hp.transformation.translate.z));
        }
        for (let i = 0; i < this.ammoboxes.length; i++) {
            let ab = this.ammoboxes[i];
            this.playerPath.push(new Vec3(ab.transformation.translate.x, ab.transformation.translate.y, ab.transformation.translate.z));
        }
        this.playerTarget = this.playerPath.length > 0 ? this.playerPath[0] : null;
    }

    // Move player towards next target, pick up items
    updatePlayerAutoWalk() {
        if (!this.playerTarget) return;
        let px = this.player.transformation.translate.x;
        let py = this.player.transformation.translate.y;
        let tx = this.playerTarget.x;
        let ty = this.playerTarget.y;
        let dx = tx - px;
        let dy = ty - py;
        let dist = Math.sqrt(dx*dx + dy*dy);
        // Jumping/climbing logic: if target is above, allow z to increase briefly
        let jumpHeight = 12;
        let climbSpeed = 2.0;
        let groundZ = 0;
        let pz = this.player.transformation.translate.z;
        let tz = this.playerTarget.z;
        if (Math.abs(tz - pz) > 1 && Math.abs(tz - groundZ) < jumpHeight) {
            // Climb or jump
            if (pz < tz) {
                this.player.transformation.translate.z += climbSpeed;
                if (this.player.transformation.translate.z > tz) {
                    this.player.transformation.translate.z = tz;
                }
            } else {
                this.player.transformation.translate.z -= climbSpeed;
                if (this.player.transformation.translate.z < tz) {
                    this.player.transformation.translate.z = tz;
                }
            }
        } else {
            // Always keep player on ground unless climbing/jumping
            this.player.transformation.translate.z = groundZ;
        }
        if (dist < 5) {
            // Arrived at target, mark as picked up
            for (let i = 0; i < this.healthpacks.length; i++) {
                let hp = this.healthpacks[i];
                if (Math.abs(hp.transformation.translate.x - tx) < 1 && Math.abs(hp.transformation.translate.y - ty) < 1) {
                    this.pickedHealth.add(i);
                }
            }
            for (let i = 0; i < this.ammoboxes.length; i++) {
                let ab = this.ammoboxes[i];
                if (Math.abs(ab.transformation.translate.x - tx) < 1 && Math.abs(ab.transformation.translate.y - ty) < 1) {
                    this.pickedAmmo.add(i);
                }
            }
            this.playerPath.shift();
            this.playerTarget = this.playerPath.length > 0 ? this.playerPath[0] : null;
        } else {
            // Move player towards target (x/y only)
            let step = this.playerSpeed / Math.max(dist, 1);
            this.player.transformation.translate.x += dx * step;
            this.player.transformation.translate.y += dy * step;
        }
    }

    // Monsters move and try to get the player, with animation
    updateMonstersChasePlayer(frameNr:number) {
        for (let enemy of this.enemies) {
            let ex = enemy.transformation.translate.x;
            let ey = enemy.transformation.translate.y;
            let px = this.player.transformation.translate.x;
            let py = this.player.transformation.translate.y;
            let dx = px - ex;
            let dy = py - ey;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let speed = 1.5;
            if (dist > 2) {
                enemy.transformation.translate.x += dx/dist * speed;
                enemy.transformation.translate.y += dy/dist * speed;
            }
            // Monsters stay on ground
            enemy.transformation.translate.z = 0;
            // Animate enemy
            if (typeof enemy.animate === "function") {
                enemy.animate(frameNr);
            }
        }
    }

    renderRaytraced(box: PixelBox, camera: Camera3d, controlSettings) {
        let pl = new PixelList();
        let w = box.width(), h = box.height();
        let aspect = w / h;
        let fov = camera.fov;
        let camPos = camera.pos;
        let camDir = camera.dir;
        // Remove picked up items from rendering
        let healthpacks = this.healthpacks.filter((_,i)=>!this.pickedHealth.has(i));
        let ammoboxes = this.ammoboxes.filter((_,i)=>!this.pickedAmmo.has(i));
        for (let px = 0; px < w; px++) {
            for (let py = 0; py < h; py++) {
                let x = (2 * (px + 0.5) / w - 1) * aspect * Math.tan(fov/2);
                let y = (1 - 2 * (py + 0.5) / h) * Math.tan(fov/2);
                let rayDir = new Vec3(x, y, -1);
                let minDist = Infinity;
                let hitColor = null;
                // Walls
                for (let wall of this.walls) {
                    let pts = wall.points;
                    let min = new Vec3(Math.min(...pts.map(p=>p.x)) + wall.transformation.translate.x,
                                      Math.min(...pts.map(p=>p.y)) + wall.transformation.translate.y,
                                      Math.min(...pts.map(p=>p.z)) + wall.transformation.translate.z);
                    let max = new Vec3(Math.max(...pts.map(p=>p.x)) + wall.transformation.translate.x,
                                      Math.max(...pts.map(p=>p.y)) + wall.transformation.translate.y,
                                      Math.max(...pts.map(p=>p.z)) + wall.transformation.translate.z);
                    let t = intersectBox(camPos, rayDir, min, max);
                    if (t !== null && t < minDist && t > 0.1) {
                        minDist = t;
                        hitColor = wall.color.copy();
                    }
                }
                // Doors
                for (let door of this.doors) {
                    let pts = door.points;
                    let min = new Vec3(Math.min(...pts.map(p=>p.x)) + door.transformation.translate.x,
                                      Math.min(...pts.map(p=>p.y)) + door.transformation.translate.y,
                                      Math.min(...pts.map(p=>p.z)) + door.transformation.translate.z);
                    let max = new Vec3(Math.max(...pts.map(p=>p.x)) + door.transformation.translate.x,
                                      Math.max(...pts.map(p=>p.y)) + door.transformation.translate.y,
                                      Math.max(...pts.map(p=>p.z)) + door.transformation.translate.z);
                    let t = intersectBox(camPos, rayDir, min, max);
                    if (t !== null && t < minDist && t > 0.1) {
                        minDist = t;
                        hitColor = door.color.copy();
                    }
                }
                // Health packs
                for (let hp of healthpacks) {
                    let pts = hp.points;
                    let min = new Vec3(Math.min(...pts.map(p=>p.x)) + hp.transformation.translate.x,
                                      Math.min(...pts.map(p=>p.y)) + hp.transformation.translate.y,
                                      Math.min(...pts.map(p=>p.z)) + hp.transformation.translate.z);
                    let max = new Vec3(Math.max(...pts.map(p=>p.x)) + hp.transformation.translate.x,
                                      Math.max(...pts.map(p=>p.y)) + hp.transformation.translate.y,
                                      Math.max(...pts.map(p=>p.z)) + hp.transformation.translate.z);
                    let t = intersectBox(camPos, rayDir, min, max);
                    if (t !== null && t < minDist && t > 0.1) {
                        minDist = t;
                        hitColor = hp.color.copy();
                    }
                }
                // Ammo boxes
                for (let ab of ammoboxes) {
                    let pts = ab.points;
                    let min = new Vec3(Math.min(...pts.map(p=>p.x)) + ab.transformation.translate.x,
                                      Math.min(...pts.map(p=>p.y)) + ab.transformation.translate.y,
                                      Math.min(...pts.map(p=>p.z)) + ab.transformation.translate.z);
                    let max = new Vec3(Math.max(...pts.map(p=>p.x)) + ab.transformation.translate.x,
                                      Math.max(...pts.map(p=>p.y)) + ab.transformation.translate.y,
                                      Math.max(...pts.map(p=>p.z)) + ab.transformation.translate.z);
                    let t = intersectBox(camPos, rayDir, min, max);
                    if (t !== null && t < minDist && t > 0.1) {
                        minDist = t;
                        hitColor = ab.color.copy();
                    }
                }
                // Barrels
                for (let barrel of this.barrels) {
                    let pts = barrel.points;
                    let min = new Vec3(Math.min(...pts.map(p=>p.x)) + barrel.transformation.translate.x,
                                      Math.min(...pts.map(p=>p.y)) + barrel.transformation.translate.y,
                                      Math.min(...pts.map(p=>p.z)) + barrel.transformation.translate.z);
                    let max = new Vec3(Math.max(...pts.map(p=>p.x)) + barrel.transformation.translate.x,
                                      Math.max(...pts.map(p=>p.y)) + barrel.transformation.translate.y,
                                      Math.max(...pts.map(p=>p.z)) + barrel.transformation.translate.z);
                    let t = intersectBox(camPos, rayDir, min, max);
                    if (t !== null && t < minDist && t > 0.1) {
                        minDist = t;
                        hitColor = barrel.color.copy();
                    }
                }
                // Sky and distant landscape
                if (!hitColor) {
                    if (y < -0.1) {
                        // Sky gradient: blue at top, lighter near horizon
                        let skyFactor = Math.max(0, Math.min(1, (-y-0.1)/1.2));
                        hitColor = new Color(
                            120 + skyFactor*60,
                            120 + skyFactor*80,
                            180 + skyFactor*40,
                            1.0
                        );
                        minDist = 40;
                    } else if (y < 0.1) {
                        // Distant landscape band (green)
                        hitColor = new Color(60, 180, 60, 1.0);
                        minDist = 40;
                    } else {
                        // Floor
                        hitColor = new Color(80,80,80,1.0);
                        minDist = 40;
                    }
                }
                if (hitColor) {
                    hitColor.a = Math.max(0.2, 1.0 - minDist * 0.03);
                    pl.add(new Pixel(px, py, hitColor));
                }
            }
        }
        return pl;
    }
}

export default class Wolfenrein3d extends Animator {
    static category = "3D"
    static title = "Wolfenrein3d"
    static description = "Wolfenstein3D Castle Demo"
    async run(box: PixelBox, scheduler: Scheduler, controls: ControlGroup) {
        // Camera controls
        const gameControls = controls.group("3D")
        const gameIntervalControl = gameControls.value("Clock interval", 1, 1, 10, 0.1, true)
        const gameFovControl = gameControls.value("Camera FOV", 1.0, 0.5, 2.0, 0.01, false)
        const gameXControl = gameControls.value("Camera X", box.width()/2, 0, box.width(), 1, false)
        const gameYControl = gameControls.value("Camera Y", box.height()/2, 0, box.height(), 1, false)
        const gameZControl = gameControls.value("Camera Z", 40, -100, 100, 1, false)
        const gameYawControl = gameControls.value("Camera Yaw", 0, -Math.PI, Math.PI, 0.01, false)
        const gamePitchControl = gameControls.value("Camera Pitch", 0, -Math.PI/2, Math.PI/2, 0.01, false)

        let pl = new PixelList();
        box.add(pl);
        let map3d = new Map3d(box);

        // Add some enemies for demo
        if (map3d.enemies.length === 0) {
            map3d.enemies.push(new Enemy3d(box.width()/2-80, box.height()/2-40, 0));
            map3d.enemies.push(new Enemy3d(box.width()/2+80, box.height()/2+40, 0));
        }
        scheduler.intervalControlled(gameIntervalControl, (frameNr) => {
            pl.clear();
            // Move player automatically (x/y only, jump/climb possible)
            map3d.updatePlayerAutoWalk();
            // Monsters chase player with animation
            map3d.updateMonstersChasePlayer(frameNr);
            // Camera follows player
            let camX = map3d.player.transformation.translate.x;
            let camY = map3d.player.transformation.translate.y;
            let camZ = map3d.player.transformation.translate.z + 40;
            let yaw = gameYawControl.value;
            let pitch = gamePitchControl.value;
            // Direction vector from yaw/pitch
            let dir = new Vec3(Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw)*Math.cos(pitch));
            let camera = new Camera3d(camX, camY, camZ, dir, gameFovControl.value);
            pl.add(map3d.renderRaytraced(box, camera, {}));
        });
    }
}
