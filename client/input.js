import { GameObject } from './game.js';

export class Input extends GameObject {
    Init() {
        window.addEventListener("keydown", (event) => this.Key(true, event.code));
        window.addEventListener("keyup", (event) => this.Key(false, event.code));
    }

    Key(down, code) {
        switch (code) {
            case 'ArrowUp':
            case 'KeyW':
                this.game.events.Trigger("Move", { move: "forward", down })
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.game.events.Trigger("Move", { move: "left", down })
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.game.events.Trigger("Move", { move: "back", down })
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.game.events.Trigger("Move", { move: "right", down })
                break;
            case 'Space':
                this.game.events.Trigger("Move", { move: "jump", down })
                break;
            // case 'ControlLeft':
            //     // Crouch()
            //     movement.crouch = false;
            case "ShiftLeft":
                this.game.events.Trigger("Move", { move: "sprint", down })
        }
    }
}