import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

export class Select extends GameObject {
  Init() {
    this.objects = []
    this.ENABLED = false

    this.game.events.RegisterEventListener('OnAddWorldObject', this, ({ object }) => {
      if (object.userData.name.includes('poster')) this.objects.push(object)
      if (object.userData.name.includes('ex:')) {
        this.objects.push(object)
      }
    })

    this.game.events.RegisterEventListener('OnObjectClick', this, ({ object, slug }) => {
      // console.log(slug)
      if (object.userData.name.includes('poster')) {
        open('https://deshowcase.london/events/' + slug)
      }
    })

    this.mouse = new THREE.Vector2()

    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    })

    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 5)

    this.selectedObject = null

    this.game.events.RegisterEventListener('OnObjectMouseOver', this, () => {
      document.body.style.cursor = 'pointer'
      document.getElementById('crosshair').style.fontSize = '35px'
    })

    this.game.events.RegisterEventListener('OnObjectMouseLeave', this, () => {
      document.body.style.cursor = ''
      document.getElementById('crosshair').style.fontSize = '20px'
    })

    this.game.events.RegisterEventListener('ControlsEnable', this, () => {
      this.ENABLED = true
    })

    this.game.events.RegisterEventListener('ControlsDisable', this, () => {
      this.ENABLED = false
      document.body.style.cursor = ''
    })

    this.clickObject

    window.addEventListener('mousedown', (event) => {
      if (event.button === 0) if (this.selectedObject) this.clickObject = this.selectedObject
    })

    window.addEventListener('mouseup', (event) => {
      if (event.button === 0 && this.ENABLED && this.game.movement.controls.isLocked)
        if (this.selectedObject)
          if (this.selectedObject === this.clickObject) {
            this.game.events.Trigger('OnObjectClick', {
              object: this.selectedObject,
              slug: this.selectedObject.userData.name.split(':')[1],
            })
            document.body.style.cursor = ''
          }

      this.clickObject = null
    })
  }

  Update() {
    if (!this.ENABLED) return

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.camera)
    const intersects = this.raycaster.intersectObjects(this.objects, true)

    if (intersects.length > 0) {
      if (this.selectedObject !== intersects[0].object) {
        this.selectedObject = intersects[0].object
        this.game.events.Trigger('OnObjectMouseOver', {
          object: this.selectedObject,
          slug: this.selectedObject.userData.name.split(':')[1],
        })
      }
    } else {
      if (this.selectedObject) {
        this.game.events.Trigger('OnObjectMouseLeave', {
          object: this.selectedObject,
          slug: this.selectedObject.userData.name.split(':')[1],
        })
        this.selectedObject = null
      }
    }
  }
}
