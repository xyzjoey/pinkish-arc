class Mouse {
    constructor() {
        this.position = new THREE.Vector2(0, 0);
        this.left = Mouse.BUTTONSTATES.UP;
        // this.right = Mouse.BUTTONSTATES.UP; // unused
    }

    static get BUTTONSTATES() {
        return {
            UP: 0,
            DOWN: 1,
        }
    }

    get isLeftDown() { return this.left === Mouse.BUTTONSTATES.DOWN; }
    // get isRightDown() { return this.right === Mouse.BUTTONSTATES.DOWN; }

    setLeftUp() { this.left = Mouse.BUTTONSTATES.UP; }
    setLeftDown() { this.left = Mouse.BUTTONSTATES.DOWN; }
    // setRightUp() { this.right = Mouse.BUTTONSTATES.UP; }
    // setRightDown() { this.right = Mouse.BUTTONSTATES.DOWN; }
}