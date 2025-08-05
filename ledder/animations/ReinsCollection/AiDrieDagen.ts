import PixelBox from "../../PixelBox.js"
import Scheduler from "../../Scheduler.js"
import ControlGroup from "../../ControlGroup.js"
import PixelList from "../../PixelList.js"
import Animator from "../../Animator.js"
import Pixel from "../../Pixel.js"
import Color from "../../Color.js"
import DrawLine from "../../draw/DrawLine.js"
import DrawCircle from "../../draw/DrawCircle.js"
import { random } from "../../utils.js"

// Extensive synthwave color palette with smooth gradients
const colors = {
    // Neon colors
    neonPink: new Color(255, 20, 147, 1, true),
    neonCyan: new Color(0, 255, 255, 1, true),
    neonPurple: new Color(138, 43, 226, 1, true),
    neonGreen: new Color(57, 255, 20, 1, true),
    neonOrange: new Color(255, 165, 0, 1, true),
    neonBlue: new Color(30, 144, 255, 1, true),
    
    // Sun colors
    sunYellow: new Color(255, 255, 100, 1, true),
    sunOrange: new Color(255, 180, 50, 1, true),
    sunRed: new Color(255, 100, 80, 1, true),
    sunWhite: new Color(255, 255, 220, 1, true),
    sunsetOrange: new Color(255, 140, 30, 1, true),
    sunriseRed: new Color(255, 80, 60, 1, true),
    sunsetPink: new Color(255, 100, 150, 1, true),
    sunrisePurple: new Color(200, 80, 200, 1, true),
    
    // Sky colors
    skyDeepPurple: new Color(25, 0, 51, 1, true),
    skyPurple: new Color(40, 20, 80, 1, true),
    skyViolet: new Color(60, 40, 120, 1, true),
    skyBlue: new Color(30, 60, 150, 1, true),
    skyLightBlue: new Color(50, 100, 200, 1, true),
    skyNightDark: new Color(5, 0, 15, 1, true),
    skyDawnPurple: new Color(80, 40, 120, 1, true),
    skyDawnPink: new Color(150, 80, 120, 1, true),
    skyDayBlue: new Color(135, 206, 235, 1, true),
    
    // Grid colors
    gridCyan: new Color(0, 255, 255, 0.8, true),
    gridPink: new Color(255, 20, 147, 0.8, true),
    gridPurple: new Color(138, 43, 226, 0.8, true),
    gridBlue: new Color(30, 144, 255, 0.8, true),
    
    // Star colors
    starWhite: new Color(255, 255, 255, 1, true),
    starBlue: new Color(200, 220, 255, 1, true),
    starYellow: new Color(255, 255, 200, 1, true),
    starOrange: new Color(255, 220, 150, 1, true),
    

    
    // Ground colors
    groundDark: new Color(10, 0, 20, 1, true),
    groundPurple: new Color(30, 10, 40, 1, true),
    grass: new Color(0, 120, 40, 1, true),
    water: new Color(0, 100, 200, 0.8, true)
}

// 3D Vector class with full transformation support
class Vec3 {
    constructor(public x: number, public y: number, public z: number) {}
    
    copy(): Vec3 {
        return new Vec3(this.x, this.y, this.z)
    }
    
    add(v: Vec3): Vec3 {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z)
    }
    
    subtract(v: Vec3): Vec3 {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z)
    }
    
    multiply(scalar: number): Vec3 {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar)
    }
    
    dot(v: Vec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z
    }
    
    cross(v: Vec3): Vec3 {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        )
    }
    
    normalize(): Vec3 {
        const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
        if (length === 0) return new Vec3(0, 0, 0)
        return new Vec3(this.x / length, this.y / length, this.z / length)
    }
    
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    }
}

// 4x4 Matrix for 3D transformations
class Matrix4 {
    constructor(public m: number[][] = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]) {}
    
    static perspective(fov: number, aspect: number, near: number, far: number): Matrix4 {
        const f = 1.0 / Math.tan(fov / 2)
        const rangeInv = 1.0 / (near - far)
        
        return new Matrix4([
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (near + far) * rangeInv, -1],
            [0, 0, 2 * far * near * rangeInv, 0]
        ])
    }
    
    static lookAt(eye: Vec3, target: Vec3, up: Vec3): Matrix4 {
        const zAxis = eye.subtract(target).normalize()
        const xAxis = up.cross(zAxis).normalize()
        const yAxis = zAxis.cross(xAxis)
        
        return new Matrix4([
            [xAxis.x, yAxis.x, zAxis.x, 0],
            [xAxis.y, yAxis.y, zAxis.y, 0],
            [xAxis.z, yAxis.z, zAxis.z, 0],
            [-xAxis.dot(eye), -yAxis.dot(eye), -zAxis.dot(eye), 1]
        ])
    }
    
    static rotationY(angle: number): Matrix4 {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return new Matrix4([
            [cos, 0, sin, 0],
            [0, 1, 0, 0],
            [-sin, 0, cos, 0],
            [0, 0, 0, 1]
        ])
    }
    
    static translation(x: number, y: number, z: number): Matrix4 {
        return new Matrix4([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [x, y, z, 1]
        ])
    }
    
    multiply(other: Matrix4): Matrix4 {
        const result = new Matrix4()
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result.m[i][j] = 0
                for (let k = 0; k < 4; k++) {
                    result.m[i][j] += this.m[i][k] * other.m[k][j]
                }
            }
        }
        return result
    }
    
    transformPoint(point: Vec3): Vec3 {
        const x = point.x * this.m[0][0] + point.y * this.m[1][0] + point.z * this.m[2][0] + this.m[3][0]
        const y = point.x * this.m[0][1] + point.y * this.m[1][1] + point.z * this.m[2][1] + this.m[3][1]
        const z = point.x * this.m[0][2] + point.y * this.m[1][2] + point.z * this.m[2][2] + this.m[3][2]
        const w = point.x * this.m[0][3] + point.y * this.m[1][3] + point.z * this.m[2][3] + this.m[3][3]
        
        if (w !== 0) {
            return new Vec3(x / w, y / w, z / w)
        }
        return new Vec3(x, y, z)
    }
}

// 3D Camera system
class Camera3D {
    position: Vec3
    target: Vec3
    up: Vec3
    fov: number
    near: number
    far: number
    
    constructor(position: Vec3, target: Vec3) {
        this.position = position
        this.target = target
        this.up = new Vec3(0, 1, 0)
        this.fov = Math.PI / 2.5   // Wider FOV (72 degrees) for better object visibility
        this.near = 0.1   // Keep near plane reasonable
        this.far = 20     // Closer far plane since objects are closer
    }
    
    getViewMatrix(): Matrix4 {
        return Matrix4.lookAt(this.position, this.target, this.up)
    }
    
    getProjectionMatrix(aspect: number): Matrix4 {
        return Matrix4.perspective(this.fov, aspect, this.near, this.far)
    }
}

// 3D Triangle for rendering
class Triangle3D {
    constructor(public v1: Vec3, public v2: Vec3, public v3: Vec3, public color: Color) {}
    
    getNormal(): Vec3 {
        const edge1 = this.v2.subtract(this.v1)
        const edge2 = this.v3.subtract(this.v1)
        return edge1.cross(edge2).normalize()
    }
    
    getCenter(): Vec3 {
        return new Vec3(
            (this.v1.x + this.v2.x + this.v3.x) / 3,
            (this.v1.y + this.v2.y + this.v3.y) / 3,
            (this.v1.z + this.v2.z + this.v3.z) / 3
        )
    }
}

// 3D Mesh object
class Mesh3D {
    triangles: Triangle3D[] = []
    position: Vec3
    rotation: Vec3
    scale: Vec3
    
    constructor(position: Vec3 = new Vec3(0, 0, 0)) {
        this.position = position
        this.rotation = new Vec3(0, 0, 0)
        this.scale = new Vec3(1, 1, 1)
    }
    
    addTriangle(triangle: Triangle3D) {
        this.triangles.push(triangle)
    }
    
    getWorldMatrix(): Matrix4 {
        const translation = Matrix4.translation(this.position.x, this.position.y, this.position.z)
        const rotationY = Matrix4.rotationY(this.rotation.y)
        return translation.multiply(rotationY)
    }
}

// 3D Renderer
class Renderer3D {
    private width: number
    private _height: number
    private camera: Camera3D
    private depthBuffer: number[][]
    
    constructor(width: number, height: number, camera: Camera3D) {
        this.width = width
        this._height = height
        this.camera = camera
        this.depthBuffer = Array(height).fill(null).map(() => Array(width).fill(Infinity))
    }
    public getHeight(): number {
        return this._height;
    }
    
    public getWidth(): number {
        return this.width;
    }
    
