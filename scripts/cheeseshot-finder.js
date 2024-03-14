import { Vector } from "./vector.js";

// very dumb logging system idk dont @ me
const Log = {
    set status(status) {
        Log._status = status;
        Log._perc = 0;
        Log.update();
    },
    set percentage(perc) {
        let oldPerc = Log._perc;
        Log._perc = Math.floor(perc + 0.5);
        if(oldPerc != Log._perc)Log.update();
    },
    update: function () {
        let msg = Log._status;
        if (Log._perc > 0) msg += "(" + Log._perc + "%)";
        //postMessage(msg);
    }
}

// very cool and shitty function for finding seamshots
export function findCheeseshots(map) {
    const PLANE_DIST_ERROR = 0.001;
    const DOT_ERROR = 0.0001;

    let edges = [];
    
    Log.status = "Finding brush edges...";
    //find all edges of every brush
    for (let b = 0; b < map.brushes.length; b++) {
        let brush = map.brushes[b];
        Log.percentage = (b / map.brushes.length) * 100;
        // ignoring the brush if it's not solid (CONTENTS_SOLID)
        if ((brush.contents & 0x1) == 0) continue;
        if (brush.leafs.length == 0) continue;
        
        for (let i = 0; i < brush.numsides-1; i++) {
            let brushSide1 = map.brushSides[brush.firstside + i];
            if (brushSide1.bevel) continue;
            let plane1 = map.planes[brushSide1.planenum];

            for (let j = i + 1; j < brush.numsides; j++) {
                let brushSide2 = map.brushSides[brush.firstside + j];
                if (i == j || brushSide2.bevel) continue;
                
                let plane2 = map.planes[brushSide2.planenum];

                // finding an intersection between two planes
                let n1 = plane1.normal;
                let n2 = plane2.normal;
                let d1 = plane1.dist;
                let d2 = plane2.dist;

                if (n1.sub(n2).length() < DOT_ERROR || n1.mult(-1).sub(n2).length() < DOT_ERROR) continue;

                // intersection line direction is just cross product
                let lineDir = n1.cross(n2).normalized();

                // for point calculations, assuming either x=0, y=0 or z=0, depending on whether
                // line ever crosses the YZ, XZ or XY plane respectively
                let linePoint = new Vector();
                if (lineDir.x != 0) {
                    linePoint.x = 0;
                    linePoint.z = (n1.y*d2 - n2.y*d1) / (n1.y*n2.z - n1.z*n2.y);
                    linePoint.y = (n1.y != 0) ? ((d1 - n1.z * linePoint.z) / n1.y) : ((d2 - n2.z * linePoint.z) / n2.y);
                } else if(lineDir.y != 0){
                    linePoint.y = 0;
                    linePoint.z = (n1.x*d2 - n2.x*d1) / (n1.x*n2.z - n1.z*n2.x);
                    linePoint.x = (n1.x != 0) ? ((d1 - n1.z * linePoint.z) / n1.x) : ((d2 - n2.z * linePoint.z) / n2.x);
                } else {
                    linePoint.z = 0;
                    linePoint.y = (n1.x*d2 - n2.x*d1) / (n1.x*n2.y - n1.y*n2.x);
                    linePoint.x = (n1.x != 0) ? ((d1 - n1.y * linePoint.y) / n1.x) : ((d2 - n2.y * linePoint.y) / n2.x);
                }

                // "ya mate im gonna give you some nans for no reason good luck debugging it"
                if (isNaN(linePoint.x) || isNaN(linePoint.y) || isNaN(linePoint.z)) {
                    throw new Error(
                        "Cannot find an intersection point of two planes: "
                        + "n1=" + n1 + ", n2=" + n2 + ", d1=" + d1 + ", d2=" + d1
                        + ", lineDir=" + lineDir + ", linePoint=" + linePoint
                    );
                }

                // finding edge points
                let minDist = Number.NEGATIVE_INFINITY;
                let maxDist = Number.POSITIVE_INFINITY;

                for (let k = 0; k < brush.numsides; k++) {
                    let brushSide3 = map.brushSides[brush.firstside + k];
                    if (i == k || j == k || brushSide3.bevel) continue;

                    let plane3 = map.planes[brushSide3.planenum];

                    let n3 = plane3.normal;
                    let d3 = plane3.dist;

                    if (n3.dot(lineDir) == 0) {
                        if (n3.dot(linePoint) - d3 > PLANE_DIST_ERROR) {
                            minDist = maxDist = Number.NEGATIVE_INFINITY;
                            break;
                        }
                        continue;
                    }
                    
                    let t = (d3 - n3.dot(linePoint)) / n3.dot(lineDir);
                    if (n3.dot(lineDir) > 0 && t < maxDist) {
                        maxDist = t;
                    }
                    if (n3.dot(lineDir) < 0 && t > minDist) {
                        minDist = t;
                    }
                }

                // some edges created by two planes aren't a part of a brush.
                if (maxDist > minDist) {
                    let p1 = linePoint.add(lineDir.mult(minDist));
                    let p2 = linePoint.add(lineDir.mult(maxDist));

                    edges.push({
                        point1: p1,
                        point2: p2,
                        brush: brush,
                        plane: plane1,
                    });
                    edges.push({
                        point1: p1,
                        point2: p2,
                        brush: brush,
                        plane: plane2,
                    });
                }
            }
        }
    }

    let filtered = [];

    Log.status = "Filtering edges";
    
    for (let edge of edges) {
        // check if plane normal of the edge is axis-aligned
        if (Math.abs(edge.plane.normal.x) != 1 && Math.abs(edge.plane.normal.y) != 1 && Math.abs(edge.plane.normal.z) != 1) {
            continue;
        }

        var distDelta = Math.round(edge.plane.dist) - edge.plane.dist;
        if (distDelta != 0.0) {
            filtered.push({
                point1: edge.point1,
                point2: edge.point2,
                delta: distDelta,
                normal: edge.plane.normal
            });
        }
    }

    Log.status = "Done!";

    return filtered;
}