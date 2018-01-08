'use strict';

// create a new set of uniforms based on the default phong shader in THREE
var plaidUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["phong"].uniforms);

// update some of the default uniforms
plaidUniforms.shininess.value = 60;
plaidUniforms.diffuse.value.setHex(0xFFFFFF);
plaidUniforms.specular.value.setHex(0x666666);

// add our custom verticalOffset uniform
plaidUniforms.verticalOffset = { value: 0.0 };

// add the plaid shader to the shader lib for use later
THREE.ShaderLib['plaid'] = {

    uniforms: plaidUniforms,

    vertexShader: ['\n\n        #define PHONG\n\n        varying vec3 vViewPosition;\n        varying vec2 vUv;\n\n        #ifndef FLAT_SHADED\n\n            varying vec3 vNormal;\n\n        #endif\n\n        #include <common>\n        #include <uv_pars_vertex>\n        #include <uv2_pars_vertex>\n        #include <displacementmap_pars_vertex>\n        #include <envmap_pars_vertex>\n        #include <color_pars_vertex>\n        #include <fog_pars_vertex>\n        #include <morphtarget_pars_vertex>\n        #include <skinning_pars_vertex>\n        #include <shadowmap_pars_vertex>\n        #include <logdepthbuf_pars_vertex>\n        #include <clipping_planes_pars_vertex>\n\n        void main() {\n\n            vUv = uv; // CUSTOMIZATION: This is how we get access to vUv without enabling a "map" in the define section of the shader\n\n            #include <uv_vertex>\n            #include <uv2_vertex>\n            #include <color_vertex>\n\n            #include <beginnormal_vertex>\n            #include <morphnormal_vertex>\n            #include <skinbase_vertex>\n            #include <skinnormal_vertex>\n            #include <defaultnormal_vertex>\n\n        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n            vNormal = normalize( transformedNormal );\n\n        #endif\n\n            #include <begin_vertex>\n            #include <morphtarget_vertex>\n            #include <skinning_vertex>\n            #include <displacementmap_vertex>\n            #include <project_vertex>\n            #include <logdepthbuf_vertex>\n            #include <clipping_planes_vertex>\n\n            vViewPosition = - mvPosition.xyz;\n\n            #include <worldpos_vertex>\n            #include <envmap_vertex>\n            #include <shadowmap_vertex>\n            #include <fog_vertex>\n\n        }\n\n    '].join(),

    fragmentShader: ['\n\n        #define PHONG\n\n        uniform vec3 diffuse;\n        uniform vec3 emissive;\n        uniform vec3 specular;\n        uniform float shininess;\n        uniform float opacity;\n        uniform float verticalOffset;\n\n        varying vec2 vUv; // CUSTOMIZATION: This is how we get access to vUv without enabling a "map" in the define section of the shader\n\n        #include <common>\n        #include <packing>\n        #include <dithering_pars_fragment>\n        #include <color_pars_fragment>\n        #include <uv_pars_fragment>\n        #include <uv2_pars_fragment>\n        #include <map_pars_fragment>\n        #include <alphamap_pars_fragment>\n        #include <aomap_pars_fragment>\n        #include <lightmap_pars_fragment>\n        #include <emissivemap_pars_fragment>\n        #include <envmap_pars_fragment>\n        #include <gradientmap_pars_fragment>\n        #include <fog_pars_fragment>\n        #include <bsdfs>\n        #include <lights_pars>\n        #include <lights_phong_pars_fragment>\n        #include <shadowmap_pars_fragment>\n        #include <bumpmap_pars_fragment>\n        #include <normalmap_pars_fragment>\n        #include <specularmap_pars_fragment>\n        #include <logdepthbuf_pars_fragment>\n        #include <clipping_planes_pars_fragment>\n\n        // plaid constants\n        const float plaidSquare = 1.0 / 9.0;\n        const float plaidSpacer = plaidSquare * plaidSquare;\n        const float plaidBar = (plaidSquare - 2.0 * plaidSpacer) / 3.0;\n\n        // plaid stop points\n        const float plaidStop1 = plaidSquare;                   // main\n\n        const float plaidStop2 = 2.0 * plaidSquare;             // empty\n\n        const float plaidStop3 = 3.0 * plaidSquare - plaidBar;  // main\n        const float plaidStop4 = 3.0 * plaidSquare;             // alt\n\n        const float plaidStop5 = 4.0 * plaidSquare;             // main\n\n        const float plaidStop6 = plaidStop5 + plaidBar;         // alt\n        const float plaidStop7 = plaidStop6 + plaidSpacer;      // main\n        const float plaidStop8 = plaidStop7 + plaidBar;         // alt\n        const float plaidStop9 = plaidStop8 + plaidSpacer;      // main\n        const float plaidStop10 = plaidStop9 + plaidBar;        // alt\n\n        const float plaidStop11 = plaidStop10 + plaidSquare;    // main\n\n        const float plaidStop12 = plaidSquare * 9.0;            // empty\n\n        // our main plaid colors\n        vec4 mainColor = vec4(0.0, 0.0, 0.0, 0.5);\n        vec4 altColor = vec4(0.0, 1.0, 0.56471, 0.5);\n        vec4 emptyColor = vec4(1.0, 1.0, 1.0, 0.5);\n\n        // method that takes a percentage of the plaid pattern and returns the proper color\n        // this logic is used in both directions. it is this logic that determines the plaid pattern\n        vec4 getPlaidColor (float percent) {\n\n            // the large majority will be blank so start with that scenario\n            if (percent > plaidStop11) {\n                return emptyColor;\n            } else if (percent <= plaidStop1) {\n                return mainColor;\n            } else if (percent <= plaidStop2) {\n                return emptyColor;\n            } else if (percent <= plaidStop3) {\n                return mainColor;\n            } else if (percent <= plaidStop4) {\n                return altColor;\n            } else if (percent <= plaidStop5) {\n                return mainColor;\n            } else if (percent <= plaidStop6) {\n                return altColor;\n            } else if (percent <= plaidStop7) {\n                return mainColor;\n            } else if (percent <= plaidStop8) {\n                return altColor;\n            } else if (percent <= plaidStop9) {\n                return mainColor;\n            } else if (percent <= plaidStop10) {\n                return altColor;\n            } else { // save a little time by not checking, this is the last possible case\n                return mainColor;\n            }\n        }\n\n        // distance from line one (slopes down and to the right)\n        const float slopeOne = 1.0;\n        const float yIntOne = 1.0;\n        const float denomOne = sqrt(slopeOne * slopeOne + 1.0);\n        float lineOneDistance(vec2 pt) {\n            return abs(slopeOne * pt.x  -1.0 * pt.y + yIntOne) / denomOne;\n        }\n\n        // distance from line two (slopes up and to the right)\n        const float slopeTwo = -1.0;\n        const float yIntTwo = 0.0;\n        const float denomTwo = sqrt(slopeTwo * slopeTwo + 1.0);\n        float lineTwoDistance(vec2 pt) {\n            return abs(slopeTwo * pt.x  -1.0 * pt.y + yIntTwo) / denomTwo;\n        }\n\n        // method to get the pixel color associated with the first plaid layer\n        vec4 getLineOneTexel(vec2 pt, float vOffset) {\n            return getPlaidColor(\n                mod(lineOneDistance(vec2(pt.x, pt.y)), 1.0)\n            );\n        }\n\n        // method to get the pixel color associated with the second plaid layer\n        vec4 getLineTwoTexel(vec2 pt, float vOffset) {\n            return getPlaidColor(\n                mod(lineTwoDistance(vec2(pt.x, pt.y)), 1.0)\n            );\n        }\n\n        void main() {\n\n            #include <clipping_planes_fragment>\n\n            // we want to increase the number of plaid pattern repitions and provide a tweak so that the scroll offset makes the lines align when it hits 100%\n            vec2 vUvD = vec2(vUv.x * 30.0, vUv.y * 30.0);\n\n            // get the pixel color for each plaid direction\n            vec4 line_one_texel = getLineOneTexel(vUvD, verticalOffset);\n            vec4 line_two_texel = getLineTwoTexel(vUvD, verticalOffset);\n\n            // merge them with an average on the color but combine the opacities\n            vec4 diffuseColor = vec4(vec3((line_one_texel.r + line_two_texel.r)/2.0, (line_one_texel.g + line_two_texel.g)/2.0, (line_one_texel.b + line_two_texel.b)/2.0), (line_one_texel.a + line_two_texel.a));\n\n            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n            vec3 totalEmissiveRadiance = emissive;\n\n            #include <logdepthbuf_fragment>\n            #include <map_fragment>\n            #include <color_fragment>\n            #include <alphamap_fragment>\n            #include <alphatest_fragment>\n            #include <specularmap_fragment>\n            #include <normal_fragment>\n            #include <emissivemap_fragment>\n\n            // accumulation\n            #include <lights_phong_fragment>\n            #include <lights_template>\n\n            // modulation\n            #include <aomap_fragment>\n\n            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n            #include <envmap_fragment>\n\n            gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n\n            #include <tonemapping_fragment>\n            #include <encodings_fragment>\n            #include <fog_fragment>\n            #include <premultiplied_alpha_fragment>\n            #include <dithering_fragment>\n        }\n\n    '].join()
};
var _ = _ || {};
var THREE = THREE || {};

