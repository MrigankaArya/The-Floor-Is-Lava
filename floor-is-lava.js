function runGame() {
$("#play").remove();
$("#instructions").remove();
var sidePanDamper = 300;
var panSensitivity = 0.001;
var levelLength = 100;
var levelWidth = 30;
var levelHeight = 15;
var playerHeight = 3;
var lavaSpeed = 0.0002;

//INITIATE OBSTACLES
var obstacles = [];

//Any objects that the player can interact with go here eg: lava wheel, pillows etc.
var interactables = [];

var gameCanvas = $("#canvas:first-child");
var posNewX = gameCanvas.attr("width")/2;
var posNewY = gameCanvas.attr("height")/2;

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
}

// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);

var gameCanvas = $("canvas:first-child");

var minimap = document.getElementById('minimap');
var minimapRenderer = new THREE.WebGLRenderer({antialias:true});
minimapRenderer.setClearColor(0xFFFFFF); // white background colour
minimap.appendChild(minimapRenderer.domElement);

var minimapCanvas = $("minimap:first-child");


// SETUP CAMERA
var playerView = {
    left: 0,
    bottom: 0,
    width: 0.499,
    height: 1.0,
    background: new THREE.Color().setRGB(0.1, 0.1, 0.1),
    eye: [0, 2, levelLength / 2 - 30],
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
    var geometry = new THREE.BoxGeometry(0.4, playerHeight, 0.4);
    var mesh = new THREE.Mesh(geometry, basicMaterial);
    camera.add(mesh);
}

function addGravity(obj) {
    if (obj.velocity == null) {
        obj.velocity = new THREE.Vector3(0, 0, 0);
    }

    obj.gravity = -0.005;
    obj.fall = function(bool) {
        if (bool) {
            this.velocity.y += this.gravity;
        } else {
            this.velocity.y = 0;
        }
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
    }
    obj.slideZ = function(isForward) {
        if (isForward) {
            this.horizontalAccelZ = Math.abs(this.horizontalAccelZ)
        } else {
            this.horizontalAccelZ = -Math.abs(this.horizontalAccelZ);
        }
        this.velocity.z += this.horizontalAccelZ;
    }
}

var firstPersonCamera = new THREE.PerspectiveCamera(playerView.fov, 1, 0.5, 1000); // view angle, aspect ratio, near, far
firstPersonCamera.rotation.order = "YXZ"; //need for pitch/yaw to maintain horizon
resetCamera(firstPersonCamera, playerView);
attachPlayerToCamera(firstPersonCamera);
addGravity(firstPersonCamera);
addHorizontalAccel(firstPersonCamera);
scene.add(firstPersonCamera);

var minimapCamera = new THREE.OrthographicCamera(levelWidth / -2, levelWidth / 2, levelWidth / 2, levelWidth / -2, 1, 1000);
minimapCamera.position.set(0, 20, 0);
minimapCamera.up = new THREE.Vector3(0, 0, -1);
minimapCamera.lookAt(scene.position);
minimapCamera.position.z = firstPersonCamera.position.z;

scene.add(minimapCamera);

// ADAPT TO WINDOW RESIZE
function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    firstPersonCamera.aspect = window.innerWidth / window.innerHeight;
    firstPersonCamera.updateProjectionMatrix();
    posNewX = gameCanvas.attr("width")/2;
    posNewY = gameCanvas.attr("height")/2;
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

var ground;

function makeRoomSurface(width, height, length, transformMatrix) {
    var boxGeometry = new THREE.BoxGeometry(width, height, length);
    var box = new THREE.Mesh(boxGeometry, toonMaterial);
    box.setMatrix(transformMatrix);
    obstacles.push(box);
    scene.add(box);
    return box;
}


