let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');

let ch = canvas.height = innerHeight;
let cw = canvas.width = innerWidth;

let camera = {
    pos: [0, 0, -13],
}

let max = 3;
let factor = cw / (max * 2);
let seebackwards = false;

function calculationForRealToPix(x, y, z) {
    if (seebackwards) {
        let rtz = z - camera.pos[2];
        let rte = [(factor * (x - camera.pos[0]) / Math.abs(z - camera.pos[2])) + (cw / 2),
        (factor * (y - camera.pos[1]) / Math.abs(z - camera.pos[2])) + (10 * cw / 45)];
        if (rtz < 0) {
            rte = [(cw / 2) - Math.sign((cw / 2) - rte[0]) * Math.abs(rte[0] - (cw / 2)),
            (ch / 2) - Math.sign((ch / 2) - rte[1]) * Math.abs(rte[1] - (ch / 2))]
        }
        return rte;
    }
    else return [(factor * (x - camera.pos[0]) / (z - camera.pos[2])) + (cw / 2),
    (factor * (y - camera.pos[1]) / (z - camera.pos[2])) + (10 * cw / 45)];
}
function realPointToPixPoint(x, y, z) {
    let p = 0.1 + camera.pos[2] - z;
    if (z > camera.pos[2]) return calculationForRealToPix(x, y, z)
    else return calculationForRealToPix(x, y, z + p);
}
function realPointToPixPoint(pos) {
    if (seebackwards) return calculationForRealToPix(pos[0], pos[1], pos[2]);
    else {
        let p = 0.1 + camera.pos[2] - pos[2];
        if (pos[2] > camera.pos[2]) return calculationForRealToPix(pos[0], pos[1], pos[2]);
        else return calculationForRealToPix(pos[0], pos[1], pos[2] + p);
    }
}
//--------
function distanceFunctionDistortion(pos) {
    pos[0] = (pos[0] / euclidNorm3d(0, 0, 0, pos[0], pos[1], pos[2])) * distanceFunction(0, 0, 0, pos[0], pos[1], pos[2])
    pos[1] = (pos[1] / euclidNorm3d(0, 0, 0, pos[0], pos[1], pos[2])) * distanceFunction(0, 0, 0, pos[0], pos[1], pos[2])
    pos[2] = (pos[2] / euclidNorm3d(0, 0, 0, pos[0], pos[1], pos[2])) * distanceFunction(0, 0, 0, pos[0], pos[1], pos[2])
    return realPointToPixPoint(pos);
}

function distanceFunction(x1, y1, z1, x2, y2, z2) {
    return manhattanDistance(x1, y1, z1, x2, y2, z2);
}

function manhattanDistance(x1, y1, z1, x2, y2, z2) {
    return Math.abs((x1 - x2)) + Math.abs((y1 - y2)) + Math.abs((z1 - z2));
}
function myParabolicDistance(x1, y1, x2, y2) {
    //xP and yP can be any value
    let xP = 9; let yP = 9;
    let a = ((yP * x2) - (xP * y2)) / ((xP * xP * x2) - (xP * x2 * x2));
    let b = (yP - x2 + (a * x2 * x2) - (a * xP * xP)) / (xP - x2);
    //let c = y2-b*x2-a*x2*x2;
    function mokt(x) {
        let lop = (2 * a * x) + b;
        let k = Math.sqrt(((lop) ** 2) + 1);
        return (Math.log(k + lop) / (4 * a)) + ((x / 2) + (b / (4 * a))) * k;
    }
    return Math.abs(mokt(x1) - mokt(x2));
}
function chebyshevDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}
function cosineSimilarityDistance(x1, y1, x2, y2) {
    return 1 - (((x1 * x2) + (y1 * y2)) / (Math.sqrt((x1 * x1) + (y1 * y1)) * Math.sqrt((x2 * x2) + (y2 * y2))))
}
function angularDistance(x1, y1, x2, y2) {
    return Math.abs(Math.atan2(y2, x2) - Math.atan2(y1, x1))
}
function logarithmicDistance(x1, y1, x2, y2) {
    return Math.log10(1 + Math.abs(x2 - x1) + Math.abs(y2 - y1));
}
function expDistance(x1, y1, x2, y2) {
    return Math.exp(-Math.abs(x2 - x1) - Math.abs(y2 - y1));
}

