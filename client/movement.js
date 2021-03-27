import * as THREE from './three/build/three.module.js'

import { PointerLockControls } from './CustomPointerLockControls.js'
import { GameObject } from './game.js'

export class Movement extends GameObject {
  Init() {
    this.controls = new PointerLockControls(this.game.camera, document.body)
    this.game.scene.add(this.controls.getObject())

    this.movement = {
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
      d: new THREE.Vector3(0, -1, 0),
    }

    this.movementSettings = {
      gravity: 9.81,
      jumpVel: 4,
      groundAccel: 75,
      maxVelGround: 7.5,
      maxVelGroundSprint: 20,
      airAccel: 2,
      maxVelAir: 1,
      friction: 6,
    }

    this.game.events.RegisterEventListener('Move', this, ({ move, down }) => {
      this.movement[move] = down
    })

    this.ENABLED = false

    this.game.events.RegisterEventListener('ControlsEnable', this, () => {
      this.ENABLED = true
      this.controls.Enable()
    })

    this.game.events.RegisterEventListener('ControlsDisable', this, () => {
      this.ENABLED = false
      this.controls.Disable()
    })
  }

  Update(delta) {
    let { height, crouch, jump } = this.movement
    let { jumpVel, gravity } = this.movementSettings

    // Start movement code

    this.movement.velocity.y -= gravity * 3 * delta

    this.GetMovementDirection()

    if (this.movement.grounded) {
      this.movement.velocity = this.MoveGround(
        this.movement.direction,
        this.movement.velocity,
        delta,
      )
    }
    // else
    // 	velocity = MoveAir(direction, velocity, delta);

    height = crouch ? 3 : 6

    if (this.controls.getObject().position.y <= height) {
      this.movement.velocity.y = 0
      this.controls.getObject().position.y = height

      this.movement.grounded = true
    } else {
      this.movement.grounded = false
    }

    if (this.movement.grounded && jump) this.movement.velocity.y = jumpVel * 3

    // Check for collisions with world objects
    // TODO CANNON.js

    // GetWorldCollisions()

    this.controls.getObject().position.addScaledVector(this.movement.velocity, delta)

    let speed = this.movement.velocity.length()
    document.getElementById('velocity').innerHTML = Math.round((speed + Number.EPSILON) * 100) / 100

    // End movement code
  }

  GetMovementDirection() {
    if (!this.ENABLED) {
      this.movement.direction.set(0, 0, 0)
      return
    }

    let { u, f } = this.movement

    this.movement.cameraDirection.setFromMatrixColumn(this.controls.getObject().matrix, 0)
    this.movement.cameraDirection.crossVectors(
      this.controls.getObject().up,
      this.movement.cameraDirection,
    )

    let movForward = Number(this.movement.forward) - Number(this.movement.back)
    let movRight = Number(this.movement.right) - Number(this.movement.left)

    this.movement.axisDirection.set(movForward, 0, movRight)
    this.movement.axisDirection.normalize() // this ensures consistent movements in all directions

    if (movForward === 0 && movRight == 0) this.movement.direction.set(0, 0, 0)
    else {
      this.movement.direction.copy(this.movement.cameraDirection)
      let angle = Math.atan2(
        this.movement.axisDirection.x * f.z - this.movement.axisDirection.z * f.x,
        this.movement.axisDirection.x * f.x + this.movement.axisDirection.z * f.z,
      )
      this.movement.direction.applyAxisAngle(u, angle)
    }
  }

  Accelerate(accelDir, prevVel, accelerate, maxVelocity, dt) {
    let projVel = prevVel.dot(accelDir)
    let accelVel = accelerate * dt

    if (projVel + accelVel > maxVelocity) accelVel = maxVelocity - projVel

    return prevVel.add(accelDir.multiplyScalar(accelVel))
  }

  MoveGround(accelDir, prevVel, dt) {
    let speed = prevVel.length()

    if (speed != 0) {
      let drop = speed * this.movementSettings.friction * dt
      prevVel.multiplyScalar(Math.max(speed - drop, 0) / speed)
    }

    let maxVel = this.movement.sprint
      ? this.movementSettings.maxVelGroundSprint
      : this.movementSettings.maxVelGround

    let max = this.movement.crouch ? 5 : maxVel

    return this.Accelerate(accelDir, prevVel, this.movementSettings.groundAccel, max, dt)
  }

  MoveAir(accelDir, prevVel, dt) {
    return this.Accelerate(
      accelDir,
      prevVel,
      movementSettings.airAccel,
      movementSettings.maxVelAir,
      dt,
    )
  }
}