function addRoom() {
    var box = makeRoomSurface(levelWidth, 1, levelLength, new THREE.Matrix4());
    ground = box;

    var leftTransform = new THREE.Matrix4().makeTranslation(-levelWidth / 2, levelHeight / 2, 0);
    var leftWall = makeRoomSurface(1, levelHeight, levelLength, leftTransform);

    var rightTransform = new THREE.Matrix4().makeTranslation(levelWidth / 2, levelHeight / 2, 0);
    var rightWall = makeRoomSurface(1, levelHeight, levelLength, rightTransform);

    var backTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, -levelLength / 2);
    var backWall = makeRoomSurface(levelWidth, levelHeight, 1, backTransform);

    var frontTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, levelLength / 2);
    var frontWall = makeRoomSurface(levelWidth, levelHeight, 1, frontTransform);
}
addGrid();
addAxes();
addRoom();

var meshMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity:0});

function makeWheel(){
    // console.log("ey wat");
    var ringGeometry = new THREE.TorusGeometry(0.25, 0.1, 16, 100);
    var ringMesh = new THREE.Mesh(ringGeometry, toonMaterial2);
    var transformMatrix = new THREE.Matrix4().makeTranslation(0, 1.5, -49);
    ringMesh.setMatrix(transformMatrix);
    var ringCollider = new THREE.BoxGeometry(0.9,0.9,0.4);
    var ringColliderMesh = new THREE.Mesh(ringCollider, meshMaterial);
    ringColliderMesh.type = "wheel";
    ringColliderMesh.setMatrix(transformMatrix);
    obstacles.push(ringColliderMesh);
    interactables.push(ringColliderMesh);
    // console.log(interactables);
    scene.add(ringColliderMesh);
    scene.add(ringMesh);
}

function makeInteractable(){
    var objGeometry = new THREE.BoxGeometry(0.3,0.3,0.3);
    var objMesh = new THREE.Mesh(objGeometry, toonMaterial2);
    var transformMatrix = new THREE.Matrix4().makeTranslation(0,1.3, -30);

    objMesh.setMatrix(transformMatrix);

    objMesh.type = "object";
    obstacles.push(objMesh);
    interactables.push(objMesh);
    scene.add(objMesh);
}

makeInteractable();
makeWheel();
//Adds lava to the floor and deforms it as necessary.
function addLava() {
    var lavaGeometry =  new THREE.PlaneGeometry(levelWidth, levelWidth, 129, 129);  //100 segments each 
    var material = new THREE.MeshBasicMaterial( {color: 0xfff000, side: THREE.DoubleSide} );
;
    var lavaPlane = new THREE.Mesh(lavaGeometry, material);
    var translate = new THREE.Matrix4().makeTranslation(0, 1, 0);
    var translateAndRotate = new THREE.Matrix4().multiplyMatrices(translate, new THREE.Matrix4().makeRotationX(Math.PI/2));
    lavaPlane.setMatrix(translateAndRotate);
    
    lavaPlane.geometry.verticesNeedUpdate = true;
    lavaPlane.dynamic = true;

    var pointer = 0;
    var terrain = generateTerrain();
    // generateTerrain();
    for(var i=0; i<65; i++){
        for (var j=0; j<65; j++){
            // apply the terrain shit
            console.log( lavaPlane.geometry.vertices[pointer]);
            lavaPlane.geometry.vertices[pointer].z += terrain[i][j];
            pointer++;
        }
    }

    scene.add(lavaPlane);

}


