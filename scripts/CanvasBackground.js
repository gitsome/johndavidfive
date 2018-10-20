var _ = _ || {};
var THREE = THREE || {};

var CanvasBackground;

(function () {

    CanvasBackground = function (configs_in) {

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
        var pointLightOne;
        var pointLightTwo;

        // our magic vertical offset used to animate the background
        var verticalOffset;

        var totalWidth;
        var totalHeight;

        var windowHeight;

        var pointLightXOffset = 30;
        var pointLightYOffset = 12;

        var cameraZScale = d3.scaleLinear()
            .domain([0, 0.5, 1])
            .range([50, 130, 50]);

        var boxRotationXScale = d3.scaleLinear()
            .domain([0, 0.5, 1])
            .range([0, -Math.PI / 8, -Math.PI / 4]);

        var doRender = function () {
            renderer.render(scene, camera);
        };

        // here is the main logic for updating the camera position and the verticalOffset uniform that is passed to the custom shaders
        // what's nice is the webgl context only renders when this method is called so no constant GPU hogging
        var vertPercentScrolled;
        var updateScene = function () {

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

        var scrollPositionUpdated = function () {
            verticalOffset = $(window).scrollTop();
            updateScene();
        };

        // need a way to update all the important dimensions when a screen resizes etc..
        var updateDimensions = function () {

            windowHeight = window.innerHeight;

            camera.aspect = window.innerWidth / windowHeight;
            camera.updateProjectionMatrix();

            camera.position.x = 0;
            camera.position.y = 0;
            camera.position.z = 60;

            camera.lookAt(new THREE.Vector3(0,0,0));

            $(renderer.domElement).attr('style', 'position: fixed; top: 0; left: 0; width: 100%; height: 100%;');
            renderer.setSize(window.innerWidth, window.innerHeight);

            totalHeight = $('body').height();
            totalWidth = $('body').width();

            pointLightXOffset = THREE.Math.mapLinear(totalWidth, 630, 2500, 7, 25);
            pointLightYOffset = THREE.Math.mapLinear(totalWidth, 630, 2500, 2, 12);

            pointLightTwo.position.set(-pointLightXOffset, pointLightYOffset, 13);
            pointLightOne.position.set(pointLightXOffset, pointLightYOffset, 13);

            scrollPositionUpdated();
        };

        var setupScene = function () {

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
            pointLightOne = new THREE.PointLight(0x0088FF, 1.0, 60);
            scene.add(pointLightOne);

            // accent point light two
            pointLightTwo = new THREE.PointLight(0x00FF88, 1.0, 60);
            scene.add(pointLightTwo);

            var sphereGeometry = new THREE.SphereGeometry(12, 40, 40);

            var plaidUniforms = THREE.ShaderLib["plaid"].uniforms;

            // our custom shader material that will use the plaid.shader.js logic
            plaidMaterial = new THREE.ShaderMaterial( {
                uniforms: plaidUniforms,
                defines: {},
                extensions: {
                    "derivatives" : true
                },
                vertexShader: THREE.ShaderLib["plaid"].vertexShader,
                fragmentShader: THREE.ShaderLib["plaid"].fragmentShader,
                fog: false,
                lights: true
            });

            plaidSphere = new THREE.Mesh(sphereGeometry, plaidMaterial);

            scene.add(plaidSphere);
        };

        var setupListeners = function () {
            window.addEventListener('resize', updateDimensions, false);
            $(window).scroll(scrollPositionUpdated);
        };

        var initialize = function () {

            setupListeners();

            setupScene();
            updateDimensions();
        };


        /*=========== PUBLIC METHODS / VARIABLES ============*/


        /*=========== INITIIALIZATION ============*/

        initialize();
    };

})();