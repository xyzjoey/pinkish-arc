// scene settings
const CAMERA_ZOOM_INITIAL = window.screen.width * window.screen.height / 30000; // window.innerWidth * window.innerHeight * 0.1
const CAMERA_NEAR = 1;
const CAMERA_FAR = 1000;
const BACKGROUND_COLOR = 0xffffff;
const BACKGROUND_ALPHA = 0.95;
//
const ENEMY_PLAYER_DISTANCE = 5;
const ENEMY_INVOKE_INTERVAL = 10000;
const ENEMY_INVOKE_NUM = 50;
const INITIAL_ENEMY_NUM = 150;
const MIN_ENEMY_NUM = 200;
const MAX_ENEMY_NUM = 1000;
// 
const HPBAR_WIDTH = 10;
const HPBAR_HEIGHT = 0.1;
const HPBAR_LEFT = 0.05;
const HPBAR_TOP = 0.03;
//
const GAMESTATES = {
    PLAY: 0,
    // PAUSE: 1,
    GAMEOVER:2,
};

var gameState = null;
var mouse = null;

var scene = null;
var camera = null;
var sceneUI = null;
var cameraUI = null;
var renderer = null;

var player = null;
var enemies = null; // array
var lines = null; // array

var ui_hpBar = null;
var ui_gameoverScreen = null;

var enemyDestroyedNum = null;
var hitNum = null;

var enemyInvokeIntervalTimer = null;

// var mouse = null;
// var isMouseDown = { left: false, right: false };

// var arrowDebuger = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0x000000);

function getSceneWidth() { return window.innerWidth/CAMERA_ZOOM_INITIAL; }
function getSceneHeight() { return window.innerHeight/CAMERA_ZOOM_INITIAL; }
function getSceneLeft(percent=0) { return getSceneWidth() * (percent - 0.5); }
function getSceneTop(percent=0) { return getSceneHeight() * (0.5 - percent); }

function updateCursor(eventClientX, eventClientY) {
    mouse.position.setX((eventClientX / window.innerWidth - 0.5) * getSceneWidth());
    mouse.position.setY((-eventClientY / window.innerHeight + 0.5) * getSceneHeight());
}

function randomEnemyPos() {
    let position = new THREE.Vector2();
    do {
        position.set((Math.random()-0.5) * getSceneWidth(), (Math.random()-0.5) * getSceneHeight());
    } while (position.distanceTo(player.position) < ENEMY_PLAYER_DISTANCE)
    return position;
}

function invokeEnemies() {
    let numToInvoke = ENEMY_INVOKE_NUM;
    if (enemies.length < MIN_ENEMY_NUM) numToInvoke = MIN_ENEMY_NUM - enemies.length;

    for (let i = 0; i < numToInvoke; ++i) {
        if (enemies.length >= MAX_ENEMY_NUM) return;
        createEnemy();
    }
}

function createEnemy() {
    if (enemies.length >= MAX_ENEMY_NUM) return;

    const index = enemies.length && enemies[enemies.length-1].index + 1 || 0;
    const enemy = new Enemy(index, randomEnemyPos());
    enemies.push(enemy);
    scene.add(enemy.object3d);
}

function removeEnemies() {
    // remove destoryed enemies
    let removedNum = 0;
    for (let i = enemies.length - 1; i >= 0; --i) {
        if (enemies[i].state === Enemy.STATES.DESTROYED) {
            scene.remove(scene.getObjectByName(enemies[i].name));
            enemies.splice(i, 1);
            ++removedNum;
        }
    }
    return removedNum;
}

function createLine() {
    const index = lines.length && lines[lines.length - 1].index + 1 || 0;
    lines.push(new Line(index, mouse.position, player.position));
    scene.add(lines[lines.length - 1].object3d);
}

function drawLine() {
    if (lines[lines.length - 1].state === Line.STATES.DRAWING)
        lines[lines.length - 1].drawLine(mouse.position);
}

function endLine() {
    lines[lines.length - 1].endLine();
    removeLines();
}

function removeLines() {
    // remove finished lines
    for (let i = lines.length - 1; i >= 0; --i) {
        if (lines[i].state === Line.STATES.ENDED) {
            scene.remove(scene.getObjectByName(lines[i].name));
            lines.splice(i, 1);
        }
    }
}

