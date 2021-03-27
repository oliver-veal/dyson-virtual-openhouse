import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

class Screen extends GameObject {
  Show() {
    this.element.style.display = 'flex'
  }

  Hide() {
    this.element.style.display = 'none'
  }
}

export class LoadingScreen extends Screen {
  Init() {
    this.element = document.getElementById('loading-screen')
    this.blocker = document.getElementById('blocker')

    this.game.events.RegisterEventListener('WorldLoadProgress', this, ({ progress }) => {
      document.getElementById('progress-bar').style.width = progress + '%'
    })

    this.game.events.RegisterEventListener('OnWorldLoad', this, () => {
      this.Hide()
      this.blocker.style.backgroundColor = 'rgba(255, 255, 255, 0)'
      this.game.events.Trigger('ScreenBlurOn', {})
      this.game.events.Trigger('NameScreenShow', {}) // Done in a separate event to avoid showing both screens at the same time.
    })
  }
}

export class NameScreen extends Screen {
  Init() {
    this.element = document.getElementById('name-screen')
    this.input = document.getElementById('name-input')

    this.game.events.RegisterEventListener('NameScreenShow', this, () => {
      this.Show()
      this.input.focus()
    })

    document.getElementById('name-form').addEventListener('submit', (event) => {
      event.preventDefault()

      this.game.events.Trigger('NameAdd', { name: this.input.value }) //TODO profanity filter

      this.game.events.Trigger('ControlsEnable', {})
      this.game.events.Trigger('ScreenBlurOff', {})
      this.Hide()

      return false
    })
  }
}
