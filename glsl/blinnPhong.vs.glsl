uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform vec3 lightPosition;
uniform float kAmbient;
uniform float kDiffuse;
uniform float kSpecular;
uniform float shininess;

varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;
void main() {
    interpolatedNormal = normalize(normalMatrix * normal);
    interpolatedPosition = position;
    interpolatedEyeDirection = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
