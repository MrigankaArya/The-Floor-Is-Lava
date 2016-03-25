uniform vec3 lightPosition;
uniform vec3 litColor;
uniform vec3 unLitColor;
uniform vec3 outlineColor;
varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;
void main() {
    interpolatedNormal = normalize(normalMatrix * normal);
    interpolatedPosition = position;
    interpolatedEyeDirection = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