//dont change this one
function euclidNormP(p1, p2) {
    return Math.sqrt(((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2))
}
function euclidNorm(x1, y1, x2, y2) {
    return Math.sqrt(((x1 - x2) ** 2) + ((y1 - y2) ** 2))
}
function euclidNorm3d(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt(((x1 - x2) ** 2) + ((y1 - y2) ** 2) + ((z1 - z2) ** 2))
}

//------------------
function sgn(num) {
    if (num <= 0) return 0;
    else return 1;
}

function wait(milli, func) {
    let p = setInterval(() => {
        func();
        clearInterval(p);
    }, milli);
}

function changeCameraPos(pos) {
    camera.pos = pos
    for (let i in Point.all) {
        Point.all[i].changeRealPosNoAdding(Point.all[i].posReal)
    }
    for (let i in Line.all) {
        Line.all[i].updateLine();
    }
}

class Point {
    static all = {};
    static allArray = [];
    /**
     * 
     * @param {number[]} posReal 
     * @param {boolean} display 
     * @param {string} color 
     * @param {string} extra 
     */
    constructor(posReal, display, color = 'hsl(1,100%,50%)', extra = null) {
        this.posReal = posReal;
        this.posPix = realPointToPixPoint(posReal);
        //this.posPix = distanceFunctionDistortion(posReal);
        this.radiusReal = 0.1;
        this.radiusPix = ((factor / 2) * (this.radiusReal) / (posReal[2] - camera.pos[2]));
        this.color = color;
        this.display = display;
        if (extra) {
            this.extra = extra;
        }
        this.id = Math.random();
        Point.all[this.id] = this;
        Point.allArray.push(this);
    }
    changeRealPos(dcoords) {
        this.posReal = addCoords(this.posReal, dcoords);
        this.posPix = realPointToPixPoint(this.posReal);
        //this.posPix = distanceFunctionDistortion(this.posReal);
        this.radiusReal = 0.1;
        this.radiusPix = (factor / 2 * (this.radiusReal) / (this.posReal[2] - camera.pos[2]));
    }
    changeRealPosNoAdding(coords) {
        this.posReal = coords;
        this.posPix = realPointToPixPoint(this.posReal);
        //this.posPix = distanceFunctionDistortion(this.posReal);
        this.radiusReal = 0.1;
        this.radiusPix = (factor / 2 * (this.radiusReal) / (this.posReal[2] - camera.pos[2]));
    }
    draw() {
        if (this.radiusReal !== 0.1) this.radiusPix = ((factor / 2) * (this.radiusReal) / (this.posReal[2] - camera.pos[2]));
        if (this.display) {
            ctx.beginPath();
            ctx.arc(this.posPix[0], this.posPix[1], Math.abs(this.radiusPix), 0, 360, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }
}

function hueBasedOnheight(height) {
    return height * 30;
}

class Line {
    static all = {};
    //static hue=0;
    /**appects ONLY pixPoints */
    constructor(p1, p2, display, color = `hsl(220,100%,50%)`, linewidth = 1) {
        this.p1 = p1;
        this.p2 = p2;
        this.x1 = p1.posPix[0];
        this.y1 = p1.posPix[1];
        this.x2 = p2.posPix[0];
        this.y2 = p2.posPix[1];
        /*if(!(this.x1>0&&this.y1>0
            &&this.x1<innerWidth&&this.y1<innerHeight
            &&this.x2<innerWidth&&this.y2<innerHeight
            &&this.x2>0&&this.y2>0
        )) {display=false;}*/
        this.display = display;
        this.id = `${p1.id},${p2.id}`;
        //Line.hue+=10;
        this.color = `hsl(${hueBasedOnheight((this.p1.posReal[1] + this.p2.posReal[1]) / 2)},100%,50%)`;
        this.linewidth = linewidth;
        //this.linewidth1 = linewidth/10;
        Line.all[this.id] = this;
    }
    draw() {
        //let rrrr = (this.p1.posReal[2]+this.p2.posReal[2])/2
        //this.linewidth=((factor / 2) * (this.linewidth1) / (rrrr - camera.pos[2]))
        if (this.display) {
            ctx.beginPath();
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.linewidth;
            ctx.stroke();
            ctx.closePath();
        }
    }
    updateLine() {
        this.x1 = this.p1.posPix[0];
        this.y1 = this.p1.posPix[1];
        this.x2 = this.p2.posPix[0];
        this.y2 = this.p2.posPix[1];
    }
}

/**ONLY realPoints */
function rotateY(point, radians) {
    let x = point.posReal[0] * Math.cos(radians) + point.posReal[2] * Math.sin(radians);
    let z = point.posReal[2] * Math.cos(radians) - point.posReal[0] * Math.sin(radians);
    return [x, point.posReal[1], z];
}
function rotateY(x, y, z, radians) {
    let xl = x * Math.cos(radians) + z * Math.sin(radians);
    let zl = z * Math.cos(radians) - x * Math.sin(radians);
    return [xl, y, zl];
}
function rotateZ(x, y, z, radians) {
    let yl = y * Math.cos(radians) + x * Math.sin(radians);
    let xl = x * Math.cos(radians) - y * Math.sin(radians);
    return [xl, yl, z];
}
function rotateX(x, y, z, radians) {
    let zl = z * Math.cos(radians) + y * Math.sin(radians);
    let yl = y * Math.cos(radians) - z * Math.sin(radians);
    return [x, yl, zl];
}
/**ONLY realPoints */
function rotateYByPoint(point1, point2, radians) {
    let p = point1.posReal[0] - point2.posReal[0];
    let c = point1.posReal[2] - point2.posReal[2];

    let r = rotateY(p, point1.posReal[1], c, radians);

    return [r[0] + point2.posReal[0], point1.posReal[1], r[2] + point2.posReal[2]]
}
function rotateXByPoint(point1, point2, radians) {
    let p = point1.posReal[1] - point2.posReal[1];
    let c = point1.posReal[2] - point2.posReal[2];

    let r = rotateX(point1.posReal[0], p, c, radians);

    return [point1.posReal[0], r[1] + point2.posReal[1], r[2] + point2.posReal[2]]
}
function rotateZByPoint(point1, point2, radians) {
    let p = point1.posReal[1] - point2.posReal[1];
    let c = point1.posReal[0] - point2.posReal[0];

    let r = rotateZ(c, p, point1.posReal[2], radians);

    return [r[0] + point2.posReal[0], r[1] + point2.posReal[1], point1.posReal[2]]
}
function subtractCoords(coord1, coord2) {
    return [coord1[0] - coord2[0], coord1[1] - coord2[1], coord1[2] - coord2[2]]
}
function addCoords(coord1, coord2) {
    return [coord1[0] + coord2[0], coord1[1] + coord2[1], coord1[2] + coord2[2]]
}
function rotatePointbyPoint(x, y, z, u, v, w, theta) {
    let newx = (u * ((u * x) + (v * y) + (w * z)) * (1 - Math.cos(theta)) + ((u * u) + (v * v) + (w * w)) * (x * Math.cos(theta)) + Math.sqrt((u * u) + (v * v) + (w * w)) * ((v * z) - (w * y)) * Math.sin(theta)) / ((u * u) + (v * v) + (w * w));
    let newy = (v * ((u * x) + (v * y) + (w * z)) * (1 - Math.cos(theta)) + ((u * u) + (v * v) + (w * w)) * (y * Math.cos(theta)) + Math.sqrt((u * u) + (v * v) + (w * w)) * (-(u * z) + (w * x)) * Math.sin(theta)) / ((u * u) + (v * v) + (w * w));
    let newz = (w * ((u * x) + (v * y) + (w * z)) * (1 - Math.cos(theta)) + ((u * u) + (v * v) + (w * w)) * (z * Math.cos(theta)) + Math.sqrt((u * u) + (v * v) + (w * w)) * ((v * x) - (u * y)) * Math.sin(theta)) / ((u * u) + (v * v) + (w * w));
    return [newx, newy, newz];
}
function findCenter() {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < arguments.length; i++) {
        x += arguments[i].posReal[0];
        y += arguments[i].posReal[1];
        z += arguments[i].posReal[2];
    }
    //console.log(x, y, z, arguments.length);
    return [x / arguments.length, y / arguments.length, z / arguments.length]
}
function findCenter(points) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < points.length; i++) {
        x += points[i].posReal[0];
        y += points[i].posReal[1];
        z += points[i].posReal[2];
    }
    return [x / points.length, y / points.length, z / points.length]
}

