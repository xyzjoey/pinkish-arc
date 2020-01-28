function vec2ToVec3(v) {
    return new THREE.Vector3(v.x, v.y, 0);
}

function vec3ToVec2(v) {
    return new THREE.Vector2(v.x, v.y);
}

function vec2cross(v1, v2) {
    return new THREE.Vector3(0, 0, v1.x*v2.y - v1.y*v2.x);
}

function vec2rotate(v, radian) {
    return new THREE.Vector2(
        Math.cos(radian) * v.x - Math.sin(radian) * v.y,
        Math.sin(radian) * v.x + Math.cos(radian) * v.y,
    );
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function lerpColor(hex1, hex2, t) {
    // r1 = 
}

// function vecAngle(v1, v2) {
//     return v1.clone().normalize().dot(v2.clone().normalize())
// }