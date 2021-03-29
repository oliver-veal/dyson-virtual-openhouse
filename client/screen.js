import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'

import './bezier/bezier-easing.min.js'

export class Screen extends GameObject {
  Init(name, display) {
    this.name = name
    this.element = document.getElementById(name + '-screen')
    this.easing = BezierEasing(0, 0, 0.2, 1)
    this.display = display
    this.NUKED = false
    this.opacity = { value: 0 }
    this.element.style.opacity = this.opacity.value
  }

  Show() {
    if (this.NUKED) return

    // let timer = setInterval(() => {
    //     if (op >= 1){
    //         clearInterval(timer);
    //         this.game.events.Trigger(this.name + "FadeIn", {});
    //     }
    //     this.element.style.opacity = this.easing(op);
    //     op += 0.05;
    // }, 10);

    if (this.tween) this.tween.stop()

    this.tween = new TWEEN.Tween(this.opacity)
      .to({ value: 1 }, 200)
      .easing(TWEEN.Easing.Cubic.In)
      .onStart(() => {
        this.element.style.display = this.display
        this.element.opacity = 0
      })
      .onUpdate(() => {
        this.element.style.opacity = this.opacity.value
      })
      .onComplete(() => {
        this.game.events.Trigger(this.name + 'FadeIn', {})
      })
      .start()
  }

  Hide() {
    if (this.NUKED) {
      this.element.style.display = 'none'
      return
    }

    // let timer = setInterval(() => {
    //     if (op <= 0){
    //         clearInterval(timer);
    //         this.element.style.display = "none";
    //         this.game.events.Trigger(this.name + "FadeOut" , {});
    //     }
    //     this.element.style.opacity = op;
    //     op -= 0.05;
    // }, 10);

    if (this.tween) this.tween.stop()

    this.tween = new TWEEN.Tween(this.opacity)
      .to({ value: 0 }, 200)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.element.style.opacity = this.opacity.value
      })
      .onComplete(() => {
        this.element.style.display = 'none'
        this.game.events.Trigger(this.name + 'FadeOut', {})
      })
      .start()
  }
}

export class LoadingScreen extends Screen {
  Init() {
    super.Init('loading', 'flex')

    this.opacity = { value: 1 }
    this.element.style.opacity = this.opacity.value

    this.blocker = document.getElementById('blocker')

    this.game.events.RegisterEventListener('WorldLoadProgress', this, ({ progress }) => {
      document.getElementById('progress-bar').style.width = progress + '%'
    })

    this.game.events.RegisterEventListener('OnWorldLoad', this, () => {
      this.Hide()
      let op = 1 // initial opacity
      let timer = setInterval(() => {
        if (op <= 0) {
          clearInterval(timer)
        }
        this.blocker.style.backgroundColor = `rgba(255, 255, 255, ${this.easing(op)})`
        op -= 0.05
      }, 10)
      // this.blocker.style.backgroundColor = "rgba(255, 255, 255, 0)";
      this.game.events.Trigger('ScreenBlurOn', {})
    })
  }
}

export class NameScreen extends Screen {
  Init() {
    super.Init('name', 'flex')
    this.input = document.getElementById('name-input')
    this.button = document.getElementById('form-submit')
    this.form = document.getElementById('name-form')
    this.hint = document.getElementById('name-hint')

    this.CHARACTER_LIMIT = 20
    this.LOCKED = false

    this.game.events.RegisterEventListener('loadingFadeOut', this, () => {
      this.Show()
      window.setTimeout(() => {
        this.input.focus()
      }, 100)
    })

    document.getElementById('name-form').addEventListener('submit', (event) => {
      event.preventDefault()

      if (!this.LOCKED) {
        console.log('Sending login request')

        this.input.disabled = true
        this.button.disabled = true
        this.hint.innerHTML = 'Logging in...'

        this.game.events.Trigger('NameAdd', { name: this.input.value })
        this.LOCKED = true
      }

      //TODO loading UI stuff

      return false
    })

    this.game.events.RegisterEventListener('Login', this, () => {
      this.game.events.Trigger('ControlsLockEnable', {})
      this.game.events.Trigger('ScreenBlurOff', {})
      this.game.events.Trigger('ShowInstructions', {})

      this.Hide()
    })
  }

  Show() {
    super.Show()

    this.pressHandler = this.input.addEventListener('input', (event) => {
      let name = event.target.value

      if (name.length > this.CHARACTER_LIMIT) {
        name = name.substring(0, this.CHARACTER_LIMIT)
      }

      name = this.ToTitleCase(name)

      if (!/^[a-zA-Z\s]*$/.test(name)) {
        this.hint.innerHTML = 'Only letters and spaces allowed'
        this.hint.classList.add('error')
      } else {
        this.hint.innerHTML = this.CHARACTER_LIMIT - name.length + '/20 remaining'
        this.hint.classList.remove('error')
      }

      event.target.value = name
    })
  }

  ToTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
  }

  Hide() {
    super.Hide()

    this.input.removeEventListener('input', this.pressHandler)
  }
}

export class InstructionsScreen extends Screen {
  Init() {
    super.Init('instructions', 'block')

    this.game.events.RegisterEventListener('ShowInstructions', this, () => {
      this.Show()
    })

    this.game.events.RegisterEventListener('HideInstructions', this, () => {
      this.Hide()
    })

    this.game.events.RegisterEventListener('NukeInstructions', this, () => {
      this.NUKED = true
      this.Hide()
    })

    this.game.events.RegisterEventListener('UnNukeInstructions', this, () => {
      this.NUKED = false
    })
  }
}

export class EscapeScreen extends Screen {
  Init() {
    super.Init('escape', 'flex')

    this.game.movement.controls.addEventListener('lock', () => {
      this.Show()
    })

    this.game.movement.controls.addEventListener('unlock', () => {
      this.Hide()
    })
  }
}

export class InfoScreen extends Screen {
  Init() {
    super.Init('info', 'block')

    this.name = document.getElementById('info-name')
    this.author = document.getElementById('info-author')

    this.names = {}

    this.OPEN = false

    this.game.events.RegisterEventListener('LoadProjectNames', this, ({ data }) => {
      let projects = data.data.entries
      projects.forEach((project) => {
        this.names[project.slug] = {
          title: project.title,
          authors: this.GetNameString(project.contributors),
        }
      })
    })

    this.game.events.RegisterEventListener('OnObjectMouseOver', this, ({ slug }) => {
      if (this.names[slug]) {
        this.name.innerHTML = this.names[slug].title
        this.author.innerHTML = this.names[slug].authors
        this.Show()
        this.OPEN = true
      }
    })

    this.game.events.RegisterEventListener('OnObjectMouseLeave', this, () => {
      this.Hide()
      this.OPEN = false
    })

    this.game.movement.controls.addEventListener('lock', () => {
      if (this.OPEN) this.Show()
    })

    this.game.movement.controls.addEventListener('unlock', () => {
      this.Hide()
    })

    this.game.events.RegisterEventListener('NukeInstructions', this, () => {
      this.NUKED = true
      this.Hide()
    })

    this.game.events.RegisterEventListener('UnNukeInstructions', this, () => {
      this.NUKED = false
      if (this.OPEN) this.Show()
    })
  }

  GetNameString(students) {
    let name = ''
    for (let i = 0; i < students.length; i++) {
      name += students[i].title + ', '
    }
    return name.slice(0, -2)
  }
}