class Shape {
    constructor(points, display, lines = undefined) {
        this.points = points;
        this.display = display;
        this.lines = lines;
        if (points) this.center = new Point(findCenter(points), false);
    }

    changeDisplay() {
        this.display = !this.display;

        this.p1.display = this.display;
        this.p2.display = this.display;
        this.p3.display = this.display;
        this.p4.display = this.display;

        for (let i = 0; i < this.lines.length; i++) {
            this.lines[i].display = this.display;
        }
    }
    /**
     * @param {number} angle radians
     * @param {Point} point 
     */
    rotateByYPoint(angle, point) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].changeRealPos(subtractCoords(rotateYByPoint(this.points[i], point, angle), this.points[i].posReal));
        }
        if (this.lines) {
            for (let i = 0; i < this.lines.length; i++) {
                this.lines[i].updateLine();
            }
        }
    }
    /**
    * @param {number} angle radians
     * @param {Point} point 
    */
    rotateByXPoint(angle, point) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].changeRealPos(subtractCoords(rotateXByPoint(this.points[i], point, angle), this.points[i].posReal));
        }
        if (this.lines) {
            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines) this.lines[i].updateLine();
            }
        }
    }
    /**
     * @param {number} angle radians
     * @param {Point} point 
     */
    rotateByZPoint(angle, point) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].changeRealPos(subtractCoords(rotateZByPoint(this.points[i], point, angle), this.points[i].posReal));
        }
        if (this.lines) {
            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines) this.lines[i].updateLine();
            }
        }
    }
    /**
     * @param {number} angleX radians
     * @param {number} angleY radians
     * @param {number} angleZ radians
     * @param {Point} point 
     */
    rotateByPointXYZ(angleX, angleY, angleZ, point) {
        this.rotateByXPoint(angleX, point);
        this.rotateByYPoint(angleY, point);
        this.rotateByZPoint(angleZ, point);
    }

    deleteAllPoints() {
        for (let i = 0; i < this.points.length; i++) {
            delete Point.all[this.points[i].id];
        }
        this.points = [];
    }
    deleteAllLines() {
        for (let i = 0; i < this.lines.length; i++) {
            delete Line.all[this.lines[i].id];
        }
        this.lines = [];
    }
}

class Tretahedra extends Shape {
    static all = {};
    /**
     * 
     * @param {Point} p1 right;
     * @param {Point} p2 left;
     * @param {Point} p3 top;
     * @param {Point} p4 back;
     * 
     * all points display must be false. unless this display is true;
     * 
    */
    constructor(p1, p2, p3, p4, display = true, pointdisplay = false, color = 'hsl(200,100%,50%)') {
        super();
        this.points = [p1, p2, p3, p4];
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;

        let k = 0;
        let l = 0;
        let m = 0;
        for (let i = 0; i < this.points.length; i++) {
            k += this.points[i].posReal[0];
            l += this.points[i].posReal[1];
            m += this.points[i].posReal[2];
        };
        this.center = new Point([k / 4, l / 4, m / 4], pointdisplay);

        this.lines = [];
        let array = [p1, p2, p3, p4];
        let c = 0;
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length; j++) {
                if (array[j] !== array[i]) {
                    this.lines.push(new Line(array[j], array[i], display));
                    this.lines[c].color = color;
                    c++;
                }
            }
            array[i].display = pointdisplay;
            array[i].color = color;
        }
        this.display = display;
        this.color = color;
        this.id = Math.random();
        Tretahedra.all[this.id] = this;
    }
}

