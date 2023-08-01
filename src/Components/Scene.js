import { useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
//import {} from 'three/examples/jsm/postprocessing/'
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import vertex from "./VertexShader";
import fragment from "./FragmentShader";
import Animations from "./Animations";
import * as TWEEN from "@tweenjs/tween.js";
import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { Refractor } from "three/examples/jsm/objects/Refractor";
import { WaterRefractionShader } from "three/examples/jsm/shaders/WaterRefractionShader";
import { SSREffect } from "screen-space-reflections"
function Scene() {
  let torusArray = [];

  useEffect(() => {
    // THREE.ColorManagement.enabled = true;
    let materials = {};
    let unrealbloompass;
    /* --------------------------- Creating the scene --------------------------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3100c08);
    /* ---------------------- creating canvas and renderer ---------------------- */
    const canvas = document.querySelector(".canvas");
    const renderer = new THREE.WebGL1Renderer({
      canvas,
      antialias: true,
      stencil: false,
      depth: false,
    });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    /* ----------------------------- create material ---------------------------- */
    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const material = new THREE.MeshStandardMaterial({
      emissive: 0xffffff,
      emissiveIntensity: 1,
      color: 0xffffff,
    });
    /* ------------------------------- add camera ------------------------------- */
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.offsetWidth / canvas.offsetHeight,
      1,
      10000
    );
    camera.position.set(-100, 60, 700);
    camera.lookAt(0, 0, 0);
    /* ---------------- create plane geometry and adding texture ---------------- */
    const geometry = new THREE.PlaneGeometry(5000, 5000);
    const torusgeometry = new THREE.TorusGeometry(200, 4, 30, 200, Math.PI);
    const animationGroup = new THREE.AnimationObjectGroup();
    material.needsUpdate = true;
    const torus = new THREE.Mesh(torusgeometry, material);
    torus.userData.material = "bloom";
    torus.position.z = 700;
    torus.position.y = -1;
    generateTorus(0);
    const texture = new THREE.TextureLoader();
    texture.load(
      "./Texture/ground.jpg",

      function (texture) {
        const canvastexture = new THREE.CanvasTexture(new FlakesTexture());
        canvastexture.wrapT = THREE.RepeatWrapping;
        canvastexture.wrapS = THREE.RepeatWrapping;
        canvastexture.repeat.x = 10;
        canvastexture.repeat.y = 6;
        
        let envmaploader = new THREE.PMREMGenerator(renderer);
        let envmap = envmaploader.fromScene(scene, 0, 0.1, 1000);
        const planematerial = new THREE.MeshStandardMaterial({
          mixBlur : 0,
          mixStrength : 1,
          resolution : 256,
          blur : [0, 0],
          minDepthThreshold : 0.9,
          maxDepthThreshold : 1,
          depthScale : 0,
          depthToBlurRatioBias : 0.25,
          mirror : 0,
          distortion : 1,
          mixContrast : 1,
          metalness: 1,
          roughness: 0,
          reflectorOffset : 0,
          bufferSamples : 8,
          reflectivity:1,
         // normalMap: canvastexture,
          planeNormal : new THREE.Vector3(0, 0, 1),
          color: 0x192841,
          envMap: envmap.texture,
          envMapIntensity: 5,
        });

        material.needsUpdate = true;


        console.log(envmap);
      
        const planeMaterial = {
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          metalness: 1,
          roughness: 0,
          color: 0x192841,
          normalMap: canvastexture,
          normalScale: new THREE.Vector2(0.15, 0.15),
          envMap: envmap.texture,
          envMapIntensity: 5,
          premultipliedAlpha: true,
          transparent: true,
          opacity: 0.7,

          reflectivity: 0.9,
        };
        planeMaterial.envMap.needsUpdate=true
        planeMaterial.envMap.needsPMREMUpdate = true
        planeMaterial.needsUpdate = true
        const reflectivematerial = new THREE.MeshPhysicalMaterial(
          planeMaterial
        );
        const plane = new THREE.Mesh(geometry, reflectivematerial);
        plane.rotateX(-Math.PI / 2);
        plane.receiveShadow = true;
      
        const refractor = new Refractor(geometry, {
          color: 0x999999,
          textureHeight: 1024 * window.devicePixelRatio,
          textureHeight: 1024 * window.devicePixelRatio,
         
          //	shader: WaterRefractionShader
        });

        refractor.position.set(0, 1, 0);
        refractor.rotateX(-Math.PI / 2);
        //refractor.userData.material='bloom'
        //scene.add( refractor );
        const groundMirror = new Reflector(geometry, {
          clipBias: 0.003,
          // textureWidth: window.innerWidth * window.devicePixelRatio,
          // textureHeight: window.innerHeight * window.devicePixelRatio,
          textureWidth: 1024 * window.devicePixelRatio,
          textureHeight: 1024 * window.devicePixelRatio,
          color: 0xffffff,
          transparent:true
          
          // opacity:.6,
          // recursion:1
        });
        
        groundMirror.position.y = -1;
        groundMirror.rotateX(-Math.PI / 2);
        groundMirror.userData.material = "bloom";
        // groundMirror.material.transparent = true;
        groundMirror.material.alpha = 0.1;
       // groundMirror.receiveShadows = true;
        //groundMirror.matrixWorldNeedsUpdate=true
       
        scene.add( groundMirror );
        console.log(groundMirror)
        plane.position.y=.1
      scene.add(plane);
      },

      undefined,

      function (err) {
        console.error("An error happened.", err);
      }
    );

    /* --------------------------------- testing -------------------------------- */
    const cgeometry = new THREE.BoxGeometry(100, 100, 10);
    const cmaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cube = new THREE.Mesh(cgeometry, cmaterial);
    const t = new THREE.TorusGeometry(200, 4, 30, 200, Math.PI);

    const to = new THREE.Mesh(t, cmaterial);
    to.userData.material = "bloom";
    to.position.y = -10;
    to.position.z = -400;
    cube.position.set(10, 0, 10);
    //scene.add(to)
    //scene.add( cube );
    /* ------------------------ adding light to the scene ----------------------- */
    const light = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.castShadow = true;
    directionalLight.position.set(30, 50, -100);
    scene.add(directionalLight);
    const pointlight = new THREE.PointLight(0xffffff, 1);
    pointlight.position.set(0, 100, 40);

    const hemilight = new THREE.HemisphereLight(0xffffbb, 0xffffff, 1);
    hemilight.position.y = 100;
    // scene.add( hemilight );
    //scene.add( pointlight );
    /* -------------------------- adding torus geometry ------------------------- */
    // const torusgeometry = new THREE.TorusGeometry(200, 4, 30, 200, Math.PI);
    // const animationGroup = new THREE.AnimationObjectGroup();
    // material.needsUpdate = true;
    // const torus = new THREE.Mesh(torusgeometry, material);
    // torus.userData.material = "bloom";
    // torus.position.z = 700;
    // torus.position.y = -1;
    //scene.add(torus);
    // torusArray.push(torus);
    // animationGroup.add(torus);

    function generateTorus(i) {
      const newTorus = torus.clone();
      newTorus.geometry = torusgeometry;
      newTorus.material = material;
      newTorus.material.needsUpdate = true;
      //newTorus.castShadow = true;
      newTorus.position.set(0, -1, torus.position.z - i * 230);

      torusArray.push(newTorus);
      animationGroup.add(newTorus);
      scene.add(newTorus);
      newTorus.visible=false
      

      if (i < 11) {
        generateTorus(i + 1);
      } else {
        return;
      }
    }
    // generateTorus(0);
    let i = torusArray.length - 1;
    setInterval(() => {
      if (i > 0) {
        torusArray[i].visible = true;
      } else {
        return;
      }

      i--;
    }, 80);
    /* ---------------------------- post proccessing ---------------------------- */

    const composer = new EffectComposer(renderer);
    composer.renderToScreen = false;
    composer.renderTarget1.texture.encoding = THREE.sRGBEncoding;
    composer.renderTarget2.texture.encoding = THREE.sRGBEncoding;
    composer.addPass(new RenderPass(scene, camera));

    unrealbloompass = new UnrealBloomPass({ x: 1024, y: 1024 }, 0.8, 0, 0.55);
    let pixelRatio = renderer.getPixelRatio();
    
    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.material.uniforms["resolution"].value.x =
      1 / (canvas.offsetWidth * pixelRatio);
    effectFXAA.material.uniforms["resolution"].value.y =
      1 / (canvas.offsetHeight * pixelRatio);
      // const ssrEffect = new SSREffect(scene, camera)
     const pass = new SMAAPass(
       window.innerWidth * renderer.getPixelRatio(),
       window.innerHeight * renderer.getPixelRatio()
     );
    
    
    composer.addPass(unrealbloompass);
    composer.addPass(effectFXAA)
    function darkenNonBloomed(obj) {
      if (obj.isMesh && obj.userData.material !== "bloom") {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
      }
    }
    function restoreMaterial(obj) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: composer.renderTarget2.texture },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        defines: {},
      }),
      "baseTexture"
    );

    finalPass.needsSwap = true;
    // effectFXAA.needsSwap=true
    // effectFXAA.renderToScreen=true
    const finalComposer = new EffectComposer(renderer);
    console.log(effectFXAA)
      // const ssrEffect = new SSREffect(scene, camera)
    
    
    //finalComposer.addPass(ssrEffect)
  

    finalComposer.addPass(new RenderPass(scene, camera));
   
    finalComposer.addPass(finalPass);
    finalComposer.addPass(effectFXAA);
    /* ----------------------------- adding animation ---------------------------- */
    console.log(light.intensity);
    let colorKF;

    colorKF = new THREE.ColorKeyframeTrack(
      ".material.color",
      [0, 1, 2, 3],
      [1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1],
      THREE.LinearInterpolant
    );

    const opacityKF = new THREE.NumberKeyframeTrack(
      ".material.emissiveIntensity",
      [0, 1, 2, 3],
      [1, 0.8, 0.8, 1]
    );
    const clip = new THREE.AnimationClip("default", 4, [colorKF, opacityKF]);
    const mixer = new THREE.AnimationMixer(animationGroup);

    const clipAction = mixer.clipAction(clip);
    clipAction.setDuration(4);
    clipAction.play();

    /* ----------------------------- animation frame ---------------------------- */
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      scene.traverse(darkenNonBloomed);
      composer.render();
      scene.traverse(restoreMaterial);
      finalComposer.render();

      TWEEN.update();
      controls.dampingFactor = 0.5;
      controls.enableDamping = true;
      controls.keyPanSpeed = 230;
      controls.maxDistance = 400;
      controls.minDistance = 10;
      controls.update();
      const delta = clock.getDelta();

      if (mixer) {
        //mixer.update(delta);
      }
    }
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = 0; // radians
    controls.maxPolarAngle = Math.PI / 2.1; // radians
    controls.target = new THREE.Vector3(0, 0, 0);
    controls.update();
    /* ---------------------------- animation testing --------------------------- */
    Animations.LightAnimation(torusArray);
    Animations.CameraAnimation(controls);
    animate();
  }, []);

  return (
    <>
      <div className="canvas-container">
        {" "}
        <canvas className="canvas"></canvas>
      </div>
    </>
  );
}

export default Scene;
