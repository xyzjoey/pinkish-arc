const PINK = 0xeb3480;
const PLAYER_HP = 50;
const PLAYER_COLOR = PINK;
const GUARD_COLOR = 0x73e8ff;
const DAMAGE_COLOR = 0xffffff;

const LINE_COLOR = PINK;

const ENEMY_HP = 3;
const ENEMY_COLORS = [0xffa203, 0xffa203, 0x14871c, 0x186e99]; // different color for different hp

class Player {
    constructor() {
        this.hp = PLAYER_HP;
        // transform
        this.position = new THREE.Vector2(0, 0);
        this.up = new THREE.Vector2(0, 1);
        this.right = new THREE.Vector2(1, 0);
        // guard
        this.guardState = Player.GUARDSTATES.READY;
        this.guardTimer = null;
        this.guardRestTimer = null;
        // mesh
        this.object3d = this.createMesh();
        this.object3d.name = "player";
    }

    createMesh() {
        // mesh
        let geometry = new THREE.Geometry();
        geometry.vertices.push(this.vertex0);
        geometry.vertices.push(this.vertex1);
        geometry.vertices.push(this.vertex2);
        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        let material = new THREE.MeshBasicMaterial( { color: PLAYER_COLOR } );
        let mesh = new THREE.Mesh( geometry, material );
        // animation
        let animationGroup = new THREE.Object3D();
        // group
        let group = new THREE.Object3D();
        group.add(mesh);
        group.add(animationGroup);

        return group;
    }

    static get GUARDSTATES() {
        return {
            READY: 0, // can guard
            GUARDING: 1, // can trigger just guard
            SUCCESS: 2, // just guard success
            REST: 3, // rest for a while before can guard again
        };
    }

    get distFromCursor() { return 1.5; }
    get posSmoothFactor() { return 0.3; }
    get dirSmoothFactor() { return 0.5; }

    get hpPercent() { return this.hp / PLAYER_HP; }

    get guardInterval() { return 200; }
    get guardSuccessInterval() { return 700; }
    get guardRestInterval() { return 300; }
    get guardRadius() { return 1.2; }
    get guardForceMagnitude() { return 0.035; }

    get vertex0() { return new THREE.Vector3(0, 2/3, 0); }
    get vertex1() { return new THREE.Vector3(-0.4, -1/3, 0); }
    get vertex2() { return new THREE.Vector3(0.4, -1/3, 0); }
    get vertex0World() { return this.up.clone().multiplyScalar(2/3).add(this.position); }
    get vertex1World() { return this.up.clone().multiplyScalar(-1/3).add(this.right.clone().multiplyScalar(-0.4)).add(this.position); }
    get vertex2World() { return this.up.clone().multiplyScalar(-1/3).add(this.right.clone().multiplyScalar(0.4)).add(this.position); }
    get boundingRadius() { return 0.7;} //
    
    get mesh() { return this.object3d.children[0]; }
    get animationGroup() { return this.object3d.children[1]; }

    move(targetPoint) {
        // new direction (this.up towards cursor)
        const newUp = this.up.clone().subVectors(targetPoint, this.position).normalize();
        this.up.lerp(newUp, this.dirSmoothFactor).normalize();
        this.right = vec2rotate(this.up, -Math.PI/2);
        // new position (move towards cursor)
        const newposition = this.position.clone().subVectors(targetPoint, this.up.clone().multiplyScalar(this.distFromCursor));
        this.position.lerp(newposition, this.posSmoothFactor);
    }

    updateMesh() {
        this.object3d.position.set(this.position.x, this.position.y, 0);
        this.object3d.rotation.z = this.right.angle();
    }

    update(targetPoint) {
        this.move(targetPoint);
        this.updateMesh();
    }

    guard() {
        if (this.guardState != Player.GUARDSTATES.READY) return;

        this.guardState = Player.GUARDSTATES.GUARDING;

        clearTimeout(this.guardTimer);
        this.guardTimer = setTimeout(() => { this.guardRest(); }, this.guardInterval);

        this.guardAnimation();
    }

    guardRest() {
        this.guardState = Player.GUARDSTATES.REST;

        clearTimeout(this.guardRestTimer);
        this.guardRestTimer = setTimeout(() => { this.guardResume(); }, this.guardRestInterval);
    }

