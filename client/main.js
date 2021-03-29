import { Game } from './game.js';

import { PostProcessing } from './postprocess.js';
import { Loader } from './loader.js';
import { Multiplayer } from './multiplayer.js';
import { Select } from './select.js';
import { Movement } from './movement.js';
import { Input } from './input.js';
import { UI } from './ui.js';

import { LoadingScreen, NameScreen, InstructionsScreen, EscapeScreen, InfoScreen } from './screen.js';
import { Modal } from './modal.js';
import { Collision } from './collision.js';

import { CannonDebugRenderer } from './cannondebug.js';
import Stats from './three/examples/jsm/libs/stats.module.js';

class OpenHouse extends Game {
    constructor() {
        super(); // In a real "engine" this would be insanely configurable, things are just hardcoded here.

        this.AddGameObject(new Loader());

        this.postProcessing = this.AddGameObject(new PostProcessing());
        this.input = this.AddGameObject(new Input());
        this.collision = this.AddGameObject(new Collision());
        this.movement = this.AddGameObject(new Movement());
        this.select = this.AddGameObject(new Select());
        this.multiplayer = this.AddGameObject(new Multiplayer());
        this.ui = this.AddGameObject(new UI());
        this.events.Trigger("FetchProjectNames", {});

        this.loadingScreen = this.AddGameObject(new LoadingScreen());
        this.nameScreen = this.AddGameObject(new NameScreen());
        this.instructionsScreen = this.AddGameObject(new InstructionsScreen());
        this.escapeScreen = this.AddGameObject(new EscapeScreen());
        this.infoScreen = this.AddGameObject(new InfoScreen());

        this.modal = this.AddGameObject(new Modal());

        // Random stuff too small to put in a separate module:

        this.renderer.domElement.style.touchAction = 'none';

        this.events.RegisterEventListener("ScreenBlurOn", this, () => {
            this.renderer.domElement.style.filter = "blur(20px)";
        });

        this.events.RegisterEventListener("ScreenBlurOff", this, () => {
            this.renderer.domElement.style.filter = "blur(0px)";
        });

        this.debug = new CannonDebugRenderer(this.scene, this.collision.world, {});

        // this.stats = new Stats();
        // this.container.appendChild(this.stats.dom);
    }

    Update(delta) {
        TWEEN.update();

        this.movement.Update(delta);
        this.collision.world.step(delta);
        this.events.Trigger("PostPhysics", {})
        // this.debug.update();

        this.select.Update();
        this.postProcessing.Update();
        // this.stats.update();
    }
}

let exhibition = new OpenHouse();

function Update() {
    requestAnimationFrame(Update);

    const delta = exhibition.clock.getDelta();

    exhibition.Update(delta);
}

Update();