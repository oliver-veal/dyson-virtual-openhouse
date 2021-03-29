<<<<<<< HEAD
import {
	Euler,
	EventDispatcher,
	Vector3
} from './three/build/three.module.js';

var PointerLockControls = function ( camera, domElement ) {

	if ( domElement === undefined ) {
		console.warn( 'THREE.PointerLockControls: The second parameter "domElement" is now mandatory.' );
		domElement = document.body;
	}

	this.domElement = domElement;
    this.ENABLED = false;
	this.isLocked = false;

	// Set to constrain the pitch of the camera
	// Range is 0 to Math.PI radians
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	//
	// internals
	//

	var scope = this;
	var changeEvent = { type: 'change' };
	var lockEvent = { type: 'lock' };
	var unlockEvent = { type: 'unlock' };
	var euler = new Euler( 0, 0, 0, 'YXZ' );
	var PI_2 = Math.PI / 2;
	var vec = new Vector3();
    let mouseDown = false; //TODO handle this with the Input component.

    function onMouseDown( event ) {
		if (event.button === 0)
        	mouseDown = true;        
    }
=======
import { Euler, EventDispatcher, Vector3 } from './three/build/three.module.js'
>>>>>>> 608da8afe155951e317501530ea2fda7f252b619

var PointerLockControls = function (camera, domElement) {
  if (domElement === undefined) {
    console.warn('THREE.PointerLockControls: The second parameter "domElement" is now mandatory.')
    domElement = document.body
  }

  this.domElement = domElement
  this.ENABLED = false
  this.isLocked = false

  // Set to constrain the pitch of the camera
  // Range is 0 to Math.PI radians
  this.minPolarAngle = 0 // radians
  this.maxPolarAngle = Math.PI // radians

  //
  // internals
  //

  var scope = this
  var changeEvent = { type: 'change' }
  var lockEvent = { type: 'lock' }
  var unlockEvent = { type: 'unlock' }
  var euler = new Euler(0, 0, 0, 'YXZ')
  var PI_2 = Math.PI / 2
  var vec = new Vector3()
  let mouseDown = false //TODO handle this with the Input component.

  function onMouseDown(event) {
    if (event.button === 0) mouseDown = true
  }

  function onMouseUp(event) {
    if (event.button === 0) mouseDown = false
  }

  let onMouseMove = (event) => {
    // if (!mouseDown || !this.ENABLED) return;
    if (!this.ENABLED) return
    if (scope.isLocked === false) return

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0

    this.RotateCamera(-movementX, -movementY)
  }

  this.RotateCamera = (movementX, movementY) => {
    euler.setFromQuaternion(camera.quaternion)

    euler.y -= -movementX * 0.0015
    euler.x -= -movementY * 0.0015

    euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x))

    camera.quaternion.setFromEuler(euler)

    scope.dispatchEvent(changeEvent)
  }

  this.Enable = function () {
    this.ENABLED = true
  }

  this.Disable = function () {
    this.ENABLED = false
    this.unlock()
  }

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent)

      scope.isLocked = true
    } else {
      scope.dispatchEvent(unlockEvent)

      scope.isLocked = false
    }
  }

  function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
  }

  this.connect = function () {
    scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove)
    scope.domElement.ownerDocument.addEventListener('mousedown', onMouseDown)
    scope.domElement.ownerDocument.addEventListener('mouseup', onMouseUp)
    scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange)
    scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError)
  }

  this.disconnect = function () {
    scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove)
    scope.domElement.ownerDocument.removeEventListener('mousedown', onMouseDown)
    scope.domElement.ownerDocument.addremoveEventListenerEventListener('mouseup', onMouseUp)
    scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange)
    scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError)
  }

  this.dispose = function () {
    this.disconnect()
  }

  this.getObject = function () {
    // retaining this method for backward compatibility
    return camera
  }

  this.getDirection = (function () {
    var direction = new Vector3(0, 0, -1)

    return function (v) {
      return v.copy(direction).applyQuaternion(camera.quaternion)
    }
  })()

  this.moveForward = function (distance) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    vec.setFromMatrixColumn(camera.matrix, 0)
    vec.crossVectors(camera.up, vec)

    camera.position.addScaledVector(vec, distance)
  }

  this.moveRight = function (distance) {
    vec.setFromMatrixColumn(camera.matrix, 0)
    camera.position.addScaledVector(vec, distance)
  }

  this.lock = function () {
    this.domElement.requestPointerLock()
  }

  this.unlock = function () {
    scope.domElement.ownerDocument.exitPointerLock()
  }

  this.connect()
}

PointerLockControls.prototype = Object.create(EventDispatcher.prototype)
PointerLockControls.prototype.constructor = PointerLockControls

export { PointerLockControls }
