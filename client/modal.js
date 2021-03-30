import * as THREE from './three/build/three.module.js'

import { GameObject } from './game.js'
import { Screen } from './screen.js'

export class Modal extends Screen {
  Init() {
    super.Init('modal', 'flex')

    this.blocker = document.getElementById('blocker')

    this.loading = document.getElementById('modal-loading')

    this.contents = document.getElementById('modal-contents')
    this.image = document.getElementById('modal-image')
    this.body = document.getElementById('modal-body')
    this.error = document.getElementById('modal-error')

    this.title = document.getElementById('modal-title')
    this.author = document.getElementById('modal-author')
    this.desc = document.getElementById('modal-desc')
    this.link = document.getElementById('modal-link')
    this.close = document.getElementById('modal-close')

    this.close.addEventListener('click', (event) => {
      this.Hide()
    })

    this.game.events.RegisterEventListener('OpenModal', this, () => {
      this.OpenModalLoading()
    })

    this.game.events.RegisterEventListener('OpenModalWithContents', this, ({ data, slug }) => {
      this.OpenModalWithContents(data, slug)
    })

    this.game.events.RegisterEventListener('SetModalContents', this, ({ data, slug }) => {
      this.contents.style.maxHeight = '500px'
      this.SetModalContents(data, slug)
      this.Loaded()
    })

    this.game.events.RegisterEventListener('SetErrorModal', this, ({ message }) => {
      this.Error(message)
    })
  }

  OpenModalLoading() {
    this.Loading()
    this.Show()
  }

  OpenModalWithContents(data, slug) {
    this.contents.classList.add('notransition')
    this.contents.style.maxHeight = '500px'
    this.contents.offsetHeight
    this.contents.classList.remove('notransition')

    this.SetModalContents(data, slug)
    this.Loaded()
    this.Show()
  }

  Loading() {
    this.contents.classList.add('notransition')
    this.contents.style.maxHeight = '100px'
    this.contents.offsetHeight
    this.contents.classList.remove('notransition')

    this.loading.style.display = 'block'
    this.image.style.display = 'none'
    this.body.style.display = 'none'
    this.error.style.display = 'none'
  }

  Loaded() {
    this.contents.style.maxHeight = '500px'
    this.loading.style.display = 'none'
    this.image.style.display = 'block'
    this.body.style.display = 'block'
    this.error.style.display = 'none'
  }

  Error(message) {
    this.loading.style.display = 'none'
    this.image.style.display = 'none'
    this.body.style.display = 'none'
    this.error.style.display = 'block'
    this.error.innerHTML = message
  }

  SetModalContents(data, slug) {
    let info = data.data.entries[0]
    this.image.style.backgroundImage = `url("${info.thumbnail[0].url}")`
    this.title.innerHTML = info.title
    this.author.innerHTML = this.GetNameString(info.contributors)
    this.desc.innerHTML = this.Truncate(info.description, 150, true)

    this.link.href = info.url //"https://deshowcase.london/projects/course/meng/" + slug;
  }

  Show() {
    super.Show()

    this.blocker.style.display = 'none'

    this.handler = (event) => {
      if (event.button === 0) this.Hide()
    }

    this.escHandler = (event) => {
      if (event.code === 'Escape') {
        // this.game.events.Trigger("UnNukeInstructions", {});
        // this.game.events.Trigger("ShowInstructions", {});
        // this.game.events.Trigger("ControlsDisable", {});
        // this.game.events.Trigger("ControlsLockEnable", {});
        // this.game.events.Trigger("ScreenBlurOff", {});

        this.Hide()
      }
    }

    // document.getElementById("blocker").addEventListener("mouseup", this.handler);
    document.addEventListener('keydown', this.escHandler)

    this.game.events.Trigger('NukeInstructions', {})
    this.game.events.Trigger('ScreenBlurOn', {})
    this.game.events.Trigger('ControlsDisable', {})
    this.game.events.Trigger('ControlsLockDisable', {})
  }

  Hide() {
    super.Hide()

    this.blocker.style.display = 'flex'

    // document.getElementById("blocker").removeEventListener("mouseup", this.handler);
    document.removeEventListener('keydown', this.escHandler)

    this.game.events.Trigger('UnNukeInstructions', {})
    this.game.events.Trigger('ControlsEnable', {})
    this.game.events.Trigger('ControlsLockEnable', {})
    this.game.events.Trigger('ScreenBlurOff', {})
  }

  GetNameString(students) {
    let name = ''
    for (let i = 0; i < students.length; i++) {
      name += students[i].title + ', '
    }
    return name.slice(0, -2)
  }

  Truncate(str, n, useWordBoundary) {
    if (str.length <= n) {
      return str
    }
    const subString = str.substr(0, n - 1)
    return (
      (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + '&hellip;'
    )
  }
}
