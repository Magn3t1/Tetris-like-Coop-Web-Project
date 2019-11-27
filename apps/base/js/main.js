//NOTE :
/*


Date.now() pour récuperer le temps actuel

fs (file system)
createReadStream

users.json
[
{
	id:1, name:"blabla",...	

}
]

*/



window.addEventListener("load", event => new Base());

class Base {

	constructor() {
		console.log("loaded");

		this.initialize();
	}

	async initialize() {

		this.iospace = "baseapp"; // IO namespace for this app
		this.io = io.connect("http://localhost/" + this.iospace); // connect socket.io
		this.io.on("connect", () => this.onIOConnect()); // listen connect event

		this.mvc = new MVC("myMVC", this, new MyModel(), new MyView(), new MyController()); // init app MVC
		await this.mvc.initialize(); // run init async tasks
		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface

	}

	/**
	 * @method test : test server GET fetch
	 */
	async test() {
		console.log("test server hello method");
		let result = await Comm.get("hello/everyone"); // call server hello method with argument "everyone"
		console.log("result", result);
		console.log("response", result.response);
	}

	/**
	 * @method onIOConnect : socket is connected
	 */
	onIOConnect() {
		trace("yay IO connected");
		this.io.on("dummy", packet => this.onDummyData(packet)); // listen to "dummy" messages
		this.io.emit("dummy", {value: "dummy data from client"}) // send test message

		this.io.on("connectedRoom", packet => this.onConnectedRoom(packet));
	}

	/**
	 * @method onDummyData : dummy data received from io server
	 * @param {Object} data 
	 */
	onDummyData(data) {
		trace("IO data", data);
		this.mvc.controller.ioDummy(data); // send it to controller
	}

	onConnectedRoom(packet){
		this.mvc.controller.ioConnectedRoom(packet.value);
	}
}

class MyModel extends Model {

	constructor() {
		super();
	}

	async initialize(mvc) {
		super.initialize(mvc);

	}

	async data() {
		trace("get data");
		// keep data in class variable ? refresh rate ?
		let result = await Comm.get("data"); // wait data from server
		return result.response; // return it to controller
	}

}

class gameView extends View {
	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

		this.stage.style.backgroundColor = "green";

	}
}

class MyView extends View {

	constructor() {
		super();
		this.table = null;
	}

	initialize(mvc) {
		super.initialize(mvc);

		// create get test btn
		this.btn = document.createElement("button");
		this.btn.innerHTML = "get test";
		this.stage.appendChild(this.btn);

		// create io test btn
		this.iobtn = document.createElement("button");
		this.iobtn.innerHTML = "io test";
		this.stage.appendChild(this.iobtn);

		// io random value display
		this.iovalue = document.createElement("div");
		this.iovalue.innerHTML = "no value";
		this.stage.appendChild(this.iovalue);

		// get dataset display
		this.table = document.createElement("table");
		this.stage.appendChild(this.table);

		this.stage.style.backgroundColor = "black";

		///TEST
		this.connectDiv = new easyElement("div")
						.setStyle({	position:"absolute",
									backgroundColor:"blue",
									top:"40%",
									left:"0",
									width:"100%",
									height:"20%"})
						.attach(this.stage)
						.getElement();

		this.connectTextField = new easyElement("input")
						.setStyle({	position:"absolute",
									//backgroundColor:"red",
									fontSize:"4vh",
									top:"43%",
									left:"20%",
									width:"60%",
									height:"7%",
									zIndex:"0",
									textAlign:"center"})
						.setAttribute({type:"text"})
						.attach(this.stage)
						.getElement();

		this.connectButton = new easyElement("button")
						.setStyle({	position:"absolute",
									//backgroundColor:"blue",
									top:"53%",
									left:"40%",
									width:"20%",
									height:"5%"})
						.setText("Connect")
						.attach(this.stage)
						.getElement();



	}

	// activate UI
	activate() {
		super.activate();
		this.addListeners(); // listen to events
	}

	// deactivate
	deactivate() {
		super.deactivate();
		this.removeListeners();
	}

	addListeners() {
		this.getBtnHandler = e => this.btnClick(e);
		this.btn.addEventListener("click", this.getBtnHandler);

		this.ioBtnHandler = e => this.ioBtnClick(e);
		this.iobtn.addEventListener("click", this.ioBtnHandler);

		this.connectButtonHandler = event => this.connectButtonClick(event);
		this.connectButton.addEventListener("click", this.connectButtonHandler); 
	}

	removeListeners() {
		this.btn.removeEventListener("click", this.getBtnHandler);
		this.iobtn.removeEventListener("click", this.ioBtnHandler);
		this.connectButton.removeEventListener("click", this.connectButtonHandler); 

	}

	btnClick(event) {
		this.mvc.controller.btnWasClicked("more parameters"); // dispatch
	}

	ioBtnClick(event) {
		this.mvc.controller.ioBtnWasClicked("io parameters"); // dispatch
	}

	connectButtonClick(event){
		this.mvc.controller.connectButtonWasClicked(this.connectTextField.value);
	}



	update(data) {
		while(this.table.firstChild) this.table.removeChild(this.table.firstChild); // empty table
		data.forEach(el => { // loop data
			let line = document.createElement("tr"); // create line
			Object.keys(el).forEach(key => { // loop object keys
				let cell = document.createElement("td"); // create cell
				cell.innerHTML = el[key]; // display
				line.appendChild(cell); // add cell
			});
			this.table.appendChild(line); // add line
		});
	}

	updateIO(value) {
		this.iovalue.innerHTML = value.toString(); // update io display
	}

}

class MyController extends Controller {

	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}

	async btnWasClicked(params) {
		trace("btn click", params);
		this.mvc.view.update(await this.mvc.model.data()); // wait async request > response from server and update view table values
	}

	async ioBtnWasClicked(params) {
		trace("io btn click", params);
		this.mvc.app.io.emit("dummy", {message: "dummy io click"}); // send socket.io packet
	}

	async connectButtonWasClicked(params){
		this.mvc.app.io.emit("connectRoom", {value: params})
	}

	ioDummy(data) {
		this.mvc.view.updateIO(data.value); // io dummy data received from main app
	}

	async ioConnectedRoom(nbRoom){
		console.log("CONNECTED TO ROOM :", nbRoom); //test

		///ON CHANGE DE CONTROLLER ET DE VIEW

		this.mvc.view.detach(); // detach view
		this.mvc.view.deactivate(); // deactivate user interface

		await this.mvc.changeView(new gameView());

		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface



	}

}