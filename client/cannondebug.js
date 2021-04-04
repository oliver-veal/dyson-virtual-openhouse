import {
  MeshBasicMaterial,
  SphereGeometry,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  BufferGeometry,
  Mesh,
  Float32BufferAttribute,
} from 'three'

import { Vec3, Sphere, Box, Plane, ConvexPolyhedron, Trimesh, Heightfield, Shape } from 'cannon'
/**
 * Adds Three.js primitives into the scene where all the Cannon bodies and shapes are.
 * @class CannonDebugRenderer
 * @param {THREE.Scene} scene
 * @param {CANNON.World} world
 * @param {object} [options]
 */
export var CannonDebugRenderer = function (scene, world, options) {
  options = options || {}

  this.scene = scene
  this.world = world

  this._meshes = []

  this._boxMaterial = new MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
  this._triMaterial = new MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  this._sphereMaterial = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

  this._sphereGeometry = new SphereGeometry(1)
  this._boxGeometry = new BoxGeometry(1, 1, 1)
  this._planeGeometry = new PlaneGeometry(10, 10, 10, 10)
  this._cylinderGeometry = new CylinderGeometry(1, 1, 10, 10)
}

CannonDebugRenderer.prototype = {
  tmpVec0: new Vec3(),
  tmpVec1: new Vec3(),
  tmpVec2: new Vec3(),
  tmpQuat0: new Vec3(),

  update: function () {
    var bodies = this.world.bodies
    var meshes = this._meshes
    var shapeWorldPosition = this.tmpVec0
    var shapeWorldQuaternion = this.tmpQuat0

    var meshIndex = 0

    for (var i = 0; i !== bodies.length; i++) {
      var body = bodies[i]

      for (var j = 0; j !== body.shapes.length; j++) {
        var shape = body.shapes[j]

        this._updateMesh(meshIndex, body, shape)

        var mesh = meshes[meshIndex]

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition)
          body.position.vadd(shapeWorldPosition, shapeWorldPosition)

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion)

          // Copy to meshes
          mesh.position.copy(shapeWorldPosition)
          mesh.quaternion.copy(shapeWorldQuaternion)
        }

        meshIndex++
      }
    }

    for (var i = meshIndex; i < meshes.length; i++) {
      var mesh = meshes[i]
      if (mesh) {
        this.scene.remove(mesh)
      }
    }

    meshes.length = meshIndex
  },

  _updateMesh: function (index, body, shape) {
    var mesh = this._meshes[index]
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh)
      }
      mesh = this._meshes[index] = this._createMesh(shape)
    }
    this._scaleMesh(mesh, shape)
  },

  _typeMatch: function (mesh, shape) {
    if (!mesh) {
      return false
    }
    var geo = mesh.geometry
    return (
      (geo instanceof SphereGeometry && shape instanceof Sphere) ||
      (geo instanceof BoxGeometry && shape instanceof Box) ||
      (geo instanceof PlaneGeometry && shape instanceof Plane) ||
      (geo.id === shape.geometryId && shape instanceof ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof Trimesh) ||
      (geo.id === shape.geometryId && shape instanceof Heightfield)
    )
  },

  _createMesh: function (shape) {
    var mesh

    var yellow = this._sphereMaterial
    var cyan = this._boxMaterial
    var purple = this._triMaterial

    switch (shape.type) {
      case Shape.types.SPHERE:
        mesh = new Mesh(this._sphereGeometry, yellow)
        break

      case Shape.types.BOX:
        mesh = new Mesh(this._boxGeometry, cyan)
        break

      case Shape.types.PLANE:
        mesh = new Mesh(this._planeGeometry, yellow)
        break

      case Shape.types.CONVEXPOLYHEDRON:
        // // Create mesh
        const geometry = new BufferGeometry()

        let vertices = []

        for (let i = 0; i < shape.vertices.length; i++) {
          let v = shape.vertices[i]
          vertices.push(v.x)
          vertices.push(v.y)
          vertices.push(v.z)
        }

        let indices = []

        for (let i = 0; i < shape.faces.length; i++) {
          let v = shape.faces[i]
          indices.push(v[0])
          indices.push(v[1])
          indices.push(v[2])
        }

        geometry.setIndex(indices)
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))

        mesh = new Mesh(geometry, cyan)
        shape.geometryId = geometry.id
        break

      case Shape.types.TRIMESH:
        // var geometry = new THREE.BufferGeometry();
        // var v0 = this.tmpVec0;
        // var v1 = this.tmpVec1;
        // var v2 = this.tmpVec2;
        // for (var i = 0; i < shape.indices.length / 3; i++) {
        //     shape.getTriangleVertices(i, v0, v1, v2);
        //     geometry.vertices.push(
        //         new THREE.Vector3(v0.x, v0.y, v0.z),
        //         new THREE.Vector3(v1.x, v1.y, v1.z),
        //         new THREE.Vector3(v2.x, v2.y, v2.z)
        //     );
        //     var j = geometry.vertices.length - 3;
        //     geometry.faces.push(new THREE.Face3(j, j+1, j+2));
        // }
        // geometry.computeBoundingSphere();
        // geometry.computeFaceNormals();
        // mesh = new THREE.Mesh(geometry, purple);
        // shape.geometryId = geometry.id;
        break

      // case CANNON.Shape.types.HEIGHTFIELD:
      //     var geometry = new THREE.Geometry();

      //     var v0 = this.tmpVec0;
      //     var v1 = this.tmpVec1;
      //     var v2 = this.tmpVec2;
      //     for (var xi = 0; xi < shape.data.length - 1; xi++) {
      //         for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
      //             for (var k = 0; k < 2; k++) {
      //                 shape.getConvexTrianglePillar(xi, yi, k===0);
      //                 v0.copy(shape.pillarConvex.vertices[0]);
      //                 v1.copy(shape.pillarConvex.vertices[1]);
      //                 v2.copy(shape.pillarConvex.vertices[2]);
      //                 v0.vadd(shape.pillarOffset, v0);
      //                 v1.vadd(shape.pillarOffset, v1);
      //                 v2.vadd(shape.pillarOffset, v2);
      //                 geometry.vertices.push(
      //                     new THREE.Vector3(v0.x, v0.y, v0.z),
      //                     new THREE.Vector3(v1.x, v1.y, v1.z),
      //                     new THREE.Vector3(v2.x, v2.y, v2.z)
      //                 );
      //                 var i = geometry.vertices.length - 3;
      //                 geometry.faces.push(new THREE.Face3(i, i+1, i+2));
      //             }
      //         }
      //     }
      //     geometry.computeBoundingSphere();
      //     geometry.computeFaceNormals();
      //     mesh = new THREE.Mesh(geometry, purple);
      //     shape.geometryId = geometry.id;
      //     break;
    }

    if (mesh) {
      this.scene.add(mesh)
    }

    return mesh
  },

  _scaleMesh: function (mesh, shape) {
    switch (shape.type) {
      case Shape.types.SPHERE:
        var radius = shape.radius
        mesh.scale.set(radius, radius, radius)
        break

      case Shape.types.BOX:
        mesh.scale.copy(shape.halfExtents)
        mesh.scale.multiplyScalar(2)
        break

      case Shape.types.CONVEXPOLYHEDRON:
        // mesh.scale.copy(shape.scale);
        break

      case Shape.types.TRIMESH:
        // mesh.scale.copy(shape.scale);
        break

      case Shape.types.HEIGHTFIELD:
        mesh.scale.set(1, 1, 1)
        break
    }
  },

  clearMeshes: function () {
    this._meshes.forEach((mesh) => {
      this.scene.remove(mesh)
    })
  },
}
