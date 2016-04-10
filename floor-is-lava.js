function runGame() {
$("#play").remove();
$("#instructions").remove();

// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
canvas.appendChild(renderer.domElement);

var gameCanvas = $("canvas:first-child");

var minimap = document.getElementById('minimap');
minimap.appendChild(minimapRenderer.domElement);

var minimapCanvas = $("minimap:first-child");


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



var cursorOffsetX = -1;
var cursorOffsetY = -1;
var keyboard = new THREEx.KeyboardState();

function addListeners() {
    keyboard.domElement.addEventListener('keydown', onKeyDown);
    keyboard.domElement.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
}

addListeners();

function removeListeners() {
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
    keyboard.domElement.removeEventListener('keydown', onKeyDown);
    keyboard.domElement.removeEventListener('keyup', onKeyUp);
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    isMouseDown = false;
}

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
            player.velocity.z = 0;

        }

        if (keys.a == true && keys.d == true) {
            if (keyUsed == "a") {
                keys.d = false;
            } else {
                keys.a = false;
            }
            player.velocity.x = 0;
        }
    } else if (match(" ")) {
        if (!isFalling) {
            player.velocity.y = 0.1;
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
            player.velocity.z = 0;
        }
        if (!keys.a && !keys.d) {
            player.velocity.x = 0;
        }
    }
}

var isMouseDown = false;


function onMouseDown(event) {
    isMouseDown = true;
    pickRay();
    // objectDrag = true;
    // mouseDrag = true;
}

//Uncomment later
function onMouseUp(event) {
    isMouseDown = false;
    // mouseDrag = false;
}

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
    //rotate the camera, not the player. This way player always parallel to horizon, making the move() function more straightforward to implement
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
        if (constraint != null) {
            //First we have to get the constraint, which is a normal, in the coordinates of the player. 
            //Constraints are defined in world coordinates and player velocity is defined in player coordinates. 
            //The matrix for normals (Q) is transpose(inverse(<matrix for vertices>(M)))
            //We want to have a matrix Q(world->player), so we should use M(world->player). This means inverse(player.matrix).
            //Therefore, the matrix to convert the constraints into player coordinates is transpose(inverse(inverse(player.matrix))) = transpose(player.matrix)

            var playerNormalMatrix = new THREE.Matrix4().copy(player.matrixWorld).transpose();
            var pConstraint = constraint.clone().applyMatrix4(playerNormalMatrix);
            console.log(constraint);

            if (pConstraint.dot(velocity) < 0) {
             
                //This code adjust the velocity to slide along faces we've collided with
                var negaVelocity = velocity.clone().negate();
                var cosTheta = negaVelocity.dot(pConstraint);
                var newConstraint = pConstraint.multiplyScalar(cosTheta);

                obj.velocity.add(newConstraint);
            }
        }
    })
    translateAfter(player, obj.velocity.x, obj.velocity.y, obj.velocity.z);
}

function updateLavaHeightStat() {
    $(".lava-height").text(Math.floor(lava.position.y));
}

function initiateLostGame() {
    removeListeners();

    //stop them from moving if they're still pressing a key down
    player.velocity = new THREE.Vector3(0, 0, 0); 
    $("#lost").removeAttr("hidden");
    updateLavaHeightStat()
}

function initiateWonGame() {
    lavaSpeed = 0;
    $("#won").removeAttr("hidden");
    updateLavaHeightStat();
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

var lavaFlushedOut = false;
function update() {
    move(player);
    var currentTime = new Date();
    translateBefore(lava, 0, lavaSpeed, 0);

    if (gameState == GameStateEnum.won && lava.position.y < ground.position.y && !lavaFlushedOut) {
        lavaFlushedOut = true;
        initiateWonGame();
    }
    //Compute FPS
    if (numFrames < thresholdFrames) {
        numFrames++;
    } else {
        numFrames = 0;
        var timePassed = currentTime - lastTime;
        var fps = thresholdFrames/(timePassed/1000);
        document.getElementById("fps-count").innerHTML = Math.floor(fps);
        lastTime = currentTime;
    }    

    requestAnimationFrame(update);
    renderer.render(scene, firstPersonCamera);
    minimapRenderer.render(scene, minimapCamera);
    minimapCamera.position.z = player.position.z;

    // move lights slightly
    var wave = Math.sin(currentTime / 1000) / 10 + Math.sin(currentTime/200)/50;
    lightPositions[0] += wave;
    lightPositions[3] += wave;


    var diff = player.position.y - lava.position.y;
    //the +1 is to prevent the near plane of the camera from intersecting with the ground plane
    detectCollision();
    
    var diffThreshold = 0.5;
    // Update health
    if (diff <= diffThreshold) {
        if (isInLava == false) {
            isInLava = true;
            if (healthCount == 0) {
                if (gameState == GameStateEnum.playing) {
                    initiateLostGame();
                    gameState = GameStateEnum.lost;
                    return;
                }
            } else if (gameState != GameStateEnum.won) {
                if (!debug) {
                    healthCount--;
                    hearts[healthCount].remove();                    
                }
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
                if (gameState == GameStateEnum.playing) {
                    initiateLostGame();
                    gameState = GameStateEnum.lost;
                    return;
                }
            } else if (gameState != GameStateEnum.won) {
                startTimeInLava = currentTimeInLava;
                if (!debug) {
                    healthCount--;
                    hearts[healthCount].remove();                    
                }
            }
        }
        isFalling = false;

        if (gameState != GameStateEnum.won || (player.position.y > ground.position.y + groundHeight/2 + playerHeight/2)) {
            translateBefore(player, 0, lavaSpeed, 0);
        }
    } else {
        //check if we're on a flat surface
        isFalling = player.constraints.filter(function(constraint) {
            return constraint != null && (constraint.y > 0.5);
        }).length == 0;
    }

    player.fall(isFalling);
    
    //Player controls
    if (keys.w) {
        player.slideZ(false);
    }

    if (keys.s) {
        player.slideZ(true);
    }

    if (keys.a) {
        player.slideX(false);
    }

    if (keys.d) {
        player.slideX(true);
    }

    if (isOutBounds && mouseMoving) {
        //DO NOT modify player.rotation.y manually. It will not rotate past -90 or 90 degrees. 
        var panRot = new THREE.Matrix4().makeRotationY(sideDx);
        player.setMatrix(new THREE.Matrix4().multiplyMatrices(player.matrix, panRot));
    }

}

update();
}