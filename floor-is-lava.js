function runGame() {
$("#play").remove();
$("#instructions").remove();
var gameLost = false;

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
    console.log("removed listeners");

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

function initiateLostGame() {
    removeListeners();

    //stop them from moving if they're still pressing a key down
    firstPersonCamera.velocity = new THREE.Vector3(0, 0, 0); 
    $("#lost").removeAttr("hidden");
    $("#lava-height").text(Math.floor(lava.position.y));
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
function update() {
    if (!gameLost) {
        translateBefore(lava, 0, lavaSpeed, 0);
    }
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
                if (gameLost != true) {
                    initiateLostGame();
                    gameLost = true;
                    return;
                }
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
                if (gameLost != true) {
                    initiateLostGame();
                    gameLost = true;
                    return;
                }
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