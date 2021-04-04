import { WebGLRenderer, PerspectiveCamera, Scene, AmbientLight, Clock } from 'three'

export class Game {
  constructor() {
    // game objects
    // event handlers

    this.gameObjects = []
    this.events = new Events()

    // container
    // renderer
    // camera
    // scene
    // clock

    this.container = document.createElement('div')
    document.body.appendChild(this.container)

    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.container.appendChild(this.renderer.domElement)

    this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 2000)

    // const axesHelper = new AxesHelper( 5 );
    // this.scene.add( axesHelper );

    this.scene = new Scene()
    this.scene.add(new AmbientLight(0xffffff, 1))

    this.clock = new Clock()

    window.addEventListener('resize', () => {
      const width = window.innerWidth
      const height = window.innerHeight

      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(width, height)
    })
  }

  AddGameObject(gameObject) {
    let index = this.gameObjects.indexOf(gameObject)
    if (index === -1) {
      this.gameObjects.push(gameObject)
      gameObject.Add(this)
    }

    return gameObject
  }

  RemoveGameObject(gameObject) {
    let index = this.gameObjects.indexOf(gameObject)
    if (index > -1) {
      this.gameObjects.splice(index, 1)
      gameObject.Remove()
    }
  }
}

export class GameObject {
  Add(game) {
    this.game = game
    this.Init()
  }

  Remove() {}
  Init() {}
}

export class Events {
  constructor() {
    this.listeners = {}
    this.uniqueId = 0
  }

  RegisterEventListener(eventName, context, listenerFunction) {
    if (!this.listeners[eventName]) this.listeners[eventName] = {}

    let id = this.uniqueId
    this.uniqueId++
    this.listeners[eventName][id] = { context: context, listener: listenerFunction }

    return id
  }

  DeregisterEventListener(eventName, id) {
    if (this.listeners[eventName]) {
      if (this.listeners[eventName][id]) {
        delete this.listeners[eventName][id]
      } else {
        console.log('Failed to remove id: ' + id)
      }
    }
  }

  //If an event handler gets removed while triggering an event (ie button clicks get heard by all buttons, so if 1 button removed another the
  // 2nd button's handler will try to be called, but it has already been removed from the list.)
  //Check if the handler exists before calling it
  Trigger(eventName, event) {
    if (this.listeners[eventName]) {
      Object.keys(this.listeners[eventName]).forEach((id) => {
        let handler = this.listeners[eventName][id]
        if (handler) handler.listener.call(handler.context, event)
      })
    }
  }
}