    guardResume() {
        this.guardState = Player.GUARDSTATES.READY;
    }

    guardSuccess() {
        clearTimeout(this.guardTimer);
        clearTimeout(this.guardRestTimer);

        this.guardState = Player.GUARDSTATES.SUCCESS;
        setTimeout(() => { this.guardResume(); }, this.guardSuccessInterval);

        this.guardSuccessAnimation();
    }

    receiveDamage(attackValue) {
        if (this.guardState === Player.GUARDSTATES.SUCCESS) return;
        if (this.guardState === Player.GUARDSTATES.GUARDING) {
            this.guardSuccess();
            return;
        }
        if (attackValue === null) return;
        if (this.hp <= 0) return;

        this.hp -= attackValue;

        this.guardRest(); //
        this.damageAnimation();
    }

    damageAnimation() {
        // fade color

        const name = "damage";
        const z = 0.1;
        const animateDuration = this.guardRestInterval;
        const animateInterval = 15;

        // create a triangle mesh for pretending color fading
        let geometry = new THREE.Geometry();
        geometry.vertices.push(this.vertex0.setZ(z)); // set z such it is on top of player mesh
        geometry.vertices.push(this.vertex1.setZ(z));
        geometry.vertices.push(this.vertex2.setZ(z));
        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        let material = new THREE.MeshBasicMaterial({
            color: DAMAGE_COLOR,
            opacity: 1,
            transparent: true,
        });
        let colored = new THREE.Mesh(geometry, material);
        colored.name = name;

        const animate = () => {
            // update opacity
            colored.material.opacity -= animateInterval / animateDuration;
        };

        this.clearAnimations(name); // clear any damage effects
        this.animationGroup.add(colored); // add to scene

        // timer
        let animateTimer = setInterval(() => { animate(); }, animateInterval);
        setTimeout(() => {
            clearInterval(animateTimer);
            this.clearAnimations(name);
        }, animateDuration);
    }

    guardAnimation() {
        // outline

        const minScale = 0.5;
        const z = -10;
        const animateDuration = this.guardInterval;
        const animateInterval = 15;
        const lerpFactor = 0.12;

        // create a triangle mesh for pretending outline
        let geometry = new THREE.Geometry();
        geometry.vertices.push(this.vertex0.setZ(z)); // set z such that player mesh is on top of it
        geometry.vertices.push(this.vertex1.setZ(z));
        geometry.vertices.push(this.vertex2.setZ(z));
        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        let material = new THREE.MeshBasicMaterial({
            color: GUARD_COLOR,
        });
        let outline = new THREE.Mesh(geometry, material);

        const animate = () => {
            // update scale
            const scale = THREE.Math.lerp(this.mesh.scale.x, 1, lerpFactor);
            this.mesh.scale.set(scale, scale, 1);
        };

        this.animationGroup.add(outline); // add to scene
        this.mesh.scale.set(minScale, minScale, 1); // make player smaller

        // timer
        let animateTimer = setInterval(() => { animate(); }, animateInterval);
        setTimeout(() => {
            this.mesh.scale.set(1, 1, 1);
            clearInterval(animateTimer);
            this.animationGroup.remove(outline);
        }, animateDuration);
    }

    guardSuccessAnimation() {
        // an expanding ring

        const name = "guardRing";
        const segmentNum = 32;
        const maxRadius = this.guardRadius;
        const radiusWidth = 0.5;
        const animateDuration = this.guardSuccessInterval;
        const animateInterval = 15;
        const lerpFactor = 0.1;

        const innerRadius = (radius) => { return Math.max(radius - radiusWidth/2, 0); }
        const outerRadius = (radius) => { return Math.min(radius + radiusWidth/2, maxRadius); }

        // create ring
        let geometry = new THREE.RingBufferGeometry(innerRadius(0), outerRadius(0), segmentNum);
        let material = new THREE.MeshBasicMaterial({
            color: GUARD_COLOR,
            opacity: 1,
            transparent: true,
        });
        let ring = new THREE.Mesh(geometry, material);
        ring.name = name;
        ring.radius = 0;

        // animation function
        const animate = () => {
            // update radius
            ring.radius = THREE.Math.lerp(ring.radius, maxRadius + radiusWidth/2, lerpFactor);
            ring.geometry.dispose();
            ring.geometry = new THREE.RingBufferGeometry(innerRadius(ring.radius), outerRadius(ring.radius), segmentNum);
            // update opacity
            ring.material.opacity -= animateInterval / animateDuration;
        };

        // clear any ring
        this.clearAnimations(name);
        // add to scene
        this.animationGroup.add(ring);
        // set animate timer
        let animateTimer = setInterval(() => { animate(); }, animateInterval);
        // set ending timer
        setTimeout(() => {
            clearInterval(animateTimer); // stop animation
            this.clearAnimations(name); // remove ring
        }, animateDuration);
    }

