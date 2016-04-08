#define NUM_LIGHTS 2
uniform vec3 lightColors[2];
uniform vec3 ambientColor;
uniform int noLights;
uniform vec3 lightPositions[2];
uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;

varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;

void main() {
	vec3 finalIllumination = vec3(0.0, 0.0, 0.0);
	for (int i = 0; i < NUM_LIGHTS; i++) {
		//Used in Specular and Diffuse. l = Plight - Pvertex
		vec3 lightDirection = normalize((viewMatrix * vec4(lightPositions[i], 1.0)).xyz - interpolatedPosition);

		//Used in Specular. h = (l + v)/|| l + v ||
		vec3 halfwayVector = normalize(lightDirection + interpolatedEyeDirection);

		//Ambient: ka*Ia
		vec3 ambientIllumination = kAmbient * ambientColor;
		
		//Diffuse: kd*Il*(n*l)
		vec3 diffuseIllumination = lightColors[i] * vec3(kDiffuse * max(dot(lightDirection, interpolatedNormal), 0.0));
		
		//Specular: ks*Il*(h*n)^kse
		vec3 specularIllumination = lightColors[i] * vec3(kSpecular * pow(max(dot(halfwayVector, interpolatedNormal), 0.0), shininess));
		finalIllumination += (ambientIllumination + diffuseIllumination + specularIllumination);
	}

	gl_FragColor = vec4(finalIllumination, 1.0);
}