class Cube extends Shape {
    static all = {};
    /**
     * front (f), right (r) down (d), back (b), left(l), up (u)
     * @param {Point} p1 frd
     * @param {Point} p2 fld
     * @param {Point} p3 fru
     * @param {Point} p4 flu
     * @param {Point} p5 brd
     * @param {Point} p6 bld
     * @param {Point} p7 bru
     * @param {Point} p8 blu
     * @param {boolean} display 
     * @param {boolean} pointdisplay 
     * @param {string} color 
     */
    constructor(p1, p2, p3, p4, p5, p6, p7, p8, display = true, pointdisplay = false, color = `hsl(270,100%,50%)`, linewidth = 1) {
        super();
        this.points = [p1, p2, p3, p4, p5, p6, p7, p8];
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.p5 = p5;
        this.p6 = p6;
        this.p7 = p7;
        this.p8 = p8;
        this.display = display;
        this.pointdisplay = pointdisplay;
        this.color = color;
        this.linewidth = linewidth;
        let k = 0;
        let l = 0;
        let m = 0;
        for (let i = 0; i < this.points.length; i++) {
            k += this.points[i].posReal[0];
            l += this.points[i].posReal[1];
            m += this.points[i].posReal[2];
            this.points[i].display = pointdisplay;
        };
        this.center = new Point([k / 8, l / 8, m / 8], pointdisplay, color);

        this.lines = [
            new Line(p8, p7, display, color, linewidth),
            new Line(p8, p6, display, color, linewidth),
            new Line(p8, p4, display, color, linewidth),
            new Line(p7, p3, display, color, linewidth),
            new Line(p7, p5, display, color, linewidth),
            new Line(p1, p5, display, color, linewidth),
            new Line(p1, p3, display, color, linewidth),
            new Line(p1, p2, display, color, linewidth),
            new Line(p2, p6, display, color, linewidth),
            new Line(p2, p4, display, color, linewidth),
            new Line(p3, p4, display, color, linewidth),
            new Line(p6, p5, display, color, linewidth)
        ];

        this.id = Math.random();
        Cube.all[this.id] = this;
    }
}

class Pyramid extends Shape {
    static all = {};
    /**
     * 
     * @param {Point} p1 right;
     * @param {Point} p2 left;
     * @param {Point} p3 top;
     * @param {Point} p4 backleft;
     * @param {Point} p5 backright;
     * 
     * all points display must be false.
     * 
    */
    constructor(p1, p2, p3, p4, p5, display = true, color = 'hsl(0,100%,50%)', pointdisplay = false, linewidth = 1) {
        super();
        this.points = [p1, p2, p3, p4, p5];
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.p5 = p5;
        this.display = display;
        this.color = color;
        this.pointdisplay = pointdisplay;
        this.linewidth = linewidth;

        this.center = new Point(findCenter(p1, p2, p3, p4, p5), pointdisplay, this.color);

        this.lines = [
            new Line(p1, p3, display, color, linewidth),
            new Line(p2, p3, display, color, linewidth),
            new Line(p4, p3, display, color, linewidth),
            new Line(p5, p3, display, color, linewidth),
            new Line(p1, p2, display, color, linewidth),
            new Line(p1, p5, display, color, linewidth),
            new Line(p2, p4, display, color, linewidth),
            new Line(p4, p5, display, color, linewidth)
        ]

        this.id = Math.random();
        Pyramid.all[this.id] = this;
    }

}

class Octahedron extends Shape {
    static all = {};
    /**
     * 
     * @param {Point} p1 right;
     * @param {Point} p2 left;
     * @param {Point} p3 top;
     * @param {Point} p4 backleft;
     * @param {Point} p5 backright;
     * @param {Point} p6 bottom;
     * 
     * all points display must be false.
     * 
    */
    constructor(p1, p2, p3, p4, p5, p6, display = true, color = 'hsl(0,100%,50%)', pointdisplay = false, linewidth = 1) {
        super();
        this.points = [p1, p2, p3, p4, p5, p6];
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.p5 = p5;
        this.p6 = p6;
        this.display = display;
        this.color = color;
        this.pointdisplay = pointdisplay;
        this.linewidth = 1;

        this.center = new Point(findCenter(p1, p2, p3, p4, p5, p6), pointdisplay, this.color);

        this.lines = [
            new Line(p1, p3, display, color, linewidth),
            new Line(p2, p3, display, color, linewidth),
            new Line(p4, p3, display, color, linewidth),
            new Line(p5, p3, display, color, linewidth),
            new Line(p1, p2, display, color, linewidth),
            new Line(p1, p5, display, color, linewidth),
            new Line(p2, p4, display, color, linewidth),
            new Line(p4, p5, display, color, linewidth),
            new Line(p1, p6, display, color, linewidth),
            new Line(p2, p6, display, color, linewidth),
            new Line(p4, p6, display, color, linewidth),
            new Line(p5, p6, display, color, linewidth),
        ]

        this.id = Math.random();
        Octahedron.all[this.id] = this;
    }
}

class Sphere extends Shape {
    constructor(center, radius, display = true, color = 'hsl(200,100%,50%)') {
        super();
        this.center = new Point(center, display, color);
        this.radius = radius;
        this.display = display;
        this.color = color;
        this.points = [];
        this.lines = [];
        let rS = radius;
        let mqx = 3;
        for (let i = 0; i < 6.1 * mqx; i++) {
            for (let j = 0; j < 6.1 * mqx; j++) {
                this.points.push(new Point([Math.cos(i) * Math.cos(j) * rS + center[0],
                Math.sin(i) * rS + center[1], Math.sin(j) * Math.cos(i) * rS + center[2]], display, color));
            }
        }
    }
}