//where the real magic happens
function generateTerrain(){
    var lavaTerrain= new Array();
    var segments = 129; //# of segments
    for(var i=0; i<segments; i++){
        lavaTerrain[i] = new Array();
        for(var j=0; j<segments; j++)
            lavaTerrain[i][j] = 0;
    }
    //Set initial values for corners of the terrain
    lavaTerrain[0][0] = 6;
    lavaTerrain[0][segments-1] = 6;
    lavaTerrain[segments-1][0] = 6;
    lavaTerrain[segments-1][segments-1] = 6;

    console.log(lavaTerrain);

    var varianceDiamond = 8; //keep tiny for smaller variations
    var varianceSq = 4; //Keep small for smaller variations to make it look more organic

    for(var currSize = segments-1; currSize >1 ; currSize = Math.floor(currSize/2)){
        //Diamond step (Hopefully)
        for(var x = 0; x < segments ; x+=currSize)
        {
            var midPoint = Math.floor(currSize/2);
            var avg = (lavaTerrain[x][currSize]+lavaTerrain[x][x]+lavaTerrain[currSize][currSize]+lavaTerrain[currSize][x])/4;
            console.log(avg);
            avg += 2*Math.random()*varianceDiamond - varianceDiamond;
            lavaTerrain[midPoint][midPoint] = avg;
        }

        //Square Step (Hopefully)
        for(var y = 0; y < currSize; y+=currSize){
            var midPoint = Math.floor(currSize/2);

            //I'm sorry for this code it's so ugly jfc
            var avgLeft = (lavaTerrain[y][y] + lavaTerrain[currSize][y])/2 +2*Math.random()*varianceDiamond - varianceDiamond;
            var avgRight = (lavaTerrain[y][currSize] + lavaTerrain[currSize][currSize])/2 + 2*Math.random()*varianceDiamond - varianceDiamond;
            var avgTop = (lavaTerrain[y][y] + lavaTerrain[y][currSize])/2 + 2*Math.random()*varianceDiamond - varianceDiamond;
            var avgBott = (lavaTerrain[currSize][y] + lavaTerrain[currSize][currSize])/2 + 2*Math.random()*varianceDiamond - varianceDiamond;
           
            //Assign the values to the right place
            lavaTerrain[y][midPoint] = avgTop;
            lavaTerrain[currSize][midPoint] = avgBott;
            lavaTerrain[midPoint][y] = avgLeft;
            lavaTerrain[midPoint][currSize] = avgRight;

            varianceDiamond/=2;    //scale the variance by half every time
        }
       
        
    }

    console.log(lavaTerrain);
    return lavaTerrain;
}

var lava;

function addLavaSub() {
    var planeGeometry = new THREE.PlaneGeometry(levelWidth, levelLength, 1);
    var plane = new THREE.Mesh(planeGeometry, blinnPhongMaterial);
    
    var rot = new THREE.Matrix4().makeRotationX(3*Math.PI / 2);
    var translateUp = new THREE.Matrix4().makeTranslation(0, 1, 0);
    var final = new THREE.Matrix4().multiplyMatrices(translateUp, rot);
    plane.setMatrix(final);
    scene.add(plane);
    lava = plane;
}

addLavaSub();

// addLava();

function printMatrix(matName, mat) {
    console.log(matName + ":");
    if (mat == null) {
        console.log("null")
    } else {
        for (var row = 0; row < 4; row++) {
            var rowStart = row * 4;
            var st = [];
            for (var col = 0; col < 4; col++) {
                st.push(mat.elements[rowStart + col]);
            }

            var str = (row == 0 ? "[" : "") + st.join(", ") + (row == 3 ? "]" : "") + "\n";
            console.log(str);
        }
        console.log(mat.elements[0] + " ");
    }
}

function addToruses() {
    for (var i = 0; i < 10; i++) {
        var geometry = new THREE.TorusKnotGeometry(1, 0.5, 100, 40, 4, 3, 1);
        var mesh = new THREE.Mesh(geometry, toonMaterial);
        mesh.position.z += i - 5;
        obstacles.push(mesh);
        scene.add(mesh);
    }
}

function makeCube(xscale, yscale, zscale, material) {
  var unitCube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), material);
  unitCube.setMatrix(new THREE.Matrix4().makeScale(xscale, yscale, zscale));
  return unitCube;
}

function testCollisionCube() {
    var cube = makeCube(10, 10, 10, toonMaterial2);
    translateBefore(cube, 10, 0, 0);
    obstacles.push(cube);
    scene.add(cube);
}

function translateBefore(obj, x, y, z) {
    var translate = new THREE.Matrix4().makeTranslation(x, y, z);
    obj.setMatrix(new THREE.Matrix4().multiplyMatrices(translate, obj.matrix));
}

