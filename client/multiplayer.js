import * as THREE from './three/build/three.module.js';
import { TWEEN } from './three/examples/jsm/libs/tween.module.min.js';
import { GameObject } from './game.js';

import { SpriteText } from './spritetext.js';

export class Multiplayer extends GameObject {
    Init() {
        this.geometry = new THREE.SphereGeometry(1, 32, 32);
    
        this.socket = io();
        this.sId =  "";

        this.clientMeshes = {};

        this.socket.on("connect", function () {
            console.log("Connected.");
        });

        this.socket.on("disconnect", function (message) {
            console.log("Disconnected: " + message);
        });

        this.socket.on("id", (id) => {
            this.sId = id;
        });
        
        this.game.events.RegisterEventListener("NameAdd", this, ({ name }) => {
            this.socket.emit("name", { name });
            setInterval(() => {
                this.socket.emit("update", { position: this.game.movement.controls.getObject().position, name }); // Should use an event to get current position but w/e
            });
        });

        this.socket.on("clients", (clients) => {
            Object.keys(clients).forEach((c) => {
                if (!this.clientMeshes[c] && c !== this.sId) {
                    const group = new THREE.Group();

                    const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(`rgb(${clients[c].color.r}, ${clients[c].color.g}, ${clients[c].color.b})`)});
                    material.opacity = 0.3;
                    material.transparent = true;
                    const playerSphere = new THREE.Mesh(this.geometry, material);
                    group.add(playerSphere);

                    let clientName = clients[c].name;

                    if (clientName.length > 0) {
                        const nameTag = new SpriteText(clients[c].name);
                        nameTag.fontFace = "Helvetica Neue";
                        nameTag.fontSize = 1000;
                        let scale = 1500;
                        nameTag.scale.set(nameTag._canvas.width / scale, nameTag._canvas.height / scale, 1);
                        nameTag.position.y = 1.5;
                        group.add(nameTag);
                    }

                    group.name = c;
                    
                    this.clientMeshes[c] = group;
                    this.game.scene.add(this.clientMeshes[c]);
                } else {
                    if (clients[c].position && c !== this.sId) {
                        // new TWEEN.Tween(this.clientMeshes[c].position)
                        // .to({
                        //     x: clients[c].position.x,
                        //     y: clients[c].position.y,
                        //     z: clients[c].position.z
                        // }, 50)
                        // .start()
                        this.clientMeshes[c].position.x = clients[c].position.x;
                        this.clientMeshes[c].position.y = clients[c].position.y;
                        this.clientMeshes[c].position.z = clients[c].position.z;
                        // // TODO interpolate
                    }
                }
            });
        });

        this.socket.on("removeClient", (id) => {
            this.game.scene.remove(this.game.scene.getObjectByName(id));
        });
    }

    // MakeTextSprite( message, parameters )
    // {
    //     if ( parameters === undefined ) parameters = {};
    //     var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Helvetica Neue";
    //     var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 125;
    //     var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 0;
    //     var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:0};
    //     var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:0, g:0, b:0, a:1 };
    //     var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:255, g:255, b:255, a:1.0 };

    //     var canvas = document.createElement('canvas');
    //     var context = canvas.getContext('2d');
    //     context.font = "Bold " + fontsize + "px " + fontface;
    //     var metrics = context.measureText( message );
    //     var textWidth = metrics.width;
    //     canvas.width = textWidth;
    //     canvas.height = fontsize;
    //     console.log(textWidth)

    //     context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
    //     context.strokeStyle = "none";

    //     // context.lineWidth = borderThickness;
    //     // roundRect(context, borderThickness/2, borderThickness/2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

    //     context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    //     // context.fillText( message, borderThickness, fontsize + borderThickness);
    //     context.fillRect(0, 0, textWidth, fontsize)

    //     var texture = new THREE.Texture(canvas) 
    //     texture.needsUpdate = true;

    //     var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
    //     var sprite = new THREE.Sprite( spriteMaterial );
    //     sprite.scale.set(0.005 * fontsize, 0.0025 * fontsize, 0 * fontsize);
    //     return sprite;  
    // }
}