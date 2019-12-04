const ModuleBase = load("com/base"); // import ModuleBase class

const BOARD_SIZE = 40;
const BOARD_LEN = 5;


class GameMVC {

	constructor(name, app, roomNb, model, controller){

		this.name = name;
		this.app = app;
		this.model = model || new GameModel();
		this.controller = controller || new GameController();

		this.room = roomNb;

		this.gameState = 0;

	}

	async initialize() {
		trace("init MVC");
		await this.model.initialize(this);
		await this.controller.initialize(this);
	}

	addClient(id){

		this.model.addClient(id);

	}

	state(){
		return this.gameState;
	}

}

class GameModel {

	constructor(){
		this.name = undefined;
		this.mvc = null;
		this.clients = new Set();

		this.boardSize 	= BOARD_SIZE;
		this.boardLen 	= BOARD_LEN;

		this.board = new Array(this.boardSize).fill(0);


		this.board[10] = 1;

	}

	initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-model";
	}

	addClient(id){

		//This should never arrive
		if(this.clients.size == 1) return;

		this.clients.add(id);

		if(this.clients.size == 1){
			this.mvc.state = 1;

			this.mvc.controller.start();

		}

	}


	

}

class GameController {
	constructor() {
		this.name = undefined;
		this.mvc = null;
	}
	
	initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-controller";
	}

	start(){
		trace("start room : ", this.mvc.room);
		setTimeout(() => this.ioTick(), 1000);		
	}

	ioTick(){
		setTimeout(() => this.ioTick(), 1000);
		trace("emit tick to room :", this.mvc.room);
		this.mvc.app._io.to(this.mvc.room).emit("boardData", this.mvc.model.board);
	}

}




class Base extends ModuleBase {

	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));

		this.roomGame = new Map();

	}

	/**
	 * @method hello : world
	 * @param {*} req 
	 * @param {*} res 
	 * @param  {...*} params : some arguments
	 */
	hello(req, res, ... params) {
		let answer = ["hello", ...params, "!"].join(" "); // say hello
		trace(answer); // say it
		this.sendJSON(req, res, 200, {message: answer}); // answer JSON
	}

	/**
	 * @method data : random data response
	 * @param {*} req 
	 * @param {*} res 
	 */
	data(req, res) {
		let data = [ // some random data
			{id: 0, name: "data0", value: Math.random()},
			{id: 1, name: "data1", value: Math.random()},
			{id: 2, name: "data2", value: Math.random()}
		];
		this.sendJSON(req, res, 200, data); // answer JSON
	}

	// connectRoom(req, res, roomNb){
	// }

	/**
	 * @method _onIOConnect : new IO client connected
	 * @param {*} socket 
	 */
	_onIOConnect(socket) {
		super._onIOConnect(socket); // do not remove super call
		socket.on("dummy", packet => this._onDummyData(socket, packet)); // listen to "dummy" messages
		socket.on("connectRoom", packet => this._onConnectRoom(socket, packet));
	}

	_onDummyData(socket, packet) { // dummy message received
		trace(socket.id, "dummy", packet); // say it
		socket.emit("dummy", {message: "dummy indeed", value: Math.random()}); // answer dummy random message
	}

	async _onConnectRoom(socket, packet){

		let nbRoom = packet.value;

		if(!/^[0-9]+$/.test(nbRoom)){
			trace(nbRoom, "is not a room number");
			///Envoyer (emit) erreur ?
			return;
		}


		//Verify if the room isn't full if it exist
		if(this.roomGame.has(nbRoom)){
			
			let state = this.roomGame.get(nbRoom).state();

			//If state is not 0, the game is not joinable
			if(state != 0){
				///Envoyer erreur (emit) salle occupé.

				return;
			}

		}
		else{
			//Create room
			this.roomGame.set(nbRoom, new GameMVC("game_nb_" + nbRoom, this, nbRoom));
			await this.roomGame.get(nbRoom).initialize();

		}

		trace(socket.id, "connected to room", nbRoom);

		
		socket.join(nbRoom);
		this.roomGame.get(nbRoom).addClient(socket.id);

		trace("EMIT CONNECTED ROOM ", nbRoom, " TO : ", socket.id);
		socket.emit("connectedRoom", {value: nbRoom});


		//setTimeout(() => {this._ioTickLoop(nbRoom)}, 1000);


	}

	_ioTickLoop(room){

		console.log(this._io);

		setTimeout(() => {this._ioTickLoop(room)}, 1000);
		trace("emit tick to room :", room);
		this._io.to(room).emit("tick");
	}

}

module.exports = Base; // export app class