    clearDepthBuffer() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.depthBuffer[y][x] = Infinity
            }
        }
    }
    
    // Subpixel rendering helper - renders a pixel with fractional coordinates using anti-aliasing
    renderSubpixel(pl: PixelList, x: number, y: number, color: Color) {
        // Extract integer and fractional parts
        const x0 = Math.floor(x)
        const y0 = Math.floor(y)
        const fx = x - x0
        const fy = y - y0
        
        // Calculate coverage weights for 2x2 pixel grid
        const weights = [
            (1 - fx) * (1 - fy), // Top-left
            fx * (1 - fy),       // Top-right
            (1 - fx) * fy,       // Bottom-left
            fx * fy              // Bottom-right
        ]
        
        const positions = [
            [x0, y0],         // Top-left
            [x0 + 1, y0],     // Top-right
            [x0, y0 + 1],     // Bottom-left
            [x0 + 1, y0 + 1]  // Bottom-right
        ]
        
        // Render weighted pixels
        for (let i = 0; i < 4; i++) {
            const [px, py] = positions[i]
            const weight = weights[i]
            
            // Only render if weight is significant and within bounds
            if (weight > 0.01 && px >= 0 && px < this.width && py >= 0 && py < this._height) {
                const subpixelColor = color.copy()
                subpixelColor.a *= weight
                pl.add(new Pixel(px, py, subpixelColor))
            }
        }
    }
    
    // Subpixel line rendering using Xiaolin Wu's algorithm for smooth anti-aliased lines
    renderSubpixelLine(pl: PixelList, x1: number, y1: number, x2: number, y2: number, color1: Color, color2: Color) {
        const dx = Math.abs(x2 - x1)
        const dy = Math.abs(y2 - y1)
        
        // For very short lines, just render endpoints with subpixel precision
        if (dx < 1 && dy < 1) {
            this.renderSubpixel(pl, x1, y1, color1)
            this.renderSubpixel(pl, x2, y2, color2)
            return
        }
        
        // Determine if line is steep
        const steep = dy > dx
        
        let startX = x1, startY = y1, endX = x2, endY = y2
        let startColor = color1, endColor = color2
        
        // Swap coordinates if steep
        if (steep) {
            let temp = startX; startX = startY; startY = temp;
            temp = endX; endX = endY; endY = temp;
        }
        
        // Ensure left to right drawing
        if (startX > endX) {
            let temp = startX; startX = endX; endX = temp;
            temp = startY; startY = endY; endY = temp;
            let tempColor = startColor; startColor = endColor; endColor = tempColor;
        }
        
        const deltaX = endX - startX
        const deltaY = endY - startY
        const gradient = deltaX === 0 ? 1 : deltaY / deltaX
        
        // First endpoint
        let xEnd = Math.round(startX)
        let yEnd = startY + gradient * (xEnd - startX)
        let xGap = 1 - (startX + 0.5 - Math.floor(startX + 0.5))
        let xPixel1 = xEnd
        let yPixel1 = Math.floor(yEnd)
        
        // Render first endpoint with anti-aliasing
        this.renderAntiAliasedPixel(pl, xPixel1, yPixel1, 1 - (yEnd - yPixel1), xGap, startColor, steep)
        this.renderAntiAliasedPixel(pl, xPixel1, yPixel1 + 1, yEnd - yPixel1, xGap, startColor, steep)
        
        let interY = yEnd + gradient
        
        // Second endpoint
        xEnd = Math.round(endX)
        yEnd = endY + gradient * (xEnd - endX)
        xGap = endX + 0.5 - Math.floor(endX + 0.5)
        let xPixel2 = xEnd
        let yPixel2 = Math.floor(yEnd)
        
        // Render second endpoint with anti-aliasing
        this.renderAntiAliasedPixel(pl, xPixel2, yPixel2, 1 - (yEnd - yPixel2), xGap, endColor, steep)
        this.renderAntiAliasedPixel(pl, xPixel2, yPixel2 + 1, yEnd - yPixel2, xGap, endColor, steep)
        
        // Main loop for line body
        for (let x = xPixel1 + 1; x < xPixel2; x++) {
            const progress = (x - startX) / deltaX
            const interpolatedColor = this.interpolateColor(startColor, endColor, progress)
            
            const y = Math.floor(interY)
            this.renderAntiAliasedPixel(pl, x, y, 1 - (interY - y), 1, interpolatedColor, steep)
            this.renderAntiAliasedPixel(pl, x, y + 1, interY - y, 1, interpolatedColor, steep)
            
            interY += gradient
        }
    }
    
    // Helper for anti-aliased pixel rendering
    renderAntiAliasedPixel(pl: PixelList, x: number, y: number, coverage: number, intensity: number, color: Color, steep: boolean) {
        const finalX = steep ? y : x
        const finalY = steep ? x : y
        
        if (finalX >= 0 && finalX < this.width && finalY >= 0 && finalY < this._height && coverage > 0.01) {
            const pixelColor = color.copy()
            pixelColor.a *= coverage * intensity
            pl.add(new Pixel(finalX, finalY, pixelColor))
        }
    }
    
    // Color interpolation helper
    interpolateColor(color1: Color, color2: Color, t: number): Color {
        return new Color(
            Math.floor(color1.r * (1 - t) + color2.r * t),
            Math.floor(color1.g * (1 - t) + color2.g * t),
            Math.floor(color1.b * (1 - t) + color2.b * t),
            color1.a * (1 - t) + color2.a * t,
            true
        )
    }
    
    projectPoint(point: Vec3): {x: number, y: number, z: number} {
        const viewMatrix = this.camera.getViewMatrix()
        const projMatrix = this.camera.getProjectionMatrix(this.width / this._height)
        const mvpMatrix = projMatrix.multiply(viewMatrix)
        
        const projected = mvpMatrix.transformPoint(point)
        
        // Convert from NDC to screen coordinates
        const screenX = (projected.x + 1) * this.width / 2
        const screenY = (1 - projected.y) * this._height / 2
        
        // Log projection details for debugging (less frequent)
        if (Math.random() < 0.001) { // Log occasionally to avoid spam
            console.log(`3D Point (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}) -> Screen (${screenX.toFixed(1)}, ${screenY.toFixed(1)}, z=${projected.z.toFixed(2)})`)
        }
        
        return { x: screenX, y: screenY, z: projected.z }
    }
    
    renderMesh(mesh: Mesh3D, isDebug: boolean = false, noClip: boolean = false, lightingMultiplier: number = 1.0): PixelList {
        const pl = new PixelList()
        const worldMatrix = mesh.getWorldMatrix()
        
        // Transform triangles to world space and sort by depth
        const worldTriangles = mesh.triangles.map(triangle => {
            const worldV1 = worldMatrix.transformPoint(triangle.v1)
            const worldV2 = worldMatrix.transformPoint(triangle.v2)
            const worldV3 = worldMatrix.transformPoint(triangle.v3)
            
            return new Triangle3D(worldV1, worldV2, worldV3, triangle.color)
        })
        
        // Sort triangles by distance from camera (painter's algorithm)
        worldTriangles.sort((a, b) => {
            const aDist = a.getCenter().subtract(this.camera.position).length()
            const bDist = b.getCenter().subtract(this.camera.position).length()
            return bDist - aDist
        })
        
        for (const triangle of worldTriangles) {
            this.renderTriangle(triangle, pl, isDebug, noClip, lightingMultiplier)
        }
        return pl
    }

    renderTriangle(triangle: Triangle3D, pl: PixelList, isDebug: boolean = false, noClip: boolean = false, lightingMultiplier: number = 1.0) {
        // Project vertices to screen space
        const p1 = this.projectPoint(triangle.v1)
        const p2 = this.projectPoint(triangle.v2)
        const p3 = this.projectPoint(triangle.v3)
        
        // Log coordinates for debugging (less frequent)
        if (Math.random() < 0.001) { // Log 1% of triangles to avoid spam
            console.log(`Triangle coordinates: (${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}, z=${p1.z.toFixed(2)})`, 
                       `(${p2.x.toFixed(1)}, ${p2.y.toFixed(1)}, z=${p2.z.toFixed(2)})`,
                       `(${p3.x.toFixed(1)}, ${p3.y.toFixed(1)}, z=${p3.z.toFixed(2)})`)
        }
        
        // Very lenient clipping for small screens - accept almost everything
        if (!noClip) {
            // Only clip if ALL vertices are clearly behind camera or impossibly far
            if (p1.z < -0.5 && p2.z < -0.5 && p3.z < -0.5) return  // All vertices way behind camera
            if (p1.z > 200 && p2.z > 200 && p3.z > 200) return     // All vertices impossibly far
        }
        
        // ALWAYS render triangles - remove all screen bounds checking for debugging
        
        // Calculate lighting with time-based modification
        const lightDir = new Vec3(0.3, -0.8, 0.5).normalize()
        const normal = triangle.getNormal()
        const baseLightIntensity = Math.max(0.3, -normal.dot(lightDir)) // Minimum ambient light
        const lightIntensity = baseLightIntensity * lightingMultiplier
        
        const litColor = triangle.color.copy()
        litColor.r = Math.floor(litColor.r * lightIntensity)
        litColor.g = Math.floor(litColor.g * lightIntensity)
        litColor.b = Math.floor(litColor.b * lightIntensity)
        litColor.a = 1.0 // Full opacity
        
        // Always render VERY BRIGHT wireframe for visibility on small screens
        const wireColor = colors.neonCyan.copy() // Force bright cyan for all wireframes
        wireColor.r = 255  // Maximum brightness
        wireColor.g = 255
        wireColor.b = 255
        wireColor.a = 1.0
        
        if (isDebug) {
            // Try to show triangle coordinates as debug info
            console.log(`Triangle vertices: (${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}, ${p1.z.toFixed(2)})`, 
                       `(${p2.x.toFixed(1)}, ${p2.y.toFixed(1)}, ${p2.z.toFixed(2)})`,
                       `(${p3.x.toFixed(1)}, ${p3.y.toFixed(1)}, ${p3.z.toFixed(2)})`)
        }
        
        // Calculate wireframe colors with depth fade and time-based lighting
        function fadedWireColor(z: number, isGrid: boolean = false): Color {
            if (isGrid) {
                // Special handling for grid - neon green with transparency and lighting
                const c = colors.neonGreen.copy()
                c.r = Math.floor(57 * lightingMultiplier)
                c.g = Math.floor(255 * lightingMultiplier)
                c.b = Math.floor(20 * lightingMultiplier)
                c.a = 0.7 * lightingMultiplier  // Semi-transparent with lighting effect
                return c
            } else {
                // Normal wireframe for mountains etc with lighting
                const c = colors.neonCyan.copy()
                c.r = Math.floor(255 * lightingMultiplier)
                c.g = Math.floor(255 * lightingMultiplier)
                c.b = Math.floor(255 * lightingMultiplier)
                c.a = Math.max(0.5, (1.0 - Math.min(1, (z - 1.5) * 0.1)) * lightingMultiplier)
                return c
            }
        }
        
        // Check if this is likely a grid triangle (has low y values)
        const isGridTriangle = (triangle.v1.y < 0.2 && triangle.v2.y < 0.2 && triangle.v3.y < 0.2)
        
        // Make wireframe lines thin for grid visibility - single pixel lines only
        const lineColor1 = fadedWireColor(p1.z, isGridTriangle)
        const lineColor2 = fadedWireColor(p2.z, isGridTriangle)
        const lineColor3 = fadedWireColor(p3.z, isGridTriangle)
        
        // Draw single thin lines for clean grid appearance with subpixel smoothing
        this.renderSubpixelLine(pl, p1.x, p1.y, p2.x, p2.y, lineColor1, lineColor2)
        this.renderSubpixelLine(pl, p2.x, p2.y, p3.x, p3.y, lineColor2, lineColor3)
        this.renderSubpixelLine(pl, p3.x, p3.y, p1.x, p1.y, lineColor3, lineColor1)
        
        // Fill triangle for solid objects (mountains, not grid)
        this.fillTriangle(p1, p2, p3, litColor, pl)
    }
    
    fillTriangle(p1: {x: number, y: number, z: number}, 
                 p2: {x: number, y: number, z: number}, 
                 p3: {x: number, y: number, z: number}, 
                 color: Color, pl: PixelList) {
        
        // Sort vertices by y coordinate
        const vertices = [p1, p2, p3].sort((a, b) => a.y - b.y)
        const [top, mid, bottom] = vertices
        
        // Skip degenerate triangles
        if (bottom.y - top.y < 1) return
        
        for (let y = Math.max(0, Math.floor(top.y)); y <= Math.min(this._height - 1, Math.ceil(bottom.y)); y++) {
            let xLeft = Infinity
            let xRight = -Infinity
            
            // Find intersection points with triangle edges
            const edges = [
                [top, mid], [mid, bottom], [bottom, top]
            ]
            
            for (const [v1, v2] of edges) {
                if ((v1.y <= y && y <= v2.y) || (v2.y <= y && y <= v1.y)) {
                    if (Math.abs(v2.y - v1.y) > 0.001) {
                        const t = (y - v1.y) / (v2.y - v1.y)
                        const x = v1.x + t * (v2.x - v1.x)
                        xLeft = Math.min(xLeft, x)
                        xRight = Math.max(xRight, x)
                    }
                }
            }
            
            if (xLeft !== Infinity && xRight !== -Infinity) {
                for (let x = Math.max(0, Math.floor(xLeft)); x <= Math.min(this.width - 1, Math.ceil(xRight)); x++) {
                    pl.add(new Pixel(x, y, color))
                }
            }
        }
    }
    
    renderWireframeLine(start: Vec3, end: Vec3, color: Color): PixelList {
        const pl = new PixelList()
        const p1 = this.projectPoint(start)
        const p2 = this.projectPoint(end)
        
        if (p1.z > 0 && p2.z > 0) {
            pl.add(new DrawLine(p1.x, p1.y, p2.x, p2.y, color, color))
        }
        
        return pl
    }
}

// 3D Synthwave Grid
class SynthwaveGrid3D extends Mesh3D {
    constructor(size: number, spacing: number) {
        super(new Vec3(0, 0, 0))
        this.generateGrid(size, spacing)
    }
    
