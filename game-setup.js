var debug = false;

var GameStateEnum = {
    playing: 0,
    won: 1,
    lost: 2
}

var gameState = GameStateEnum.playing;

var groundHeight = 1;
var sidePanDamper = 300;
var panSensitivity = 0.001;
var levelLength = 100;
var levelWidth = 30;
var levelHeight = 15;
var playerHeight = 0.5;
var lavaSpeed = 0.0002;
var secondsBeforeHealthDecrease = 0500;

var ground;
var lava;

var matSpec = {
    transparent: true,
    opacity: 0
};
if (debug) {
    matSpec.opacity = 0.5;
}
var transparentMaterial = new THREE.MeshBasicMaterial(matSpec);

//INITIATE OBSTACLES
var obstacles = [];

//Any objects that the player can interact with go here eg: lava wheel, pillows etc.
var interactables = [];

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
}

// Requires a matrix name to print
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
    }
}

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor(0xFFFFFF); // white background colour

var minimapRenderer = new THREE.WebGLRenderer({antialias:true});
minimapRenderer.setClearColor(0xFFFFFF); // white background colour

// SETUP CAMERA
var playerView = {
    left: 0,
    bottom: 0,
    width: 0.499,
    height: 1.0,
    background: new THREE.Color().setRGB(0.1, 0.1, 0.1),
    eye: [0, 0, 0],
    up: [0, 1, 0],
    fov: 45,
    updateCamera: function(camera, scene, mouseX, mouseY) {}
};

if (debug) {
    playerView.eye = [0, 10, 10];
}

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

var firstPersonCamera = new THREE.PerspectiveCamera(playerView.fov, 1, 0.2, 1000); // view angle, aspect ratio, near, far
firstPersonCamera.rotation.order = "YXZ"; //need for pitch/yaw to maintain horizon
resetCamera(firstPersonCamera, playerView);
var geometry = new THREE.BoxGeometry(0.2, playerHeight, 0.2);
var player = new THREE.Mesh(geometry, basicMaterial);

player.add(firstPersonCamera);

addGravity(player);
addHorizontalAccel(player);
player.setMatrix(new THREE.Matrix4().makeTranslation(0, 2, levelLength / 2 - 40));

scene.add(player);

var minimapCamera = new THREE.OrthographicCamera(levelWidth / -2, levelWidth / 2, levelWidth / 2, levelWidth / -2, 1, 1000);
minimapCamera.position.set(0, 20, 0);
minimapCamera.up = new THREE.Vector3(0, 0, -1);
minimapCamera.lookAt(scene.position);
minimapCamera.position.z = player.position.z;

scene.add(minimapCamera);


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

function makeRoomSurface(width, height, length, transformMatrix) {
    var boxGeometry = new THREE.BoxGeometry(width, height, length);
    var box = new THREE.Mesh(boxGeometry, toonMaterial);
    box.setMatrix(transformMatrix);
    obstacles.push(box);
    return box;
}

function makeRoom() {
    var box = makeRoomSurface(levelWidth + 1, groundHeight, levelLength + 1, new THREE.Matrix4());
    ground = box;

    var leftTransform = new THREE.Matrix4().makeTranslation(-levelWidth / 2, levelHeight / 2, 0);
    var leftWall = makeRoomSurface(1, levelHeight, levelLength, leftTransform);
    ground.add(leftWall);

    var rightTransform = new THREE.Matrix4().makeTranslation(levelWidth / 2, levelHeight / 2, 0);
    var rightWall = makeRoomSurface(1, levelHeight, levelLength, rightTransform);
    ground.add(rightWall);

    var backTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, -levelLength / 2);
    var backWall = makeRoomSurface(levelWidth, levelHeight, 1, backTransform);
    ground.add(backWall);

    var frontTransform = new THREE.Matrix4().makeTranslation(0, levelHeight / 2, levelLength / 2);
    var frontWall = makeRoomSurface(levelWidth, levelHeight, 1, frontTransform);
    ground.add(frontWall);
    return ground;
}

