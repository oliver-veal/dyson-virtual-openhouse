import * as THREE from 'three/build/three.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { GameObject } from './game.js'

export class Loader extends GameObject {
  /*
   *   Responsible for loading the world and skybox.
   */

  Init() {
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x002222,
      metalness: 0,
      roughness: 0,
      alphaTest: 0.5,
      // envMap: texture,
      envMapIntensity: 1,
      depthWrite: false,
      transmission: 0.85,
      opacity: 0.5,
      transparent: true,
    })

    // Load skybox
    this.Load(
      new THREE.CubeTextureLoader(),
      GenerateCubeURLs('assets/skybox/', '.jpg'),
      (texture) => {
        this.game.scene.background = texture
        this.glassMaterial.envMap = texture
        this.game.envMapTexture = texture
        this.game.events.Trigger('OnLoadSkybox', { texture })
      },
      null,
      (error) => console.error(error),
    )

    let self = this

    const loader = new GLTFLoader()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('./three/examples/js/libs/draco/')
    dracoLoader.setDecoderConfig({})
    dracoLoader.setWorkerLimit(4)

    loader.setDRACOLoader(dracoLoader)

    // Load skybox
    this.Load(
      loader,
      'assets/2.0/sep-01-c3.glb',
      (gltf) => {
        let collisionObjects = []
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            if (child.material.map) {
              child.material.map.generateMipmaps = false
              child.material.map.magFilter = THREE.LinearFilter
              child.material.map.minFilter = THREE.LinearFilter
              child.material.map.encoding = THREE.LinearEncoding
            }

            // test if scene is gpu or cpu bound
            // child.material = new THREE.MeshBasicMaterial()

            if (child.userData)
              if (child.userData.name) {
                if (child.userData.name.includes('collision')) {
                  collisionObjects.push(child)
                  self.game.events.Trigger('OnAddCollisionObject', { object: child })
                } else {
                  self.game.events.Trigger('OnAddWorldObject', { object: child })

                  if (child.userData.name.includes('glass')) {
                    child.material = self.glassMaterial
                    child.geometry.computeVertexNormals()
                  }
                }
              }
          }

        })
        
        gltf.scene.children = gltf.scene.children.filter((e) => {
          return collisionObjects.indexOf(e) < 0
        })

        gltf.scene.overrideMaterial = new THREE.MeshBasicMaterial()
        
        // let scale = 1
        // gltf.scene.scale.set(scale, scale, scale)
        
        this.game.scene.add(gltf.scene)
        this.game.events.Trigger('OnWorldLoad', {})
        dracoLoader.dispose()
      },
      (xhr) => {
        let progress = (xhr.loaded / xhr.total) * 100
        this.game.events.Trigger('WorldLoadProgress', { progress })
      },
      (error) => console.error(error),
    )
  }

  Load(loader, urls, loaded, progress, error) {
    loader.load(urls, loaded, progress, error)
  }
}

// Load Utils

const GenerateCubeURLs = function (prefix, postfix) {
  return [
    prefix + 'px' + postfix,
    prefix + 'nx' + postfix,
    prefix + 'py' + postfix,
    prefix + 'ny' + postfix,
    prefix + 'pz' + postfix,
    prefix + 'nz' + postfix,
  ]
}