    generateGrid(size: number, spacing: number) {
        // Create a synthwave grid that covers the entire ground plane visible on screen
        const rows = 15  // More lines to cover full ground plane with higher density
        const cols = 18  // More vertical lines for complete coverage
        const xStart = -size / 2
        const zStart = -1.0   // Start even closer to camera
        const xEnd = size / 2
        const zEnd = 8.0      // Extend to horizon for full coverage
        const xSpacing = (xEnd - xStart) / cols
        const zSpacing = (zEnd - zStart) / rows
        
        // Create horizontal lines (parallel to x-axis) - these create the perspective effect
        for (let row = 0; row <= rows; row++) {
            const z = zStart + row * zSpacing
            
            // Calculate depth-based transparency - closer lines are more opaque, distant lines more transparent
            const depthRatio = (z - zStart) / (zEnd - zStart)  // 0 at front, 1 at back
            const baseAlpha = 0.9  // Strong alpha for close lines
            const minAlpha = 0.15  // Minimum alpha for distant lines
            const alpha = baseAlpha - (depthRatio * (baseAlpha - minAlpha))
            
            // Make lines as thin as possible while still visible on small screens
            const yOffset = 0
            const v1 = new Vec3(xStart, 0.05 + yOffset, z)
            const v2 = new Vec3(xEnd, 0.05 + yOffset, z)
            
            // Neon green with depth-based transparency for synthwave effect
            const gridColor = colors.neonGreen.copy()
            gridColor.r = 57
            gridColor.g = 255
            gridColor.b = 20
            gridColor.a = alpha  // Depth-based transparency for depth effect
            
            // Create minimal thin line using triangle strip
            const lineWidth = 0.02  // Very thin line
            const v3 = new Vec3(xEnd, 0.05 + yOffset + lineWidth, z)
            const v4 = new Vec3(xStart, 0.05 + yOffset + lineWidth, z)
            this.addTriangle(new Triangle3D(v1, v2, v3, gridColor))
            this.addTriangle(new Triangle3D(v1, v3, v4, gridColor))
        }
        
        // Create vertical lines (parallel to z-axis) - these create depth
        for (let col = 0; col <= cols; col++) {
            const x = xStart + col * xSpacing
            
            // Make lines as thin as possible while still visible
            const yOffset = 0
            const v1 = new Vec3(x, 0.05 + yOffset, zStart)
            const v2 = new Vec3(x, 0.05 + yOffset, zEnd)
            
            // Neon green with transparency for vertical lines (less transparency variation)
            const gridColor = colors.neonGreen.copy()
            gridColor.r = 57
            gridColor.g = 255
            gridColor.b = 20
            gridColor.a = 0.6  // Consistent transparency for vertical lines
            
            // Create minimal thin line using triangle strip
            const lineWidth = 0.02  // Very thin line
            const v3 = new Vec3(x, 0.05 + yOffset + lineWidth, zEnd)
            const v4 = new Vec3(x, 0.05 + yOffset + lineWidth, zStart)
            this.addTriangle(new Triangle3D(v1, v2, v3, gridColor))
            this.addTriangle(new Triangle3D(v1, v3, v4, gridColor))
        }
        
        // Add some filled grid squares for a synthwave groundplane effect
        for (let row = 0; row < rows; row += 2) {
            for (let col = 0; col < cols; col += 2) {
                const x1 = xStart + col * xSpacing
                const x2 = xStart + (col + 1) * xSpacing
                const z1 = zStart + row * zSpacing
                const z2 = zStart + (row + 1) * zSpacing
                
                // Create subtle filled squares
                const v1 = new Vec3(x1, 0.02, z1)
                const v2 = new Vec3(x2, 0.02, z1)
                const v3 = new Vec3(x2, 0.02, z2)
                const v4 = new Vec3(x1, 0.02, z2)
                
                // Dark purple/blue fill for ground squares
                const fillColor = colors.groundPurple.copy()
                fillColor.a = 0.3  // Semi-transparent
                
                this.addTriangle(new Triangle3D(v1, v2, v3, fillColor))
                this.addTriangle(new Triangle3D(v1, v3, v4, fillColor))
            }
        }
    }
}

// Electric spark system for the tower
class ElectricSpark {
    position: Vec3
    velocity: Vec3
    life: number
    maxLife: number
    color: Color
    intensity: number
    
    constructor(startPos: Vec3, direction: Vec3, life: number = 30) {
        this.position = startPos.copy()
        this.velocity = direction.multiply(0.05 + Math.random() * 0.1) // Random speed
        this.life = life
        this.maxLife = life
        this.intensity = 0.8 + Math.random() * 0.4 // Random intensity
        
        // Electric blue/white colors with variation
        const colorVariation = Math.random()
        if (colorVariation < 0.3) {
            this.color = new Color(200, 220, 255, 1, true) // Blue-white
        } else if (colorVariation < 0.7) {
            this.color = new Color(255, 255, 255, 1, true) // Pure white
        } else {
            this.color = new Color(180, 200, 255, 1, true) // Light blue
        }
    }
    
    update(): boolean {
        // Move spark
        this.position = this.position.add(this.velocity)
        
        // Add some random jitter for electric effect (reduced for smoother motion)
        this.position.x += (Math.random() - 0.5) * 0.005
        this.position.y += (Math.random() - 0.5) * 0.005
        this.position.z += (Math.random() - 0.5) * 0.005
        
        // Slow down over time
        this.velocity = this.velocity.multiply(0.98)
        
        // Decrease life
        this.life--
        
        // Update color alpha based on life remaining
        const lifeRatio = this.life / this.maxLife
        this.color.a = lifeRatio * this.intensity
        
        return this.life > 0
    }
    
    render(renderer: Renderer3D): PixelList {
        const pl = new PixelList()
        
        // Render spark as a small bright point with subpixel precision
        const projected = renderer.projectPoint(this.position)
        
        if (projected.z > 0 && projected.x >= -1 && projected.x < renderer.getWidth() + 1 && 
            projected.y >= -1 && projected.y < renderer.getHeight() + 1) {
            
            // Use subpixel rendering for smoother sparks
            renderer.renderSubpixel(pl, projected.x, projected.y, this.color)
            
            // Add glow effect for brighter sparks
            if (this.color.a > 0.5) {
                const glowColor = this.color.copy()
                glowColor.a *= 0.3
                
                // Add surrounding glow with subpixel precision
                renderer.renderSubpixel(pl, projected.x - 1, projected.y, glowColor)
                renderer.renderSubpixel(pl, projected.x + 1, projected.y, glowColor)
                renderer.renderSubpixel(pl, projected.x, projected.y - 1, glowColor)
                renderer.renderSubpixel(pl, projected.x, projected.y + 1, glowColor)
            }
        }
        
        return pl
    }
}

// 3D Tower system - replaces mountains with a red block tower
class Tower3D extends Mesh3D {
    sparks: ElectricSpark[] = []
    sparkTimer: number = 0
    
    constructor() {
        super(new Vec3(0, 0, 0))
        this.generateTower()
    }

    generateTower() {
        // Tower pattern for each face (8x8 grid)
        // 'r' = red block, '0' = no block
        // Pattern defined from BOTTOM (index 0) to TOP (index 7) for correct orientation
        const pattern = [
            "rrr00rrr",  // Bottom row (ground level)
            "0rr00rr0",
            "0rr00rr0",
            "0rrrrrr0",
            "0rrrrrr0",
            "0rrrrrr0",
            "rr0rr0rr", 
            "rr0rr0rr"   // Top row
        ]
        
        // Tower dimensions: 8x8x8 blocks
        const towerSize = 8
        const blockSize = 0.4  // Larger blocks for better visibility and stability
        const towerZ = 7.0     // Tower closer to camera for better visibility and stability
        
        // Red color for blocks
        const blockColor = new Color(255, 80, 80, 1, true)  // Bright red
        
        // Generate blocks based on pattern
        for (let y = 0; y < towerSize; y++) {
            for (let x = 0; x < towerSize; x++) {
                for (let z = 0; z < towerSize; z++) {
                    // Check if this position should have a block
                    let hasBlock = false
                    
                    // Only check front face (z = 0) to create a 2D panel effect
                    if (z === 0 && pattern[y] && pattern[y][x] === 'r') hasBlock = true
                    
                    if (hasBlock) {
                        this.createBlock(
                            (x - towerSize/2) * blockSize,  // Center the tower horizontally
                            y * blockSize,                  // Fixed: y=0 is bottom, y increases upward
                            towerZ + (z - towerSize/2) * blockSize,
                            blockSize,
                            blockColor
                        )
                    }
                }
            }
        }
    }
    
    createBlock(x: number, y: number, z: number, size: number, color: Color) {
        const half = size / 2
        
        // Define the 8 vertices of a cube
        const vertices = [
            new Vec3(x - half, y - half, z - half), // 0: bottom-left-front
            new Vec3(x + half, y - half, z - half), // 1: bottom-right-front
            new Vec3(x + half, y + half, z - half), // 2: top-right-front
            new Vec3(x - half, y + half, z - half), // 3: top-left-front
            new Vec3(x - half, y - half, z + half), // 4: bottom-left-back
            new Vec3(x + half, y - half, z + half), // 5: bottom-right-back
            new Vec3(x + half, y + half, z + half), // 6: top-right-back
            new Vec3(x - half, y + half, z + half)  // 7: top-left-back
        ]
        
        // Create different shades for different faces (lighting effect)
        const frontColor = color.copy()
        
        // Only create front face for 2D panel effect
        // Front face triangles
        this.addTriangle(new Triangle3D(vertices[0], vertices[1], vertices[2], frontColor))
        this.addTriangle(new Triangle3D(vertices[0], vertices[2], vertices[3], frontColor))
    }
    
    updateSparks() {
        // Update existing sparks
        this.sparks = this.sparks.filter(spark => spark.update())
        
        // Spawn new sparks occasionally
        this.sparkTimer++
        if (this.sparkTimer > 30 + Math.random() * 60) { // Every 30-90 frames (1.5-4.5 seconds at 20fps)
            this.sparkTimer = 0
            this.spawnSpark()
        }
    }
    
    spawnSpark() {
        // Spawn sparks at the front face of the tower
        const towerSize = 8
        const blockSize = 0.4  // Match tower generation block size
        const towerZ = 6.0  // Match updated tower position
        
        // Random position on the front face of the tower
        const x = (Math.random() - 0.5) * towerSize * blockSize * 0.8 // Stay within tower bounds
        const y = Math.random() * towerSize * blockSize * 0.8 // Random height
        const z = towerZ - towerSize/2 * blockSize // Front face
        
        // Create spark at the tower front with random direction
        const direction = new Vec3(
            (Math.random() - 0.5) * 2, // Random horizontal movement
            Math.random() * 1.5 + 0.5, // Upward movement
            (Math.random() - 0.5) * 0.5 // Slight forward/backward movement
        ).normalize()
        
        const spark = new ElectricSpark(new Vec3(x, y, z), direction)
        this.sparks.push(spark)
    }
    
    renderSparks(renderer: Renderer3D): PixelList {
        const pl = new PixelList()
        
        for (const spark of this.sparks) {
            pl.add(spark.render(renderer))
        }
        
        return pl
    }
}

// 2D Sky system with celestial objects - renders as overlay on top half of screen
class SkySystem2D {
    // Star array for animated Julia fractal background
    stars: {
        baseX: number, 
        baseY: number, 
        x: number, 
        y: number, 
        brightness: number, 
        color: Color, 
        constellation: string, 
        type: string,
        iterations?: number,
        fractalX?: number,
        fractalY?: number
    }[] = []
    sun: {x: number, y: number, radius: number, color: Color}
    moon: {x: number, y: number, radius: number, color: Color, phase: number}
    clouds: {x: number, y: number, baseX: number, size: number, color: Color}[] = []
    skylineObjects: {x: number, y: number, width: number, height: number, type: string, color: Color}[] = []
    width: number
    height: number
    skyHeight: number
    
    // Northern Lights (Aurora Borealis) system
    northernLights: {
        enabled: boolean,
        intensity: number,
        strips: {
            baseY: number,
            currentY: number,
            height: number,
            waveOffset: number,
            color: Color,
            opacity: number,
            frequency: number
        }[]
    } = { enabled: true, intensity: 1.0, strips: [] }
    
