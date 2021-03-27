import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

export class Modal extends GameObject {
  Init() {
    this.element = document.getElementById('modal-container')

    this.image = document.getElementById('modal-image')
    this.title = document.getElementById('modal-title')
    this.author = document.getElementById('modal-author')
    this.desc = document.getElementById('modal-desc')
    this.link = document.getElementById('modal-link')

    this.game.events.RegisterEventListener('OpenModal', this, ({ data, slug }) => {
      if (data.data.entries.length > 0) {
        let info = data.data.entries[0]
        this.image.style.backgroundImage = `url("${info.thumbnail[0].url}")`
        this.title.innerHTML = info.title
        this.author.innerHTML = this.GetNameString(info.students)
        this.desc.innerHTML = this.Truncate(info.description, 150, true)

        this.link.href = 'https://deshowcase.london/projects/course/meng/' + slug

        this.Show()
      }
    })
  }

  Show() {
    this.element.style.display = 'flex'
    this.game.events.Trigger('ControlsDisable', {})
    this.handler = (event) => {
      // if (event.button === 0)
      //     this.Hide();
    }
    this.escHandler = (event) => {
      if (event.code === 'Escape') this.Hide()
    }
    this.element.addEventListener('mouseup', this.handler)
    document.addEventListener('keydown', this.escHandler)
  }

  Hide() {
    this.element.style.display = 'none'
    this.element.removeEventListener('mouseup', this.handler)
    document.removeEventListener('keydown', this.escHandler)
    this.game.events.Trigger('ControlsEnable', {})
  }

  GetNameString(students) {
    let name = ''
    for (let i = 0; i < students.length; i++) {
      name += students[i].name + ', '
    }
    return name.slice(0, -2)
  }

  Truncate(str, n, useWordBoundary) {
    if (str.length <= n) {
      return str
    }
    const subString = str.substr(0, n - 1) // the original check
    return (
      (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + '&hellip;'
    )
  }
}
