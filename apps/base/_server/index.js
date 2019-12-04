const ModuleBase = load("com/base"); // import ModuleBase class

class Base extends ModuleBase {

	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));
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

	// 	let nbRoom = roomNb;

	// 	trace("test", "connected to room", nbRoom);

	// 	//ON CREER LA ROOM --- A FAIRE

	// 	//
	// 	this.sendJSON(req, res, 200, {value: nbRoom}); // answer JSON

	// 	//socket.emit("connectedRoom", {value: nbRoom})

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

	_onConnectRoom(socket, packet){

		let nbRoom = packet.value;

		if(!/^[0-9]+$/.test(nbRoom)){
			trace(nbRoom, "is not a room number");
			//Envoyer erreur ?
			return;
		}

		trace(socket.id, "connected to room", nbRoom);

		//ON CREER LA ROOM --- A FAIRE

		socket.join(nbRoom);

		//trace(Object.keys(socket.adapter.rooms));
		setTimeout(() => {this._ioTickLoop(nbRoom)}, 1000);
		// 

		socket.emit("connectedRoom", {value: nbRoom})

	}

	_ioTickLoop(room){
		setTimeout(() => {this._ioTickLoop(room)}, 1000);
		trace("emit tick to room :", room);
		this._io.to(room).emit("tick");
	}

}

module.exports = Base; // export app class