var CanvasBackground;

(function () {

    CanvasBackground = function CanvasBackground(configs_in) {

        var defaults = {};

        var that = this;
        _.extend(that, defaults, configs_in);

        /*=========== PRIVATE VARIABLES / METHODS ============*/

        var canvas;
        var scene;
        var renderer;
        var camera;
        var plaidMaterial;
        var plaidSphere;
        var cameraPoinLight;

        // our magic vertical offset used to animate the background
        var verticalOffset;

        var totalWidth;
        var totalHeight;

        var windowHeight;

        var cameraZScale = d3.scaleLinear().domain([0, 0.5, 1]).range([50, 120, 50]);

        var boxRotationXScale = d3.scaleLinear().domain([0, 0.5, 1]).range([0, -Math.PI / 8, -Math.PI / 4]);

        var doRender = function doRender() {
            renderer.render(scene, camera);
        };

        // here is the main logic for updating the camera position and the verticalOffset uniform that is passed to the custom shaders
        // what's nice is the webgl context only renders when this method is called so no constant GPU hogging
        var vertPercentScrolled;
        var updateScene = function updateScene() {

            // update the vertPercentScrolled and update the uniform variable so the shader can use it
            vertPercentScrolled = verticalOffset / (totalHeight - windowHeight);
            plaidMaterial.uniforms.verticalOffset.value = vertPercentScrolled;

            // easing maps 0-1 percentage into transformed 0-1 percentage
            // then this new eased percentage passed to appropriate scale method defined above
            plaidSphere.rotation.x = boxRotationXScale(vertPercentScrolled);
            camera.position.z = cameraZScale(vertPercentScrolled);

            // a point light that is white will stay with the camera
            // this will create nice gradient background when the sphere is close to the camera
            cameraPoinLight.position.z = camera.position.z;
            cameraPoinLight.position.y = camera.position.y;
            cameraPoinLight.position.x = camera.position.x;

            // wrap the do render here, that way we have as much time as possible to render the scene after the request animation frame callback runs
            // not doing this can cause rendering to occur and push back the next frame which can cause a frame drop
            requestAnimationFrame(doRender);
        };

        var scrollPositionUpdated = function scrollPositionUpdated() {
            verticalOffset = $(window).scrollTop();
            updateScene();
        };

        // need a way to update all the important dimensions when a screen resizes etc..
        var updateDimensions = function updateDimensions() {

            windowHeight = window.innerHeight;

            camera.aspect = window.innerWidth / windowHeight;
            camera.updateProjectionMatrix();

            camera.position.x = 0;
            camera.position.y = 0;
            camera.position.z = 60;

            camera.lookAt(new THREE.Vector3(0, 0, 0));

            $(renderer.domElement).attr('style', 'position: fixed; top: 0; left: 0; width: 100%; height: 100%;');
            renderer.setSize(window.innerWidth, window.innerHeight);

            totalHeight = $('body').height();
            totalWidth = $('body').width();

            scrollPositionUpdated();
        };

        var setupScene = function setupScene() {

            scene = new THREE.Scene();

            renderer = new THREE.WebGLRenderer({ antialias: true });
            $('body').prepend(renderer.domElement).attr('style', 'position: relative;');

            renderer.setClearColor(0xFFFFFF, 1);

            camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 0.1, 1000);

            // base lighting
            var light = new THREE.AmbientLight(0x333333);
            scene.add(light);

            // point light that will move with the camera
            cameraPoinLight = new THREE.PointLight(0x444444, 1.0, 225);
            scene.add(cameraPoinLight);

            // accent point light one
            var pointLightOne = new THREE.PointLight(0x0088FF, 1.0, 60);
            pointLightOne.position.set(30, 12, 12);
            scene.add(pointLightOne);

            // accent point light two
            var pointLightTwo = new THREE.PointLight(0x00FF88, 1.0, 60);
            pointLightTwo.position.set(-30, 12, 12);
            scene.add(pointLightTwo);

            var sphereGeometry = new THREE.SphereGeometry(12, 40, 40);

            var plaidUniforms = THREE.ShaderLib["plaid"].uniforms;

            // our custom shader material that will use the plaid.shader.js logic
            plaidMaterial = new THREE.ShaderMaterial({
                uniforms: plaidUniforms,
                defines: {},
                extensions: {
                    "derivatives": true
                },
                vertexShader: THREE.ShaderLib["plaid"].vertexShader,
                fragmentShader: THREE.ShaderLib["plaid"].fragmentShader,
                fog: false,
                lights: true
            });

            plaidSphere = new THREE.Mesh(sphereGeometry, plaidMaterial);

            scene.add(plaidSphere);
        };

        var setupListeners = function setupListeners() {
            window.addEventListener('resize', updateDimensions, false);
            $(window).scroll(scrollPositionUpdated);
        };

        var initialize = function initialize() {

            setupListeners();

            setupScene();
            updateDimensions();
        };

        /*=========== PUBLIC METHODS / VARIABLES ============*/

        /*=========== INITIIALIZATION ============*/

        initialize();
    };
})();
var _ = _ || {};
var CanvasBackground = CanvasBackground || {};