function makeWheel(){
    var radius = 0.5; // radius of wheel
    var tube = 0.05; // radius of wheel's tube
    var ringGeometry = new THREE.TorusGeometry(radius, tube, 16, 100);
    var ringMesh = new THREE.Mesh(ringGeometry, toonMaterial2);

    var spokes = [1, 2, 3, 4, 5];
    spokes.forEach(function(spokeNumber) {
        var wheelSpoke = new THREE.Mesh(new THREE.CylinderGeometry(tube, tube, radius * 2, 8), toonMaterial2);
        var rotAmount = (spokeNumber / (spokes.length)) * Math.PI;
        wheelSpoke.applyMatrix(new THREE.Matrix4().makeRotationZ(rotAmount));
        ringMesh.add(wheelSpoke);
    })

    var transformMatrix = new THREE.Matrix4().makeTranslation(0, 1.5, -49);
    ringMesh.setMatrix(transformMatrix);
    var ringCollider = new THREE.BoxGeometry(radius * 2 + 1, radius * 2 + 1, 0.4);
    var ringColliderMesh = new THREE.Mesh(ringCollider, transparentMaterial);
    ringColliderMesh.type = "wheel";
    ringColliderMesh.setMatrix(transformMatrix);
    obstacles.push(ringColliderMesh);
    interactables.push(ringColliderMesh);
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

function addLavaSub() {
    var planeGeometry = new THREE.PlaneGeometry(levelWidth, levelLength, 1);
    var plane;
    if (debug) {
        plane = new THREE.Mesh(planeGeometry, transparentMaterial);
    } else {
        plane = new THREE.Mesh(planeGeometry, blinnPhongMaterial);
    }
    var rot = new THREE.Matrix4().makeRotationX(3*Math.PI / 2);
    var translateUp = new THREE.Matrix4().makeTranslation(0, 1, 0);
    var final = new THREE.Matrix4().multiplyMatrices(translateUp, rot);
    plane.setMatrix(final);
    scene.add(plane);
    lava = plane;
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

function addStartPlatform() {
    var cube = makeCube(4, player.position.y - 0.5, 4, toonMaterial2);
    translateBefore(cube, player.position.x, 0, player.position.z);
    obstacles.push(cube);
    scene.add(cube);
}

function addShelf(width, height, length, thickness) {
    var shelf = new THREE.Object3D();

    var left = makeCube(thickness, height + 1, width + 1, blinnPhongMaterial);
    var right = makeCube(thickness, height + 1, width + 1, blinnPhongMaterial);
    translateBefore(left, length/2, 0, 0);
    shelf.add(left);
    translateBefore(right, -length/2, 0, 0);
    shelf.add(right);
    obstacles.push(left);
    obstacles.push(right);

    var levels = [-2, -1, 0, 1, 2];
    levels.forEach(function(level) {
        var y = (level * height / (levels.length - 1));
        var wall = makeCube(length, thickness, width * (1 + levels[levels.length - 1] - level) / levels.length, blinnPhongMaterial);
        translateBefore(wall, 0, y, 0);
        shelf.add(wall);
        obstacles.push(wall);
    })

    
    scene.add(shelf);
    rotateAfter(shelf, 'y', Math.PI/2)
    obstacles.push(shelf);
    translateAfter(shelf, (levelWidth / 2) - (width / 2), height / 2, 0);
}

function getRotMatrix(axis, angle) {
    switch(axis) {
        case 'x':
        return new THREE.Matrix4().makeRotationX(angle);
        break;
        case 'y':
        return new THREE.Matrix4().makeRotationY(angle);
        break;
        case 'z':
        return new THREE.Matrix4().makeRotationZ(angle);
        break;
        default: 
        console.log("This is not an axis: " + axis);
        return null;
    }
}

function rotateBefore(obj, axis, angle) {
    var rot = getRotMatrix(axis, angle);
    
    var finalMatrix = new THREE.Matrix4().multiplyMatrices(rot, obj.matrix);
    obj.setMatrix(finalMatrix);
}

function rotateAfter(obj,axis, angle) {
    var rot = getRotMatrix(axis, angle);
    var finalMatrix = new THREE.Matrix4().multiplyMatrices(obj.matrix, rot);
    obj.setMatrix(finalMatrix);
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
        //need to multiply by 1.1 because of the subdivide making the legs look smaller
        var leg = makeCube(legsize, floorToSeatHeight * 1.1, legsize, material);
        translateBefore(leg, x*(seatWidth / 2 - legsize), -floorToSeatHeight / 2 + 0.05, z*(seatWidth / 2 - legsize));
        return leg;
    }

    // ATTACH LEGS AND A BACK TO THE SEAT
    //need to make dist smaller than 1 because of the subdivide making the legs look smaller
    var dist = 0.7;
    var legs = [makeLeg(dist, dist), makeLeg(dist, -dist), makeLeg(-dist, dist), makeLeg(-dist, -dist)];
    legs.forEach(function(leg) {
        seat.merge(leg.geometry, leg.matrix);
    })

    var back = makeCube(seatWidth, height-floorToSeatHeight, legsize, material);
    translateBefore(back, 0, (height - floorToSeatHeight) / 2, -(seatWidth / 2 - legsize));
    seat.merge(back.geometry, back.matrix);

    // COLLIDER FOR THE BACK
    var backCollider = makeCube(seatWidth, height-floorToSeatHeight, legsize, transparentMaterial);
    translateBefore(backCollider, 0, (height - floorToSeatHeight) / 2, -(seatWidth / 2 - legsize));
    obstacles.push(backCollider);
    
    

    var modifier = new THREE.SubdivisionModifier(3); //# subdivides
    seat.mergeVertices();
    if (!debug) {
        modifier.modify(seat);
    }
    //CREATE THE CHAIR MESH
    var chairMesh = new THREE.Mesh(seat, material);
    chairMesh.add(backCollider);
        
    chair.add(chairMesh);

    return chair;
}

function makeChairPyramid() {
    var pyramid = new THREE.Object3D();

    var height = 2;
    var legsize = 0.1;
    var floorToSeatHeight = height/2;
    var seatWidth = 1;
    var seatHeight = 0.25
    var material = blinnPhongMaterial;
    var material2 = blinnPhongMaterial2;
    function make2ChairUnit(verticalDisplacement, hDisplace1, hDisplace2, makeSecond) {
        var chair = makeChair(height, legsize, floorToSeatHeight, seatWidth, seatHeight, material2);
        translateAfter(chair, hDisplace2, height/2 + verticalDisplacement, hDisplace1 + verticalDisplacement/20);

        pyramid.add(chair);
        if (makeSecond) {
            var chair2 = makeChair(height, legsize, floorToSeatHeight, seatWidth, seatHeight, material);
            translateAfter(chair2, hDisplace2, 2 * floorToSeatHeight + seatHeight/2 + verticalDisplacement, hDisplace1);
            var rot = new THREE.Matrix4().makeRotationX(Math.PI);
            chair2.setMatrix(new THREE.Matrix4().multiplyMatrices(chair2.matrix, rot))
            pyramid.add(chair2);
        }
    }

    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            var k;
            var kMax = Math.min(2 - Math.abs(j), 2 - Math.abs(i));
            for (k = 0; k < kMax; k++) {
                make2ChairUnit(k * 1.1 * height, j * 1.1 * seatWidth, i * 1.1 * seatWidth, true);
            }
            make2ChairUnit(k * 1.1 * height, j * 1.1 * seatWidth, i * 1.1 * seatWidth, false);
        }
    }

    // CREATE COLLISION MESHES

    var collisionGeometry = new THREE.BoxGeometry((seatWidth * 1.1) * 5, (floorToSeatHeight + seatHeight)* 2, (seatWidth * 1.1) * 5);
    var collisionMesh = new THREE.Mesh(collisionGeometry, transparentMaterial);
    obstacles.push(collisionMesh);
    pyramid.add(collisionMesh);
    
    var collisionGeometry2 = new THREE.BoxGeometry((seatWidth * 1.1) * 3, (height + seatHeight + floorToSeatHeight * 1.1)* 2, (seatWidth * 1.1) * 3);
    var collisionMesh2 = new THREE.Mesh(collisionGeometry2, transparentMaterial);
    translateAfter(collisionMesh2, 0, 0, 0.1 * seatWidth);
    obstacles.push(collisionMesh2);
    pyramid.add(collisionMesh2);

    var collisionGeometry3 = new THREE.BoxGeometry(seatWidth * 1.1, (2* height + 2*seatHeight + floorToSeatHeight * 1.1)* 2, seatWidth * 1.1);
    var collisionMesh3 = new THREE.Mesh(collisionGeometry3, transparentMaterial);
    translateAfter(collisionMesh3, 0, 0, 0.2 * seatWidth);
    obstacles.push(collisionMesh3);
    pyramid.add(collisionMesh3);
    // END COLLIISION MESHES
    return pyramid;
}

