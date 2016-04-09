#define NUM_LIGHTS 2
uniform vec3 lightColors[2];
uniform vec3 ambientColor;
uniform int noLights;
uniform vec3 lightPositions[2];
uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;
uniform sampler2D surfaceTexture;
uniform float u_scale;
uniform float v_scale;

varying vec2 vUv;
varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;

void main() {
	vec3 finalIllumination = vec3(0.0, 0.0, 0.0);
	vec3 textureColor = vec3(texture2D(surfaceTexture, vUv));

	for (int i = 0; i < NUM_LIGHTS; i++) {
		//Used in Specular and Diffuse. l = Plight - Pvertex
		vec3 lightDirection = normalize((viewMatrix * vec4(lightPositions[i], 1.0)).xyz - interpolatedPosition);

		//Used in Specular. h = (l + v)/|| l + v ||
		vec3 halfwayVector = normalize(lightDirection + interpolatedEyeDirection);

		//Ambient: ka*Ia
		vec3 ambientIllumination = textureColor * kAmbient * ambientColor;
		
		//Diffuse: kd*Il*(n*l)
		vec3 diffuseIllumination = lightColors[i] * vec3(textureColor * kDiffuse * max(dot(lightDirection, interpolatedNormal), 0.0));
		
		//Specular: ks*Il*(h*n)^kse
		vec3 specularIllumination = lightColors[i] * vec3(textureColor * kSpecular * pow(max(dot(halfwayVector, interpolatedNormal), 0.0), shininess));
		finalIllumination += (ambientIllumination + diffuseIllumination + specularIllumination);

		vec3 shadow = vec3(0, 0.2, 0.2);

		float dotResult = dot(halfwayVector, interpolatedNormal);
		if (dotResult < -0.5) {
			finalIllumination -= shadow;
		} else {

		}
	}
	float outlineDeterminant = dot(interpolatedEyeDirection, interpolatedNormal);
	if (outlineDeterminant < 0.1) {
		finalIllumination = vec3(1, 0, 0);
	}
	gl_FragColor = vec4(finalIllumination, 1.0);
}