function UIupdate() {
    ui_hpBar.setSize(HPBAR_WIDTH * player.hpPercent);
}

function UIresetPosition() {
    ui_hpBar.setPosition(new THREE.Vector2(getSceneLeft(HPBAR_LEFT), getSceneTop(HPBAR_TOP)));
    if (ui_gameoverScreen !== null) ui_gameoverScreen.setBackgroundSize(getSceneWidth(), getSceneHeight());
}

function initializeScene() {
    // scene
    scene = new THREE.Scene();
    sceneUI = new THREE.Scene();
    // camera
    const sceneWidth = getSceneWidth();
    const sceneHeight = getSceneHeight();
    camera = new THREE.OrthographicCamera(-sceneWidth/2, sceneWidth/2, sceneHeight/2, -sceneHeight/2, CAMERA_NEAR, CAMERA_FAR);
    camera.position.z = 5;
    cameraUI = new THREE.OrthographicCamera(-sceneWidth/2, sceneWidth/2, sceneHeight/2, -sceneHeight/2, CAMERA_NEAR, CAMERA_FAR);
    cameraUI.position.z = 5;
    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( BACKGROUND_COLOR, BACKGROUND_ALPHA);
    document.body.appendChild( renderer.domElement );
}

function initializeEventListeners() {
    mouse = new Mouse();

    // block context menu
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    }, false);

    // mouse down
    document.addEventListener('mousedown', (event) => {
        event.preventDefault();
        updateCursor(event.clientX, event.clientY);

        // left button
        if (event.button === 0 && !mouse.isLeftDown) {
            createLine();
            mouse.setLeftDown();
        }
        // right button
        else if (event.button === 2) {
            player.guard();
        }
    }, false);

    // mouse move
    document.addEventListener('mousemove', (event) => {
        event.preventDefault();
        updateCursor(event.clientX, event.clientY);
        if (mouse.isLeftDown) drawLine();
    }, false);

    // mouse up
    document.addEventListener('mouseup', (event) => {
        event.preventDefault();

        // left button
        if (event.button === 0) {
            endLine();
            mouse.setLeftUp();
        } 
        // right button
        else if (event.button === 2) {
        }
    }, false);

    // window resize
    window.addEventListener('resize', () => {
        const sceneWidth = getSceneWidth();
        const sceneHeight = getSceneHeight();
        camera.left = -sceneWidth/2;
        camera.right = sceneWidth/2;
        camera.bottom = -sceneHeight/2;
        camera.top = sceneHeight/2;
        camera.updateProjectionMatrix();
        cameraUI.left = -sceneWidth/2;
        cameraUI.right = sceneWidth/2;
        cameraUI.bottom = -sceneHeight/2;
        cameraUI.top = sceneHeight/2;
        cameraUI.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        UIresetPosition();
    }, false);
}

function initializeGameobjects(){
    // create player
    player = new Player();
    scene.add(player.object3d);

    // create enemies
    enemies = new Array();
    for (let i = 0; i < INITIAL_ENEMY_NUM; ++i) createEnemy();
    enemyInvokeIntervalTimer = setInterval(() => { invokeEnemies(); }, ENEMY_INVOKE_INTERVAL);

    lines = new Array();
}

function initializeUIobjects() {
    ui_hpBar = new UIHpBar(new THREE.Vector2(getSceneLeft(HPBAR_LEFT), getSceneTop(HPBAR_TOP)), HPBAR_WIDTH, HPBAR_HEIGHT);
    sceneUI.add(ui_hpBar.object3d);
}

