uniform vec3 lightColors[2];
uniform vec3 ambientColor;
uniform int noLights;
uniform vec3 lightPositions[2];
uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float u_scale;
uniform float v_scale;
uniform float time;
uniform float shininess;
uniform float lavaReflectIntensity;
uniform sampler2D surfaceTexture;
uniform sampler2D slideTex1;
uniform sampler2D slideTex2;
uniform vec3 flashlightColor;
uniform vec3 flashlightPosition;
uniform vec3 flashlightDirection;

varying vec2 vUv;
varying vec2 slideUv1;
varying vec2 slideUv2;
varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;
void main() {
	vUv = vec2(u_scale, v_scale) * uv;
	//slider textures need to be pretty big
	//we want them to light up surface with weird shapes
	slideUv1 = vec2(u_scale / 10.0, v_scale / 10.0) * uv + sin(time / 20.0) + sin(time / 90.0);
	slideUv2 = vec2(u_scale / 10.0, v_scale / 10.0) * uv + sin(time / 30.0);
	
    interpolatedNormal = normalize(normalMatrix * normal);
    interpolatedPosition = position;
    interpolatedEyeDirection = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
