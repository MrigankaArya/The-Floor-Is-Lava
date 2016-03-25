uniform vec3 lightPosition;
uniform vec3 litColor;
uniform vec3 unLitColor;
uniform vec3 outlineColor;
varying vec3 interpolatedNormal;
varying vec3 interpolatedPosition;
varying vec3 interpolatedEyeDirection;
void main() {
	vec3 lightDirection = normalize(lightPosition - interpolatedPosition);
	float kw = (1.0 + max(dot(interpolatedNormal, lightDirection), 0.0))/2.0;
	vec3 c = kw*litColor + (1.0 - kw)*unLitColor;

	float outlineDot = dot(interpolatedEyeDirection, interpolatedNormal);
	if (outlineDot < 0.4) {
		c = outlineColor;
	}

	gl_FragColor = vec4(c, 1.0);
}
