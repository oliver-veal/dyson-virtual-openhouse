const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const port = 3000;

class App {
    constructor(port) {
        this.port = port;
        this.clients = {};


        const app = express();

        app.use(express.static(path.join(__dirname, "./client")));
        app.use("/three/build", express.static(path.join(__dirname, "./node_modules/three/build")));
        app.use("/three/examples", express.static(path.join(__dirname, "./node_modules/three/examples")));

        this.server = new http.Server(app);

        this.io = new Server(this.server);

        this.io.on("connection", (socket) => {
            // console.log(socket.constructor.name);
            // console.log(this.clients);
            console.log("A user connected: " + socket.handshake.address);
            socket.emit("id", socket.id);
            
            socket.on("disconnect", () => {
                console.log("Socket disconnected: " + socket.handshake.address.address);
                if (this.clients && this.clients[socket.id]) {
                    console.log("User disconnected: " + this.clients[socket.id].name);
                    delete this.clients[socket.id];
                    this.io.emit("removeClient", socket.id);
                }
            });
            
            socket.on("name", (message) => {
                this.clients[socket.id] = { name: message.name, color: {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)} };
                console.log(message.name + " connected with IP " + socket.handshake.address.address);
                console.log(Object.keys(this.clients).length + " connected users.");
            })

            socket.on("update", (message) => {
                if (this.clients[socket.id]) {
                    this.clients[socket.id].position = message.position;
                    this.clients[socket.id].name = message.name;
                }
            })
        });

        setInterval(() => {
            this.io.emit("clients", this.clients);
        }, 50);
    }

    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}

new App(port).Start();