// ADD PROPS TO GAME
if (debug) {
    addGrid();
    addAxes();
}
var room = makeRoom();
scene.add(room);
makeInteractable();
makeWheel();
addLavaSub();
// addLava();

var chairPyra = makeChairPyramid();
scene.add(chairPyra);

var chairPyra2 = makeChairPyramid();
chairPyra2.position.z = 40;
scene.add(chairPyra2);

addShelf(4, 5, 6, 0.2);
addStartPlatform();
// addToruses();

player.constraints = [];
for (var i = 0; i < 8; i++) {
    player.constraints[i] = null;
}

//Detects collision between the player and the objects. Replace toruses with boxes because this is an awkward hitbox
function detectCollision(){
    var geometry = new THREE.BoxGeometry(playerHeight, playerHeight, playerHeight);

    var playerPos = player.position.clone();
    for(var vertex = 0; vertex < 8; vertex++){
        var localV = geometry.vertices[vertex].clone();

        var globalV = localV.applyMatrix4(player.matrix);
        var directionVector = globalV.sub(player.position)
        

        var ray = new THREE.Raycaster(playerPos, directionVector.clone().normalize());

        var collisions = ray.intersectObjects(obstacles);
        if(collisions.length > 0 && collisions[0].distance < 0.5){
            var normal = collisions[0].face.normal;
            if (player.constraints.indexOf(normal) == -1) { //only add if not already there
                //normal matrix of M(object->world), aka matrixWorld, is inverse(transpose(matrixWorld))
                //need to normalize again (possibly because of scaling?)
                var objectToWorldNormalMatrix = new THREE.Matrix4().getInverse(collisions[0].object.matrixWorld).transpose();
                player.constraints[vertex] = normal.clone().applyMatrix4(objectToWorldNormalMatrix).normalize();
            }
       } else {
            player.constraints[vertex] = null
        }
   }
}

var mouse = new THREE.Vector2(), INTERSECTED;

// var objectDrag = false;
// var mouseDrag = false;
//picking ray
function pickRay(){
    var pickRayCaster = new THREE.Raycaster();
    pickRayCaster.setFromCamera(mouse, firstPersonCamera);

    //Change this number in order to change the distance at which you can interact with the object
    pickRayCaster.far = 3;
    var intersects = pickRayCaster.intersectObjects(interactables);
    //Grab the 1st intersected object's type
    if(intersects.length >  0)
        takeAction(intersects[0].object);
}

function takeAction(obj){
    var type = obj.type;
    switch(type){
        case "wheel":
            //Reverse Lava flow
            gameState = GameStateEnum.won;
            lavaSpeed *= -10;
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


//SETUP ENDED
$("#loading").remove();
$('#play').removeAttr("hidden");
