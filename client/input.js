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
                this.game.events.Trigger("Move", { move: "panLeft", down })
                break;
            case 'KeyA':
                this.game.events.Trigger("Move", { move: "left", down })
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.game.events.Trigger("Move", { move: "back", down })
                break;
            case 'ArrowRight':
                this.game.events.Trigger("Move", { move: "panRight", down })
                break;
            case 'KeyD':
                this.game.events.Trigger("Move", { move: "right", down })
                break;
        }
    }
}