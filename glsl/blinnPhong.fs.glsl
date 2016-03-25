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
	//Used in Specular and Diffuse. l = Plight - Pvertex
	vec3 lightDirection = normalize(lightPosition - interpolatedPosition);

	//Used in Specular. h = (l + v)/|| l + v ||
	vec3 halfwayVector = normalize(lightDirection + interpolatedEyeDirection);

	//Ambient: ka*Ia
	vec3 ambientIllumination = kAmbient * ambientColor;
	
	//Diffuse: kd*Il*(n*l)
	vec3 diffuseIllumination = lightColor * vec3(kDiffuse * max(dot(lightDirection, interpolatedNormal), 0.0));
	
	//Specular: ks*Il*(h*n)^kse
	vec3 specularIllumination = lightColor * vec3(kSpecular * pow(max(dot(halfwayVector, interpolatedNormal), 0.0), shininess));

	gl_FragColor = vec4(ambientIllumination + diffuseIllumination + specularIllumination, 1.0);
}
