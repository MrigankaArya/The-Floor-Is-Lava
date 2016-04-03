var panSensitivity = 0.001;
var levelLength = 100;
var levelWidth = 50;
var levelHeight = 15;
var playerHeight = 3;
var lavaSpeed = 0.0002;


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
    eye: [0, 5, levelLength / 2 - 10],
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
    var geometry = new THREE.BoxGeometry(1, playerHeight, 3);
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
        // console.log(this.velocity.y);
        // this.velocity.y = Math.max(this.velocity.y, -0.7); //terminal velocity
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



// var camera = new THREE.PerspectiveCamera(30,1,0.1,1000); // view angle, aspect ratio, near, far
// camera.position.set(45,20,40);
// camera.lookAt(scene.position);
// scene.add(camera);

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

function makeRoomSurface(width, height, transformMatrix) {
       var planeGeometry = new THREE.PlaneGeometry(width, height, 1);
       var plane = new THREE.Mesh(planeGeometry, toonMaterial);
       plane.setMatrix(transformMatrix);
       scene.add(plane);
       return plane;
}


function addRoom() {
    var plane = makeRoomSurface(levelWidth, levelLength, new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    groundPlane = plane;

    var leftTransform = new THREE.Matrix4().makeTranslation(-levelWidth / 2, levelHeight / 2, 0);
    var leftRotate = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    var leftWall = makeRoomSurface(levelLength, levelHeight, new THREE.Matrix4().multiplyMatrices(leftTransform, leftRotate));

    var rightTransform = new THREE.Matrix4().makeTranslation(levelWidth / 2, levelHeight / 2, 0);
    var rightRotate = new THREE.Matrix4().makeRotationY(-Math.PI / 2);
    var rightWall = makeRoomSurface(levelLength, levelHeight, new THREE.Matrix4().multiplyMatrices(rightTransform, rightRotate));

    var backTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, -levelLength / 2);
    var backWall = makeRoomSurface(levelWidth, levelHeight, backTransform);

    var frontTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, levelLength / 2);
    var frontRotate = new THREE.Matrix4().makeRotationY(Math.PI);
    var frontWall = makeRoomSurface(levelWidth, levelHeight, new THREE.Matrix4().multiplyMatrices(frontTransform, frontRotate));
}

addGrid();
addAxes();
addRoom();

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
    printMatrix("440", rot);
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

//INITIATE OBSTACLES
var obstacles = [];

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
    var seat = makeCube(seatWidth, seatHeight, seatWidth, material);

    function makeLeg(x, z) {
        var leg = makeCube(legsize, floorToSeatHeight / seatHeight, legsize / seatWidth, material);
        translateBefore(leg, x*(seatWidth / 2 - legsize) / seatWidth, (-floorToSeatHeight / 2) / seatHeight, z*(seatWidth / 2 - legsize) / seatWidth);
        seat.add(leg);
    }

    makeLeg(1, 1);
    makeLeg(1, -1);
    makeLeg(-1, 1);
    makeLeg(-1, -1);

    var back = makeCube(seatWidth/seatWidth, (height-floorToSeatHeight)/seatHeight, (legsize)/seatWidth, material);
    scene.add(back);
    translateBefore(back, 0, ((height - floorToSeatHeight) / 2) / seatHeight, -(seatWidth / 2 - legsize) / seatWidth);
    seat.add(back);

    chair.add(seat);
    return chair;
}

function makeChairPyramid() {
    function make2ChairUnit(verticalDisplacement, hDisplace1, hDisplace2, makeSecond) {
        var chair = makeChair(2, 0.1, 1, 1, 0.25, blinnPhongMaterial2);
        translateAfter(chair, hDisplace2, 1 + verticalDisplacement, hDisplace1 + verticalDisplacement/20);

        scene.add(chair);
        if (makeSecond) {
            var chair2 = makeChair(2, 0.1, 1, 1, 0.25, blinnPhongMaterial);
            translateAfter(chair2, hDisplace2, 2.125 + verticalDisplacement, hDisplace1);
            var rot = new THREE.Matrix4().makeRotationX(Math.PI);
            chair2.setMatrix(new THREE.Matrix4().multiplyMatrices(chair2.matrix, rot))
            scene.add(chair2);
        }
    }

    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            var k;
            console.log("lop");
            var kMax = Math.min(2 - Math.abs(j), 2 - Math.abs(i));
            for (k = 0; k < kMax; k++) {
                make2ChairUnit(k * 2.2, j * 1.1, i * 1.1, true);
            }
            make2ChairUnit(k * 2.2, j * 1.1, i * 1.1, false);
        }
    }


}
makeChairPyramid();
//addToruses();

//Detects collision between the player and the objects. Replace toruses with boxes because this is an awkward hitbox
function detectCollision(){
    var geometry = new THREE.BoxGeometry(1, playerHeight, 3);
    var playerPos = firstPersonCamera.position.clone();
    for(var vertex = 0; vertex < 8; vertex++){
        var localV = geometry.vertices[vertex].clone();
        var globalV = localV.applyMatrix4(firstPersonCamera.matrix);
        var directionVector = globalV.sub(firstPersonCamera.position)
        var ray = new THREE.Raycaster(playerPos, directionVector.clone().normalize());

        var collisions = ray.intersectObjects(obstacles);
        if(collisions.length > 0 && collisions[0].distance < directionVector.length()){
            console.log("HIT");
        }

   }
}


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

    var diff = firstPersonCamera.position.y - (groundPlane.position.y + playerHeight / 2 + 5);
    //the +1 is to prevent the near plane of the camera from intersecting with the ground plane

    detectCollision();
    
    // Update health
    if (diff <= 0 && isInLava == false) {
        isInLava = true;
        console.log(healthCount);
        if (healthCount == 0) {
            console.log ("YOU LOST");
        } else {
            healthCount--;
            hearts[healthCount].remove();
        }
        startTimeInLava = new Date();
    }

    if (diff > 0) {
        isInLava = false;
    }

    if (isInLava == true) {
        var currentTimeInLava = new Date();
        var secondsPassedInLava = (currentTimeInLava - startTimeInLava);
        var secondsPassedInLava = secondsPassedInLava/1000;
        if (secondsPassedInLava > secondsBeforeHealthDecrease) {
            if (healthCount == 0) {
                console.log("YOU LOST");
            } else {
                startTimeInLava = currentTimeInLava;
                healthCount--;
                hearts[healthCount].remove();
            }
        }
    }

    if (diff > 0) {
        firstPersonCamera.fall();
        isFalling = true;
    } else {
        isFalling = false;
    }


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


    if (isOutBounds && mouseMoving) {
        firstPersonCamera.rotation.y += oldDx;
    }

}

update();