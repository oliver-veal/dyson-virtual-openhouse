import * as THREE from './three/build/three.module.js'

import './cannon/cannon.min.js'

import { GameObject } from './game.js'

export class Collision extends GameObject {
  Init() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, 0, 0)

    this.game.events.RegisterEventListener('GeneratePlayerCollider', this, () => {
      this.player = new CANNON.Body({ mass: 1 })
      let shape = new CANNON.Cylinder(0.25, 0.25, 1, 128)
      this.player.addShape(shape)
      this.player.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
      this.player.fixedRotation = true
      this.player.updateMassProperties()
      this.world.addBody(this.player)
    })

    this.game.events.RegisterEventListener('OnAddCollisionObject', this, ({ object }) => {
      let collisionMesh = new CANNON.Box(
        new CANNON.Vec3(object.scale.x, object.scale.y, object.scale.z),
      )
      let body = new CANNON.Body({ mass: 0 })
      body.addShape(collisionMesh)
      body.position.copy(object.position)
      body.quaternion.copy(object.quaternion)
      this.world.addBody(body)
    })

    this.game.events.RegisterEventListener('MovePlayer', this, ({ p }) => {
      let { x, y, z } = p
      this.player.previousPosition.set(x, y, z)
      this.player.position.set(x, y, z)
      this.player.interpolatedPosition.set(x, y, z)
      this.player.velocity.set(0, 0, 0)
    })

    var stone = new CANNON.Material('stone')
    var stone_stone = new CANNON.ContactMaterial(stone, stone, {
      friction: 0,
      restitution: 0,
    })
    this.world.addContactMaterial(stone_stone)
  }

  CreateConvex(geometry) {
    const vertices = geometry.attributes.position.array
    const indices = geometry.index.array

    let vertexArray = []
    let indexArray = []

    for (let i = 0; i < vertices.length; i += 3) {
      vertexArray.push(new CANNON.Vec3(vertices[i], vertices[i + 1], vertices[i + 2]))
    }

    for (let i = 0; i < indices.length; i += 3) {
      indexArray.push([indices[i], indices[i + 1], indices[i + 2]])
    }

    return new CANNON.ConvexPolyhedron(vertexArray, indexArray)
  }
}
