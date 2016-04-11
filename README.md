Maggie Chen
40626103
f8i8

Mriganka Arya
53131124
i6r8

We're using all of our grace days that we both saved up.

What this game is:
	The Floor is Lava is a platform puzzle game where the objective is to travel from one end of the room to the other while avoiding the lava and using the environment to your advantage.

	The advanced functionality items implemented are

	1. Collision Detection
		Collision detection was implemented via raycasting
	
	2. Animation
		The wheel that turns off the lava is animated. We also have a animated lava texture that mimics lava flow. The lights are also animated in a sinusoidal pattern. The wheel animation has a bunch of if statements that serve to reproduce keyframes, and we interpolate between positions to achieve movement. 

	3. Particle Systems
		Fire plumes randomly appear through the lava field.

	4. Shaders
		Cel-shading inspired model. We also have a moving lava texture and reflections. 

How was this made?:
	
	Shelves: Created a function to make shelves of any size with any # shelf levels. 

	Camera: The camera used is a perspective camera that follows the player model. We also have a overhead orthographic camera for the minimap.

	Movement (Interactivity): Movement is done by accelerating the player along a direction vector. The direction vector is calculated from the direction the player is facing in. Gravity also is in place for the player.

	Camera Panning (Interactivity): Camera panning is done by calculating the last speed which the mouse moved at in the last update tick and using that as a pan velocity for the edges to turn around and up and down.

	Collision Detection: Done by raycasting from the vertices of the player model to a array of obstacles and then sliding along the intersected surface by projecting the player velocity onto the intersected plane and using the resultant vector as the new velocity vector. This handles any objects in any orientation with any geometric complexity. We also optimized this by taking advantage of the fact that most of the collidable objects are static (in terms of their z coordinate, at least), and the level is a hallway. We sorted the collidable objects by z coordinate and only tested collision for objects a maximum of 2 units away from the player's z coordinate. This way we do not do the calculation for faraway objects. It also means that the maximum collidable object size is 4. 

	Picking: Also done using raycasting. The ray is casted from the camera using the pointer coordinates and is checked against a array of interactable objects.

	Lava reflections: We use 2 textures that move against each other in a sinuosoidal pattern, multiply them with each other, and apply that on top using an algorithm that reproduces photoshop's screen algorithm.

	Lava texture: We use a lava texture that is overlaid with a fog layer that is multiplied into the lava to provide a moving effect.

	Chair Pyramid: Incrementally add chair models to a pyramid using for loops

	Particle Systems: Uses the three.js sprites class to create and move the fire particles on the screen. The particles are removed from the particle system object when they reach a certain height randomized to 1.5 units above lava height. The systems spawn randomly every 10 game ticks provided that the previous system has finished it's life.

	On-screen control panel: This is mostly HTML and JQuery stuff.

	Gameplay: Also HTML and JQuery stuff. We update counts in various events in the code. 


How do you play?:
	Players move with the WASD keys and jump using Spacebar. The panning is done using the mouse (drag it to the left or right edge of the screen to turn the player's head), and the lava flow is turned off by finding the wheel at the other end of the room, centering it on the screen, and clicking. 

	The aim of the game is to reach the other end of the room and activate the lava wheel while avoiding the lava.


Sources:

Textures from:
http://www.mb3d.co.uk/mb3d/Wood_Seamless_and_Tileable_High_Res_Textures_files/Wood_14_UV_H_CM_1.jpg
http://www.mb3d.co.uk/mb3d/Marble_and_Tiles_Seamless_and_Tileable_High_Res_Textures_files/marble_1.jpg
http://www.textures.com/download/crackles0004/3947
http://www.textures.com/download/waterplain0017/14169?q=water+waves&filter=all
http://www.textures.com/download/wallpaperforties0057/19071?q=wall&filter=all
http://www.textures.com/download/metalpainted0064/11976?q=metal&filter=all
http://www.textures.com/download/carpet0025/8255?q=carpet&filter=all

Libraries used:
Subdivision Modifier
https://github.com/mrdoob/three.js/blob/master/examples/js/modifiers/SubdivisionModifier.js

XHRLoader and DDSLoader from P2
TGALoader:
https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/TGALoader.js

3D Models:
Subwoofer
http://www.turbosquid.com/FullPreview/Index.cfm/ID/527825

Angle Table:
http://www.turbosquid.com/FullPreview/Index.cfm/ID/644916

Soft Sofa:
http://www.turbosquid.com/FullPreview/Index.cfm/ID/758576

Lava Sliding Algorithm and texture:
http://threejs.org/examples/#webgl_shader_lava

Collision detection inspiration:
https://stemkoski.github.io/Three.js/Collision-Detection.html

Particle systems inspiration:
http://stemkoski.github.io/Three.js/Particles.html
