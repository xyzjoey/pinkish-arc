function collideCircles(center1, radius1, center2, radius2, allowOverlap=false, kinematic1=true, kinematic2=true) {
    let results = {
        isCollide: false,
        translation1: null, // vector to move circle1 away to avoid overlap
        translation2: null, // vector to move circle2 away to avoid overlap
        force1: null, // momemtum
        force2: null,
    };

    const vec1to2 = center2.clone().sub(center1);
    const dist = vec1to2.length();

    results.isCollide = dist <= (radius1 + radius2);
    if (!results.isCollide) return results;

    // move away so to avoid overlap
    if (!allowOverlap) {
        const overlayDist = (radius1 + radius2) - dist;
        if (overlayDist > 0) {
            const moveDist1 = overlayDist * radius2 / (radius1 + radius2);
            const moveDist2 = overlayDist * radius1 / (radius1 + radius2);
            results.translation1 = vec1to2.clone().setLength(moveDist1).negate();
            results.translation2 = vec1to2.clone().setLength(moveDist2);
        }
    }

    // // momemtum //http://ericleong.me/research/circle-circle/
    // const normali = vectorij.clone().normalize();
    // const normalj = normali.clone().negate();
    // const p = 2 * (enemies[i].velocity.dot(normali) + enemies[j].velocity.dot(normalj)) / (enemies[i].radius + enemies[j].radius);
    // enemies[i].addForce(normalj.clone().multiplyScalar(p * enemies[i].radius));
    // enemies[j].addForce(normali.clone().multiplyScalar(p * enemies[j].radius));

    return results;
}

function collideTriangleCircle(v0, v1, v2, circlecenter, radius, kinematicTri=true, kinematicCir=true) {
    // v0, v1, v2: vertices of triangle
    // circlecenter, radius: center & radius of circle

    let results = {
        isCollide: false,
        circleTranslation: null,
    };

    const vmid = v0.clone().add(v1).add(v2).multiplyScalar(1/3);

    // vector from triangle center to circle (approximately) closest point
    let d = circlecenter.clone().sub(vmid);
    if (d.length() === 0) d = new THREE.Vector2(Number.EPSILON, 0); // avoid zero
    d.setLength(d.length() - radius || d.length() - radius + Number.EPSILON); // reduce length by radius // what if negative?
    const dlength = d.length(); 

    // return if outside bounding circle
    if (dlength > Math.max(vmid.distanceTo(v0), vmid.distanceTo(v1), vmid.distanceTo(v2))) return results;

    const dnorm = d.clone().normalize();
    const v01 = v1.clone().sub(v0);
    const v12 = v2.clone().sub(v1);
    const v20 = v0.clone().sub(v2);

    // find intersections of each side
    const raylength01 = intersectRays(vmid, dnorm, v0, v01.clone().normalize());
    const raylength12 = intersectRays(vmid, dnorm, v1, v12.clone().normalize());
    const raylength20 = intersectRays(vmid, dnorm, v2, v20.clone().normalize());

    // determine if collided
    let intersectT = null;
    if (raylength01.t >= 0 && raylength01.t >= dlength && raylength01.u >= 0 && raylength01.u <= v01.length()) intersectT = raylength01.t;
    else if (raylength12.t >= 0 && raylength12.t >= dlength && raylength12.u >= 0 && raylength12.u <= v12.length()) intersectT = raylength12.t;
    else if (raylength20.t >= 0 && raylength20.t >= dlength && raylength20.u >= 0 && raylength20.u <= v20.length()) intersectT = raylength20.t;

    if (intersectT !== null) {
        results.isCollide = true;
        results.circleTranslation = d.clone().setLength(intersectT - dlength);
    }

    return results;
}

// perpendicular distance
// function collideTriangleCircle(v0, v1, v2, circlecenter, radius, kinematicTri=true, kinematicCir=true) {
//     // v0, v1, v2: vertices of triangle
//     // circlecenter, radius: center & radius of circle

