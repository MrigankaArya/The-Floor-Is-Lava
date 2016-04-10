// LIGHTING UNIFORMS
var lightColor = new THREE.Color(1, 0.3, 0.3);
var ambientColor = new THREE.Color(0.4, 0.5, 0.6);
var lightPosition = new THREE.Vector3(70, 100, 70);

var lightColor2 = new THREE.Color(0, 0.3, 1);

var litColor = new THREE.Color(0.7, 0.4, 0.6);
var unLitColor = new THREE.Color(0.15, 0.2, 0.6);
var litColor2 = new THREE.Color(0.1, 0.4, 0.9);
var unLitColor2 = new THREE.Color(0.7, 0.32, 0.6);

var outlineColor = new THREE.Color(0.04, 0.1, 0.15);

var kAmbient = new THREE.Color(1, 1, 0.7);
var kDiffuse = new THREE.Color(0.6, 0.6, 0.7);
var kSpecular = new THREE.Color(1, 1, 1);
var shininess = 10.0;

var textureLoader = new THREE.TextureLoader();

var chairTex = textureLoader.load("textures/smooth-wood.jpg");

var cloudTex = textureLoader.load("textures/cloud.png");
var lavaTex = textureLoader.load("textures/lavatile.jpg");

var lavaUniforms = {
    uniforms:{
        fogDensity: {
            type:"f",
            value: 0.5
        },
        fogColor: {
            type: "v3",
            value: new THREE.Vector3(0,0,0)
        },
        time: {
            type: "f",
            value: 1.0
        },
        uvScale: {
            type: "v2",
            value: new THREE.Vector2(0.06, 0.03)
        },
        textureCloud: {
            type: "t",
            value: cloudTex
        },
        textureLava: {
            type: "t",
            value: lavaTex
        }
    }
}

var toonSpec = {
    uniforms: {
        litColor: {
            type: 'c',
            value: litColor
        },
        unLitColor: {
            type: 'c',
            value: unLitColor
        },
        outlineColor: {
            type: 'c',
            value: outlineColor
        },
        lightColor: {
            type: 'c',
            value: lightColor
        },
        ambientColor: {
            type: 'c',
            value: ambientColor
        },
        lightPosition: {
            type: 'v3',
            value: lightPosition
        },
    },
};

var toonSpec2 = {
    uniforms: {
        litColor: {
            type: 'c',
            value: litColor2
        },
        unLitColor: {
            type: 'c',
            value: unLitColor2
        },
        outlineColor: {
            type: 'c',
            value: outlineColor
        },
        lightColor: {
            type: 'c',
            value: lightColor
        },
        ambientColor: {
            type: 'c',
            value: ambientColor
        },
        lightPosition: {
            type: 'v3',
            value: lightPosition
        }
    },
};

function makeSpec(tex, colors, ambColor, litePositions, kAmb, kDiff, kSpec, shineFactor, uScale, vScale) {
    var spec = {
        uniforms: {
            surfaceTexture: {
                type: "t",
                value: tex
            },
            lightColors: {
                type: 'fv',
                value: colors
            },
            ambientColor: {
                type: 'c',
                value: ambColor
            },
            lightPositions: {
                type: 'fv',
                value: litePositions
            },
            kAmbient: {
                type: 'c',
                value: kAmb
            },
            kDiffuse: {
                type: 'c',
                value: kDiff
            },
            kSpecular: {
                type: 'c',
                value: kSpec
            },
            shininess: {
                type: 'f',
                value: shineFactor
            },
            u_scale: {
                type: 'f',
                value: uScale
            },
            v_scale: {
                type: 'f',
                value: vScale
            }
        },
    };

    return spec;
}

var lightPositions = [70, 100, 70, -70, -100, -70];

var blinnPhongSpec = makeSpec(chairTex, [0.1, 0.3, 0.8, 1, 1, 0.7], ambientColor, lightPositions, kAmbient, kDiffuse, kSpecular, shininess, 1, 1)
var blinnPhongSpec2 = makeSpec(chairTex, [1, 0.6, 1, 0, 0, 1], ambientColor, lightPositions, kAmbient, kDiffuse, kSpecular, shininess, 1, 1)


//MATERIALS
var basicMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide
});
var toonMaterial = new THREE.ShaderMaterial(toonSpec);
var toonMaterial2 = new THREE.ShaderMaterial(toonSpec2);

var blinnPhongMaterial = new THREE.ShaderMaterial(blinnPhongSpec);
var blinnPhongMaterial2 = new THREE.ShaderMaterial(blinnPhongSpec2);

var lavaMaterial = new THREE.ShaderMaterial(lavaUniforms);
// LOAD SHADERS
var shaderFiles = [
    'glsl/blinnPhong.vs.glsl',
    'glsl/blinnPhong.fs.glsl',
    'glsl/toon.vs.glsl',
    'glsl/toon.fs.glsl',
    'glsl/lava.vs.glsl',
    'glsl/lava.fs.glsl'
];

var shaderDetails = [{
    mat: blinnPhongMaterial,
    vs: 'glsl/blinnPhong.vs.glsl',
    fs: 'glsl/blinnPhong.fs.glsl'
}, {
    mat: blinnPhongMaterial2,
    vs: 'glsl/blinnPhong.vs.glsl',
    fs: 'glsl/blinnPhong.fs.glsl'
}]


new THREE.SourceLoader().load(shaderFiles, function(shaders) {

    shaderDetails.forEach(function(shaderDetail) {
        var material = shaderDetail.mat;
        material.vertexShader = shaders[shaderDetail.vs];
        material.fragmentShader = shaders[shaderDetail.fs];
        material.needsUpdate = true;
    })

    toonMaterial.vertexShader = shaders['glsl/toon.vs.glsl'];
    toonMaterial.fragmentShader = shaders['glsl/toon.fs.glsl'];
    toonMaterial.needsUpdate = true;

    toonMaterial2.vertexShader = shaders['glsl/toon.vs.glsl'];
    toonMaterial2.fragmentShader = shaders['glsl/toon.fs.glsl'];
    toonMaterial2.needsUpdate = true;

    lavaMaterial.vertexShader = shaders['glsl/lava.vs.glsl'];
    lavaMaterial.fragmentShader = shaders['glsl/lava.fs.glsl'];
    lavaMaterial.needsUpdate = true;
})