class HyperSphere extends Shape {
    constructor(center, radius, display = true, color = 'hsl(200,100%,50%)') {
        super();
        this.center = new Point(center, display, color);
        this.radius = radius;
        this.display = display;
        this.color = color;
        ///**@type {Point} */
        this.points = [];
        this.lines = [];
        this.f4d = 0;
    }
    makePoints(angleW) {
        //this.deleteAllPoints();
        let rS = this.radius;
        let mqx = 3;
        this.f4d = Math.sin(angleW) * rS;
        if (this.points.length === 0) {
            for (let i = 0; i < 6.1 * mqx; i++) {
                for (let j = 0; j < 6.1 * mqx; j++) {
                    //console.log(Math.cos(i) * Math.cos(j) * Math.cos(angleW) * rS+this.center.posReal[0])
                    this.points.push(new Point([
                        Math.cos(i) * Math.cos(j) * Math.cos(angleW) * rS + this.center.posReal[0],
                        Math.sin(i) * Math.cos(angleW) * rS + this.center.posReal[1],
                        Math.sin(j) * Math.cos(i) * Math.cos(angleW) * rS + this.center.posReal[2]],
                        this.display, this.color));
                }
            }
        }
        else {
            let counter = 0;
            for (let i = 0; i < 6.1 * mqx; i++) {
                for (let j = 0; j < 6.1 * mqx; j++) {
                    //console.log(Math.cos(i) * Math.cos(j) * Math.cos(angleW) * rS+this.center.posReal[0])
                    this.points[counter].changeRealPosNoAdding([
                        Math.cos(i) * Math.cos(j) * Math.cos(angleW) * rS + this.center.posReal[0],
                        Math.sin(i) * Math.cos(angleW) * rS + this.center.posReal[1],
                        Math.sin(j) * Math.cos(i) * Math.cos(angleW) * rS + this.center.posReal[2]])
                    counter++;
                }
            }
        }
    }
    deleteAllPoints() {
        for (let i = 0; i < this.points.length; i++) {
            delete Point.all[this.points[i].id];
        }
        this.points = [];
    }
}

let allLetters = {};

class Letter extends Shape {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super();
        this.center = new Point(center, pointdisplay, color);
        this.radius = -radius;
        this.display = display;
        this.color = color;
        this.points = [this.center];
        this.lines = [];
        this.pointdisplay = pointdisplay;
        this.doPixAndLines();
        this.id = id;
        this.rotate = rotate;
        allLetters[this.id] = this;
    }
    doPixAndLines() { }
}

class LetterA extends Letter {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super(center, radius, rotate, display, color, pointdisplay, id);
    }
    doPixAndLines() {
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] - (this.radius), this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] - (this.radius * 2), this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - (this.radius * 2), this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0], this.center.posReal[1] + (this.radius * 2), this.center.posReal[2]], this.pointdisplay, this.color));

        this.lines.push(new Line(this.points[0], this.points[1], this.display, this.color, 2));
        this.lines.push(new Line(this.points[0], this.points[2], this.display, this.color, 2));
        this.lines.push(new Line(this.points[1], this.points[3], this.display, this.color, 2));
        this.lines.push(new Line(this.points[3], this.points[4], this.display, this.color, 2));
        this.lines.push(new Line(this.points[1], this.points[5], this.display, this.color, 2));
        this.lines.push(new Line(this.points[2], this.points[6], this.display, this.color, 2));
        this.lines.push(new Line(this.points[6], this.points[7], this.display, this.color, 2));
        this.lines.push(new Line(this.points[2], this.points[8], this.display, this.color, 2));
        this.lines.push(new Line(this.points[8], this.points[9], this.display, this.color, 2));
        this.lines.push(new Line(this.points[5], this.points[9], this.display, this.color, 2));
    }
}

class Letter1 extends Letter {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super(center, radius, rotate, display, color, pointdisplay, id);
    }
    doPixAndLines() {
        this.points.push(new Point([this.center.posReal[0], this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0], this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));

        this.lines.push(new Line(this.points[1], this.points[3], this.display, this.color, 2));
        this.lines.push(new Line(this.points[1], this.points[2], this.display, this.color, 2));
        this.lines.push(new Line(this.points[4], this.points[5], this.display, this.color, 2));
    }
}

class Letter5 extends Letter {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super(center, radius, rotate, display, color, pointdisplay, id);
    }
    doPixAndLines() {
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));

        this.lines.push(new Line(this.points[2], this.points[1], this.display, this.color, 2));
        this.lines.push(new Line(this.points[1], this.points[3], this.display, this.color, 2));
        this.lines.push(new Line(this.points[3], this.points[4], this.display, this.color, 2));
        this.lines.push(new Line(this.points[4], this.points[5], this.display, this.color, 2));
        this.lines.push(new Line(this.points[5], this.points[6], this.display, this.color, 2));

    }
}

class Letter3 extends Letter {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super(center, radius, rotate, display, color, pointdisplay, id);
    }
    doPixAndLines() {
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1], this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));

        this.lines.push(new Line(this.points[2], this.points[1], this.display, this.color, 2));
        this.lines.push(new Line(this.points[1], this.points[3], this.display, this.color, 2));
        this.lines.push(new Line(this.points[3], this.points[4], this.display, this.color, 2));
        this.lines.push(new Line(this.points[4], this.points[5], this.display, this.color, 2));
        this.lines.push(new Line(this.points[5], this.points[6], this.display, this.color, 2));

    }
}

class Letter7 extends Letter {
    constructor(center, radius, rotate = true, display = true, color = 'hsl(100,100%,50%)', pointdisplay = false, id = `${Math.random() * 100}`) {
        super(center, radius, rotate, display, color, pointdisplay, id);
    }
    doPixAndLines() {
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] + this.radius, this.center.posReal[1] + this.radius, this.center.posReal[2]], this.pointdisplay, this.color));
        this.points.push(new Point([this.center.posReal[0] - this.radius, this.center.posReal[1] - this.radius, this.center.posReal[2]], this.pointdisplay, this.color));

        this.lines.push(new Line(this.points[1], this.points[2], this.display, this.color, 2));
        this.lines.push(new Line(this.points[2], this.points[3], this.display, this.color, 2));
    }
}