    // Rainbow system for daytime atmospheric effects
    rainbow: {
        enabled: boolean,
        centerY: number,
        radius: number,
        thickness: number,
        opacity: number,
        colors: Color[]
    } = { 
        enabled: true, 
        centerY: 0, 
        radius: 0, 
        thickness: 15, 
        opacity: 0.6,
        colors: []
    }
    
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.skyHeight = Math.floor(height * 0.8) // Top 80% of screen (above horizon)
        const centerX = width / 2
        const centerY = this.skyHeight / 2
        
        // Initialize rainbow system
        this.initializeRainbow()
        
          // Generate Northern Lights (Aurora Borealis)
        this.generateNorthernLights()
        // Create realistic constellations instead of random stars
        
        this.generateJuliaFractalStars()
        
        // Sun - initial position will be calculated based on time
        this.sun = {
            x: width * 0.5,  
            y: this.skyHeight * 0.2,  
            radius: Math.min(8, this.skyHeight * 0.4),
            color: colors.sunYellow.copy()
        }
        
        // Moon - initial position will be calculated based on time  
        this.moon = {
            x: width * 0.2,
            y: this.skyHeight * 0.3,  
            radius: Math.min(3, this.skyHeight * 0.2),
            color: new Color(220, 220, 240, 0.7, true), // Slightly bluish white for moon
            phase: 0 // Moon phase: 0=new, 0.5=full, 1=new again
        }
        
        // Clouds - distributed across the sky with wind animation data (only in sky area)
        for (let i = 0; i < 5; i++) {
            const baseX = (width / 6) * (i + 1)
            this.clouds.push({
                x: baseX,
                y: random(this.skyHeight * 0.1, this.skyHeight * 0.7), // Keep clouds in sky area only
                baseX: baseX, // Store original position for wind animation
                size: random(3, 8),
                color: colors.sunWhite.copy()
            })
        }
        
