var panSensitivity = 0.001;

var basicMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide
});

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
}

// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);

// SETUP CAMERA
var playerView = {
    left: 0,
    bottom: 0,
    width: 0.499,
    height: 1.0,
    background: new THREE.Color().setRGB(0.1, 0.1, 0.1),
    eye: [40, 20, 40],
    up: [0, 1, 0],
    fov: 45,
    updateCamera: function(camera, scene, mouseX, mouseY) {}
};

function resetCamera(camera, view) {
    camera.position.x = view.eye[0];
    camera.position.y = view.eye[1];
    camera.position.z = view.eye[2];
    camera.up.x = view.up[0];
    camera.up.y = view.up[1];
    camera.up.z = view.up[2];
    var origin = new THREE.Vector3(0, 0, 0);
    camera.lookAt(origin);
    camera.lookAtPoint = origin;
}

function attachPlayerToCamera(camera) {
    var geometry = new THREE.BoxGeometry(1, 1, 2);
    var mesh = new THREE.Mesh(geometry, basicMaterial);
    camera.add(mesh);
}

var firstPersonCamera = new THREE.PerspectiveCamera(playerView.fov, 1, 2, 1000); // view angle, aspect ratio, near, far
firstPersonCamera.rotation.order = "YXZ"; //need for pitch/yaw to maintain horizon
resetCamera(firstPersonCamera, playerView);
attachPlayerToCamera(firstPersonCamera);
scene.add(firstPersonCamera);

//uncomment to debug using orbit controls
//var controls = new THREE.OrbitControls(camera);

// ADAPT TO WINDOW RESIZE
function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    firstPersonCamera.aspect = window.innerWidth / window.innerHeight;
    firstPersonCamera.updateProjectionMatrix();
}

// EVENT LISTENER RESIZE
window.addEventListener('resize', resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function() {
    window.scrollTo(0, 0);
}

// Build a visual axis system
function buildAxis(src, dst, colorHex, dashed) {
    var geom = new THREE.Geometry(),
        mat;

    if (dashed) {
        mat = new THREE.LineDashedMaterial({
            linewidth: 3,
            color: colorHex,
            dashSize: 3,
            gapSize: 3
        });
    } else {
        mat = new THREE.LineBasicMaterial({
            linewidth: 3,
            color: colorHex
        });
    }

    geom.vertices.push(src.clone());
    geom.vertices.push(dst.clone());
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line(geom, mat, THREE.LinePieces);

    return axis;
}

function addAxes() {
    var length = 100.0;
    // Build axis visuliaztion for debugging.
    x_axis = buildAxis(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(length, 0, 0),
        0xFF0000,
        false
    )
    y_axis = buildAxis(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, length, 0),
        0x00ff00,
        false
    )
    z_axis = buildAxis(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, length),
        0x0000FF,
        false
    )

    // ADDING THE AXIS DEBUG VISUALIZATIONS
    scene.add(x_axis);
    scene.add(y_axis);
    scene.add(z_axis);
}

function addGrid() {
    // SETUP HELPER GRID
    // Note: Press Z to show/hide
    var gridGeometry = new THREE.Geometry();
    var i;
    for (i = -50; i < 51; i += 2) {
        gridGeometry.vertices.push(new THREE.Vector3(i, 0, -50));
        gridGeometry.vertices.push(new THREE.Vector3(i, 0, 50));
        gridGeometry.vertices.push(new THREE.Vector3(-50, 0, i));
        gridGeometry.vertices.push(new THREE.Vector3(50, 0, i));
    }

    var gridMaterial = new THREE.LineBasicMaterial({
        color: 0xBBBBBB
    });
    var grid = new THREE.Line(gridGeometry, gridMaterial, THREE.LinePieces);
    scene.add(grid);
}

function addGroundPlane() {
    var planeGeometry = new THREE.PlaneGeometry(100, 100, 1);
    var plane = new THREE.Mesh(planeGeometry, basicMaterial);
    var rotateX90 = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    plane.setMatrix(rotateX90);
    plane.position.y = -0.1;
    scene.add(plane);
}

addGrid();
addAxes();
addGroundPlane();

var cursorOffsetX = -1;
var cursorOffsetY = -1;
var keyboard = new THREEx.KeyboardState();
keyboard.domElement.addEventListener('keydown', onKeyDown);
keyboard.domElement.addEventListener('keyup', onKeyUp);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);

function onKeyDown(event) {
    console.log(event.code);
    // TO-DO: BIND KEYS TO YOUR CONTROLS      
    if (keyboard.eventMatches(event, "w")) { // Reveal/Hide helper grid
        console.log("w!");
    } else if (keyboard.eventMatches(event, "a")) { // Reveal/Hide helper grid
        console.log("a!");
    } else if (keyboard.eventMatches(event, "s")) { // Reveal/Hide helper grid
        console.log("s!");
    } else if (keyboard.eventMatches(event, "d")) { // Reveal/Hide helper grid
        console.log("d!");
    }
}

function onKeyUp(event) {
    console.log(event.code);
}

var isMouseDown = false;

function onMouseDown(event) {
    console.log("mouse down");
    isMouseDown = true;
}

function onMouseUp(event) {
    console.log("mouse up");
    isMouseDown = false;
}

function onMouseMove(event) {        
        var dx = panSensitivity * event.movementX;
        var dy = panSensitivity * event.movementY;

        if(firstPersonCamera.rotation.y+dx <1 && firstPersonCamera.rotation.y+dx >-1){
            firstPersonCamera.rotation.y += dx;
        }
        if(firstPersonCamera.rotation.x+dy <1 && firstPersonCamera.rotation.x+dy >-1){
           firstPersonCamera.rotation.x += dy;
       }
}

function update() {
    requestAnimationFrame(update);
    renderer.render(scene, firstPersonCamera);
}

update();