class Numbers {
    constructor(string, pos, radius, distancebetween) {
        this.string = string;
        this.characters = [];
        for (let i = 0; i < string.length; i++) {
            this.characters.push(eval(`new Letter${string[i]}([pos[0]+distancebetween,pos[1],pos[2]],radius)`))
        }
    }
}

/*class VectorPoint extends Point{
    constructor(pos,display,color,extra) {
        super(pos,display,color,extra)
    }
}*/

function cubePoints(center, radius) {
    let frd = new Point([center[0] + radius, center[1] - radius, center[2] - radius], false);
    let fld = new Point([center[0] - radius, center[1] - radius, center[2] - radius], false);
    let fru = new Point([center[0] + radius, center[1] - radius, center[2] + radius], false);
    let flu = new Point([center[0] - radius, center[1] - radius, center[2] + radius], false);
    let brd = new Point([center[0] + radius, center[1] + radius, center[2] - radius], false);
    let bld = new Point([center[0] - radius, center[1] + radius, center[2] - radius], false);
    let bru = new Point([center[0] + radius, center[1] + radius, center[2] + radius], false);
    let blu = new Point([center[0] - radius, center[1] + radius, center[2] + radius], false);
    return [frd, fld, fru, flu, brd, bld, bru, blu];
}

function distance(pos1, pos2) {
    return Math.sqrt(((pos1[0] - pos2[0]) ** 2) + ((pos1[1] - pos2[1]) ** 2) + ((pos1[2] - pos2[2]) ** 2))
}

/*let hsphere = new HyperSphere([0, 0, 0], 5);
hsphere.makePoints(0);
let adder = 1 / 30;
setInterval(() => {
    hsphere.makePoints(adder-=1/30);
    hsphere.rotateByPointXYZ(-adder, adder, adder, hsphere.center)
}, 10)*/

/**@param {string} string */
function replaceAlll(string, replacer, replacewith) {
    let s = "";
    for (let i = 0; i < string.length; i++) {
        if (string.substring(i, i + replacer.length) == replacer) {
            s += replacewith;
            i += replacer.length - 1;
        }
        else s += string[i];
        //console.log(string.substring(i,i+replacer.length))
    }
    return s
}

