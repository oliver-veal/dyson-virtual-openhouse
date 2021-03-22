import * as THREE from './three/build/three.module.js';

import { GUI } from './three/examples/jsm/libs/dat.gui.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js';

import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader.js';
import { FirstPersonControls } from './three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from './CustomPointerLockControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from './three/examples/jsm/postprocessing/OutlinePass.js';
import { CopyShader } from './three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from './three/examples/jsm/shaders/FXAAShader.js';
import { VerticalBlurShader } from './three/examples/jsm/shaders/VerticalBlurShader.js';
import { HorizontalBlurShader } from './three/examples/jsm/shaders/HorizontalBlurShader.js';

import { TWEEN } from './three/examples/jsm/libs/tween.module.min.js'

const DEBUG = true;
let WORLD_LOADED = false;

let container;

let camera, scene, renderer, controls, stats;
let composer, fxaaPass, outlinePass, bloomPass;

let envMapTexture;

let raycaster;
const mouse = new THREE.Vector2();

let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let object;
let clock;

const objects = [];
let selectedObjects = [];

let pickableObjects = [];

const params = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0.99,
    bloomRadius: 0
};

let user = {
    name: ""
}

init();
animate();

function init() {
    clock = new THREE.Clock()

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.toneMapping = THREE.ReinhardToneMapping;
    container.appendChild( renderer.domElement );

    // welcome screen blur



    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 2000 );
    camera.position.y = 5;

    // scene

    scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight( 0xffffff, 1 );
    scene.add( ambientLight );

    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    // performance monitor

    if (DEBUG) {
        stats = new Stats();
        container.appendChild( stats.dom );
    }
    // post-processing

    const renderScene = new RenderPass( scene, camera );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    fxaaPass = new ShaderPass( FXAAShader );
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );

    outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.edgeThickness = 3.0;
    outlinePass.edgeStrength = 10.0;
    
    composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( outlinePass );
    composer.addPass( fxaaPass );

    // let hblur = new ShaderPass( HorizontalBlurShader );
    // composer.addPass( hblur );

    // let vblur = new ShaderPass( VerticalBlurShader );
    // vblur.renderToScreen = true;
    // composer.addPass( vblur );

    // composer.addPass( bloomPass );

    // controls = new OrbitControls( camera, renderer.domElement );
    // controls.minDistance = 1;
    // controls.maxDistance = 50; 
    // controls.enablePan = false;

    // controls

    controls = new PointerLockControls( camera, document.body );

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    blocker.addEventListener( 'click', function () {
        if (WORLD_LOADED) {
            controls.lock();
        }
    } );

    controls.addEventListener( 'lock', function () {
        // instructions.style.display = 'none';
        blocker.style.display = 'none';
    } );

    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'flex';
        // instructions.style.display = '';
    } );

    scene.add( controls.getObject() );

    // event listeners

    window.addEventListener( 'resize', onWindowResize );
    renderer.domElement.style.touchAction = 'none';
    document.addEventListener( 'keydown', keyDown );
    document.addEventListener( 'keyup', keyUp );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 20 );

    // envmap

    const genCubeUrls = function ( prefix, postfix ) {
        return [
            prefix + 'px' + postfix, prefix + 'nx' + postfix,
            prefix + 'py' + postfix, prefix + 'ny' + postfix,
            prefix + 'pz' + postfix, prefix + 'nz' + postfix
        ];
    };

    const urls = genCubeUrls( 'assets/skybox/', '.jpg' );

    new THREE.CubeTextureLoader().load( urls, function ( cubeTexture ) {
        // cubeTexture.encoding = THREE.linear;
        envMapTexture = cubeTexture;
        scene.background = cubeTexture;
    } );

    // load world

    const loader = new GLTFLoader();

    loader.load('assets/build-09.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                if (child.material.map) {
                    child.material.map.generateMipmaps = false;
                    child.material.map.magFilter = THREE.LinearFilter;
                    child.material.map.minFilter = THREE.LinearFilter;
                    child.material.map.encoding = THREE.LinearEncoding;
                }



                objects.push(child);

                if (child.userData)
                    if (child.userData.name)
                        if (child.userData.name.includes("poster"))
                            pickableObjects.push(child);
                        if (child.userData.name.includes("exhibit"))
                            pickableObjects.push(child);
                        else if (child.userData.name.includes("glass")) {
                            const physmat = new THREE.MeshPhysicalMaterial( {
                                color: 0x002222,
                                metalness: 0,
                                roughness: 0,
                                alphaTest: 0.5,
                                envMap: envMapTexture,
                                envMapIntensity: 1,
                                depthWrite: false,
                                transmission: 0.85, // use material.transmission for glass materials
                                opacity: 1, // set material.opacity to 1 when material.transmission is non-zero
                                transparent: true
                            } );
                            child.material = physmat;
                        }
            }
        });

        let scale = 4
        gltf.scene.scale.set(scale, scale, scale)

        scene.add( gltf.scene );

        document.getElementById("blocker").style.backgroundColor = "rgba(29, 29, 27, 0)";
        document.getElementById("blocker").style.cursor = "pointer";
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("instructions").style.display = "none";
        document.getElementById("name").style.display = "flex";
        document.getElementById("name-form").addEventListener("submit", play);
        document.getElementById("name-input").focus()
        renderer.domElement.style.filter = "blur(10px)";
        // renderer.domElement.style.transition = "filter .5s ease-in-out;"
        WORLD_LOADED = true;

        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object
    }, function ( xhr ) {
        let loaded = xhr.loaded / xhr.total * 100;
        document.getElementById("progress-bar").style.width = loaded + "%"
    }, function ( error ) {
        console.log( 'An error happened' );
    });

    // gui

    // if (DEBUG) {

    // 	const gui = new GUI();

    // 	gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
    // 		renderer.toneMappingExposure = Math.pow( value, 4.0 );
    // 	} );

    // 	gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
    // 		bloomPass.threshold = Number( value );
    // 	} );

    // 	gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
    // 		bloomPass.strength = Number( value );
    // 	} );

    // 	gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
    // 		bloomPass.radius = Number( value );
    // 	} );

    // }

    // socket.io

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    
    const socket = io();
    let sId =  "";

    let clientMeshes = {};

    socket.on("connect", function () {
        console.log("Connected.");
    });

    socket.on("disconnect", function (message) {
        console.log("Disconnected: " + message);
    });

    socket.on("id", (id) => {
        sId = id;
        setInterval(() => {
            socket.emit("update", { position: controls.getObject().position });
        });
    });

    socket.on("clients", (clients) => {
        Object.keys(clients).forEach((c) => {
            if (!clientMeshes[c] && c !== sId) {
                const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(`rgb(${clients[c].color.r}, ${clients[c].color.g}, ${clients[c].color.b})`), wireframe: false });
                material.opacity = 0.2;
                material.transparent = true;
                clientMeshes[c] = new THREE.Mesh(geometry, material);
                clientMeshes[c].name = c;
                scene.add(clientMeshes[c]);
            } else {
                if (clients[c].position && c !== sId) {
                    clientMeshes[c].position.x = clients[c].position.x;
                    clientMeshes[c].position.y = clients[c].position.y;
                    clientMeshes[c].position.z = clients[c].position.z;
                    // TODO interpolate
                }
            }
        });
    });

    socket.on("removeClient", (id) => {
        scene.remove(scene.getObjectByName(id));
    });
}