function collisionDetection()
{
    // player & enemy collision
    const playerV0 = player.vertex0World;
    const playerV1 = player.vertex1World;
    const playerV2 = player.vertex2World;
    for (let i = 0; i < enemies.length; ++i) {
        // if (!enemies[i].isActive) continue;

        const {isCollide, circleTranslation} = collideTriangleCircle(playerV0, playerV1, playerV2, enemies[i].position, enemies[i].radius);
        if (!isCollide) continue;
        
        enemies[i].translate(circleTranslation);

        if (!enemies[i].isActive) continue; // remove?
        player.receiveDamage(enemies[i].attack().attackValue);
    }

    // player guard area & enemy collision
    if (player.guardState === Player.GUARDSTATES.SUCCESS) {
        for (let i = 0; i < enemies.length; ++i) {
            if (!enemies[i].isActive) continue;

            const {isCollide} = collideCircles(player.position, player.guardRadius, enemies[i].position, enemies[i].radius, allowOverlap=true);
            if (!isCollide) continue;
            
            const force = enemies[i].position.clone().sub(player.position).setLength(player.guardForceMagnitude);
            enemies[i].receiveDamage(force, 0);
        }
    }

    // let newCollidedEnemies = new Array();

    // line & enemy collision
    for (let i = 0; i < lines.length; ++i) {
        let colliders = new Array();
        let collidedSegmentInds = new Array();

        // detect collision
        for (let j = 0; j < enemies.length; ++j) {
            if (!enemies[j].isActive) continue;
            // todo: boudning sphere
            const {isCollide, lineSegmentIndex} = collideLineCircle(lines[i].getPoints(), enemies[j].position, lines[i].margin + enemies[j].radius);
            if (isCollide) {
                colliders.push(enemies[j]);
                collidedSegmentInds.push(lineSegmentIndex);
            }
        }

        // do things for collision enter
        const {enteredColliders, enteredColliderInds} = lines[i].updateEnemyColliders(colliders);
        for (let j = 0; j < enteredColliders.length; ++j) {
            const enemy = enteredColliders[j];
            const lineSegmentIndex = collidedSegmentInds[enteredColliderInds[j]];
            const {force, attackValue} = lines[i].attack(lineSegmentIndex, enemy.position);
            enemy.receiveDamage(force, attackValue);
        }
        hitNum += enteredColliders.length;
    }

    // enemy & enemy collision
    for (let i = 0; i < enemies.length - 1; ++i) {
        if (!enemies[i].isActive) continue;
        for (let j = i + 1; j < enemies.length; ++j) {
            const {isCollide, translation1, translation2} = collideCircles(enemies[i].position, enemies[i].radius, enemies[j].position, enemies[j].radius);
            if (!isCollide) continue;
            
            enemies[i].translate(translation1);
            enemies[j].translate(translation2);
        }   
    }
}

function updateGame() {
    if (gameState === GAMESTATES.GAMEOVER) return;

    // collision
    collisionDetection();

    // update player
    player.update(mouse.position);
    // update enemies
    enemies.forEach((enemy) => { enemy.update(); });
    // update UI
    UIupdate();

    // remove destroyed enemies
    enemyDestroyedNum += removeEnemies();
    // console.log(enemyDestroyedNum);

    // check gameover
    if (isGameover()) gameover();
}

function update() {
    // if (gameState === GAMESTATES.GAMEOVER) return;

    requestAnimationFrame(update);

    updateGame();

    // render
    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.render(sceneUI, cameraUI);
};

function isGameover() {
    return player.hp <= 0;
}

function gamestart() {

    initializeScene();
    initializeGameobjects();
    initializeUIobjects();
    initializeEventListeners();

    gameState = GAMESTATES.PLAY;
    enemyDestroyedNum = 0;
    hitNum = 0;

    update();
}

function gameover() {
    gameState = GAMESTATES.GAMEOVER;
    clearInterval(enemyInvokeIntervalTimer);

    // count remaining enemies
    for (let i = enemies.length - 1; i >= 0; --i) {
        if (enemies[i].state === Enemy.STATES.DESTROYING) {
            ++enemyDestroyedNum;
        }
    }

    // set screen
    ui_gameoverScreen = new GameoverScreen(getSceneWidth(), getSceneHeight());
    ui_gameoverScreen.addText("YOU DIED", 1, 0xEE214D, 1);
    ui_gameoverScreen.addText("Kill: " + enemyDestroyedNum, 0.5, 0xffffff, -1);
    ui_gameoverScreen.addText("Hit: " + hitNum, 0.5, 0xffffff, -2);
    sceneUI.add(ui_gameoverScreen.object3d);
}

// function gameclear() {

// }

function main() {
    gamestart();
}

main();

//TODO
// zoom camera scroll, clip
// font file
// start screen