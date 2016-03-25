var panSensitivity = 0.001;
var levelLength = 100;
var levelWidth = 50;
var levelHeight = 15;
var playerHeight = 3;
// LIGHTING UNIFORMS
var lightColor = new THREE.Color(1, 1, 1);
var ambientColor = new THREE.Color(0.4, 0.4, 0.4);
var lightPosition = new THREE.Vector3(70, 100, 70);

var litColor = new THREE.Color(0.7, 0.4, 0.6);
var unLitColor = new THREE.Color(0.15, 0.2, 0.6);
var outlineColor = new THREE.Color(0.04, 0.1, 0.15);

var kAmbient = 0.4;
var kDiffuse = 0.8;
var kSpecular = 0.8;
var shininess = 10.0;

//MATERIALS
var basicMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide
});

var toonMaterial = new THREE.ShaderMaterial({
    uniforms: {
        litColor: {
            type: 'c',
            value: litColor
        },
        unLitColor: {
            type: 'c',
            value: unLitColor
        },
        outlineColor: {
            type: 'c',
            value: outlineColor
        },
        lightColor: {
            type: 'c',
            value: lightColor
        },
        ambientColor: {
            type: 'c',
            value: ambientColor
        },
        lightPosition: {
            type: 'v3',
            value: lightPosition
        },
        kAmbient: {
            type: 'f',
            value: kAmbient
        },
        kDiffuse: {
            type: 'f',
            value: kDiffuse
        },
        kSpecular: {
            type: 'f',
            value: kSpecular
        },
        shininess: {
            type: 'f',
            value: shininess
        },
    },
});

var blinnPhongMaterial = new THREE.ShaderMaterial({
    uniforms: {
        lightColor: {
            type: 'c',
            value: lightColor
        },
        ambientColor: {
            type: 'c',
            value: ambientColor
        },
        lightPosition: {
            type: 'v3',
            value: lightPosition
        },
        kAmbient: {
            type: 'f',
            value: kAmbient
        },
        kDiffuse: {
            type: 'f',
            value: kDiffuse
        },
        kSpecular: {
            type: 'f',
            value: kSpecular
        },
        shininess: {
            type: 'f',
            value: shininess
        }
    },
});
// LOAD SHADERS
var shaderFiles = [
    'glsl/blinnPhong.vs.glsl',
    'glsl/blinnPhong.fs.glsl',
    'glsl/toon.vs.glsl',
    'glsl/toon.fs.glsl'
];

new THREE.SourceLoader().load(shaderFiles, function(shaders) {
    blinnPhongMaterial.vertexShader = shaders['glsl/blinnPhong.vs.glsl'];
    blinnPhongMaterial.fragmentShader = shaders['glsl/blinnPhong.fs.glsl'];
    blinnPhongMaterial.needsUpdate = true;
    toonMaterial.vertexShader = shaders['glsl/toon.vs.glsl'];
    toonMaterial.fragmentShader = shaders['glsl/toon.fs.glsl'];
    toonMaterial.needsUpdate = true;
})

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
    eye: [0, 20, levelLength / 2 - 10],
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
    camera.velocity = new THREE.Vector3(0, 0, 0);
    camera.lookAtPoint = origin;
}

function attachPlayerToCamera(camera) {
    var geometry = new THREE.BoxGeometry(1, playerHeight, 2);
    var mesh = new THREE.Mesh(geometry, basicMaterial);
    camera.add(mesh);
}

function addGravity(obj) {
    if (obj.velocity == null) {
        obj.velocity = new THREE.Vector3(0, 0, 0);
    }

    obj.gravity = -0.005;
    obj.fall = function() {
        this.velocity.y += this.gravity;
        var fallTranslation = new THREE.Matrix4().makeTranslation(0, this.velocity.y, 0);
        var postFallPos = new THREE.Matrix4().multiplyMatrices(fallTranslation, this.matrix);
        this.setMatrix(postFallPos);
    }
}

function addHorizontalAccel(obj) {
    if (obj.velocity == null) {
        obj.velocity = new THREE.Vector3(0, 0, 0);
    }

    obj.horizontalAccelX = 0.002;
    obj.horizontalAccelZ = 0.002;
    obj.slideX = function(isForward) {
        if (isForward) {
            this.horizontalAccelX = Math.abs(this.horizontalAccelX)
        } else {
            this.horizontalAccelX = -Math.abs(this.horizontalAccelX);
        }
        this.velocity.x += this.horizontalAccelX;
        var slideTranslation = new THREE.Matrix4().makeTranslation(this.velocity.x, 0, 0);
        var postSlideTranslation = new THREE.Matrix4().multiplyMatrices(slideTranslation, this.matrix);
        this.setMatrix(postSlideTranslation);
    }
    obj.slideZ = function(isForward) {
        if (isForward) {
            this.horizontalAccelZ = Math.abs(this.horizontalAccelZ)
        } else {
            this.horizontalAccelZ = -Math.abs(this.horizontalAccelZ);
        }
        this.velocity.z += this.horizontalAccelZ;
        var slideTranslation = new THREE.Matrix4().makeTranslation(0, 0, this.velocity.z);
        var postSlideTranslation = new THREE.Matrix4().multiplyMatrices(slideTranslation, this.matrix);
        this.setMatrix(postSlideTranslation);
    }
}

var firstPersonCamera = new THREE.PerspectiveCamera(playerView.fov, 1, 2, 1000); // view angle, aspect ratio, near, far
firstPersonCamera.rotation.order = "YXZ"; //need for pitch/yaw to maintain horizon
resetCamera(firstPersonCamera, playerView);
attachPlayerToCamera(firstPersonCamera);
addGravity(firstPersonCamera);
addHorizontalAccel(firstPersonCamera);
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
    grid.position.y += 0.1
    scene.add(grid);
}