    clearAnimations(name=null) {
        // remove objects under animation group with specific name
        // if name === null, remove all
        for (let i = this.animationGroup.children.length - 1; i >= 0; --i) {
            if (name === null || this.animationGroup.children[i].name === name)
                this.animationGroup.remove(this.animationGroup.children[i]);
        }
    }
};

class Enemy {
    constructor(index, pos) {
        this.index = index;
        this.hp = ENEMY_HP;
        this.state = Enemy.STATES.DEACTIVE;

        this.position = pos;
        this.velocity = new THREE.Vector2(); //(new THREE.Vector2(random(-1, 1), random(-1, 1))).setLength(this.convergeSpeed/3);

        this.object3d = this.createMesh();
        this.object3d.name = this.name;
        this.activate();
    }

    createMesh() {
        // mesh
        let geometry = new THREE.CircleGeometry(this.radius, 16);
        let material = new THREE.MeshBasicMaterial( {
            color: this.color,
            opacity: 0,
            transparent: true,
        } );
        const mesh = new THREE.Mesh( geometry, material );
        // animation
        let animationGroup = new THREE.Object3D();
        // group
        let group = new THREE.Object3D();
        group.add(mesh);
        group.add(animationGroup);
        return group;
    }

    static get STATES() {
        return {
            DEACTIVE: 0,
            READY: 1, // can attack
            REST: 2, // cannot attack
            DESTROYING: 3,
            DESTROYED: 4,
        };
    }

    get name() { return "enemy_" + this.index; }

    get radius() { return 0.1; }
    get dirSmoothFactor() { return 0.005; }
    get convergeSpeed() { return 0.1; }
    
    get isActive() { return this.state === Enemy.STATES.READY || this.state === Enemy.STATES.REST; }

    get activateInterval() { return 1000; }
    get activateInterval() { return 2000; }
    get attackInterval() { return 1000; }
    get destroyInterval() { return 1500; }

    get attackValue() { return 1; }

    get mesh() { return this.object3d.children[0]; }
    get animationGroup() { return this.object3d.children[1]; }
    get color() { return ENEMY_COLORS[Math.round(this.hp)]; }

    translate(vec) {
        if (!this.isActive) return;
        if (!vec) return;
        this.position.add(vec); 
        this.updateMesh();
    }

    addForce(force) { 
        if (!this.isActive) return;
        this.velocity.add(force); 
    }

    move() {
        // new velocity (lerp towards player)
        const newvelocity = player.position.clone().sub(this.position).normalize().multiplyScalar(this.convergeSpeed);
        this.velocity.lerp(newvelocity, this.dirSmoothFactor);
        // new position (move towards player)
        this.position.add(this.velocity);
    }

    updateMesh() {
        this.object3d.position.set(this.position.x, this.position.y, 0);
    }

    updateMeshColor() {
        if (!this.isActive) return;
        // if (this.color === undefined) return;
        this.mesh.material.color.setHex(this.color);
    }

    update() {
        if (!this.isActive) return;
        this.move();
        this.updateMesh();
    }

    receiveDamage(force, attackValue) {
        if (!this.isActive) return;
        if (attackValue === null) return;
        if (this.hp <= 0) return;

        this.hp -= attackValue;
        if (this.hp > 0) this.addForce(force);
        else this.destroy();

        this.updateMeshColor();
    }

    attack() {
        let results = { attackValue: null };
        if (!this.isActive) return results;
        if (this.state === Enemy.STATES.REST) return results;

        this.state = Enemy.STATES.REST;
        setTimeout(() => { this.state = Enemy.STATES.READY; }, this.attackInterval);
        results.attackValue = this.attackValue;
        return results;
    }