let r;
/**@type {Cube} */
let cube;
let noiserArray = [];
let universalEquation = '';
let universalAdder = 0.2;
function noiser() {
    if (noiserArray.length === 0) {
        noiserArray.push(Math.random() * 0.3);
    }
    else noiserArray.push(randomArthemic(Math.random() * 0.05, noiserArray[noiserArray.length - 1]));
    return noiserArray[noiserArray.length - 1];
}
function newCube(boundradius) {
    if (cube) {
        cube.deleteAllLines();
        cube.deleteAllPoints();
    }
    let cubep = cubePoints([0, 0, 0], boundradius);
    cube = new Cube(cubep[0], cubep[1], cubep[2], cubep[3], cubep[4], cubep[5]
        , cubep[6], cubep[7], true, false, 'rgb(255,255,255)', 0.5
    );
}
let graphing = true;
let vectorGraph = false;
/**@param {string} equation ex:"x+y" */
function grapherEqu(equation = 'Math.cos(x)-Math.sin(y)', boundradius = 5, adder = universalAdder) {

    if (!graphing) return;
    universalEquation = equation;
    equation = replaceAlll(equation, 'cos', 'Math.cos');
    equation = replaceAlll(equation, 'sin', 'Math.sin');
    equation = replaceAlll(equation, 'sqrt', 'Math.sqrt');
    //equation=replaceAlll(equation,'tan','Math.tan');

    //new Numbers(`${boundradius}`, [boundradius, 0, 0], 0.5, 0);
    //new Numbers(`${boundradius}`, [0, boundradius, 0], 0.5, 0);
    //new Numbers(`${boundradius}`, [0, 0, boundradius], 0.5, 0);
    max = boundradius;

    let points = [];
    let matrixPoints = [];
    //equation = equation.padStart(equation.length + 1, '-');

    if (r) {
        r.deleteAllLines();
        r.deleteAllPoints();
    }

    for (let i = 0; i < (boundradius * 2) / adder; i++) {
        matrixPoints.push([]);
    }

    let liness = [];

    for (let x = -boundradius; x <= boundradius; x += adder) {
        for (let y = -boundradius; y <= boundradius; y += adder) {

            let c;
            let linedisplay = true;
            //console.log(equation, points)
            if (eval(equation) <= boundradius && eval(equation) >= -boundradius)
                c = new Point([x, eval(equation), y], false, 'rgb(0,0,0)', 1)
            else {
                c = new Point([x, 0, y], false, 'rgb(0,0,0)', 2);
                linedisplay = false;
            }

            points.push(c);

            let r = Math.floor((x + boundradius) / adder);
            if (r === Math.floor((boundradius * 2) / adder)) break;
            matrixPoints[r].push(c);

            //if this is not the first point graphed make a line
            if (matrixPoints[r].length > 1) {
                //if the point is in boundary add a line to it
                if (matrixPoints[r][matrixPoints[r].length - 2].extra === 1) {

                    liness.push(new Line(
                        matrixPoints[r][matrixPoints[r].length - 1],
                        matrixPoints[r][matrixPoints[r].length - 2],
                        linedisplay, 'rgb(0,255,0)',
                    ));

                }
            }

            //if this is not the first array add a line to a point
            if (matrixPoints[r - 1]) {
                //and if the point exists add a line to it
                if (matrixPoints[r - 1][matrixPoints[r].length - 1]) {
                    //and if the point is in the boundary add a line to it
                    if (matrixPoints[r - 1][matrixPoints[r].length - 1].extra === 1) {

                        liness.push(new Line(
                            matrixPoints[r - 1][matrixPoints[r].length - 1],
                            matrixPoints[r][matrixPoints[r].length - 1],
                            linedisplay, 'rgb(0,255,0)',
                        ));

                    }
                }
            }

        }
    }

    r = new Shape(points, true, liness);

    newCube(boundradius);

    //r.rotateByPointXYZ(Math.PI*2-rX,Math.PI*2-rY,Math.PI*2-rZ,cube.center);
    //cube.rotateByPointXYZ(-rX,-rY,-rZ,cube.center)
}
function grapherPointEqu(pointsEq, boundradius = 5, adder = universalAdder) {

    if (!graphing) return
    universalEquation = pointsEq;
    pointsEq = replaceAlll(pointsEq, 'cos', 'Math.cos');
    pointsEq = replaceAlll(pointsEq, 'sin', 'Math.sin');
    pointsEq = replaceAlll(pointsEq, 'sqrt', 'Math.sqrt');
    //pointsEq=replaceAlll(pointsEq,'tan','Math.tan');

    pointsEq = pointsEq.split(',')
    //console.log(pointsEq)

    if (r) {
        r.deleteAllLines();
        r.deleteAllPoints();
    }

    let points = [];
    let matrixPoints = [];

    for (let i = 0; i < (boundradius * 2) / adder; i++) {
        matrixPoints.push([]);
    }

    let liness = [];

    for (let x = -boundradius; x <= boundradius; x += adder) {
        for (let y = -boundradius; y <= boundradius; y += adder) {

            let c;
            let linedisplay = true;

            //if (eval(equation) <= boundradius && eval(equation) >= -boundradius) 
            c = new Point([eval(pointsEq[0]), eval(pointsEq[1]), eval(pointsEq[2])], false, 'rgb(0,0,0)', 1)
            //else {
            //    c = new Point([x, 0, y], false, 'rgb(0,0,0)', 2);
            //    linedisplay = false;
            //}

            points.push(c);

            let r = Math.floor((x + boundradius) / adder);
            if (r === Math.floor((boundradius * 2) / adder)) break;
            matrixPoints[r].push(c);

            //if this is not the first point graphed make a line
            if (matrixPoints[r].length > 1) {
                //if the point is in boundary add a line to it
                if (matrixPoints[r][matrixPoints[r].length - 2].extra === 1) {

                    liness.push(new Line(
                        matrixPoints[r][matrixPoints[r].length - 1],
                        matrixPoints[r][matrixPoints[r].length - 2],
                        linedisplay, 'rgb(0,255,0)',
                    ));

                }
            }

            //if this is not the first array add a line to a point
            if (matrixPoints[r - 1]) {
                //and if the point exists add a line to it
                if (matrixPoints[r - 1][matrixPoints[r].length - 1]) {
                    //and if the point is in the boundary add a line to it
                    if (matrixPoints[r - 1][matrixPoints[r].length - 1].extra === 1) {

                        liness.push(new Line(
                            matrixPoints[r - 1][matrixPoints[r].length - 1],
                            matrixPoints[r][matrixPoints[r].length - 1],
                            linedisplay, 'rgb(0,255,0)',
                        ));

                    }
                }
            }

        }
    }

    r = new Shape(points, true, liness);

    newCube(boundradius);
}
function rotateGraph(x, y, z) {
    rX += x; rY += y; rZ += z;
    r.rotateByPointXYZ(x, y, z, cube.center);
    cube.rotateByPointXYZ(x, y, z, cube.center);
}

let rX = 0; let rY = 0; let rZ = 0;

function vectorGraphing(equationX, equationY, equationZ,adder=1) {
    //if (!vectorGraph) return;

    equationX = replaceAlll(equationX, 'cos', 'Math.cos');
    equationX = replaceAlll(equationX, 'sin', 'Math.sin');
    equationX = replaceAlll(equationX, 'sqrt', 'Math.sqrt');
    equationY = replaceAlll(equationY, 'cos', 'Math.cos');
    equationY = replaceAlll(equationY, 'sin', 'Math.sin');
    equationY = replaceAlll(equationY, 'sqrt', 'Math.sqrt');
    equationZ = replaceAlll(equationZ, 'cos', 'Math.cos');
    equationZ = replaceAlll(equationZ, 'sin', 'Math.sin');
    equationZ = replaceAlll(equationZ, 'sqrt', 'Math.sqrt');

    if (r) {
        r.deleteAllLines();
        r.deleteAllPoints();
    }

    let points = [];
    let lines = [];
    let vector = {};
    for (let x = -max; x <= max; x += adder) {
        for (let y = -max; y <= max; y += adder) {
            for (let z = -max; z <= max; z += adder) {

                points.push(new Point([x, y, z], false));
                points.push(new Point([eval(equationX), eval(equationY), eval(equationZ)], true, 'rgb(0,255,0)'));
                lines.push(new Line(points[points.length - 1], points[points.length - 2], true));

                vector[`${x},${y},${z}`] = [
                    Number((points[points.length - 1].posReal[0] - points[points.length - 2].posReal[0]).toPrecision(3)),
                    Number((points[points.length - 1].posReal[1] - points[points.length - 2].posReal[1]).toPrecision(3)),
                    Number((points[points.length - 1].posReal[2] - points[points.length - 2].posReal[2]).toPrecision(3)),
                ]

            }
        }
    }
    //console.log(vector)
    r = new Shape(points, true, lines);
    newCube(5);
}
//vectorGraphing('x+(sin(x-y)/10)','y+((y+z)/10)','z+((z+x)/10)');
//grapherPointEqu("x+y,(x)*sin(-75*3.141592/180)-(x*x+y*y)*cos(-75*3.141592/180),(x*x)/10+(y*y)/10", 5, 0.2);
//grapherPointEqu("x,sin(noiser()),y", 5, 0.5)
grapherEqu('(sqrt((x**2)+(y**2)))-5');
/*wait(1000, ()=>{
    grapherEqu('x+2', 7, 0.5);
    universalEquation = 'x+2';
})
universalEquation = '(sqrt((x**2)+(y**2)))-5';*/


