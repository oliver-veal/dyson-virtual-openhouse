import * as THREE from './three/build/three.module.js';

import './cannon/cannon.min.js';

import { GameObject } from './game.js';

export class Collision extends GameObject {
    Init() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, 0, 0); // TODO use this for jumping gravity
        // this.world.broadphase = new CANNON.GridBroadphase();



        // this.physicsMaterial = new CANNON.Material("slipperyMaterial");
        // this.physicsContactMaterial = new CANNON.ContactMaterial(this.physicsMaterial,
        //     this.physicsMaterial,
        //                                                         0.0, // friction coefficient
        //                                                         0.3  // restitution
        //                                                         );
        // // We must add the contact materials to the world
        // this.world.addContactMaterial(this.physicsContactMaterial);

        // this.game.events.RegisterEventListener("OnAddWorldObject", this, ({ object }) => {
        //     let collisionMesh = this.CreateTrimesh(object.geometry);
        //     let body = new CANNON.Body({type: CANNON.Body.STATIC});
        //     body.addShape(collisionMesh);
        //     body.allowSleep = false;
        //     body.position.copy(object.position);
        //     this.world.addBody(body);
        // });

        this.game.events.RegisterEventListener("GeneratePlayerCollider", this, () => {
            // this.player = new CANNON.Body({mass: 1, material: this.physicsMaterial});
            // // this.player.addShape(new CANNON.Cylinder(1, 1, 5, 30));
            // this.player.addShape(new CANNON.Sphere(1));
            // this.player.allowSleep = false;
            // this.player.fixedRotation = true;
            // this.player.updateMassProperties();
            // this.player.position.y = 10;
            // this.world.addBody(this.player);


            this.player = new CANNON.Body({mass: 1});
            // let shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            let shape = new CANNON.Cylinder(0.25, 0.25, 1, 128);
            this.player.addShape(shape);
            this.player.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
            this.player.fixedRotation = true;
		    this.player.updateMassProperties();
            this.world.addBody(this.player);

            // this.world.addEventListener("beginContact", (e) => {
            //     console.log(e);
            // })

            // this.player.preStep = (body) => {
            //     console.log("pre " + body);
            // }

            // this.player.postStep = (body) => {
            //     console.log("post " + body);
            // }

            // this.player.addEventListener("collide",function(e){
                // console.log("The player just collided with a body!");
                // console.log("Collided with body:",e.body);
                // console.log("Contact between bodies:",e.contact);
            // });
        });

        this.game.events.RegisterEventListener("OnAddCollisionObject", this, ({ object }) => {
            // console.log(object)
            let collisionMesh = new CANNON.Box(new CANNON.Vec3(object.scale.x, object.scale.y, object.scale.z));
            let body = new CANNON.Body({mass: 0});
            body.addShape(collisionMesh);
            body.position.copy(object.position);
            body.quaternion.copy(object.quaternion);
            this.world.addBody(body);
        });

        this.game.events.RegisterEventListener("MovePlayer", this, ({p}) => {
            let {x, y, z} = p;
            this.player.previousPosition.set(x, y, z)
            this.player.position.set(x, y, z)
            this.player.interpolatedPosition.set(x, y, z)
            this.player.velocity.set(0, 0, 0);
            // this.player.quaternion.set(0, 0, 0, 1);
            // console.log(this.player.position);

            // Resolve collisions

            // Broadcast collider position back to controller position

        });

        // let box = new CANNON.Body({mass: 0});
        // let shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        // box.addShape(shape);
        // box.position.set(0, 4, -2);
        // this.world.addBody(box);

        var stone = new CANNON.Material('stone');
        var stone_stone = new CANNON.ContactMaterial(stone, stone, {
          friction: 0,
          restitution: 0
        });
        this.world.addContactMaterial(stone_stone);

        // // Plane -y
        // var planeShapeYmin = new CANNON.Plane();
        // var planeYmin = new CANNON.Body({ mass: 0, material: stone });
        // planeYmin.addShape(planeShapeYmin);
        // planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
        // planeYmin.position.set(0,0,0);
        // this.world.addBody(planeYmin);

        // var planeShapeXmin = new CANNON.Plane();
        // var planeXmin = new CANNON.Body({ mass: 0, material: stone });
        // planeXmin.addShape(planeShapeXmin);
        // planeXmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.PI/2);
        // planeXmin.position.set(-5,0,0);
        // this.world.addBody(planeXmin);
    }

    CreateConvex(geometry) {
        const vertices = geometry.attributes.position.array
        const indices = geometry.index.array;
        
        let vertexArray = [];
        let indexArray = [];

        for (let i = 0; i < vertices.length; i += 3) {
            vertexArray.push(new CANNON.Vec3(vertices[i], vertices[i + 1], vertices[i + 2]));
        }

        for (let i = 0; i < indices.length; i += 3) {
            indexArray.push([indices[i], indices[i + 1], indices[i + 2]]);
        }

        return new CANNON.ConvexPolyhedron(vertexArray, indexArray);
    }
}