    activate() {
        if (this.state !== Enemy.STATES.DEACTIVE) return;

        setTimeout(() => { this.state = Enemy.STATES.READY; }, this.activateInterval);
        this.activateAnimation();
        this.updateMesh();
    }

    destroy() {
        this.state = Enemy.STATES.DESTROYING;
        this.destroyAnimation();
        setTimeout(() => { this.state = Enemy.STATES.DESTROYED; }, this.destroyInterval);
    }

    activateAnimation() {
        // particles move towards center

        const particleNum = 50;
        const maDist = 2;
        const lerpFactor = 0.03;
        const animateDuration = this.activateInterval;
        const animateInterval = 15;

        // create particles
        let geometry = new THREE.Geometry();
        for (let i = 0; i < particleNum; ++i) {
            const vertex = new THREE.Vector3(random(-maDist, maDist), random(-maDist, maDist), 0);
            geometry.vertices.push(vertex);
        }
        let material = new THREE.PointsMaterial({
            color: this.color, 
            size: 1.5, 
            sizeAttenuation: false,
        });
        const particles = new THREE.Points(geometry, material);

        // function for animation
        const animate = () => { 
            // opacity
            this.mesh.material.opacity += animateInterval / animateDuration;
            // particles position
            for (let i = 0; i < particleNum; ++i) particles.geometry.vertices[i].lerp(new THREE.Vector3(), lerpFactor);
            particles.geometry.verticesNeedUpdate = true;
        };

        // add to scene
        this.animationGroup.add(particles);
        // set animate timer
        let animateTimer = setInterval(() => { animate(); }, animateInterval);
        // set ending timer
        setTimeout(() => {
            this.mesh.material.opacity = 1; // make sure opacity is 1
            clearInterval(animateTimer); // stop animation
            this.animationGroup.remove(particles); // remove particles
        }, animateDuration);
    }

    destroyAnimation() {
        // particles move away from center

        const particleNum = 50;
        const velocityMagnitude = 0.05;
        const animateDuration = this.destroyInterval;
        const animateInterval = 15;
        const lerpFactor = 0.99;

        // create particles & set velocities
        let geometry = new THREE.Geometry();
        geometry.velocities = new Array(); // custom property for convenience
        for (let i = 0; i < particleNum; ++i) {
            const position = new THREE.Vector3(random(-this.radius, this.radius), random(-this.radius, this.radius), 0);
            geometry.vertices.push(vec2ToVec3(position));
            geometry.velocities.push(position.clone().sub(new THREE.Vector3()).add(new THREE.Vector3(Number.EPSILON,0,0)).setLength(velocityMagnitude));
        }
        let material = new THREE.PointsMaterial({
            color: this.color, 
            size: 1.5, 
            sizeAttenuation: false,
            opacity: 1,
            transparent: true,
        });
        const particles = new THREE.Points(geometry, material);

        const animate = () => { 
            // update positions
            for (let i = 0; i < particleNum; ++i) {
                particles.geometry.vertices[i].add(particles.geometry.velocities[i]);
                particles.geometry.velocities[i].multiplyScalar(lerpFactor);
            }
            particles.geometry.verticesNeedUpdate = true;
            // update opacity
            particles.material.opacity -= animateInterval / animateDuration;
        };

        this.animationGroup.add(particles); // add particles to scene
        this.mesh.material.opacity = 0; // set enemy mesh invisible
        let animateTimer = setInterval(() => { animate(); }, animateInterval); // set animate timer
        setTimeout(() => { clearInterval(animateTimer); }, animateDuration); //set ending timer
    }
}

class Line {
    constructor(i, pointPos, playerPos) {
        this.playerPosition = playerPos; // reference

        this.index = i;
        this.state = Line.STATES.DRAWING;
        this.pointRange = { start: 0, end: 0 }; // point range for render
        this.lineLength = 0;

        this.points = new Array();
        this.normals = new Array();
        this.segmentLengths = new Array();
        this.addPoint(pointPos);

        this.idleTimer = null;
        this.fadeTimer = null;

        this.enemyColliders = new Array();

        this.object3d = this.createMesh();
        this.object3d.name = this.name;
    }

