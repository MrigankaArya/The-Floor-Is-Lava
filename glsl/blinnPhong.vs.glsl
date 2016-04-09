uniform vec3 lightColors[2];
uniform vec3 ambientColor;
uniform int noLights;
uniform vec3 lightPositions[2];
uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;
uniform sampler2D surfaceTexture;

varying vec2 vUv;
varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;
void main() {
	vUv = uv;
    interpolatedNormal = normalize(normalMatrix * normal);
    interpolatedPosition = position;
    interpolatedEyeDirection = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