// loading states

function play(event) {
    event.preventDefault()
    renderer.domElement.style.filter = "blur(0px)";
    controls.isReady = true;
    document.getElementById("name").style.display = "none";
    return false;
}

// input

function keyDown() {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW':
            movement.forward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            movement.left = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            movement.back = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            movement.right = true;
            break;
        case 'Space':
            movement.jump = true;
            break;
        case 'ControlLeft':
            // Crouch()
            movement.crouch = false;
        case "ShiftLeft":
            movement.sprint = true;
    }
}

function keyUp() {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW':
            movement.forward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            movement.left = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            movement.back = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            movement.right = false;
            break;
        case 'Space':
            movement.jump = false;
            break;
        case 'ControlLeft':
            movement.crouch = false;
        case "ShiftLeft":
            movement.sprint = false;
    }				
}

// object selection

window.addEventListener("mousemove", (event) => { //TODO use canvas element w/h
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function addSelectedObject( object ) {
    selectedObjects = [];
    selectedObjects.push( object );
    document.getElementById("blocker").style.cursor = "pointer";
    renderer.domElement.style.filter = "blur(10px)";
}

function checkIntersection() {
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( pickableObjects, true );

    if ( intersects.length > 0 ) {
        const selectedObject = intersects[ 0 ].object;
        addSelectedObject( selectedObject );
        outlinePass.selectedObjects = selectedObjects;
    } else {
        outlinePass.selectedObjects = [];
        document.getElementById("blocker").style.cursor = "";
        renderer.domElement.style.filter = "blur(0px)";
    }
}

// window resize

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer.setSize( width, height );

    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
}

// movement

let movement = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    crouch: false,
    grounded: false,
    sprint: false,
    height: 6,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    axisDirection: new THREE.Vector3(),
    cameraDirection: new THREE.Vector3(),
    u: new THREE.Vector3(0, 1, 0),
    f: new THREE.Vector3(1, 0, 0),
    d: new THREE.Vector3(0, -1, 0)
}