var groundPlane;

function addRoom() {
    function makeRoomSurface(width, height, transformMatrix) {
        var planeGeometry = new THREE.PlaneBufferGeometry(width, height, 1);
        var plane = new THREE.Mesh(planeGeometry, basicMaterial);
        plane.setMatrix(transformMatrix);
        scene.add(plane);
        return plane;
    }

    var plane = makeRoomSurface(levelWidth, levelLength, new THREE.Matrix4().makeRotationX(Math.PI / 2));
    groundPlane = plane;

    var leftTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, -levelWidth / 2);
    var leftRightRotate = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    var leftWall = makeRoomSurface(levelLength, levelHeight, new THREE.Matrix4().multiplyMatrices(leftRightRotate, leftTransform));

    var rightTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, levelWidth / 2);
    var rightWall = makeRoomSurface(levelLength, levelHeight, new THREE.Matrix4().multiplyMatrices(leftRightRotate, rightTransform));

    var backTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, -levelLength / 2);
    var backWall = makeRoomSurface(levelWidth, levelHeight, backTransform);

    var frontTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, levelLength / 2);
    var frontWall = makeRoomSurface(levelWidth, levelHeight, frontTransform);
}

addGrid();
addAxes();
addRoom();

//INITIATE OBSTACLES
var obstacles = [];

function addToruses() {
    for (var i = 0; i < 10; i++) {
        var geometry = new THREE.TorusKnotGeometry(1, 0.5, 32, 6, 4, 3, 1);
        var mesh = new THREE.Mesh(geometry, toonMaterial);
        mesh.position.z += i - 5;
        obstacles.push(mesh);
        scene.add(mesh);
    }
}

addToruses();

//Sort obstacles by y position for collision detection
obstacles.sort(function(a, b) {
    return a.position.z - b.position.z;
});

obstacles.forEach(function(ob) {
    console.log(ob.position.z)
});

var cursorOffsetX = -1;
var cursorOffsetY = -1;
var keyboard = new THREEx.KeyboardState();
keyboard.domElement.addEventListener('keydown', onKeyDown);
keyboard.domElement.addEventListener('keyup', onKeyUp);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);

var keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

var isFalling = true;

function onKeyDown(event) {
    function match(key) {
        return keyboard.eventMatches(event, key) ? key : false;
    }

    var keyUsed;
    if (keyUsed = match("w") || match("a") || match("s") || match("d")) {
        keys[keyUsed] = true;
        if (keys.w == true && keys.s == true) {
            if (keyUsed == "s") {

                keys.w = false;
            } else {
                keys.s = false;
            }
            firstPersonCamera.velocity.z = 0;

        }

        if (keys.a == true && keys.d == true) {
            if (keyUsed == "a") {
                keys.d = false;
            } else {
                keys.a = false;
            }
            firstPersonCamera.velocity.x = 0;
        }
    } else if (match(" ")) {
        if (!isFalling) {
            firstPersonCamera.velocity.y = 0.1;
            var translateUpSlightly = new THREE.Matrix4().makeTranslation(0, 1, 0);
            //need to do this because diff in update() function will not prevent us from sinking into the floor slightly
            var jumpStartMatrix = new THREE.Matrix4().multiplyMatrices(firstPersonCamera.matrix, translateUpSlightly);
            firstPersonCamera.setMatrix(jumpStartMatrix);
            isFalling = true;
        }
    }
}

function onKeyUp(event) {
    function match(key) {
        return keyboard.eventMatches(event, key) ? key : false;
    }

    var keyUsed;
    if (keyUsed = match("w") || match("a") || match("s") || match("d")) {
        keys[keyUsed] = false;

        if (!keys.w && !keys.s) {
            firstPersonCamera.velocity.z = 0;
        }
        if (!keys.a && !keys.d) {
            firstPersonCamera.velocity.x = 0;

        }
    }
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

//TODO: Set posNewX and posNewY to center screen coordinates when you start game at center
//      Follow up todo:  game "START" screen at centered at the center of the screen. Must be dynamic
//      These values are a local standin for the actual thing. Replace with your screen res to make it actually work

var posNewX = 800;
var posNewY = 508;
var oldDx = 0;
var isOutBounds = false;
var mouseMoving = false;

function onMouseMove(event) {

    mouseMoving = true;
    var diffX = event.clientX - posNewX;
    var diffY = event.clientY - posNewY;

    var dx = panSensitivity * diffX;
    var dy = panSensitivity * diffY;


    posNewY = event.clientY;
    posNewX = event.clientX;

    firstPersonCamera.rotation.y += dx;
    firstPersonCamera.rotation.x += dy;

    if (event.clientX >= (screen.width - 100) || event.clientX == 0) {
        isOutBounds = true;
        mouseMoving = true;
        return;
    }

    oldDx = dx;
    mouseMoving = false;
}

function update() {
    requestAnimationFrame(update);
    renderer.render(scene, firstPersonCamera);

    var diff = firstPersonCamera.position.y - (groundPlane.position.y + playerHeight / 2);
    if (diff > 0) {
        firstPersonCamera.fall();
        isFalling = true;
    } else {
        isFalling = false;
    }

    if (keys.w) {
        firstPersonCamera.slideZ(false);
    }

    if (keys.s) {
        firstPersonCamera.slideZ(true);
    }

    if (keys.a) {
        firstPersonCamera.slideX(false);
    }

    if (keys.d) {
        firstPersonCamera.slideX(true);
    }


    if (isOutBounds && mouseMoving) {
        console.log("HI FUCKO");
        firstPersonCamera.rotation.y += oldDx;
    }

}

update();