    createMesh() {
        let geometry = new THREE.BufferGeometry();
        let vertices = new Float32Array(this.bufferFaceNum * 2 * 3); // 4 vertices for every 2 faces, 3 values for each vertice

        let faces = new Array(this.bufferFaceNum);
        for (let i = 0; i < this.bufferFaceNum / 2; ++i) { // for each quad (2 faces)
            // 6 indices for each face
            // 4 values used for each face
            faces[i*6+0] = i*4+0; // left bottom
            faces[i*6+1] = i*4+1; // right bottom
            faces[i*6+2] = i*4+2; // right top
            faces[i*6+3] = i*4+2;
            faces[i*6+4] = i*4+3; // left top
            faces[i*6+5] = i*4+0;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(faces);
        geometry.setDrawRange(0, 0);
        let material = new THREE.MeshBasicMaterial( { color: LINE_COLOR } );
        return new THREE.Mesh( geometry, material );
    }

    static get STATES() {
        return {
            DRAWING: 0,
            ENDING: 1,
            ENDED: 2,
        };
    }

    get name() { return "line_" + this.index; }

    get maxPointNum() { return 50; }
    get endPointNum() { return 1; } // extra point for finishing the line
    get bufferPointNum() { return this.maxPointNum + this.endPointNum; }
    get bufferFaceNum() { return (this.bufferPointNum - 1) * 2; }

    get minSegmentLength() { return 0.45; }
    get endSegmentLength() { return 0.7; }
    get maxLineLength() { return 15; }

    get maxIdleInterval() { return 200; }
    get initalFadeInterval() { return 200; }
    get fadeInterval() { return 150 / this.lineLength; }

    get margin() { return 0.2; }
    get visualMargin() { return 0.1; }
    get forceMagnitude() { return 0.15; }
    get attackValue() { return 1; }

    attack(segmentInd, targetPos) { // return vector2
        const normalForce = this.normals[segmentInd].clone().add(this.normals[segmentInd+1]).multiplyScalar(0.5);
        const forwardForce = this.points[segmentInd+1].clone().sub(this.points[segmentInd]);
        const force = normalForce.clone().lerp(forwardForce, 0.5).setLength(this.forceMagnitude);
        // const force = this.normals[segmentInd].clone().add(this.normals[segmentInd+1]).multiplyScalar(0.5).setLength(this.forceMagnitude).lerp(
        //     targetPos.clone().sub(this.points[segmentInd]).setLength(this.forceMagnitude), 0.8);
        const attackValue = this.attackValue; //
        return { force, attackValue };
    }

    getPoints() {
        return this.points.slice(this.pointRange.start, this.pointRange.end+1);
    }

    addPoint(pointPos) {
        // update points & normals
        this.points.push(pointPos.clone());
        this.normals.push(pointPos.clone().sub(this.playerPosition).normalize());

        // update mesh
        this.addMesh();

        // update other info
        ++this.pointRange.end; // update point range
        const pointNum = this.points.length;
        if (pointNum > 1) {
            this.segmentLengths.push(this.points[this.points.length - 2].distanceTo(this.points[this.points.length - 1]));
            this.lineLength += this.segmentLengths[this.segmentLengths.length - 1];
        }
    }

    removePoint() {
        this.removeMesh();
        ++this.pointRange.start;
    }

    addMesh() {
        if (this.points.length <= 1) return;

        const curr = this.points.length - 1; // current point
        const prev = curr - 1; // previous point
        const quad = this.points.length - 2; // current quad

        const segment = this.points[curr].clone().sub(this.points[prev]);
        const minMargin = vec2rotate(segment, Math.PI/2).setLength(0.01);
        const left1 = this.normals[prev].clone().setLength( Math.sign(vec2cross(segment, this.normals[prev]).z) * this.visualMargin ).add(minMargin);
        const left2 = this.normals[curr].clone().negate().setLength(this.visualMargin).add(minMargin);

        // compute vertices
        const v0 = this.points[prev].clone().add(left1); // left bottom
        const v1 = this.points[prev].clone().sub(left1); // right bottom
        const v2 = this.points[curr].clone().add(left2); // right top
        const v3 = v2.clone(); // left top

        // assign vertices
        let vertices = this.object3d.geometry.attributes.position.array;
        vertices[quad*4*3+0] = v0.x; vertices[quad*4*3+1] = v0.y; // left bottom
        vertices[quad*4*3+3] = v1.x; vertices[quad*4*3+4] = v1.y; // right bottom
        vertices[quad*4*3+6] = v2.x; vertices[quad*4*3+7] = v2.y; // right top
        vertices[quad*4*3+9] = v3.x; vertices[quad*4*3+10] = v3.y; // left top
        if (quad > 0) {
            const v2prev = v1;
            const v3prev = v0;
            vertices[quad*4*3-6] = v2prev.x; vertices[quad*4*3-5] = v2prev.y; // prev right top
            vertices[quad*4*3-3] = v3prev.x; vertices[quad*4*3-2] = v3prev.y;  // prev left top
        }

        const prevDrawRange = this.object3d.geometry.drawRange;
        this.object3d.geometry.setDrawRange(prevDrawRange.start, prevDrawRange.count + 4*3);
        this.object3d.geometry.attributes.position.needsUpdate = true;
    }

    removeMesh() {
        const prevDrawRange = this.object3d.geometry.drawRange;
        this.object3d.geometry.setDrawRange(prevDrawRange.start + 4*3, prevDrawRange.count - 4*3);
    }

    drawLine(pointPos) {
        if (this.state != Line.STATES.DRAWING) return;

        // check if point num / line length exceed
        if (this.pointRange.end + 2 >= this.maxPointNum || this.lineLength >= this.maxLineLength) {
            this.endLine();
            return;
        }

        // check if far enough from previous point
        const lastPos = this.points[this.points.length - 1];
        if (pointPos.distanceTo(lastPos) < this.minSegmentLength) return;

        this.addPoint(pointPos);

        // set timer
        if (this.points.length == 2) this.fadeTimer = setTimeout(() => { this.fadeLine(); }, this.initalFadeInterval);
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => { this.endLine(); }, this.maxIdleInterval);
    }

