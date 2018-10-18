
// create a new set of uniforms based on the default phong shader in THREE
var plaidUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["phong"].uniforms);

// update some of the default uniforms
plaidUniforms.shininess.value = 60;
plaidUniforms.diffuse.value.setHex(0xFFFFFF);
plaidUniforms.specular.value.setHex(0x666666);

// add our custom verticalOffset uniform
plaidUniforms.verticalOffset = {value: 0.0};

// add the plaid shader to the shader lib for use later
THREE.ShaderLib['plaid'] = {

    uniforms: plaidUniforms,

    vertexShader: [`

        #define PHONG

        varying vec3 vViewPosition;
        varying vec2 vUv;

        #ifndef FLAT_SHADED

            varying vec3 vNormal;

        #endif

        #include <common>
        #include <uv_pars_vertex>
        #include <uv2_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <envmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        void main() {

            vUv = uv; // CUSTOMIZATION: This is how we get access to vUv without enabling a "map" in the define section of the shader

            #include <uv_vertex>
            #include <uv2_vertex>
            #include <color_vertex>

            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>

        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

            vNormal = normalize( transformedNormal );

        #endif

            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            #include <displacementmap_vertex>
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>

            vViewPosition = - mvPosition.xyz;

            #include <worldpos_vertex>
            #include <envmap_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>

        }

    `].join(),

    fragmentShader: [`

        #define PHONG

        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform vec3 specular;
        uniform float shininess;
        uniform float opacity;
        uniform float verticalOffset;

        varying vec2 vUv; // CUSTOMIZATION: This is how we get access to vUv without enabling a "map" in the define section of the shader

        #include <common>
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <envmap_pars_fragment>
        #include <gradientmap_pars_fragment>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars>
        #include <lights_phong_pars_fragment>
        #include <shadowmap_pars_fragment>
        #include <bumpmap_pars_fragment>
        #include <normalmap_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>

        // plaid constants
        const float plaidSquare = 1.0 / 9.0;
        const float plaidSpacer = plaidSquare * plaidSquare;
        const float plaidBar = (plaidSquare - 2.0 * plaidSpacer) / 3.0;

        // plaid stop points
        const float plaidStop1 = plaidSquare;                   // main

        const float plaidStop2 = 2.0 * plaidSquare;             // empty

        const float plaidStop3 = 3.0 * plaidSquare - plaidBar;  // main
        const float plaidStop4 = 3.0 * plaidSquare;             // alt

        const float plaidStop5 = 4.0 * plaidSquare;             // main

        const float plaidStop6 = plaidStop5 + plaidBar;         // alt
        const float plaidStop7 = plaidStop6 + plaidSpacer;      // main
        const float plaidStop8 = plaidStop7 + plaidBar;         // alt
        const float plaidStop9 = plaidStop8 + plaidSpacer;      // main
        const float plaidStop10 = plaidStop9 + plaidBar;        // alt

        const float plaidStop11 = plaidStop10 + plaidSquare;    // main

        const float plaidStop12 = plaidSquare * 9.0;            // empty

        // our main plaid colors
        vec4 mainColor = vec4(0.0, 0.0, 0.0, 0.5);
        vec4 altColor = vec4(0.0, 1.0, 0.56471, 0.5);
        vec4 emptyColor = vec4(1.0, 1.0, 1.0, 0.5);

        // method that takes a percentage of the plaid pattern and returns the proper color
        // this logic is used in both directions. it is this logic that determines the plaid pattern
        vec4 getPlaidColor (float percent) {

            // the large majority will be blank so start with that scenario
            if (percent > plaidStop11) {
                return emptyColor;
            } else if (percent <= plaidStop1) {
                return mainColor;
            } else if (percent <= plaidStop2) {
                return emptyColor;
            } else if (percent <= plaidStop3) {
                return mainColor;
            } else if (percent <= plaidStop4) {
                return altColor;
            } else if (percent <= plaidStop5) {
                return mainColor;
            } else if (percent <= plaidStop6) {
                return altColor;
            } else if (percent <= plaidStop7) {
                return mainColor;
            } else if (percent <= plaidStop8) {
                return altColor;
            } else if (percent <= plaidStop9) {
                return mainColor;
            } else if (percent <= plaidStop10) {
                return altColor;
            } else { // save a little time by not checking, this is the last possible case
                return mainColor;
            }
        }

        // distance from line one (slopes down and to the right)
        const float slopeOne = 1.0;
        const float yIntOne = 1.0;
        const float denomOne = sqrt(slopeOne * slopeOne + 1.0);
        float lineOneDistance(vec2 pt) {
            return abs(slopeOne * pt.x  -1.0 * pt.y + yIntOne) / denomOne;
        }

        // distance from line two (slopes up and to the right)
        const float slopeTwo = -1.0;
        const float yIntTwo = 0.0;
        const float denomTwo = sqrt(slopeTwo * slopeTwo + 1.0);
        float lineTwoDistance(vec2 pt) {
            return abs(slopeTwo * pt.x  -1.0 * pt.y + yIntTwo) / denomTwo;
        }

        // method to get the pixel color associated with the first plaid layer
        vec4 getLineOneTexel(vec2 pt, float vOffset) {
            return getPlaidColor(
                mod(lineOneDistance(vec2(pt.x, pt.y)), 1.0)
            );
        }

        // method to get the pixel color associated with the second plaid layer
        vec4 getLineTwoTexel(vec2 pt, float vOffset) {
            return getPlaidColor(
                mod(lineTwoDistance(vec2(pt.x, pt.y)), 1.0)
            );
        }

        void main() {

            #include <clipping_planes_fragment>

            // we want to increase the number of plaid pattern repitions and provide a tweak so that the scroll offset makes the lines align when it hits 100%
            vec2 vUvD = vec2(vUv.x * 30.0, vUv.y * 30.0);

            // get the pixel color for each plaid direction
            vec4 line_one_texel = getLineOneTexel(vUvD, verticalOffset);
            vec4 line_two_texel = getLineTwoTexel(vUvD, verticalOffset);

            // merge them with an average on the color but combine the opacities
            vec4 diffuseColor = vec4(vec3((line_one_texel.r + line_two_texel.r)/2.0, (line_one_texel.g + line_two_texel.g)/2.0, (line_one_texel.b + line_two_texel.b)/2.0), (line_one_texel.a + line_two_texel.a));

            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;

            #include <logdepthbuf_fragment>
            #include <map_fragment>
            #include <color_fragment>
            #include <alphamap_fragment>
            #include <alphatest_fragment>
            #include <specularmap_fragment>

            specularStrength = (0.1 * diffuseColor.r + 0.8 * diffuseColor.g + 0.1 * diffuseColor.b);

            #include <normal_fragment>
            #include <emissivemap_fragment>

            // accumulation
            #include <lights_phong_fragment>
            #include <lights_template>

            // modulation
            #include <aomap_fragment>

            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

            #include <envmap_fragment>

            gl_FragColor = vec4(outgoingLight, diffuseColor.a);

            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }

    `].join()
};