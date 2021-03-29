import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js'
import { OutlinePass } from './three/examples/jsm/postprocessing/OutlinePass.js'
import { FXAAShader } from './three/examples/jsm/shaders/FXAAShader.js'
import { VerticalBlurShader } from './three/examples/jsm/shaders/VerticalBlurShader.js'
import { HorizontalBlurShader } from './three/examples/jsm/shaders/HorizontalBlurShader.js'

export class PostProcessing extends GameObject {
  Init() {
    // post-processing

    this.renderScene = new RenderPass(this.game.scene, this.game.camera)

    // let bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.99, 0 );
    // bloomPass.threshold = params.bloomThreshold;
    // bloomPass.strength = params.bloomStrength;
    // bloomPass.radius = params.bloomRadius;

    this.fxaaPass = new ShaderPass(FXAAShader)
    this.SetFXAAPixelRatio = () => {
      const pixelRatio = this.game.renderer.getPixelRatio()
      this.fxaaPass.material.uniforms['resolution'].value.x =
        1 / (this.game.container.offsetWidth * pixelRatio)
      this.fxaaPass.material.uniforms['resolution'].value.y =
        1 / (this.game.container.offsetHeight * pixelRatio)
    }
    this.SetFXAAPixelRatio()

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.game.scene,
      this.game.camera,
    )
    this.outlinePass.edgeThickness = 3.0
    this.outlinePass.edgeStrength = 10.0

    this.composer = new EffectComposer(this.game.renderer)
    this.composer.addPass(this.renderScene)
    this.composer.addPass(this.outlinePass)
    this.composer.addPass(this.fxaaPass)

    // let hblur = new ShaderPass( HorizontalBlurShader );
    // composer.addPass( hblur );

    // let vblur = new ShaderPass( VerticalBlurShader );
    // vblur.renderToScreen = true;
    // composer.addPass( vblur );

    // composer.addPass( bloomPass );

    window.addEventListener('resize', () => {
      const width = window.innerWidth
      const height = window.innerHeight

      this.composer.setSize(width, height)

      this.SetFXAAPixelRatio()
    })

    this.game.events.RegisterEventListener('OnObjectMouseOver', this, ({ object }) => {
      this.outlinePass.selectedObjects = [object]
    })

    this.game.events.RegisterEventListener('OnObjectMouseLeave', this, ({ object }) => {
      this.outlinePass.selectedObjects = []
    })
  }

  Update() {
    this.composer.render()
  }
}