        // Generate distant skyline objects for depth illusion
        this.generateSkylineObjects()
        
      
    }
    
    // Subpixel rendering helper for smooth star movement
    renderSubpixelStar(pl: PixelList, x: number, y: number, color: Color) {
        // Extract integer and fractional parts
        const x0 = Math.floor(x)
        const y0 = Math.floor(y)
        const fx = x - x0
        const fy = y - y0
        
        // Calculate coverage weights for 2x2 pixel grid
        const weights = [
            (1 - fx) * (1 - fy), // Top-left
            fx * (1 - fy),       // Top-right
            (1 - fx) * fy,       // Bottom-left
            fx * fy              // Bottom-right
        ]
        
        const positions = [
            [x0, y0],         // Top-left
            [x0 + 1, y0],     // Top-right
            [x0, y0 + 1],     // Bottom-left
            [x0 + 1, y0 + 1]  // Bottom-right
        ]
        
        // Render weighted pixels
        for (let i = 0; i < 4; i++) {
            const [px, py] = positions[i]
            const weight = weights[i]
            
            // Only render if weight is significant and within bounds
            if (weight > 0.01 && px >= 0 && px < this.width && py >= 0 && py < this.height) {
                const subpixelColor = color.copy()
                subpixelColor.a *= weight
                pl.add(new Pixel(px, py, subpixelColor))
            }
        }
    }
    
    // Julia fractal parameters for animated starfield
    juliaParams = {
        cReal: -0.7269,
        cImag: 0.1889,
        maxIterations: 120,  // Increased for more detail and smoother gradients
        zoom: 1.8,           // Slightly closer for more detail
        colorCycle: 0,
        animationSpeed: 0.015,  // Slightly faster animation
        depthLayers: 3       // Multiple depth layers for 3D effect
    }
    
    // Generate animated Julia fractal starfield
    generateJuliaFractalStars() {
        this.stars = []
        
        // Much higher density for intense, detailed fractal
        const samplesX = 60   // Doubled density for more intensity
        const samplesY = 36   // Doubled density for more intensity
        
        // Generate multiple depth layers for 3D effect
        for (let layer = 0; layer < this.juliaParams.depthLayers; layer++) {
            const layerZoom = this.juliaParams.zoom * (1 + layer * 0.3)  // Different zoom per layer
            const layerOffset = layer * 0.1  // Slight offset per layer
            
            for (let x = 0; x < samplesX; x++) {
                for (let y = 0; y < samplesY; y++) {
                    // Convert screen coordinates to fractal coordinates with layered mapping
                    const fractalX = (x / samplesX - 0.5) * 3.5 / layerZoom + layerOffset
                    const fractalY = (y / samplesY - 0.5) * 2.8 / layerZoom + layerOffset * 0.7
                    
                    // Calculate Julia set iteration count at this point
                    const iterations = this.calculateJuliaPoint(fractalX, fractalY)
                    
                    // More diverse criteria for star creation - create denser patterns
                    const shouldCreateStar = (
                        (iterations > 2 && iterations < this.juliaParams.maxIterations - 5) ||  // Broader edge regions
                        (iterations > 8 && iterations < 25) ||                                   // Enhanced mid-range
                        (iterations > 30 && iterations < 60) ||                                  // New high-detail region
                        (iterations > 80 && iterations < this.juliaParams.maxIterations - 3) || // Near-escape enhanced
                        (layer > 0 && iterations > 15 && iterations < 45)                       // Layer-specific patterns
                    )
                    
                    if (shouldCreateStar) {
                        // Convert back to screen coordinates
                        const screenX = (x / samplesX) * this.width
                        const screenY = (y / samplesY) * this.skyHeight
                        
                        // Enhanced brightness calculation with smoother gradients
                        let brightness: number
                        const normalizedIter = iterations / this.juliaParams.maxIterations
                        
                        if (iterations < 15) {
                            brightness = 0.4 + (iterations / 15) * 0.5  // Brighter for low iterations
                        } else if (iterations < 40) {
                            brightness = 0.9 - ((iterations - 15) / 25) * 0.4  // Peak brightness in mid-range
                        } else if (iterations < 80) {
                            brightness = 0.5 + ((iterations - 40) / 40) * 0.4   // Gradual increase
                        } else {
                            brightness = 0.6 + ((iterations - 80) / (this.juliaParams.maxIterations - 80)) * 0.3
                        }
                        
                        // Layer depth adjustment - background layers dimmer
                        brightness *= (1.0 - layer * 0.15)
                        
                        // Create fractal "star" with layer information
                        this.stars.push({
                            baseX: screenX,
                            baseY: screenY,
                            x: screenX,
                            y: screenY,
                            brightness: brightness,
                            iterations: iterations,
                            fractalX: fractalX,
                            fractalY: fractalY,
                            color: this.getFractalColor(iterations, 0, layer), // Enhanced color with layer
                            constellation: 'fractal',
                            type: `fractal_layer_${layer}`  // Store layer in type for identification
                        })
                    }
                }
            }
        }
    }
    
    // Calculate Julia set iteration count for a point
    calculateJuliaPoint(x: number, y: number): number {
        let zReal = x
        let zImag = y
        let iterations = 0
        
        while (iterations < this.juliaParams.maxIterations) {
            // z = z^2 + c
            const zRealNew = zReal * zReal - zImag * zImag + this.juliaParams.cReal
            const zImagNew = 2 * zReal * zImag + this.juliaParams.cImag
            
            zReal = zRealNew
            zImag = zImagNew
            
            // Check if point escapes
            if (zReal * zReal + zImag * zImag > 4) {
                break
            }
            
            iterations++
        }
        
        return iterations
    }
    
    // Generate smooth cycling colors for fractal (synthwave-themed) with layer support
    getFractalColor(iterations: number, colorCycle: number, layer: number = 0): Color {
        // Create smooth color transitions using sine waves with synthwave palette
        const normalizedIter = iterations / this.juliaParams.maxIterations
        const cycleOffset = colorCycle * Math.PI * 2
        
        // Layer-specific color variations for depth effect
        const layerHueShift = layer * Math.PI * 0.4  // Different hue per layer
        const layerIntensity = 1.0 - layer * 0.1     // Dimmer background layers
        
        // Enhanced color mixing with synthwave bias and layer variations
        const baseRed = 128 + 127 * Math.sin(normalizedIter * 6 + cycleOffset + layerHueShift)
        const baseGreen = 128 + 127 * Math.sin(normalizedIter * 4 + cycleOffset + Math.PI * 0.33 + layerHueShift)
        const baseBlue = 128 + 127 * Math.sin(normalizedIter * 8 + cycleOffset + Math.PI * 0.66 + layerHueShift)
        
        // Strong synthwave color transformation with enhanced intensity
        const synthRed = Math.floor(baseRed * 0.7 + baseBlue * 0.6)     // Enhanced purple/magenta
        const synthGreen = Math.floor(baseGreen * 0.5 + baseBlue * 0.4) // Stronger cyan accent
        const synthBlue = Math.floor(baseBlue * 1.4)                    // Intensified blue/purple
        
        // Multi-frequency neon intensity cycling for more dynamic effect
        const neonPulse1 = 0.7 + 0.3 * Math.sin(colorCycle * Math.PI * 6)
        const neonPulse2 = 0.8 + 0.2 * Math.cos(colorCycle * Math.PI * 4.7)
        const combinedPulse = (neonPulse1 + neonPulse2) / 2 * layerIntensity
        
        // Additional color complexity based on iteration bands
        let colorBoost = 1.0
        if (iterations < 20) colorBoost = 1.3      // Bright inner regions
        else if (iterations < 60) colorBoost = 1.1 // Mid regions
        else colorBoost = 0.9                      // Outer regions
        
        return new Color(
            Math.min(255, Math.max(30, Math.floor(synthRed * combinedPulse * colorBoost))),
            Math.min(255, Math.max(30, Math.floor(synthGreen * combinedPulse * colorBoost))),
            Math.min(255, Math.max(50, Math.floor(synthBlue * combinedPulse * colorBoost))),
            1, true
        )
    }
    
    // Update Julia fractal animation using unified time system with enhanced dynamics
    updateJuliaFractal(timeOfDay: number, fractalSpeed: number = 1.0, intensity: number = 0.7) {
        // More complex animation of Julia set parameters with multiple time scales
        const fractalTime = timeOfDay * fractalSpeed * Math.PI * 2
        const slowTime = timeOfDay * fractalSpeed * 0.3 * Math.PI * 2  // Slower variation
        const fastTime = timeOfDay * fractalSpeed * 1.7 * Math.PI * 2  // Faster variation
        
        // Multi-layered parameter animation for more complex patterns
        this.juliaParams.cReal = -0.7269 + 
            0.12 * Math.sin(fractalTime * 3.7) + 
            0.05 * Math.cos(slowTime * 2.1) +
            0.03 * Math.sin(fastTime * 7.3)
            
        this.juliaParams.cImag = 0.1889 + 
            0.12 * Math.cos(fractalTime * 2.3) + 
            0.06 * Math.sin(slowTime * 1.8) +
            0.04 * Math.cos(fastTime * 5.9)
            
        // Enhanced color cycling with multiple frequencies
        this.juliaParams.colorCycle = (timeOfDay * this.juliaParams.animationSpeed * fractalSpeed * 2.5) % 1.0
        
        // Animate zoom for breathing effect
        this.juliaParams.zoom = 1.8 + 0.3 * Math.sin(slowTime * 1.1)
        
        // Update each fractal star with enhanced animation
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i]
            
            // Extract layer from type string
            const layer = star.type.startsWith('fractal_layer_') ? 
                parseInt(star.type.split('_')[2]) || 0 : 0
            
            // Recalculate Julia point with animated parameters and layer-specific zoom
            const layerZoom = this.juliaParams.zoom * (1 + layer * 0.3)
            const layerOffset = layer * 0.1
            const adjustedFractalX = star.fractalX! * (layerZoom / 1.8) + layerOffset
            const adjustedFractalY = star.fractalY! * (layerZoom / 1.8) + layerOffset * 0.7
            
            const newIterations = this.calculateJuliaPoint(adjustedFractalX, adjustedFractalY)
            star.iterations = newIterations
            
            // Enhanced brightness calculation with more dynamic range
            const normalizedIter = newIterations / this.juliaParams.maxIterations
            let baseBrightness: number
            
            if (newIterations < 20) {
                baseBrightness = 0.5 + (newIterations / 20) * 0.4
            } else if (newIterations < 50) {
                baseBrightness = 0.9 - ((newIterations - 20) / 30) * 0.3
            } else if (newIterations < 90) {
                baseBrightness = 0.6 + ((newIterations - 50) / 40) * 0.3
            } else {
                baseBrightness = 0.7 + ((newIterations - 90) / (this.juliaParams.maxIterations - 90)) * 0.2
            }
            
            // Layer and user intensity adjustments
            const layerDimming = 1.0 - layer * 0.12
            star.brightness = baseBrightness * intensity * layerDimming
            
            // Update color with current color cycle and layer
            star.color = this.getFractalColor(newIterations, this.juliaParams.colorCycle, layer)
            
            // Enhanced position animation with layer-specific movement patterns
            const flowTime = timeOfDay * fractalSpeed * Math.PI * 2
            const layerFlow = 1.0 + layer * 0.3  // Different flow speeds per layer
            const flowX = 3 * Math.sin(flowTime * 1.3 * layerFlow + star.fractalX! * 4) +
                         1.5 * Math.cos(flowTime * 0.7 * layerFlow + star.fractalY! * 3)
            const flowY = 3 * Math.cos(flowTime * 1.1 * layerFlow + star.fractalY! * 4) +
                         1.5 * Math.sin(flowTime * 0.9 * layerFlow + star.fractalX! * 3)
            
            star.x = star.baseX + flowX
            star.y = star.baseY + flowY
        }
    }
    

    // Generate small distant objects on the horizon for depth illusion
    generateSkylineObjects() {
        const horizonY = this.skyHeight // Horizon line
        const objectCount = 15 + Math.floor(Math.random() * 10) // 15-25 objects
        
        // Create various types of distant objects
        for (let i = 0; i < objectCount; i++) {
            const x = (this.width / objectCount) * i + Math.random() * (this.width / objectCount * 0.8)
            const objectType = Math.random()
            
            let width: number, height: number, type: string, baseColor: Color
            
            if (objectType < 0.3) {
                // Houses/buildings
                width = 1 + Math.random() * 2 // Very small width
                height = 1 + Math.random() * 3 // Small height
                type = "building"
                baseColor = new Color(40, 30, 60, 1, true) // Dark purple-gray
            } else if (objectType < 0.6) {
                // Trees
                width = 1 + Math.random() * 1.5 // Very narrow
                height = 2 + Math.random() * 4 // Slightly taller
                type = "tree"
                baseColor = new Color(20, 40, 20, 1, true) // Dark green
            } else {
                // Hills/distant mountains
                width = 3 + Math.random() * 8 // Wider but low
                height = 1 + Math.random() * 2 // Very low hills
                type = "hill"
                baseColor = new Color(30, 20, 50, 1, true) // Dark blue-purple
            }
            
            // Create a copy and make objects more visible with higher opacity
            const finalColor = baseColor.copy()
            finalColor.a = 0.4 + Math.random() * 0.3 // More visible (40-70% opacity)
            
            this.skylineObjects.push({
                x: Math.floor(x),
                y: horizonY - Math.floor(height), // Position just above horizon
                width: Math.max(1, Math.floor(width)),
                height: Math.max(1, Math.floor(height)),
                type: type,
                color: finalColor
            })
        }
        
        // Sort objects by width (larger hills in back, smaller objects in front)
        this.skylineObjects.sort((a, b) => b.width - a.width)
    }
    
    // Calculate sun position based on time of day (0=midnight, 0.5=noon, 1=midnight)
    calculateSunPosition(timeOfDay: number): {x: number, y: number, color: Color, intensity: number} {
        // Sun follows an arc across the sky
        const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2 // Start at horizon at dawn
        const centerX = this.width / 2
        const maxHeight = this.skyHeight * 0.8
        const arcWidth = this.width * 0.8
        
        // Calculate position on arc
        const x = centerX + Math.cos(sunAngle) * arcWidth / 2
        const y = this.skyHeight - Math.sin(sunAngle) * maxHeight
        
        // Ultra-realistic sun color and intensity based on time with atmospheric effects
        let color: Color
        let intensity: number
        
        if (timeOfDay < 0.18 || timeOfDay > 0.82) {
            // Deep night - sun completely below horizon, no light
            color = new Color(10, 5, 20, 1, true) // Very faint deep blue for astronomical twilight
            intensity = 0.0
        } else if (timeOfDay < 0.22 || timeOfDay > 0.78) {
            // Astronomical twilight - first hint of light
            const twilightProgress = timeOfDay < 0.22 ? (timeOfDay - 0.18) / 0.04 : (0.82 - timeOfDay) / 0.04
            color = new Color(
                Math.floor(10 + twilightProgress * 40),  // Deep blue to purple
                Math.floor(5 + twilightProgress * 10),   // Very subtle
                Math.floor(20 + twilightProgress * 30),  // Blue dominant
                1, true
            )
            intensity = twilightProgress * 0.05
        } else if (timeOfDay < 0.28 || timeOfDay > 0.72) {
            // Civil twilight - deep purple to magenta transition
            const isRising = timeOfDay < 0.5
            const civilProgress = isRising ? (timeOfDay - 0.22) / 0.06 : (0.78 - timeOfDay) / 0.06
            
            color = new Color(
                Math.floor(50 + civilProgress * 100),   // Purple to deep red
                Math.floor(15 + civilProgress * 25),    // Very low green for purple
                Math.floor(50 + civilProgress * 40),    // Purple to magenta
                1, true
            )
            intensity = 0.05 + civilProgress * 0.15
        } else if (timeOfDay < 0.32 || timeOfDay > 0.68) {
            // Nautical twilight - dramatic color burst (golden hour begins)
            const isRising = timeOfDay < 0.5
            const nauticalProgress = isRising ? (timeOfDay - 0.28) / 0.04 : (0.72 - timeOfDay) / 0.04
            
            // Create the famous "golden hour" colors
            color = new Color(
                Math.floor(150 + nauticalProgress * 105), // Deep red to bright orange
                Math.floor(40 + nauticalProgress * 80),   // Low to medium orange
                Math.floor(90 - nauticalProgress * 60),   // Purple fading to warm
                1, true
            )
            intensity = 0.2 + nauticalProgress * 0.3
        } else if (timeOfDay < 0.38 || timeOfDay > 0.62) {
            // Golden hour - warm orange to yellow transition
            const isRising = timeOfDay < 0.5
            const goldenProgress = isRising ? (timeOfDay - 0.32) / 0.06 : (0.68 - timeOfDay) / 0.06
            
            color = new Color(
                255,  // Full red for warm glow
                Math.floor(120 + goldenProgress * 100),  // Orange to yellow
                Math.floor(30 + goldenProgress * 70),    // Warm to bright
                1, true
            )
            intensity = 0.5 + goldenProgress * 0.3
        } else {
            // Full daylight - bright white with subtle temperature variations
            const noonDistance = Math.abs(timeOfDay - 0.5) // Distance from noon (0-0.12)
            const dayStrength = Math.cos(noonDistance * Math.PI / 0.12) // Smooth falloff from noon
            
            // At noon: cool white, moving toward warm white at edges of day
            const warmth = (1 - dayStrength) * 0.3 // Warmth factor based on sun angle
            
            color = new Color(
                255,  // Always full red
                Math.floor(255 - warmth * 30),          // Slight yellow tint away from noon
                Math.floor(255 - warmth * 80),          // More yellow/warm away from noon
                1, true
            )
            intensity = 0.8 + dayStrength * 0.2  // Peak intensity at noon
        }
        
        return { x, y, color, intensity }
    }
    
    // Calculate moon position based on time of day (opposite to sun)
    calculateMoonPosition(timeOfDay: number): {x: number, y: number, phase: number} {
        // Moon is roughly opposite to the sun
        const moonTime = (timeOfDay + 0.5) % 1.0
        const moonAngle = moonTime * Math.PI * 2 - Math.PI / 2
        const centerX = this.width / 2
        const maxHeight = this.skyHeight * 0.8
        const arcWidth = this.width * 0.8
        
        // Calculate position on arc
        const x = centerX + Math.cos(moonAngle) * arcWidth / 2
        const y = this.skyHeight - Math.sin(moonAngle) * maxHeight
        
        // Calculate moon phase (cycles over longer period)
        const phase = (timeOfDay * 8) % 1.0 // Moon phase changes over 8 day cycles
        
        return { x, y, phase }
    }
    
    // Draw moon with phase
    drawMoonWithPhase(pl: PixelList, x: number, y: number, radius: number, phase: number, horizonY: number, visibility: number = 1.0) {
        // Only render moon if it's above the horizon
        if (y >= horizonY) return
        
        const moonX = Math.floor(x)
        const moonY = Math.floor(y)
        
        // Draw moon base (full circle) with visibility modifier (more transparent)
        for (let r = 0; r < radius; r++) {
            const moonColor = this.moon.color.copy()
            moonColor.a = (1.0 - r * 0.15) * visibility * 0.6  // Added 0.6 multiplier for more transparency
            
            if (moonY + r < horizonY && moonY - r >= 0) {
                pl.add(new DrawCircle(moonX, moonY, r, moonColor))
            }
        }
        
        // Draw phase shadow (also more transparent)
        if (phase !== 0.5) { // Skip shadow for full moon
            const shadowColor = colors.skyDeepPurple.copy()
            shadowColor.a = 0.8 * visibility * 0.6  // Added 0.6 multiplier for more transparency
            
            // Calculate shadow position and size based on phase
            let shadowOffset: number
            let shadowWidth: number
            
            if (phase < 0.5) {
                // Waxing moon - shadow on left
                shadowOffset = -radius * (1 - phase * 2)
                shadowWidth = radius * 2 * (1 - phase * 2)
            } else {
                // Waning moon - shadow on right
                shadowOffset = radius * ((phase - 0.5) * 2)
                shadowWidth = radius * 2 * ((phase - 0.5) * 2)
            }
            
            // Draw shadow as partial circle
            for (let r = 0; r < radius; r++) {
                if (moonY + r < horizonY && moonY - r >= 0) {
                    const shadowR = Math.min(r, Math.floor(shadowWidth / 2))
                    if (shadowR > 0) {
                        pl.add(new DrawCircle(moonX + Math.floor(shadowOffset), moonY, shadowR, shadowColor))
                    }
                }
            }
        }
    }
    
    // Generate Northern Lights (Aurora Borealis) strips
    generateNorthernLights() {
        this.northernLights.strips = []
        const numStrips = 4 + Math.floor(Math.random() * 3) // 4-6 aurora strips
        
        for (let i = 0; i < numStrips; i++) {
            // Aurora appears in upper portion of sky
            const baseY = this.skyHeight * (0.1 + Math.random() * 0.4) // Upper 10-50% of sky
            const height = 8 + Math.random() * 15 // Variable height strips
            
            // Aurora colors - green, blue, purple, pink
            let color: Color
            const colorChoice = Math.random()
            if (colorChoice < 0.4) {
                // Green (most common)
                color = new Color(50 + Math.random() * 100, 180 + Math.random() * 75, 50 + Math.random() * 80, 1, true)
            } else if (colorChoice < 0.7) {
                // Blue-green
                color = new Color(30 + Math.random() * 70, 150 + Math.random() * 80, 120 + Math.random() * 100, 1, true)
            } else if (colorChoice < 0.9) {
                // Purple
                color = new Color(120 + Math.random() * 80, 50 + Math.random() * 100, 150 + Math.random() *  80, 1, true)
            } else {
                // Pink (rare)
                color = new Color(180 + Math.random() * 75, 80 + Math.random() * 100, 120 + Math.random() * 80, 1, true)
            }
            
            this.northernLights.strips.push({
                baseY: baseY,
                currentY: baseY,
                height: height,
                waveOffset: Math.random() * Math.PI * 2, // Random phase offset
                color: color,
                opacity: 0.3 + Math.random() * 0.4, // 30-70% opacity
                frequency: 0.5 + Math.random() * 1.0 // Wave frequency variation
            })
        }
    }
    
    // Update Northern Lights dynamically over unified time
    updateNorthernLights(timeOfDay: number, rawTime: number) {
        // Regenerate aurora strips periodically for variety (using raw time for absolute intervals)
        if (Math.floor(rawTime / 1000) % 30 === 0 && rawTime % 50 < 1) { // Every 30 seconds, with small timing window
            this.generateNorthernLights()
        }
        
        // Subtle intensity variations over time using unified time system
        for (const strip of this.northernLights.strips) {
            // Add slow breathing effect to each strip based on timeOfDay
            const breathe = 0.8 + 0.2 * Math.sin(timeOfDay * Math.PI * 4 + strip.waveOffset)
            strip.opacity = Math.max(0.1, Math.min(0.8, strip.opacity * breathe))
        }
    }
    
    // Render Northern Lights with flowing wave animation
    renderNorthernLights(pl: PixelList, time: number, screenWidth: number, screenHeight: number, intensity: number = 1.0, timeOfDay: number = 0.0) {
        if (!this.northernLights.enabled || intensity <= 0) return
        
        // Aurora is most visible during night and twilight
        const horizonY = Math.floor(screenHeight * 0.8)
        
        // Time-based aurora visibility (more visible at night)
        let timeVisibility: number
        if (timeOfDay < 0.15 || timeOfDay > 0.85) {
            timeVisibility = 1.0 // Full visibility at night
        } else if (timeOfDay < 0.25 || timeOfDay > 0.75) {
            // Visible during twilight
            const twilightFactor = timeOfDay < 0.25 ? (0.25 - timeOfDay) / 0.1 : (timeOfDay - 0.75) / 0.1
            timeVisibility = 0.3 + twilightFactor * 0.7
        } else {
            timeVisibility = 0.1 // Very subtle during day
        }
        
        for (const strip of this.northernLights.strips) {
            // Create flowing wave effect across the width of the sky using unified time
            for (let x = 0; x < screenWidth; x++) {
                // Multiple wave functions for complex aurora movement - use timeOfDay for smooth animation
                const waveTime = timeOfDay * Math.PI * 8 // More cycles for smoother wave motion
                const wave1 = Math.sin((x * 0.02) + (waveTime * strip.frequency) + strip.waveOffset) * 8
                const wave2 = Math.sin((x * 0.015) + (waveTime * strip.frequency * 0.8) + strip.waveOffset + Math.PI) * 5
                const wave3 = Math.cos((x * 0.025) + (waveTime * strip.frequency * 1.2) + strip.waveOffset * 0.5) * 3
                
                // Combine waves for complex flowing motion
                const waveOffset = wave1 + wave2 + wave3
                const centerY = Math.floor(strip.baseY + waveOffset)
                
                // Skip if aurora would be below horizon
                if (centerY >= horizonY) continue
                
                // Create vertical gradient for each strip (aurora curtain effect)
                for (let dy = 0; dy < strip.height; dy++) {
                    const y = centerY + dy - Math.floor(strip.height / 2)
                    
                    // Skip if outside screen bounds or below horizon
                    if (y < 0 || y >= horizonY) continue
                    
                    // Calculate opacity falloff from center of strip for smooth edges
                    const distanceFromCenter = Math.abs(dy - strip.height / 2) / (strip.height / 2)
                    const verticalFalloff = 1.0 - Math.pow(distanceFromCenter, 2) // Smooth falloff
                    
                    // Add horizontal intensity variation for more realistic look
                    const horizontalVariation = 0.7 + 0.3 * Math.sin(x * 0.03 + timeOfDay * Math.PI * 4)
                    
                    // Add temporal flickering for aurora shimmer using unified time
                    const shimmer = 0.8 + 0.2 * Math.sin(timeOfDay * Math.PI * 10 + x * 0.01 + dy * 0.1)
                    
                    // Final opacity calculation with time-based visibility
                    const finalOpacity = strip.opacity * verticalFalloff * horizontalVariation * shimmer * intensity * timeVisibility
                    
                    if (finalOpacity > 0.02) {
                        const auroraColor = strip.color.copy()
                        auroraColor.a = finalOpacity
                        
                        // Use subpixel rendering for smoother aurora edges
                        this.renderSubpixelStar(pl, x, y, auroraColor)
                    }
                }
            }
        }
    }
    
    // Initialize rainbow system with realistic colors and physics
    initializeRainbow() {
        // Set rainbow position - centered horizontally, positioned for realistic viewing angle
        this.rainbow.centerY = this.skyHeight * 0.25  // Higher in sky for better arc visibility
        this.rainbow.radius = this.width * 0.8        // Large arc spanning most of screen width
        
        // Create authentic rainbow colors (ROYGBIV) with precise spectral values
        this.rainbow.colors = [
            new Color(255, 0, 0, 1, true),     // Red (700 nm)
            new Color(255, 165, 0, 1, true),   // Orange (620 nm)
            new Color(255, 255, 0, 1, true),   // Yellow (570 nm)
            new Color(0, 255, 0, 1, true),     // Green (530 nm)
            new Color(0, 191, 255, 1, true),   // Blue (475 nm) - more cyan-blue
            new Color(75, 0, 130, 1, true),    // Indigo (445 nm)
            new Color(138, 43, 226, 1, true)   // Violet (400 nm) - more purple-violet
        ]
    }
    
    // Render realistic rainbow arc with proper optics and atmospheric effects
    renderRainbow(pl: PixelList, timeOfDay: number, screenHeight: number, intensity: number = 1.0) {
        if (!this.rainbow.enabled) return
        
        // Rainbow visibility based on atmospheric conditions and time of day
        let rainbowVisibility: number
        if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
            // Daytime - rainbow visibility peaks when sun is at optimal angle (not too high)
            const noonDistance = Math.abs(timeOfDay - 0.5)  // Distance from noon
            // Best rainbow conditions are slightly off-noon when sun is at 40-42° angle
            const optimalDistance = 0.15  // Optimal time offset from noon
            const distanceFromOptimal = Math.abs(noonDistance - optimalDistance)
            rainbowVisibility = Math.max(0, 1.0 - (distanceFromOptimal * 6))  // Peak visibility at optimal angle
        } else {
            rainbowVisibility = 0  // No rainbow at night
        }
        
        if (rainbowVisibility <= 0.02) return
        
        const horizonY = Math.floor(screenHeight * 0.8)
        const centerX = this.width / 2
        const centerY = this.rainbow.centerY
        
        // Calculate atmospheric scattering effects for realistic rainbow appearance
        const scatteringFactor = Math.sin(timeOfDay * Math.PI * 2) * 0.3 + 0.7  // Varies with sun angle
        
        // Primary rainbow: red on outside, violet on inside (42° arc)
        for (let colorIndex = 0; colorIndex < this.rainbow.colors.length; colorIndex++) {
            const color = this.rainbow.colors[colorIndex].copy()
            
            // Calculate precise arc radius - red band is outermost
            const bandOffset = colorIndex * (this.rainbow.thickness / this.rainbow.colors.length)
            const bandRadius = this.rainbow.radius - bandOffset
            const bandThickness = this.rainbow.thickness / this.rainbow.colors.length * 1.2  // Slightly thicker bands
            
            // Rainbow arc spans approximately 84° (42° radius from center)
            const startAngle = Math.PI * 0.08  // Start slightly inward from horizon
            const endAngle = Math.PI * 0.92    // End slightly inward from horizon
            
            // Render smooth arc with proper curvature
            const angleStep = 0.008  // Very fine steps for ultra-smooth curve
            for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
                const arcX = centerX + Math.cos(angle) * bandRadius
                const arcY = centerY + Math.sin(angle) * bandRadius * 0.6  // Realistic arc ratio
                
                // Only render if within bounds and above horizon
                if (arcX >= 0 && arcX < this.width && arcY >= 0 && arcY < horizonY) {
                    // Calculate distance from horizon for fade effect
                    const heightAboveHorizon = (horizonY - arcY) / horizonY
                    const heightFade = Math.pow(heightAboveHorizon, 0.3)  // Fade near horizon
                    
                    // Create band thickness with gradient edges
                    for (let thick = 0; thick < bandThickness; thick++) {
                        const thickY = arcY - thick * 0.7  // Slightly compressed vertically
                        if (thickY >= 0 && thickY < horizonY) {
                            // Smooth edge gradient within each color band
                            const edgePosition = thick / bandThickness
                            const edgeOpacity = Math.sin(edgePosition * Math.PI) * 0.8 + 0.2  // Bell curve opacity
                            
                            // Color intensity varies with wavelength (red is more intense)
                            const wavelengthIntensity = colorIndex === 0 ? 1.2 :    // Red
                                                      colorIndex === 1 ? 1.1 :    // Orange  
                                                      colorIndex === 2 ? 1.0 :    // Yellow
                                                      colorIndex === 3 ? 0.9 :    // Green
                                                      colorIndex === 4 ? 0.8 :    // Blue
                                                      colorIndex === 5 ? 0.6 :    // Indigo
                                                      0.5                          // Violet
                            
                            // Apply all realistic factors
                            color.a = this.rainbow.opacity * rainbowVisibility * intensity * 
                                     edgeOpacity * heightFade * scatteringFactor * wavelengthIntensity * 0.7
                            
                            if (color.a > 0.03) {
                                this.renderSubpixelStar(pl, arcX, thickY, color)
                            }
                        }
                    }
                }
            }
        }
        
        // Secondary rainbow (supernumerary rainbow) - fainter, reversed colors, larger radius
        if (rainbowVisibility > 0.5 && intensity > 0.7) {
            const secondaryRadius = this.rainbow.radius * 1.25  // 25% larger radius (51° arc)
            const secondaryOpacity = this.rainbow.opacity * 0.3  // Much fainter
            const secondaryThickness = this.rainbow.thickness * 0.8  // Slightly thinner
            
            // Reversed color order (violet outside, red inside)
            for (let colorIndex = this.rainbow.colors.length - 1; colorIndex >= 0; colorIndex--) {
                const color = this.rainbow.colors[colorIndex].copy()
                const bandOffset = (this.rainbow.colors.length - 1 - colorIndex) * (secondaryThickness / this.rainbow.colors.length)
                const bandRadius = secondaryRadius + bandOffset  // Note: + instead of - for secondary
                const bandThickness = secondaryThickness / this.rainbow.colors.length
                
                const startAngle = Math.PI * 0.05
                const endAngle = Math.PI * 0.95
                
                for (let angle = startAngle; angle <= endAngle; angle += 0.012) {  // Coarser for secondary
                    const arcX = centerX + Math.cos(angle) * bandRadius
                    const arcY = centerY + Math.sin(angle) * bandRadius * 0.6
                    
                    if (arcX >= 0 && arcX < this.width && arcY >= 0 && arcY < horizonY) {
                        const heightAboveHorizon = (horizonY - arcY) / horizonY
                        const heightFade = Math.pow(heightAboveHorizon, 0.4)
                        
                        for (let thick = 0; thick < bandThickness; thick++) {
                            const thickY = arcY - thick * 0.6
                            if (thickY >= 0 && thickY < horizonY) {
                                const edgePosition = thick / bandThickness
                                const edgeOpacity = Math.sin(edgePosition * Math.PI) * 0.6 + 0.1
                                
                                color.a = secondaryOpacity * rainbowVisibility * intensity * 
                                         edgeOpacity * heightFade * scatteringFactor * 0.5
                                
                                if (color.a > 0.02) {
                                    this.renderSubpixelStar(pl, arcX, thickY, color)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Add supernumerary bands (interference fringes) inside primary rainbow for ultra-realism
        if (rainbowVisibility > 0.8 && intensity > 0.8) {
            const superRadius = this.rainbow.radius * 0.85  // Inside primary rainbow
            const superOpacity = this.rainbow.opacity * 0.15  // Very faint
            
            // Create 2-3 faint interference bands
            for (let band = 0; band < 3; band++) {
                const bandRadius = superRadius - (band * 8)  // Close spacing
                const bandColor = new Color(255, 255, 255, superOpacity * (0.8 - band * 0.2), true)  // White interference
                
                for (let angle = Math.PI * 0.2; angle <= Math.PI * 0.8; angle += 0.015) {
                    const arcX = centerX + Math.cos(angle) * bandRadius
                    const arcY = centerY + Math.sin(angle) * bandRadius * 0.6
                    
                    if (arcX >= 0 && arcX < this.width && arcY >= 0 && arcY < horizonY) {
                        bandColor.a = superOpacity * rainbowVisibility * intensity * (0.5 - band * 0.1)
                        if (bandColor.a > 0.01) {
                            this.renderSubpixelStar(pl, arcX, arcY, bandColor)
                        }
                    }
                }
            }
        }
    }
    
    // Complete render method to integrate all sky elements
    render(time: number, timeOfDay: number, windSpeed: number = 0.21, screenHeight: number = 8, fractalSpeed: number = 1.0, fractalIntensity: number = 0.7, auroraIntensity: number = 0.8, showAurora: boolean = true, showRainbow: boolean = true): PixelList {
        const pl = new PixelList()
        
        // Calculate horizon line - sky elements only visible above this line
        const horizonY = Math.floor(screenHeight * 0.8)  // 80% down the screen where sky meets ground
        
        // Calculate celestial body positions and lighting using unified time
        const sunPos = this.calculateSunPosition(timeOfDay)
        const moonPos = this.calculateMoonPosition(timeOfDay)
        
        // Update sun position and color
        this.sun.x = sunPos.x
        this.sun.y = sunPos.y
        this.sun.color = sunPos.color
        
        // Update moon position and phase
        this.moon.x = moonPos.x
        this.moon.y = moonPos.y
        this.moon.phase = moonPos.phase
        
        // Update and render animated Julia fractal starfield using unified time
        this.updateJuliaFractal(timeOfDay, fractalSpeed, fractalIntensity)
        
        // Update Northern Lights for dynamic behavior using unified time
        this.updateNorthernLights(timeOfDay, time)
        
        // Render northern lights (aurora) effect FIRST - in the background behind everything else
        if (showAurora) {
            this.renderNorthernLights(pl, time, this.width, screenHeight, auroraIntensity, timeOfDay)
        }
        
        // Render rainbow during daytime - middle atmospheric layer
        if (showRainbow) {
            this.renderRainbow(pl, timeOfDay, screenHeight, 1.0)
        }
        
        // Render Julia fractal stars (MIDDLE LAYER)
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i]
            
            // Stars are more visible at night with smooth transitions (with transparency)
            let timeAlpha: number
            if (timeOfDay < 0.2 || timeOfDay > 0.8) {
                timeAlpha = 0.8 // High visibility at night for fractal beauty
            } else if (timeOfDay < 0.3 || timeOfDay > 0.7) {
                // Smooth fade during dawn/dusk
                const fadeOut = timeOfDay < 0.3 ? (0.3 - timeOfDay) / 0.1 : (timeOfDay - 0.7) / 0.1
                timeAlpha = fadeOut * 0.8
            } else {
                timeAlpha = 0.1 // Subtle visibility during day for ethereal effect
            }
            
            // Smooth breathing effect for fractal animation using unified time
            const breathe = 0.7 + 0.3 * Math.sin(timeOfDay * Math.PI * 6 + i * 0.1)
            const alpha = star.brightness * timeAlpha * breathe * 0.7 // Base transparency
            
            // Only render if star is within screen bounds AND above horizon AND visible
            if (star.x >= -1 && star.x < this.width + 1 && star.y >= -1 && star.y < horizonY + 1 && alpha > 0.05) {
                const starColor = star.color.copy()
                starColor.a = alpha
                
                // Draw fractal star with subpixel precision for smooth movement
                this.renderSubpixelStar(pl, star.x, star.y, starColor)
                
                // Add subtle glow effect for brighter fractal points (at night)
                if (star.brightness > 0.6 && timeAlpha > 0.6) {
                    const glowColor = starColor.copy()
                    glowColor.a *= 0.3
                    
                    // Add surrounding glow with subpixel precision
                    this.renderSubpixelStar(pl, star.x, star.y - 1, glowColor)
                    this.renderSubpixelStar(pl, star.x + 1, star.y, glowColor)
                    this.renderSubpixelStar(pl, star.x - 1, star.y, glowColor)
                    this.renderSubpixelStar(pl, star.x, star.y + 1, glowColor)
                }
            }
        }
        
        // Render sun with realistic positioning and colors
        const sunX = Math.floor(this.sun.x)
        const sunY = Math.floor(this.sun.y)
        
        // Only render sun if it's above the horizon and has intensity
        if (sunY < horizonY && sunPos.intensity > 0.05) {
            // Draw sun with time-appropriate color and intensity
            for (let r = 0; r < this.sun.radius; r += 1) {
                const layerIntensity = (1 - (r / this.sun.radius)) * sunPos.intensity
                const sunColor = this.sun.color.copy()
                sunColor.a = layerIntensity
                
                // Add inner core for brighter center during day
                if (r < this.sun.radius * 0.4 && sunPos.intensity > 0.7) {
                    sunColor.r = Math.min(255, sunColor.r + 50)
                    sunColor.g = Math.min(255, sunColor.g + 50)
                    sunColor.b = Math.min(255, sunColor.b + 50)
                }
                
                // Only add sun circle if it's above horizon
                const circleY = sunY
                if (circleY + r < horizonY && circleY - r >= 0) {
                    pl.add(new DrawCircle(sunX, sunY, r, sunColor))
                }
            }
            
            // Add sun rays during bright daylight
            if (sunPos.intensity > 0.8) {
                const rayColor = this.sun.color.copy()
                rayColor.a = 0.3 * sunPos.intensity
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8
                    const rayLength = this.sun.radius * 1.5
                    const endX = sunX + Math.cos(angle) * rayLength
                    const endY = sunY + Math.sin(angle) * rayLength
                    
                    if (endY < horizonY && endY >= 0) {
                        pl.add(new DrawLine(sunX, sunY, Math.floor(endX), Math.floor(endY), rayColor, rayColor))
                    }
                }
            }
        }
        
        // Render moon with realistic positioning and phases (more visible at night)
        const moonVisibility = timeOfDay < 0.3 || timeOfDay > 0.7 ? 1.0 : 
                              timeOfDay < 0.4 || timeOfDay > 0.6 ? 0.5 : 0.2
        
        if (moonVisibility > 0.1) {
            this.drawMoonWithPhase(pl, this.moon.x, this.moon.y, this.moon.radius, this.moon.phase, horizonY, moonVisibility)
        }
        
        return pl
    }
}

// Main 3D Synthwave Animation
export default class Synthwave extends Animator {
    static category = "Synthwave"
    static title = "3D Synthwave"
    static description = "Fully 3D rendered synthwave landscape with real 3D perspective"
    
    async run(box: PixelBox, scheduler: Scheduler, controls: ControlGroup) {
        const synthControls = controls.group("3D Synthwave")
        const speedControl = synthControls.value("Animation Speed", 1, 0.1, 3, 0.1, true)
        const windControl = synthControls.value("Wind Speed", 0.21, -1, 1, 0.01, true)  // Wind: -1=left, 0=still, +1=right
        const dayLengthControl = synthControls.value("Day Length (seconds)", 60, 10, 300, 5, true)  // Configurable day length
        const fractalSpeedControl = synthControls.value("Fractal Animation Speed", 1.0, 0.1, 3.0, 0.1, true)  // Julia fractal animation speed
        const fractalIntensityControl = synthControls.value("Fractal Intensity", 0.7, 0.1, 1.5, 0.1, true)  // Julia fractal brightness
        const auroraIntensityControl = synthControls.value("Aurora Intensity", 0.8, 0.0, 2.0, 0.1, true)  // Northern Lights intensity
        const showStarsControl = synthControls.switch("Show Stars", true, false)
        const showAuroraControl = synthControls.switch("Show Northern Lights", true, false)
        const showHorizonControl = synthControls.switch("Show Horizon Effect", true, false)
        const debugModeControl = synthControls.switch("Debug Mode", false, true)
        const noClipControl = synthControls.switch("No Clipping (Debug)", true, true)
        
        const pl = new PixelList()
        box.add(pl)
        
        const width = box.width()
        const height = box.height()
        
        // Setup 3D camera with error checking
        let camera: Camera3D
        let renderer: Renderer3D
        let tower: Tower3D
        let skySystem: SkySystem2D
        
        try {
            camera = new Camera3D(
                new Vec3(0, 0.5, -1.5),   // Camera position - stationary
                new Vec3(0, 0, 6.0)       // Camera target updated to new tower position Z=6.0
            )
            
            // Create 3D renderer with error checking
            renderer = new Renderer3D(width, height, camera)
            
            // Create 3D objects with optimal sizing for small screen visibility
            tower = new Tower3D() // Red block tower
            skySystem = new SkySystem2D(width, height)
        } catch (error) {
            console.error("Failed to initialize 3D objects:", error)
            // Fallback to 2D only mode
            camera = null
            renderer = null
        }
        
        let time = 0
        
        scheduler.interval(50, (frameNr) => {
            pl.clear()
            time += speedControl.value * 10  // 10x faster animation

            // UNIFIED TIME SYSTEM - Calculate time of day once for all time-based effects
            // dayLengthControl.value = seconds for full day (24 hours)
            // At 20 FPS (50ms intervals), dayLengthControl.value * 20 = total frames for one day
            // time increments by speedControl.value each frame, so we need to account for that
            const framesPerDay = dayLengthControl.value * 20
            const timeOfDay = ((time / speedControl.value) / framesPerDay) % 1.0
            
            // Calculate ultra-realistic sky colors based on UNIFIED time of day with atmospheric scattering
            let topSkyColor: Color
            let bottomSkyColor: Color
            
            if (timeOfDay < 0.18 || timeOfDay > 0.82) {
                // Deep night - very dark sky with subtle blue tints
                topSkyColor = new Color(0, 0, 8, 1, true)  // Almost black at zenith
                bottomSkyColor = new Color(5, 8, 25, 1, true)  // Slight blue glow at horizon
            } else if (timeOfDay < 0.22 || timeOfDay > 0.78) {
                // Astronomical twilight - first hint of light
                const twilightProgress = timeOfDay < 0.22 ? (timeOfDay - 0.18) / 0.04 : (0.82 - timeOfDay) / 0.04
                topSkyColor = new Color(
                    Math.floor(0 + twilightProgress * 15),
                    Math.floor(0 + twilightProgress * 8),
                    Math.floor(8 + twilightProgress * 17),
                    1, true
                )
                bottomSkyColor = new Color(
                    Math.floor(5 + twilightProgress * 25),
                    Math.floor(8 + twilightProgress * 15),
                    Math.floor(25 + twilightProgress * 35),
                    1, true
                )
            } else if (timeOfDay < 0.28 || timeOfDay > 0.72) {
                // Civil twilight - purple and deep blue
                const civilProgress = timeOfDay < 0.28 ? (timeOfDay - 0.22) / 0.06 : (0.78 - timeOfDay) / 0.06
                topSkyColor = new Color(
                    Math.floor(15 + civilProgress * 25),
                    Math.floor(8 + civilProgress * 17),
                    Math.floor(25 + civilProgress * 35),
                    1, true
                )
                bottomSkyColor = new Color(
                    Math.floor(30 + civilProgress * 50),
                    Math.floor(23 + civilProgress * 37),
                    Math.floor(60 + civilProgress * 40),
                    1, true
                )
            } else if (timeOfDay < 0.32 || timeOfDay > 0.68) {
                // Nautical twilight - dramatic color burst (purple to orange horizon)
                const nauticalProgress = timeOfDay < 0.32 ? (timeOfDay - 0.28) / 0.04 : (0.72 - timeOfDay) / 0.04
                topSkyColor = new Color(
                    Math.floor(40 + nauticalProgress * 30),
                    Math.floor(25 + nauticalProgress * 35),
                    Math.floor(60 + nauticalProgress * 40),
                    1, true
                )
                bottomSkyColor = new Color(
                    Math.floor(80 + nauticalProgress * 100),
                    Math.floor(60 + nauticalProgress * 80),
                    Math.floor(100 + nauticalProgress * 20),
                    1, true
                )
            } else if (timeOfDay < 0.38 || timeOfDay > 0.62) {
                // Golden hour - warm orange to blue transition
                const goldenProgress = timeOfDay < 0.38 ? (timeOfDay - 0.32) / 0.06 : (0.68 - timeOfDay) / 0.06
                topSkyColor = new Color(
                    Math.floor(70 + goldenProgress * 65),
                    Math.floor(60 + goldenProgress * 100),
                    Math.floor(100 + goldenProgress * 100),
                    1, true
                )
                bottomSkyColor = new Color(
                    Math.floor(180 + goldenProgress * 20),
                    Math.floor(140 + goldenProgress * 60),
                    Math.floor(120 + goldenProgress * 20),
                    1, true
                )
            } else {
                // Full daylight - realistic atmospheric blue with horizon whitening
                const noonDistance = Math.abs(timeOfDay - 0.5)
                const dayStrength = Math.cos(noonDistance * Math.PI / 0.12)
                
                // Deep blue at zenith, lighter near horizon (Rayleigh scattering effect)
                topSkyColor = new Color(
                    Math.floor(70 + dayStrength * 20),   // Deep blue
                    Math.floor(130 + dayStrength * 30),
                    Math.floor(200 + dayStrength * 35),
                    1, true
                )
                bottomSkyColor = new Color(
                    Math.floor(180 + dayStrength * 40),  // Atmospheric whitening near horizon
                    Math.floor(200 + dayStrength * 35),
                    Math.floor(220 + dayStrength * 35),
 1, true
                )
            }

            // Render realistic sky background gradient (upper half) and grass (lower half)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let bgColor
                    if (y < Math.floor(height * 0.8)) {
                        // Sky gradient with atmospheric scattering effects
                        const skyGradient = y / (height * 0.8)
                        
                        // Use non-linear gradient for more realistic atmospheric perspective
                        const atmosphericCurve = Math.pow(skyGradient, 1.5) // Atmospheric scattering curve
                        
                        bgColor = new Color(
                            Math.floor(topSkyColor.r + atmosphericCurve * (bottomSkyColor.r - topSkyColor.r)),
                            Math.floor(topSkyColor.g + atmosphericCurve * (bottomSkyColor.g - topSkyColor.g)),
                            Math.floor(topSkyColor.b + atmosphericCurve * (bottomSkyColor.b - topSkyColor.b)),
                            1
                        )
                    } else {
                        // Ground area - grass with dramatic darkening at night (using UNIFIED timeOfDay)
                        bgColor = colors.grass.copy()
                        if (timeOfDay < 0.3 || timeOfDay > 0.7) {
                            // Much more dramatic grass darkening at night with smooth transitions
                            const nightFactor = timeOfDay < 0.3 ? (0.3 - timeOfDay) / 0.3 : (timeOfDay - 0.7) / 0.3
                            const darkenAmount = nightFactor * 0.85 // Up to 85% darker for more dramatic night effect
                            
                            // Add subtle blue tint at night for moonlight effect
                            bgColor.r = Math.floor(bgColor.r * (1 - darkenAmount))
                            bgColor.g = Math.floor(bgColor.g * (1 - darkenAmount * 0.9)) // Keep slightly more green
                            bgColor.b = Math.floor(bgColor.b * (1 - darkenAmount * 0.7) + nightFactor * 15) // Add blue tint
                        }
                    }
                    pl.add(new Pixel(x, y, bgColor))
                }
            }
            
            // Add smooth horizon effect with transparency gradient
            if (showHorizonControl.enabled) {
                const horizonY = Math.floor(height * 0.8) // Horizon line at 80% down
                const horizonEffectHeight = Math.min(8, Math.floor(height * 0.15)) // Effect spans 15% of screen height
            
            // Create horizon gradient colors based on time of day
            let horizonTopColor: Color
            let horizonBottomColor: Color
            
            if (timeOfDay < 0.2 || timeOfDay > 0.8) {
                // Night horizon - subtle dark blue/purple gradient
                horizonTopColor = new Color(15, 25, 45, 0.6, true)  // Dark blue-purple, semi-transparent
                horizonBottomColor = new Color(8, 15, 25, 0.8, true) // Darker at bottom, more opaque
            } else if (timeOfDay < 0.35 || timeOfDay > 0.65) {
                // Dawn/dusk horizon - warm colors
                const duskFactor = timeOfDay < 0.35 ? (0.35 - timeOfDay) / 0.15 : (timeOfDay - 0.65) / 0.15
                horizonTopColor = new Color(
                    Math.floor(80 + duskFactor * 120),   // Orange to deep red
                    Math.floor(60 + duskFactor * 40),    // Warm orange
                    Math.floor(30 + duskFactor * 20),    // Low blue for warmth
                    0.5 + duskFactor * 0.3, true        // Variable transparency
                )
                horizonBottomColor = new Color(
                    Math.floor(40 + duskFactor * 80),    // Darker orange-red
                    Math.floor(30 + duskFactor * 30),    // Darker orange
                    Math.floor(15 + duskFactor * 15),    // Minimal blue
                    0.7 + duskFactor * 0.2, true        // More opaque at bottom
                )
            } else {
                // Daytime horizon - atmospheric haze effect
                horizonTopColor = new Color(200, 220, 240, 0.4, true)  // Light atmospheric haze
                horizonBottomColor = new Color(180, 200, 220, 0.6, true) // Slightly more opaque ground haze
            }
            
            // Render horizon gradient effect
            for (let y = horizonY - horizonEffectHeight; y <= horizonY + horizonEffectHeight; y++) {
                if (y >= 0 && y < height) {
                    // Calculate position in horizon effect (0 = top of effect, 1 = bottom of effect)
                    const effectProgress = (y - (horizonY - horizonEffectHeight)) / (horizonEffectHeight * 2)
                    
                    // Create smooth S-curve for more natural atmospheric transition
                    const smoothProgress = effectProgress * effectProgress * (3 - 2 * effectProgress)
                    
                    // Interpolate colors and opacity
                    const horizonColor = new Color(
                        Math.floor(horizonTopColor.r + smoothProgress * (horizonBottomColor.r - horizonTopColor.r)),
                        Math.floor(horizonTopColor.g + smoothProgress * (horizonBottomColor.g - horizonTopColor.g)),
                        Math.floor(horizonTopColor.b + smoothProgress * (horizonBottomColor.b - horizonTopColor.b)),
                        horizonTopColor.a + smoothProgress * (horizonBottomColor.a - horizonTopColor.a),
                        true
                    )
                    
                    // Add some horizontal variation for atmospheric realism
                    for (let x = 0; x < width; x++) {
                        // Subtle horizontal atmospheric variation
                        const horizontalVariation = 0.9 + 0.1 * Math.sin((x / width) * Math.PI * 4 + timeOfDay * Math.PI * 6)
                        const finalColor = horizonColor.copy()
                        finalColor.a *= horizontalVariation
                        
                        // Only render if opacity is significant
                        if (finalColor.a > 0.05) {
                            pl.add(new Pixel(x, y, finalColor))
                        }
                    }
                }
            }
            } // End horizon effect
            
            // Only render 3D if initialization succeeded
            if (renderer && camera) {
                console.log("3D rendering active, frame:", frameNr)
                try {
                    renderer.clearDepthBuffer()
                    
                    // Calculate lighting multiplier for 3D scene based on UNIFIED time of day
                    const lightingMultiplier = timeOfDay < 0.2 || timeOfDay > 0.8 ? 0.3 : // Night - very dark
                                             timeOfDay < 0.25 || timeOfDay > 0.75 ? 0.3 + ((timeOfDay < 0.25 ? (0.25 - timeOfDay) : (timeOfDay - 0.75)) / 0.05 * 0.2) : // Pre-dawn/late night
                                             timeOfDay < 0.35 || timeOfDay > 0.65 ? 0.5 + ((timeOfDay < 0.35 ? (timeOfDay - 0.25) : (0.75 - timeOfDay)) / 0.1 * 0.3) : // Dawn/dusk
                                             0.8 + (Math.cos(Math.abs(timeOfDay - 0.5) / 0.15 * Math.PI / 2) * 0.2) // Day - bright
                    
                    console.log(`3D Lighting multiplier: ${lightingMultiplier.toFixed(2)} (unified timeOfDay: ${timeOfDay.toFixed(3)})`)
                    
                    // Render sky system FIRST as background layer (behind all 3D objects)
                    if (showStarsControl.enabled && skySystem) {
                        console.log("Rendering sky system as background...")
                        pl.add(skySystem.render(time, timeOfDay, windControl.value, height, fractalSpeedControl.value, fractalIntensityControl.value, auroraIntensityControl.value, showAuroraControl.enabled))
                    }
                    
                    // Render 3D objects with error checking and realistic lighting
                    
                    // Add debug frame border to see screen boundaries
                    for (let x = 0; x < width; x++) {
                        pl.add(new Pixel(x, 0, colors.neonCyan))
                        pl.add(new Pixel(x, height-1, colors.neonCyan))
                    }
                    for (let y = 0; y < height; y++) {
                        pl.add(new Pixel(0, y, colors.neonCyan))
                        pl.add(new Pixel(width-1, y, colors.neonCyan))
                    }
                    
                    if (tower) {
                        console.log("Rendering tower with lighting multiplier:", lightingMultiplier.toFixed(2))
                        
                        // Update tower sparks
                        tower.updateSparks()
                        
                        // Render tower structure
                        pl.add(renderer.renderMesh(tower, false, noClipControl.enabled, lightingMultiplier))
                        
                        // Render sparks on top of tower
                        pl.add(tower.renderSparks(renderer))
                    }
                } catch (error) {
                    console.error("3D rendering error:", error)
                    // Continue with 2D fallback
                }
            } else {
                console.log("3D rendering not available - using 2D fallback only")
            }
        })
    }
    
    // ...existing code...
}