function translateAfter(obj, x, y, z) {
    var translate = new THREE.Matrix4().makeTranslation(x, y, z);
    obj.setMatrix(new THREE.Matrix4().multiplyMatrices(obj.matrix, translate));
}

function makeChair(height, legsize, floorToSeatHeight, seatWidth, seatHeight, material) {
    var chair = new THREE.Object3D();
    var seat = new THREE.BoxGeometry(seatWidth, seatHeight, seatWidth);

    function makeLeg(x, z) {
        var leg = makeCube(legsize, floorToSeatHeight, legsize, material);
        translateBefore(leg, x*(seatWidth / 2 - legsize), -floorToSeatHeight / 2, z*(seatWidth / 2 - legsize));
        return leg;
    }

    // ATTACH LEGS AND A BACK TO THE SEAT
    var legs = [makeLeg(1, 1), makeLeg(1, -1), makeLeg(-1, 1), makeLeg(-1, -1)];
    legs.forEach(function(leg) {
        seat.merge(leg.geometry, leg.matrix);
    })

    var back = makeCube(seatWidth, height-floorToSeatHeight, legsize, material);
    translateBefore(back, 0, (height - floorToSeatHeight) / 2, -(seatWidth / 2 - legsize));
    seat.merge(back.geometry, back.matrix);

    // COLLIDER FOR THE BACK
    var backCollider = makeCube(seatWidth, height-floorToSeatHeight, legsize, material);
    translateBefore(backCollider, 0, (height - floorToSeatHeight) / 2, -(seatWidth / 2 - legsize));
    obstacles.push(backCollider);
    
    //CREATE THE CHAIR MESH
    var chairMesh = new THREE.Mesh(seat, material);
    chairMesh.add(backCollider);
    scene.add(chairMesh);
    
    // var meshMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity:0});
    chair.add(chairMesh);

    return chair;
}

function makeChairPyramid() {
    var height = 2;
    var legsize = 0.1;
    var floorToSeatHeight = 1;
    var seatWidth = 1;
    var seatHeight = 0.25
    var material = blinnPhongMaterial;
    var material2 = blinnPhongMaterial2;
    function make2ChairUnit(verticalDisplacement, hDisplace1, hDisplace2, makeSecond) {
        var chair = makeChair(height, legsize, floorToSeatHeight, seatWidth, seatHeight, material2);
        translateAfter(chair, hDisplace2, 1 + verticalDisplacement, hDisplace1 + verticalDisplacement/20);

        scene.add(chair);
        if (makeSecond) {
            var chair2 = makeChair(height, legsize, floorToSeatHeight, seatWidth, seatHeight, material);
            translateAfter(chair2, hDisplace2, 2.125 + verticalDisplacement, hDisplace1);
            var rot = new THREE.Matrix4().makeRotationX(Math.PI);
            chair2.setMatrix(new THREE.Matrix4().multiplyMatrices(chair2.matrix, rot))
            scene.add(chair2);
        }
    }

    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            var k;
            var kMax = Math.min(2 - Math.abs(j), 2 - Math.abs(i));
            for (k = 0; k < kMax; k++) {
                make2ChairUnit(k * 2.2, j * 1.1, i * 1.1, true);
            }
            make2ChairUnit(k * 2.2, j * 1.1, i * 1.1, false);
        }
    }

    // CREATE COLLISION MESHES
    var meshMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity:0});
    var collisionGeometry = new THREE.BoxGeometry((seatWidth + 0.1) * 5, (floorToSeatHeight + seatHeight)* 2, (seatWidth + 0.1) * 5);
    var collisionMesh = new THREE.Mesh(collisionGeometry, meshMaterial);
    obstacles.push(collisionMesh);
    scene.add(collisionMesh);
    
    var collisionGeometry2 = new THREE.BoxGeometry((seatWidth + 0.1) * 3, (height + seatHeight + floorToSeatHeight + 0.1)* 2, (seatWidth + 0.1) * 3);
    var collisionMesh2 = new THREE.Mesh(collisionGeometry2, meshMaterial);
    translateAfter(collisionMesh2, 0, 0, 0.1);
    obstacles.push(collisionMesh2);
    scene.add(collisionMesh2);

    var collisionGeometry3 = new THREE.BoxGeometry(seatWidth + 0.1, (2* height + 2*seatHeight + floorToSeatHeight + 0.1)* 2, seatWidth + 0.1);
    var collisionMesh3 = new THREE.Mesh(collisionGeometry3, meshMaterial);
    translateAfter(collisionMesh3, 0, 0, 0.2);
    obstacles.push(collisionMesh3);
    scene.add(collisionMesh3);
    // END COLLIISION MESHES

}
makeChairPyramid();
testCollisionCube();
// addToruses();
firstPersonCamera.constraints = [];
for (var i = 0; i < 8; i++) {
    firstPersonCamera.constraints[i] = null;
}

