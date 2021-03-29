class Stats {

    constructor() {
        this.socket = io()
        this.sId = ''
        this.name

        this.clientMeshes = {}

        this.socket.on('connect', () => {
            console.log('Connected.')

            this.socket.emit("stats")
        })

        this.socket.on('disconnect', function (message) {
            console.log('Disconnected: ' + message)
        })

        this.socket.on('statsupdate', (message) => {
            document.getElementById("count").innerHTML = message.count
            document.getElementById("users").innerHTML = this.GetUserString(message.users)
        })
    }

    GetUserString(users) {
        let userString = ''
        users.forEach((user) => {
            userString = userString + user + "<br />"
        });
        return userString
    }
}

new Stats()