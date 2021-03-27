import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

export class Select extends GameObject {
  Init() {
    //TODO OnAddWorldObject pickable event handler

    this.objects = []

    this.game.events.RegisterEventListener('OnAddWorldObject', this, ({ object }) => {
      if (object.userData.name.includes('poster')) this.objects.push(object)
      if (object.userData.name.includes('ex')) this.objects.push(object)
    })

    this.mouse = new THREE.Vector2()

    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    })

    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 15)

    this.selectedObject = null

    // pointer cursor

    this.game.events.RegisterEventListener('OnObjectMouseOver', this, ({ object }) => {
      document.body.style.cursor = 'pointer'
    })

    this.game.events.RegisterEventListener('OnObjectMouseLeave', this, ({ object }) => {
      document.body.style.cursor = ''
    })

    this.clickObject

    window.addEventListener('mousedown', (event) => {
      if (event.button === 0) if (this.selectedObject) this.clickObject = this.selectedObject
    })

    window.addEventListener('mouseup', (event) => {
      if (event.button === 0)
        if (this.selectedObject)
          if (this.selectedObject === this.clickObject)
            this.game.events.Trigger('OnObjectClick', {
              object: this.selectedObject,
            })

      this.clickObject = null
    })
  }

  Update() {
    this.raycaster.setFromCamera(this.mouse, this.game.camera)
    const intersects = this.raycaster.intersectObjects(this.objects, true)

    if (intersects.length > 0) {
      if (this.selectedObject !== intersects[0].object) {
        this.selectedObject = intersects[0].object
        this.game.events.Trigger('OnObjectMouseOver', {
          object: this.selectedObject,
        })
      }
    } else {
      if (this.selectedObject) {
        this.game.events.Trigger('OnObjectMouseLeave', {
          object: this.selectedObject,
        })
        this.selectedObject = null
      }
      // document.getElementById("blocker").style.cursor = "";
      // renderer.domElement.style.filter = "blur(0px)";
    }
  }
}