//Detects collision between the player and the objects. Replace toruses with boxes because this is an awkward hitbox
function detectCollision(){
    var geometry = new THREE.BoxGeometry(1.5, playerHeight, 3);
    var playerPos = firstPersonCamera.position.clone();
    for(var vertex = 0; vertex < 8; vertex++){
        var localV = geometry.vertices[vertex].clone();
        var globalV = localV.applyMatrix4(firstPersonCamera.matrix);
        var directionVector = globalV.sub(firstPersonCamera.position)
        var ray = new THREE.Raycaster(playerPos, directionVector.clone().normalize());

        var collisions = ray.intersectObjects(obstacles);
        if(collisions.length > 0 && collisions[0].distance < 1){
            firstPersonCamera.constraints[vertex] = collisions[0].face.normal;
       } else {
            firstPersonCamera.constraints[vertex] = null
        }
   }
}

var mouse = new THREE.Vector2(), INTERSECTED;
var lavaReverse = false;
var objectDrag = false;
var mouseDrag = false;
//picking ray
function pickRay(){
    var pickRayCaster = new THREE.Raycaster();
    pickRayCaster.setFromCamera(mouse, firstPersonCamera);

    //Change this number in order to change the distance at which you can interact with the object
    pickRayCaster.far = 3;
    var intersects  = pickRayCaster.intersectObjects(interactables);
    //Grab the 1st intersected object's type
    if(intersects.length >  0)
        takeAction(intersects[0].object);
}

function takeAction(obj){
    var type = obj.type;
    switch(type){
        case "wheel":
            //Reverse Lava flow
            if(lavaReverse){
                translateBefore(lava, 0, -lavaSpeed*10, 0);
            }
            break;
        case "ladder":
            //climb the ladder to the wheel
            break;
        case "object":
            //Pick up the object
          break;
                
        default:
            //do nothing
            break;
    }
}

