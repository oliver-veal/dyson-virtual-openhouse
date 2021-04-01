import './cannon/cannon.min.js'

import { GameObject } from './game.js'

export class Collision extends GameObject {
  Init() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, 0, 0)

    this.world.solver.iterations = 20
    this.world.solver.tolerance = 0

    let material = new CANNON.Material('material')
    let contact = new CANNON.ContactMaterial(material, material, {
      friction: 10,
      restitution: 0,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 10000,
      frictionEquationStiffness: 1,
    })

    this.world.addContactMaterial(contact)

    this.game.events.RegisterEventListener('GeneratePlayerCollider', this, () => {
      this.player = new CANNON.Body({ mass: 0.00001, material })
      let shape = new CANNON.Cylinder(0.25, 0.25, 1, 128)
      this.player.addShape(shape)
      this.player.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
      this.player.fixedRotation = true
      this.player.updateMassProperties()
      this.world.addBody(this.player)
      let { x, y, z } = this.game.camera.position
      this.player.position.set(x, y, z)
    })

    this.game.events.RegisterEventListener('OnAddCollisionObject', this, ({ object }) => {
      let collisionMesh = new CANNON.Box(
        new CANNON.Vec3(object.scale.x, object.scale.y, object.scale.z),
      )
      let body = new CANNON.Body({ mass: 0, material })
      body.addShape(collisionMesh)
      body.position.copy(object.position)
      body.quaternion.copy(object.quaternion)
      this.world.addBody(body)
    })

    // let planeShapeYmin = new CANNON.Plane();
    // let planeYmin = new CANNON.Body({ mass: 0, material });
    // planeYmin.addShape(planeShapeYmin);
    // planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    // planeYmin.position.set(0,0,0);
    // this.world.addBody(planeYmin);
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
