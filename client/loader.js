import * as THREE from './three/build/three.module.js'
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js'

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
      opacity: 1,
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

    // Load skybox
    this.Load(
      new GLTFLoader(),
      'assets/build-10.glb',
      (gltf) => {
        //TODO Break all this out into event handlers ----------------------------------------------------------------------------------------------------

        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            if (child.material.map) {
              child.material.map.generateMipmaps = false
              child.material.map.magFilter = THREE.LinearFilter
              child.material.map.minFilter = THREE.LinearFilter
              child.material.map.encoding = THREE.LinearEncoding
            } // This stuff can stay here

            if (child.userData)
              if (child.userData.name) {
                // This stuff needs to go in the Select event handlers
                // For now just broadcast object name. Do we need more info to do API calls and select objects?
                self.game.events.Trigger('OnAddWorldObject', { object: child })

                if (child.userData.name.includes('glass')) child.material = self.glassMaterial
              }
          }
        })

        let scale = 4
        gltf.scene.scale.set(scale, scale, scale)

        this.game.scene.add(gltf.scene)

        // document.getElementById("blocker").style.backgroundColor = "rgba(29, 29, 27, 0)";
        // document.getElementById("blocker").style.cursor = "pointer";
        // document.getElementById("loading-screen").style.display = "none";
        // document.getElementById("instructions").style.display = "none";
        // document.getElementById("name").style.display = "flex";
        // document.getElementById("name-form").addEventListener("submit", play);
        // document.getElementById("name-input").focus()
        // renderer.domElement.style.filter = "blur(10px)";
        // renderer.domElement.style.transition = "filter .5s ease-in-out;"

        // -----------------------------------------------------------------------------------------------------------------------------------------------

        this.game.events.Trigger('OnWorldLoad', {})
      },
      (xhr) => {
        let progress = (xhr.loaded / xhr.total) * 100
        this.game.events.Trigger('WorldLoadProgress', { progress })
      },
      (error) => console.error(error),
    )
  }

  Load(loader, urls, loaded, progress, error) {
    // Wow what an epic function!
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
