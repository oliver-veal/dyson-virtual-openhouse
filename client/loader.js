import {
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  Cache,
  CubeTextureLoader,
  LinearFilter,
  LinearEncoding,
} from 'three'
import * as localforage from 'localforage/dist/localforage.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { GameObject } from './game.js'

export class Loader extends GameObject {
  /*
   *   Responsible for loading the world and skybox.
   */
  constructor(assetVersion) {
    super()
    this.ASSET_VERSION = assetVersion
  }

  Init() {
    localforage.config({
      name: 'misc_load_file_storage',
      storeName: 'three_cache',
    })

    localforage
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          if (key.includes('assets') && !key.includes(this.GetAssetPath())) {
            console.log('removing ' + key)
            localforage.removeItem(key)
          }
        })
      })
      .catch(function (err) {
        console.log(err)
      })

    Cache.enabled = true

    Cache.add = (key, value, callback) => {
      localforage.setItem(key, value, callback)
    }

    Cache.get = (key, callback) => {
      return localforage.getItem(key, (error, value) => {
        // NOTE By default local storage returns only null, never undefined

        if (value === null) {
          callback(undefined)
        } else {
          this.game.events.Trigger('AssetCacheHit', { key })
          callback(value)
        }
      })
    }

    Cache.remove = (key, callback) => {
      localforage.removeItem(key, callback)
    }

    Cache.clear = () => {
      localforage.clear()
    }

    this.glassMaterial = new MeshPhysicalMaterial({
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
      new CubeTextureLoader(),
      GenerateCubeURLs(this.GetAssetPath() + 'skybox/', '.jpg'),
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
    dracoLoader.setDecoderPath('/draco/')
    dracoLoader.setDecoderConfig({})
    dracoLoader.setWorkerLimit(4)

    loader.setDRACOLoader(dracoLoader)

    // Load skybox
    this.Load(
      loader,
      this.GetAssetPath() + 'scene.glb',
      (gltf) => {
        this.game.events.Trigger('WorldLoadProgress', { progress: 100 })

        let collisionObjects = []
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            if (child.material.map) {
              child.material.map.generateMipmaps = false
              child.material.map.magFilter = LinearFilter
              child.material.map.minFilter = LinearFilter
              child.material.map.encoding = LinearEncoding
              // child.material.map.anisotropy = 16
              // console.log(child.material.map.anisotropy)
            }

            // test if scene is gpu or cpu bound
            // child.material = new MeshBasicMaterial()

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

        gltf.scene.overrideMaterial = new MeshBasicMaterial()

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

  GetAssetPath() {
    return 'assets/' + this.ASSET_VERSION + '/'
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
