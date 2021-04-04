import { Vector2, Vector3, Raycaster } from 'three'

import { GameObject } from './game.js'

export class Select extends GameObject {
  Init() {
    this.objects = []
    this.objectGroups = {}
    this.ENABLED = false

    this.game.events.RegisterEventListener('OnAddWorldObject', this, ({ object }) => {
      if (object.userData.name.includes('poster')) this.objects.push(object)
      if (object.userData.name.includes('ex:')) {
        this.objects.push(object)
        let slug = this.GetSlug(object)
        if (!this.objectGroups[slug]) this.objectGroups[slug] = []
        this.objectGroups[slug].push(object)
      }
    })

    this.game.events.RegisterEventListener('OnObjectClick', this, ({ object, slug }) => {
      // console.log(slug)
      if (object.userData.name.includes('poster')) {
        open('https://deshowcase.london/events/' + slug)
      }
    })

    this.mouse = new Vector2()

    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    })

    this.raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 5)

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
              slug: this.GetSlug(this.selectedObject),
            })
            document.body.style.cursor = ''
          }

      this.clickObject = null
    })
  }

  GetSlug(object) {
    return object.userData.name.split(':')[1]
  }

  Update() {
    if (!this.ENABLED) return

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.camera)
    const intersects = this.raycaster.intersectObjects(this.objects, true)

    if (intersects.length > 0) {
      if (this.selectedObject !== intersects[0].object) {
        this.selectedObject = intersects[0].object
        let slug = this.GetSlug(this.selectedObject)
        this.game.events.Trigger('OnObjectMouseOver', {
          object: this.selectedObject,
          objects: this.objectGroups[slug],
          slug,
        })
      }
    } else {
      if (this.selectedObject) {
        this.game.events.Trigger('OnObjectMouseLeave', {})
        this.selectedObject = null
      }
    }
  }
}
