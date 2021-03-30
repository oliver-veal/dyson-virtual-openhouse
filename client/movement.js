import * as THREE from './three/build/three.module.js'

import { PointerLockControls } from './CustomPointerLockControls.js'
import { GameObject } from './game.js'

export class Movement extends GameObject {
  Init() {
    this.controls = new PointerLockControls(this.game.camera, document.body)
    this.game.scene.add(this.controls.getObject())

    this.panSpeed = 0
    this.panMaxSpeed = 10
    this.panAccel = 80

    this.movement = {
      forward: false,
      back: false,
      left: false,
      panLeft: false,
      right: false,
      panRight: false,
      velocity: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      axisDirection: new THREE.Vector3(),
      cameraDirection: new THREE.Vector3(),
      u: new THREE.Vector3(0, 1, 0),
      f: new THREE.Vector3(1, 0, 0),
      d: new THREE.Vector3(0, -1, 0),
    }

    this.movementSettings = {
      groundAccel: 20,
      maxVelGround: 3,
      friction: 10,
    }

    this.game.events.RegisterEventListener('Move', this, ({ move, down }) => {
      this.movement[move] = down
    })

    this.ENABLED = false
    this.LOCK_ENABLED = false

    this.game.events.RegisterEventListener('ControlsEnable', this, () => {
      this.ENABLED = true
      this.controls.Enable()
    })

    this.game.events.RegisterEventListener('ControlsDisable', this, () => {
      this.ENABLED = false
      this.controls.Disable()
    })

    this.game.events.RegisterEventListener('ControlsLockEnable', this, () => {
      this.LOCK_ENABLED = true
    })

    this.game.events.RegisterEventListener('ControlsLockDisable', this, () => {
      this.LOCK_ENABLED = false
    })

    this.game.events.RegisterEventListener('PostPhysics', this, () => {
      let { x, y, z } = this.game.collision.player.position
      this.controls.getObject().position.set(x, y, z)
    })

    document.getElementById('blocker').addEventListener('click', () => {
      if (this.LOCK_ENABLED) this.controls.lock()
    })

    document.getElementById('modal-screen').addEventListener('click', () => {
      if (this.LOCK_ENABLED) this.controls.lock()
    })

    this.controls.addEventListener('lock', () => {
      document.getElementById('crosshair').style.display = 'block'
      this.game.events.Trigger('HideInstructions', {})
      this.game.events.Trigger('ControlsEnable', {})
    })

    this.controls.addEventListener('unlock', () => {
      document.getElementById('crosshair').style.display = 'none'
      this.game.events.Trigger('ShowInstructions', {})
      this.game.events.Trigger('ControlsDisable', {})
    })

    this.game.events.Trigger('GeneratePlayerCollider', {})
  }

  Update(delta) {
    let panWish = 0

    if (this.ENABLED) {
      if (this.movement.panLeft) panWish += 1

      if (this.movement.panRight) panWish += -1
    }

    this.panSpeed += panWish * delta * this.panAccel
    if (panWish == 0) {
      if (this.panSpeed > 0) this.panSpeed = Math.max(this.panSpeed - this.panAccel * delta, 0)
      if (this.panSpeed < 0) this.panSpeed = Math.min(this.panSpeed + this.panAccel * delta, 0)
    }
    this.panSpeed = Math.min(Math.max(this.panSpeed, -this.panMaxSpeed), this.panMaxSpeed)
    this.controls.RotateCamera(this.panSpeed, 0)

    this.GetMovementDirection()
    this.movement.velocity = this.MoveGround(this.movement.direction, this.movement.velocity, delta)

    this.controls.getObject().position.addScaledVector(this.movement.velocity, delta)
    let { x, y, z } = this.controls.getObject().position

    this.game.events.Trigger('MovePlayer', { p: this.controls.getObject().position })

    let speed = this.movement.velocity.length()
    document.getElementById('velocity').innerHTML = Math.round((speed + Number.EPSILON) * 100) / 100
    document.getElementById('pos-x').innerHTML = Math.round((x + Number.EPSILON) * 100) / 100
    document.getElementById('pos-y').innerHTML = Math.round((z + Number.EPSILON) * 100) / 100
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
    this.movement.axisDirection.normalize()

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

    return this.Accelerate(
      accelDir,
      prevVel,
      this.movementSettings.groundAccel,
      this.movementSettings.maxVelGround,
      dt,
    )
  }
}
