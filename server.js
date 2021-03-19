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
            this.clients[socket.id] = { color: {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)} };
            // console.log(this.clients);
            console.log("A user connected: " + socket.id);
            socket.emit("id", socket.id);

            socket.on("disconnect", () => {
                console.log("Socket disconnected: " + socket.id);
                if (this.clients && this.clients[socket.id]) {
                    delete this.clients[socket.id];
                    this.io.emit("removeClient", socket.id);
                }
            });

            socket.on("update", (message) => {
                if (this.clients[socket.id]) {
                    this.clients[socket.id].position = message.position;
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