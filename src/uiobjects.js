// const GAME_UI_Z = 0.5;
// const MENU_UI_Z = 
const HP_COLOR = 0xff0000
const FONTPATH = "../fonts/helvetiker_bold.typeface.json"; // https://github.com/mrdoob/three.js/tree/master/examples/fonts
// const FONTPATH = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json";
const HORIZONTAL_ALIGN = {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2,
};
const VERTICAL_ALIGN = {
    TOP: 0,
    CENTER: 1,
    BOTTOM: 2,
};

// load font
var font = null;
new THREE.FontLoader().load(FONTPATH, (ft) => { font = ft; });

class UIBar {
    constructor(pos, width, height, color, horizontalAlign=null, verticalAlign=null) {
        this.position = pos;
        this.width = width;
        this.height = height;
        this.color = color;

        this.object3d = this.createMesh(horizontalAlign, verticalAlign);
        this.updateMeshSize();
        this.updateMeshPosition();
    }

    get mesh() { return this.object3d; }

    createMesh(horizontalAlign, verticalAlign) {
        // return (1,1) size plane mesh
        // geometry
        let geometry = new THREE.PlaneGeometry(1, 1);
        // alignment
        let d = new THREE.Vector3();
        if (horizontalAlign === HORIZONTAL_ALIGN.LEFT) d.x += 0.5;
        else if (horizontalAlign === HORIZONTAL_ALIGN.RIGHT) d.x -= 0.5;
        if (verticalAlign === VERTICAL_ALIGN.TOP) d.y -= 0.5;
        else if (verticalAlign === VERTICAL_ALIGN.BOTTOM) d.y += 0.5;
        for (let i = 0; i < geometry.vertices.length; ++i) geometry.vertices[i].add(d);
        geometry.verticesNeedUpdate = true;
        // material
        let material = new THREE.MeshBasicMaterial({
            color: this.color,
        });
        // mesh
        let bar = new THREE.Mesh(geometry, material);
        return bar;
    }

    setSize(width=null, height=null) {
        if (width !== null) this.width = width;
        if (height !== null) this.height = height;
        this.updateMeshSize();
    }

    setPosition(pos) {
        this.position.copy(pos);
        this.updateMeshPosition();
    }

    updateMeshSize() {
        this.object3d.scale.set(this.width, this.height, 1);
    }

    updateMeshPosition() {
        this.object3d.position.set(this.position.x, this.position.y, 0);
    }
}

class UIHpBar extends UIBar {
    constructor(pos, width, height) {
        super(pos, width, height, HP_COLOR, HORIZONTAL_ALIGN.LEFT, VERTICAL_ALIGN.TOP);
        this.object3d.position.setZ(0.5);
    }
}

class UIPlane {
    constructor(width, height, color, alpha) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.alpha = alpha;

        this.object3d = this.createMesh();
        this.updateMeshSize();
    }

    createMesh() {
        let geometry = new THREE.PlaneGeometry(1, 1);
        let material = new THREE.MeshBasicMaterial({
            color: this.color,
            opacity: this.alpha,
            transparent: true,
        });
        let plane = new THREE.Mesh(geometry, material);
        return plane;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.updateMeshSize();
    }

    updateMeshSize() {
        this.object3d.scale.set(this.width, this.height, 1);
    }
}

class UICanvas {
    constructor(width, height, backgroundColor, backgroundAlpha) {
        this.background = new UIPlane(width, height, backgroundColor, backgroundAlpha);
        this.object3d = this.createMesh();
    }

    get textMeshes() { return this.object3d.children[0]; }

    createMesh() {
        // texts
        let texts = new THREE.Object3D();
        //  background
        this.background.object3d.position.setZ(0.6);
        // group
        let group = new THREE.Object3D();
        group.add(texts);
        group.add(this.background.object3d);
        
        return group;
    }

    addText(text, fontsize, color, y) {
        this.addTextMesh(text, fontsize, color, new THREE.Vector2(0, y));
    }

    addTextMesh(text, fontsize, color, pos) {
        let geometry = new THREE.TextGeometry( text, {
            font: font,
            size: fontsize,
            height: 0.1,
            curveSegments: 3,
        });
        geometry.center();
        let material = new THREE.MeshBasicMaterial({
            color: color,
        });
        let textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.set(pos.x, pos.y, 1);
        this.textMeshes.add(textMesh);
    }

    setBackgroundSize(width, height) {
        this.background.setSize(width, height);
    }

    // addObject(object3d) {
    //     this.object3d.add(object3d);
    // }

    // getObject(name) {
    //     return this.object3d.getObjectByName(name);
    // }
}