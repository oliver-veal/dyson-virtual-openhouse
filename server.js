const express = require('express')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')
const fetch = require('node-fetch')

const port = 3000

class App {
  constructor(port) {
    this.port = port
    this.clients = {}
    this.intervals = {}

    const app = express()

    const cacheHeaders = {
      cacheControl: true,
      maxAge: 604800,
      immutable: true,
    }

    app.use(express.static(path.join(__dirname, './dist'), cacheHeaders))
    app.use('/assets', express.static(path.join(__dirname, './client/assets'), cacheHeaders))
    app.use('/stats', express.static(path.join(__dirname, './client/stats.html')))
    app.use(
      '/draco',
      express.static(
        path.join(__dirname, './node_modules/three/examples/js/libs/draco'),
        cacheHeaders,
      ),
    )

    this.server = new http.Server(app)

    this.io = new Server(this.server, { pingTimeout: 60000, pingInterval: 25000 })

    this.io.on('connection', (socket) => {
      console.log('A user connected: ' + socket.handshake.address)
      socket.emit('id', socket.id)

      socket.on('disconnect', () => {
        console.log('Socket disconnected: ' + socket.handshake.address.address)

        if (this.intervals[socket.id]) {
          clearInterval(this.intervals[socket.id])
          delete this.intervals[socket.id]
        }

        if (this.clients && this.clients[socket.id]) {
          console.log('User disconnected: ' + this.clients[socket.id].name)
          delete this.clients[socket.id]
          this.io.emit('removeClient', socket.id)
        }
      })

      socket.on('name', (message) => {
        let name = message.name

        if (name.length > 0) {
          // verify name

          if (name.length > this.CHARACTER_LIMIT) {
            name = name.substring(0, this.CHARACTER_LIMIT)
          }

          name = this.ToTitleCase(name)

          if (!/^[a-zA-Z\s]*$/.test(name)) {
            name = ''
          }

          // prof filter

          fetch(
            `https://api1-eu.webpurify.com/services/rest/?method=webpurify.live.check&format=json&api_key=6d6ad9e38472fbb9d57c8c1e31cda9e6&text=${name}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          )
            .then((r) => r.json())
            .then((data) => {
              console.log(name, data)
              if (data.rsp) {
                if ('found' in data.rsp) {
                  if (Number(data.rsp.found) === 0) {
                    this.Login(socket, name)
                  } else {
                    console.log('Profanity detected, logging in with blank name.')
                    this.Login(socket, '')
                  }

                  return
                }
              }

              console.log('Error in profanity filter response, logging in with blank name.')
              this.Login(socket, '')
            })
            .catch((error) => {
              console.error(error)
              this.Login(socket, '')
            })
        } else {
          this.Login(socket, '')
        }
      })

      socket.on('update', (message) => {
        if (this.clients[socket.id]) {
          this.clients[socket.id].position = message.position
          this.clients[socket.id].name = message.name
        }
      })

      socket.on('stats', () => {
        this.intervals[socket.id] = setInterval(() => {
          socket.emit('statsupdate', {
            count: Object.keys(this.clients).length,
            users: this.GetUserNames(),
          })
        }, 2000)
      })
    })
  }

  GetUserNames() {
    let userNames = []
    Object.keys(this.clients).forEach((socketid) => {
      let client = this.clients[socketid]
      if (client.name.length > 0) userNames.push(client.name)
    })
    return userNames
  }

  Login(socket, name) {
    this.clients[socket.id] = {
      name,
      color: {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
      },
    }

    console.log(name + ' connected with IP ' + socket.handshake.address.address)
    console.log(Object.keys(this.clients).length + ' connected users.')

    socket.emit('login', { name })

    this.intervals[socket.id] = setInterval(() => {
      socket.emit('clients', this.clients)
    }, 50)
  }

  ToTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
  }

  Start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}.`)
    })
  }
}

new App(port).Start()