    fadeLine() {
        if (this.state === Line.STATES.ENDED) return;

        this.removePoint();

        // set fading timer
        if (this.state === Line.STATES.DRAWING || this.pointRange.start < this.pointRange.end)
            this.fadeTimer = setTimeout(() => { this.fadeLine(); }, this.fadeInterval);
        
        // change state
        if (this.state === Line.STATES.DRAWING && this.pointRange.start === this.pointRange.end) this.endLine();
        else if (this.state === Line.STATES.ENDING && this.pointRange.start === this.pointRange.end) this.stopLine();
    }

    endLine() {
        if (this.state != Line.STATES.DRAWING) return;
        if (this.points.length <= 1) {
            this.stopLine();
            return;
        }

        this.state = Line.STATES.ENDING;

        // add extra points at the end
        let prevPoint = this.points[this.points.length - 1];
        const d = prevPoint.clone().sub(this.points[this.points.length - 2]).setLength(this.endSegmentLength);
        for (let i = 0; i < this.endPointNum; ++i) {
            const newPoint = prevPoint.clone().add(d);
            this.addPoint(newPoint);
            prevPoint.copy(newPoint);
        }
    }

    stopLine() {
        this.state = Line.STATES.ENDED;
        clearTimeout(this.idleTimer);
        clearTimeout(this.fadeTimer);

        // set to invisible
        this.object3d.geometry.setDrawRange(0, 0);
    }

    updateEnemyColliders(newColliders) {
        let results = {
            enteredColliders: new Array(),
            enteredColliderInds: new Array(), // indices corresponds to newColliders array
            // leftColliders: new Array(),
        };

        let prevColliderNames = new Array(this.enemyColliders.length);
        for (let i = 0; i < this.enemyColliders.length; ++i) {
            prevColliderNames[i] = this.enemyColliders[i].name;
        }

        // if (newColliders.length > 0) console.log(prevColliderNames);

        for (let i = 0; i < newColliders.length; ++i) {
            if (!prevColliderNames.includes(newColliders[i].name)) {
                results.enteredColliders.push(newColliders[i]);
                results.enteredColliderInds.push(i);
            }
        }

        this.enemyColliders = newColliders;
        // results.enteredColliders = newColliders;
        // results.enteredColliderInds = [...Array(newColliders.length).keys()];
        return results;
    }
}