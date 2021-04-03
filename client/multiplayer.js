import { io } from 'socket.io-client'

import * as THREE from 'three/build/three.module.js'
import { GameObject } from './game.js'

import { SpriteText } from './spritetext.js'

export class Multiplayer extends GameObject {
  Init() {
    this.geometry = new THREE.SphereGeometry(0.25, 32, 32)

    this.socket = io()
    this.sId = ''
    this.name

    this.clientMeshes = {}

    this.socket.on('connect', function () {
      console.log('Connected.')
    })

    this.socket.on('disconnect', function (message) {
      console.log('Disconnected: ' + message)
    })

    this.socket.on('login', (message) => {
      this.name = message.name
      // if (this.name.includes('Speedy')) {
      //   this.game.movement.movementSettings.maxVelGround *= 5
      //   this.game.movement.movementSettings.friction *= 0.25
      // }
      console.log('Logged in with name ' + message.name)

      this.game.events.Trigger('Login', {})

      setInterval(() => {
        this.socket.emit('update', {
          position: this.game.movement.controls.getObject().position,
          name: this.name,
        })
      })
    })

    this.socket.on('id', (id) => {
      this.sId = id

      if (this.name) {
        this.socket.emit('name', { name: this.name })
      }
    })

    this.game.events.RegisterEventListener('NameAdd', this, ({ name }) => {
      this.socket.emit('name', { name })
    })

    this.socket.on('clients', (clients) => {
      Object.keys(clients).forEach((c) => {
        if (!this.clientMeshes[c] && c !== this.sId) {
          const group = new THREE.Group()

          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(
              `rgb(${clients[c].color.r}, ${clients[c].color.g}, ${clients[c].color.b})`,
            ),
          })
          material.opacity = 0.3
          material.transparent = true
          const playerSphere = new THREE.Mesh(this.geometry, material)
          group.add(playerSphere)

          let clientName = clients[c].name

          if (clientName.length > 0) {
            const nameTag = new SpriteText(clients[c].name)
            nameTag.fontFace = 'Helvetica Neue'
            nameTag.fontSize = 200
            let scale = 1000
            nameTag.scale.set(nameTag._canvas.width / scale, nameTag._canvas.height / scale, 1)
            nameTag.position.y = 0.4
            group.add(nameTag)
          }

          group.name = c

          this.clientMeshes[c] = group
          this.game.scene.add(this.clientMeshes[c])
        } else {
          if (clients[c].position && c !== this.sId) {
            let pos = this.clientMeshes[c].position
            let target = clients[c].position

            new TWEEN.Tween(pos)
              .to(target, 50)
              .onUpdate(() => {
                this.clientMeshes[c].position.x = pos.x
                this.clientMeshes[c].position.y = pos.y
                this.clientMeshes[c].position.z = pos.z
              })
              .start()
          }
        }
      })
    })

    this.socket.on('removeClient', (id) => {
      this.game.scene.remove(this.game.scene.getObjectByName(id))
    })
  }
}
