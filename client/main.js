import { Game } from './game.js';

import { PostProcessing } from './postprocess.js';
import { Loader } from './loader.js';
import { Multiplayer } from './multiplayer.js';
import { Select } from './select.js';
import { Movement } from './movement.js';
import { Input } from './input.js';
import { UI } from './ui.js';

import { LoadingScreen, NameScreen } from './screen.js';
import { Modal } from './modal.js';

class OpenHouse extends Game {
    constructor() {
        super(); // In a real "engine" this would be insanely configurable, things are just hardcoded here.

        this.AddGameObject(new Loader());

        this.postProcessing = this.AddGameObject(new PostProcessing());
        this.select = this.AddGameObject(new Select());
        this.input = this.AddGameObject(new Input());
        this.movement = this.AddGameObject(new Movement());
        this.multiplayer = this.AddGameObject(new Multiplayer());
        this.ui = this.AddGameObject(new UI());

        this.loadingScreen = this.AddGameObject(new LoadingScreen());
        this.nameScreen = this.AddGameObject(new NameScreen());

        this.modal = this.AddGameObject(new Modal());

        // Random stuff too small to put in a separate module:

        this.renderer.domElement.style.touchAction = 'none'; // TODO What does this do? Is it useful?

        this.events.RegisterEventListener("ScreenBlurOn", this, () => {
            this.renderer.domElement.style.filter = "blur(10px)";
        });

        this.events.RegisterEventListener("ScreenBlurOff", this, () => {
            this.renderer.domElement.style.filter = "blur(0px)";
        });
    }

    Update(delta) {
        this.movement.Update(delta);
        this.select.Update();
        this.postProcessing.Update();
        this.stats.update();
    }
}

let exhibition = new OpenHouse();

function Update() {
    requestAnimationFrame(Update);

    const delta = exhibition.clock.getDelta();

    exhibition.Update(delta);
}

Update(); // This stuff is done outside the OpenHouse class to avoid this-context workarounds.