let movementSettings = {
    gravity: 9.81,
    jumpVel: 4,
    groundAccel: 75,
    maxVelGround: 7.5,
    maxVelGroundSprint: 20,
    airAccel: 2,
    maxVelAir: 1,
    friction: 6
}

function getMovementDirection() {
    let { direction, axisDirection, cameraDirection, u, f } = movement;

    cameraDirection.setFromMatrixColumn(controls.getObject().matrix, 0)
    cameraDirection.crossVectors(controls.getObject().up, cameraDirection)

    let movForward = Number( movement.forward ) - Number( movement.back );
    let movRight = Number( movement.right ) - Number( movement.left );

    axisDirection.set(movForward, 0, movRight);
    axisDirection.normalize(); // this ensures consistent movements in all directions

    if (movForward === 0 && movRight == 0)
        direction.set(0, 0, 0);
    else {
        direction.copy(cameraDirection);
        let angle = Math.atan2(axisDirection.x*f.z - axisDirection.z*f.x, axisDirection.x * f.x + axisDirection.z*f.z)
        direction.applyAxisAngle(u, angle);
    }
}

function Accelerate(accelDir, prevVel, accelerate, maxVelocity, dt) {
    let projVel = prevVel.dot(accelDir);
    let accelVel = accelerate * dt;

    if (projVel + accelVel > maxVelocity)
        accelVel = maxVelocity - projVel;

    return prevVel.add(accelDir.multiplyScalar(accelVel));
}

function MoveGround(accelDir, prevVel, dt) {
    let speed = prevVel.length()

    if (speed != 0) {
        let drop = speed * movementSettings.friction * dt;
        prevVel.multiplyScalar(Math.max(speed - drop, 0) / speed); 
    }

    let maxVel = movement.sprint ? movementSettings.maxVelGroundSprint : movementSettings.maxVelGround;

    let max = movement.crouch ? 5 : maxVel;

    return Accelerate(accelDir, prevVel, movementSettings.groundAccel, max, dt);
}

function MoveAir(accelDir, prevVel, dt) {
    return Accelerate(accelDir, prevVel, movementSettings.airAccel, movementSettings.maxVelAir, dt);
}

function Crouch() {
    controls.getObject().position.y -= 3;
}

// function GetWorldCollisions() {
// 	raycaster.set(controls.getObject().position, movement.d)
// }

// animate loop

function animate() {
    requestAnimationFrame( animate );

    const delta = clock.getDelta();

    if ( controls.isReady ) {
        let { velocity, direction, grounded, height } = movement;
        let { vMax, jumpVel } = movementSettings;

        // Start movement code

        velocity.y -= movementSettings.gravity * 3 * delta;

        getMovementDirection();

        if (grounded)
            velocity = MoveGround(direction, velocity, delta);
        // else
        // 	velocity = MoveAir(direction, velocity, delta);

        height = movement.crouch ? 3 : 6;
        
        if ( controls.getObject().position.y <= height ) {
            velocity.y = 0;
            controls.getObject().position.y = height;
            
            movement.grounded = true;
        } else {
            movement.grounded = false;
        }
        
        if (movement.grounded && movement.jump) {
            velocity.y = jumpVel * 3;
            console.log("Jump")
        }

        // Check for collisions with world objects

        // GetWorldCollisions()

        controls.getObject().position.addScaledVector(velocity, delta);

        let speed = velocity.length()
        document.getElementById("velocity").innerHTML = Math.round((speed + Number.EPSILON) * 100) / 100;

        // End movement code
    }

    checkIntersection();
    composer.render();
    if (DEBUG)
        stats.update();
}