//For later.
//Sort obstacles by y position for collision detection
obstacles.sort(function(a, b) {
    return a.position.z - b.position.z;
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
    } else if (match("t")) {
        // renderer.render(scene, camera);
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
    isMouseDown = true;
    lavaReverse = true;
    objectDrag = true;
    mouseDrag = true;
}

//Uncomment later
function onMouseUp(event) {
    isMouseDown = false;
    mouseDrag = false;
}

//TODO: Set posNewX and posNewY to center screen coordinates when you start game at center
//      Follow up todo:  game "START" screen at centered at the center of the screen. Must be dynamic
//      These values are a local standin for the actual thing. Replace with your screen res to make it actually work

var posNewX = gameCanvas.attr("width")/2;
var posNewY = gameCanvas.attr("height")/2;

var sideDx = 0;
var isOutBounds = false;
var mouseMoving = false;

function onMouseMove(event) {
    mouse.x = (event.clientX/window.innerWidth)*2-1;
    mouse.y = -(event.clientY/window.innerHeight)*2+1;
    mouseMoving = true;
    var diffY = event.clientY - posNewY;

    var dy = panSensitivity * diffY;


    posNewY = event.clientY;
    posNewX = event.clientX;

    var gameCanvasWidth = gameCanvas.attr("width");
    firstPersonCamera.rotation.x += dy;

    var boundary = 1/100;
    var inverseBoundary = 1 - boundary;
    var outRight = event.clientX > gameCanvasWidth * inverseBoundary;

    var outLeft = event.clientX < gameCanvasWidth * boundary;
    if (outRight || outLeft) {
        isOutBounds = true;
        mouseMoving = true;
        if (outRight) {
            sideDx = (gameCanvasWidth * inverseBoundary) - event.clientX;
        }

        if (outLeft) {
            sideDx = (gameCanvasWidth * boundary) - event.clientX;
        }

        sideDx /= sidePanDamper;
        return;
    }

    mouseMoving = false;
}

function move(obj) {
    var velocity = obj.velocity;
    obj.constraints.forEach(function(constraint) {

        if (constraint != null && constraint.dot(velocity) < 0) {
            // console.log(constraint);
            // console.log(velocity);
            var negaVelocity = velocity.clone().negate();
            // console.log("NEGATED")
            // console.log(negaVelocity)
            
            // console.log("DOTCONSTRAINT")
            var cosTheta = negaVelocity.dot(constraint);
            // console.log(cosTheta);

            var newConstraint = constraint.clone().multiplyScalar(cosTheta);
            // console.log("PROJECTION")
            // console.log(constraint);
            

            obj.velocity.add(newConstraint);
            // console.log(obj.velocity);
        }
    })
    
    translateBefore(obj, obj.velocity.x, obj.velocity.y, obj.velocity.z);
}

//For FPS
var lastTime = new Date();
var numFrames = 0;
var thresholdFrames = 25;

//For Health
var hearts = $(".heart");
var healthCount = hearts.length;
var isInLava = false;
var startTimeInLava;
var secondsBeforeHealthDecrease = 2;
function update() {
    translateBefore(lava, 0, lavaSpeed, 0);
    //Compute FPS
    if (numFrames < thresholdFrames) {
        numFrames++;
    } else {
        numFrames = 0;
        var currentTime = new Date();
        var timePassed = currentTime - lastTime;
        var fps = thresholdFrames/(timePassed/1000);
        document.getElementById("fps-count").innerHTML = Math.floor(fps);
        lastTime = currentTime;
    }    

    requestAnimationFrame(update);
    renderer.render(scene, firstPersonCamera);
    minimapRenderer.render(scene, minimapCamera);
    minimapCamera.position.z = firstPersonCamera.position.z;

    var diff = firstPersonCamera.position.y - lava.position.y;
    //the +1 is to prevent the near plane of the camera from intersecting with the ground plane
    detectCollision();
    pickRay();
    
    var diffThreshold = 0.5;
    // Update health
    if (diff <= diffThreshold) {
        if (isInLava == false) {
            isInLava = true;
            if (healthCount == 0) {
                //TODO: GAME OVER
            } else {
                healthCount--;
                hearts[healthCount].remove();
            }
            startTimeInLava = new Date();
        }
    } else {
        isInLava = false;
    }

    if (isInLava == true) {
        var currentTimeInLava = new Date();
        var secondsPassedInLava = (currentTimeInLava - startTimeInLava);
        var secondsPassedInLava = secondsPassedInLava/1000;
        if (secondsPassedInLava > secondsBeforeHealthDecrease) {
            if (healthCount == 0) {
                // console.log("YOU LOST");
            } else {
                startTimeInLava = currentTimeInLava;
                healthCount--;
                hearts[healthCount].remove();
            }
        }
        isFalling = false;
        translateBefore(firstPersonCamera, 0, lavaSpeed, 0);
    } else {
        //check if we're on a flat surface
        isFalling = firstPersonCamera.constraints.filter(function(constraint) {
            return constraint != null && (constraint.y > 0.5);
        }).length == 0;
    }

    firstPersonCamera.fall(isFalling);
    
    //Player controls
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

    move(firstPersonCamera);

    if (isOutBounds && mouseMoving) {
        firstPersonCamera.rotation.y += sideDx;
    }

}

update();
}