function randomArthemic(a, b) {
    return Math.random() < 0.5 ? a + b : a - b;
}

/*let points=[
    new Point([0,0,0],false),
    new Point([0,-5,0],false),
    new Point([0,0,5],false),
    new Point([5,0,0],false),
    new Point([-3,0,-3],false)
]

let lines =[
    new Line(points[0],points[1],true),
    new Line(points[0],points[2],true),
    new Line(points[0],points[3],true),
    new Line(points[0],points[4],true)
]

let t = new Shape(points,true,lines);

setInterval(()=>{
    t.rotateByYPoint(1/30,points[0])
},10)*/

/*let rig = new Point([1,2,1],true);
let left = new Point([-1,2,1],true);
let backleft = new Point([-1,2,3],true);
let backrig = new Point([1,2,3],true);
let topp = new Point([0,0,2],true);
let bottom = new Point([0,4,2],true);*/


addEventListener('keydown', (e) => {

    switch (e.key) {
        case 'w':
            /*if (graphing) rotateGraph(1 / 30, 0, 0);
            if (vectorGraph) r.rotateByPointXYZ(1 / 30, 0, 0, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) {
                            allLetters[i].rotateByPointXYZ(1 / 30, 0, 0, r.center);
                        }
                    }
                }
            };*/
            changeCameraPos([camera.pos[0],camera.pos[1],camera.pos[2]+1])
            break;
        case 's':
            /*if (graphing) rotateGraph(-1 / 30, 0, 0);
            if (vectorGraph) r.rotateByPointXYZ(-1 / 30, 0, 0, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(-1 / 30, 0, 0, r.center)
                    }
                }
            };*/
            changeCameraPos([camera.pos[0],camera.pos[1],camera.pos[2]-1])
            break;
        case 'q':
            if (graphing) rotateGraph(0, 0, -1 / 30);
            if (vectorGraph) r.rotateByPointXYZ(0, 0, -1 / 30, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(0, 0, -1 / 30, r.center)
                    }
                }
            };
            break;
        case 'e':
            if (graphing) rotateGraph(0, 0, 1 / 30);
            if (vectorGraph) r.rotateByPointXYZ(0, 0, 1 / 30, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(0, 0, 1 / 30, r.center)
                    }
                }
            };
            break;
        case 'a':
            /*if (graphing) rotateGraph(0, -1 / 30, 0);
            if (vectorGraph) r.rotateByPointXYZ(0, -1 / 30, 0, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(0, -1 / 30, 0, r.center)
                    }
                }
            };*/
            changeCameraPos([camera.pos[0]-1,camera.pos[1],camera.pos[2]])
            break;
        case 'd':
            /*if (graphing) rotateGraph(0, 1 / 30, 0);
            if (vectorGraph) r.rotateByPointXYZ(0, 1 / 30, 0, r.center);
            if (graphing || vectorGraph) {
                for (let i in allLetters) {
                    if (r) {
                        if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(0, 1 / 30, 0, r.center)
                    }
                }
            };*/
            changeCameraPos([camera.pos[0]+1,camera.pos[1],camera.pos[2]])
            break;
    }

});
let clickStarted = false;
let postition = [];
canvas.addEventListener('click', (e) => {
    if (!clickStarted) {
        postition = [e.x, e.y]
    }
    else {
        postition = [];
    }
    clickStarted = !clickStarted;
})
canvas.addEventListener('mousemove', (e) => {
    if (clickStarted) {
        if (graphing) rotateGraph(-(e.y - postition[1]) / 300, -(e.x - postition[0]) / 300, 0);
        if (vectorGraph) r.rotateByPointXYZ(-(e.y - postition[1]) / 300, -(e.x - postition[0]) / 300, 0, r.center)
        if (graphing || vectorGraph) {
            for (let i in allLetters) {
                if (r) {
                    if (allLetters[i].rotate) allLetters[i].rotateByPointXYZ(-(e.y - postition[1]) / 300, -(e.x - postition[0]) / 300, 0, r.center)
                }
            }
        }
        postition = [e.x, e.y]
    }
})


function rndmFlr(num) {
    return Math.floor(Math.random() * num);
}

function xroot(x, y) {
    return Math.pow(y, 1 / x);
}

function animate() {
    ctx.fillStyle = 'rgb(25, 28, 35)';
    ctx.fillRect(0, 0, cw, ch);
    for (let i in Point.all) {
        Point.all[i].draw();

    }
    for (let i in Line.all) {
        Line.all[i].draw();
    }
}

//sqrt(((x*x)+((x**2)**2))/((Math.tan(Math.atan((x**2)/x)+90)**2)+1)),y, -Math.tan(Math.atan((x**2)/x)+90)*sqrt(((x*x)+((x**2)**2))/((Math.tan(Math.atan((x**2)/x)+90)**2)+1))

setInterval(animate, 10);