var main = {};

(function () {

    /*============ PRIVATE VARIABLES AND METHODS ============*/

    /*============ PUBLIC ============*/

    main.start = function () {

        // start up the animated plaid custom shader and ThreeJS scene
        var canvasBackground = new CanvasBackground({
            canvas: $('canvas')
        });

        // cross browser scroll to function
        var scrollTo = function scrollTo(targetTopOffset, duration, callBack) {

            callBack = callBack || $.noop;

            if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
                $('body').animate({ scrollTop: targetTopOffset }, duration, callBack);
            } else {
                $('html,body').animate({ scrollTop: targetTopOffset }, duration, callBack);
            }
        };

        // back to top on mobile
        $('.back-to-top').click(function () {
            scrollTo(0, 0);
        });

        // animated navigation to clicked section
        $('.nav-button').click(function () {

            var element = $(this);
            var target = $(element.attr('data-target'));

            scrollTo(target.offset().top, 900, function () {
                target.attr('tabindex', '-1');
                target.focus();
            });
        });

        // update the mastery items
        $('[data-mastery-percent]').each(function () {

            var masteryItem = $(this);
            var masteryPercent = masteryItem.attr('data-mastery-percent');

            var masteryA11y = $('<span class="sr-only">' + masteryPercent + ' percent proficient</span>');
            masteryItem.append(masteryA11y);

            masteryItem.attr('style', 'width:' + masteryPercent + '%');
        });

        // use the Waypoint library to show the mastery items
        var skillsWaypoint = new Waypoint({
            element: $('.skill-set-group-row'),
            offset: '50%',
            handler: function handler(direction, callee, symbol) {
                $(this.element).addClass('show-groups');
            }
        });

        // use the Waypoint library to show and hide the Back to Top button
        var backToTopWaypoint = new Waypoint({
            element: $('.section-profile'),
            handler: function handler(direction) {

                if (direction === 'down') {
                    $('.back-to-top').addClass('back-to-top-active');
                } else {
                    $('.back-to-top').removeClass('back-to-top-active');
                }
            }
        });
    };
})();