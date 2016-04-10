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
uniform sampler2D slideTex1;
uniform sampler2D slideTex2;
uniform float u_scale;
uniform float v_scale;
uniform float sliderU1;
uniform float sliderV1;
uniform float sliderU2;
uniform float sliderV2;
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
	vec3 finalIllumination = vec3(0.0, 0.0, 0.0);
	vec3 textureColor = vec3(texture2D(surfaceTexture, vUv));

	float lightFromBelowAmount;

	for (int i = 0; i < NUM_LIGHTS; i++) {
		//Used in Specular and Diffuse. l = Plight - Pvertex
		vec3 lightDirection = normalize((viewMatrix * vec4(lightPositions[i], 1.0)).xyz - interpolatedPosition);

		//Used in Specular. h = (l + v)/|| l + v ||
		vec3 halfwayVector = normalize(lightDirection + interpolatedEyeDirection);

		//Ambient: ka*Ia
		vec3 ambientIllumination = textureColor * kAmbient * ambientColor;
		
		//Diffuse: kd*Il*(n*l)
		float diffuseAmount = max(dot(lightDirection, interpolatedNormal), 0.0);
		vec3 diffuseIllumination = lightColors[i] * vec3(textureColor * kDiffuse * diffuseAmount);
		if (i == 1) {
			lightFromBelowAmount = diffuseAmount;
		}

		//Specular: ks*Il*(h*n)^kse
		vec3 specularIllumination = lightColors[i] * vec3(textureColor * kSpecular * pow(max(dot(halfwayVector, interpolatedNormal), 0.0), shininess));
		finalIllumination += (ambientIllumination + diffuseIllumination + specularIllumination);

		vec3 shadow = vec3(0, 0.2, 0.1);
		vec3 shadowByLightIntensity = shadow * length(lightColors[i]);

		vec3 saturatedLineColor = vec3(0, 0.3, 0.3);
		vec3 saturatedByLightIntensity = saturatedLineColor * length(lightColors[i]);

		vec3 shadowAmount;
		float dotResult = dot(lightDirection, interpolatedNormal);
		
		float shadowLimit = 0.38;
		float maxSaturationLimit = shadowLimit + 0.05;
		float lightAreaLimit = maxSaturationLimit + 0.03;
		float highlightLimit = 1.0 - pow(0.1, shininess * 3.0);
		if (dotResult < shadowLimit) {
			shadowAmount = shadowByLightIntensity;
		} else if (dotResult >= shadowLimit && dotResult < maxSaturationLimit) {
			//linearly create saturation line
			//mx
			float mx = (1.0 / (maxSaturationLimit - shadowLimit)) * dotResult;
			
			//b
			float b = - shadowLimit / (maxSaturationLimit - shadowLimit);

			//y
			float interpolator = mx + b;

			shadowAmount = shadowByLightIntensity * (1.0 - interpolator) + interpolator * saturatedByLightIntensity;
		} else if (dotResult >= maxSaturationLimit && dotResult < lightAreaLimit) {
			//linearly end saturation line
			//mx
			float mx = (1.0 / (lightAreaLimit - maxSaturationLimit)) * dotResult;
			
			//b
			float b = - maxSaturationLimit / (lightAreaLimit - maxSaturationLimit);

			//y
			float interpolator = mx + b;

			shadowAmount = saturatedByLightIntensity * (1.0 - interpolator);
		} else if (dotResult < highlightLimit) {
			shadowAmount = vec3(-0.1, -0.1, 0); //this will be "added", creating an additional highlight
		}

		finalIllumination -= shadowAmount / 2.0;
	}

	float outlineDeterminant = dot(interpolatedEyeDirection, interpolatedNormal);
	if (outlineDeterminant < 0.1) {
		finalIllumination = vec3(1, 0, 0);
	}

	//ADD FLASHLIGHT
	vec3 toSurface = normalize(interpolatedPosition - (viewMatrix * vec4(flashlightPosition, 1.0)).xyz);
	float spotInterpolator = max(dot(toSurface, flashlightDirection), 0.0);
	
	// if (spotInterpolator > 0.6) {
	// 	finalIllumination += flashlightColor;
	// }

	//TODO: Replace this with an actual spot light
	vec3 flashlightIllumination = flashlightColor * vec3(max(dot(-toSurface, interpolatedNormal), 0.0));
	finalIllumination += flashlightIllumination;

	//add sliding
	vec3 slide1TextureColor = vec3(texture2D(slideTex1, slideUv1));
	vec3 slide2TextureColor = vec3(texture2D(slideTex2, slideUv2));
	vec3 combined = slide1TextureColor * slide2TextureColor;
	
	vec3 white = vec3(1, 1, 1);
	vec3 lavaIllumination = finalIllumination + combined * 0.2; //multiply slightly to bring out colour

	lavaIllumination = (white - (white - lavaIllumination) * (white - combined));
	//^this line inspired by photoshop's screen blending mode
	//http://www.deepskycolors.com/archive/2010/04/21/formulas-for-Photoshop-blending-modes.html

	float opacityOfLava = 0.6;
	finalIllumination = finalIllumination * (1.0 - (lightFromBelowAmount + opacityOfLava)) + lavaIllumination * (lightFromBelowAmount + opacityOfLava);

	gl_FragColor = vec4(finalIllumination, 1.0);
}