//     let results = {
//         isCollide: false,
//         circleTranslation: null,
//     };

//     // const vmid = v0.clone().add(v1).add(v2).multiplyScalar(1/3);
//     const v01 = v1.clone().sub(v0);
//     const v12 = v2.clone().sub(v1);
//     const v20 = v0.clone().sub(v2);

//     // rays from circle surface corresponds to triangle planes
//     // normals
//     const n01 = v01.clone().rotateAround(new THREE.Vector2(), Math.PI/2).normalize();
//     const n12 = v12.clone().rotateAround(new THREE.Vector2(), Math.PI/2).normalize();
//     const n20 = v20.clone().rotateAround(new THREE.Vector2(), Math.PI/2).normalize();
//     // starting points
//     const p01 = circlecenter.clone().add(n01.clone().setLength(radius));
//     const p12 = circlecenter.clone().add(n12.clone().setLength(radius));
//     const p20 = circlecenter.clone().add(n20.clone().setLength(radius));

//     // find intersections of each side
//     const raylength01 = intersectRays(p01, n01, v0, v01.clone().normalize());
//     const raylength12 = intersectRays(p12, n12, v1, v12.clone().normalize());
//     const raylength20 = intersectRays(p20, n20, v2, v20.clone().normalize());

//     // determine if collided
//     results.isCollide = (raylength01.t <= 0 && raylength01.u >= 0 && raylength01.u <= v01.length() &&
//                         raylength12.t <= 0 && raylength12.u >= 0 && raylength12.u <= v12.length() &&
//                         raylength20.t <= 0 && raylength20.u >= 0 && raylength20.u <= v20.length());

//     if (!results.isCollide) return results;

//     // determine closest side
//     if (raylength01.t >= raylength12.t && raylength01.t >= raylength20.t) { // raylength01.t is max
//         results.circleTranslation = n01.clone().setLength(raylength01.t);
//     } else if (raylength12.t >= raylength01.t && raylength12.t >= raylength20.t) { // raylength12.t is max
//         results.circleTranslation = n12.clone().setLength(raylength12.t);
//     } else { // raylength20.t is max
//         results.circleTranslation = n20.clone().setLength(raylength20.t);
//     }
//     return results;
// }

function collideLineCircle(linePoints, circlecenter, radius) {
    let results = {
        isCollide: false,
        lineSegmentIndex: null,
        lineNormal: null,
    }

    // find first line segment that collide with the circle
    for (let i = 0; i < linePoints.length - 1; ++i) {
        const linePt1 = linePoints[i];
        const linePt2 = linePoints[i+1];
        const lineSegment = linePt2.clone().sub(linePt1);
        const circleNormal = lineSegment.clone().rotateAround(new THREE.Vector2(), Math.PI/2).normalize();// negative direction doesnt matter

        // find intersection
        const raylength = intersectRays(circlecenter, circleNormal, linePt1, lineSegment.clone().normalize());

        // determine if collided
        if (Math.abs(raylength.t) <= radius && raylength.u >= 0 && raylength.u <= lineSegment.length()) {
            results.isCollide = true;
            results.lineSegmentIndex = i;
            results.lineNormal = raylength.t >= 0 && circleNormal.clone().negate() || circleNormal;
            return results;
        }
    }

    return results;
}

function intersectRays(p1, d1, p2, d2) {
    // p: start point, d: ray direction
    // p1 + t(d1) = p2 + u(d2)
    // parallel & same line --> 0
    // parallel & no intersection --> Infinity
    if (d1.equals(d2) && p1.equals(p2)) { // same line
        return {t: 0, u: 0};
    } else {
        const t = (d2.y*p2.x - d2.y*p1.x - d2.x*p2.y + d2.x*p1.y) / (d2.y*d1.x - d2.x*d1.y);
        const u = (p1.x + t*d1.x - p2.x) / d2.x;
        return {t, u};
    }
}