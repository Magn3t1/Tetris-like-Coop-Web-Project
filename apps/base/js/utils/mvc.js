/**
* @export
*/
class MVC {
	
	constructor(name, app, model, view, controller) {
		/** @export */this.name = name;
		/** @export */this.app = app;
		/** @export */this.model = model || new Model();
		/** @export */this.view = view || undefined;
		/** @export */this.controller = controller || new Controller();
	}
	
	async initialize() {
		trace("init MVC");
		await this.model.initialize(this);
		await this.view.initialize(this);
		await this.controller.initialize(this);
	}
	
}

class ModelBase {
	
	constructor() {
		/** @export */this.name = undefined;
		/** @export */this.mvc = null;
	}
	
	initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-model";
	}
	
}

/**
* @export
*/
class Model extends ModelBase {
	
	constructor() {
		super();
	}
	
	/**
	* @export
	*/
	initialize(mvc) {
		super.initialize(mvc);
	}
}

class ViewBase {
	
	constructor() {
		//console.log("construct view :", name, bounds);
		/** @export */this.name = undefined;
		/** @export */this.mvc = null;
		/** @export */this.parent = null;
		/** @export */this.stage = null;
		this._rect = null;
		this.attached = false;
		this.activated = false;
	}
	
	async initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-view";
		this.create();
	}
	
	create() {
		trace("create", this.name);
		this.stage = document.createElement("div");
		this.stage.style.position = "absolute";
		this.stage.style.left = "0px";
		this.stage.style.top = "0px";
		this.stage.style.width = "100%";
		this.stage.style.height ="100%";
		this.stage.setAttribute("name", "view-" + this.name);
		this._rect = null;
		this.draw();
	}
	
	draw() {
		trace("draw", this.name);
	}
	
	resize() {
		if(this.attached) this._rect = this.stage.getBoundingClientRect();
	}
	
	destroy() {
		trace("destroy", this.name);
		if(this.attached) this.detach();
	}
	
	attach(parent) {
		if(this.attached) return;
		trace("attach", this.name);
		this.parent = parent;
		this.parent.appendChild(this.stage);
		this.attached = true;
		this._rect = this.stage.getBoundingClientRect();
		this.mvc.controller.attached();
	}
	
	detach() {
		if(!this.attached) return;
		trace("detach", this.name);
		this.parent.removeChild(this.stage);
		this.attached = false;
		this.mvc.controller.detached();
	}
	
	activate() {
		trace("activate", this.name);
		this.activated = true;
		this.mvc.controller.activated();
	}
	
	deactivate() {
		trace("deactivate", this.name);
		this.activated = false;
		this.mvc.controller.deactivated();
	}
	
}

/**
* @export
*/
class View extends ViewBase {
	
	constructor() {
		super();
	}
	
	/**
	* @export
	*/
	initialize(mvc) {
		super.initialize(mvc);
	}
	
	/**
	* @export
	*/
	create() {
		super.create();
	}
	
	/**
	* @export
	*/
	destroy() {
		super.destroy();
	}
	
	/**
	* @export
	*/
	draw() {
		super.draw();
	}
	
	/**
	* @export
	*/
	resize() {
		super.resize();
	}
	
	/**
	* @export
	*/
	attach(parent) {
		super.attach(parent);
	}
	
	/**
	* @export
	*/
	detach() {
		super.detach();
	}
	
	/**
	* @export
	*/
	activate() {
		super.activate();
	}
	
	/**
	* @export
	*/
	deactivate() {
		super.deactivate();
	}
	
}

class ControllerBase {
	
	constructor() {
		/** @export */this.name = undefined;
		/** @export */this.mvc = null;
	}
	
	initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-controller";
	}
	
	attached() {
		trace(this.name, "attached");
	}
	
	detached() {
		trace(this.name, "detached");
	}
	
	activated() {
		trace(this.name, "activated");
	}
	
	deactivated() {
		trace(this.name, "deactivated");
	}
}

/**
* @export
*/
class Controller extends ControllerBase {
	
	constructor() {
		super();
	}
	
	/**
	 * @export
	 */
	initialize(mvc) {
		super.initialize(mvc);
	}
	
	/**
	 * @export
	 */
	attached() {
		super.attached();
	}
	
	/**
	 * @export
	 */
	detached() {
		super.detached();
	}
	
	/**
	 * @export
	 */
	activated() {
		super.activated()
	}
	
	/**
	 * @export
	 */
	deactivated() {
		super.deactivated();
	}
}