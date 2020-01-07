

const ModuleBase = load("com/base"); // import ModuleBase class
const GameMVC = require("./gameMVC");



class Base extends ModuleBase {

	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));

		//Relie numéro de room à une Game
		this.roomGame = new Map();

		//Relie l'identifiant a une room
		this.socketRoom = new Map();


		this._initializeFile();


	}

	async _initializeFile(){
		
		fs.access("hallOfFame.json", fs.constants.F_OK, (err) => {

	    	if (err) {

        		let tempoJson = {"top5": [{"names": [],"score": 0},{"names": [],"score": 0},{"names": [],"score": 0},{"names": [],"score": 0},{"names": [],"score": 0}]}
        		let tempoRaw = JSON.stringify(tempoJson, null, 2);

            	fs.writeFileSync("hallOfFame.json",	tempoRaw);

            	trace("Created hallOfFame.json file.");
		    
		    }

		});

	}


	/*
		This method send the hallOfFame json to the client
	*/
	hallOfFame(req, res){
		let rawJson = fs.readFileSync("hallOfFame.json");
		let tempoJson = JSON.parse(rawJson);

		this.sendJSON(req, res, 200, tempoJson);
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
		socket.on("movingKey", packet => this._onMovingKey(socket, packet));
		socket.on("rotateKey", packet => this._onRotateKey(socket, packet));
		socket.on("message", packet => this._onMessage(socket, packet));
		socket.on("go", packet => this._onGo(socket, packet));
	}

	/*
		Changed the prototype of onIODisconnect to send the ID as a parametter.
		The old version wasn't working because the socket was deleted before we could get the ID of it.
	*/
	_onIODisconnect(socketID) {
		
		super._onIODisconnect(socketID);

		if(this.socketRoom.has(socketID)){

			let room = this.socketRoom.get(socketID);
			this.socketRoom.delete(socketID);

			//If we did this well, we do not need to verify if the room exist in roomGame Map.
			let isDead = this.roomGame.get(room).removeClient(socketID);

			if(isDead){
				this.roomGame.delete(room);
			}

		}


	}

	_onDummyData(socket, packet) { // dummy message received
		trace(socket.id, "dummy", packet); // say it
		socket.emit("dummy", {message: "dummy indeed", value: Math.random()}); // answer dummy random message
	}

	async _onConnectRoom(socket, packet){

		let nbRoom = packet.value;
		let nickname = packet.nickname;

		if(!/^[0-9]+$/.test(nbRoom)){
			trace(nbRoom, "is not a room number");
			return;
		}

		trace(nickname, "is my nickname");
		if(/^[^A-Za-z0-9]+$/.test(nickname)){
			trace(nickname, "is not a correct nickname");
			return;
		}


		//Check if the room exist
		if(this.roomGame.has(nbRoom)){
			let state = this.roomGame.get(nbRoom).state();

			//If state is not 0, the game is not joinable
			if(state !== 0){
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
		this.socketRoom.set(socket.id, nbRoom);


		//Send connectedRoom before adding the client to the Game to prevent starting game before the client load the game.
		trace("EMIT CONNECTED ROOM ", nbRoom, " TO : ", socket.id);
		socket.emit("connectedRoom", {room: nbRoom});

		this.roomGame.get(nbRoom).addClient(socket.id, nickname);

	}


	_onMovingKey(socket, packet){

		if(!this.socketRoom.has(socket.id)){
			//ERROR 

			//Send error message ? (Not in room)

			return;
		}


		this.roomGame.get(this.socketRoom.get(socket.id)).onMovingKey(socket.id, packet);

	}

	_onRotateKey(socket, packet){

		if(!this.socketRoom.has(socket.id)){
			return;
		}


		this.roomGame.get(this.socketRoom.get(socket.id)).onRotateKey(socket.id, packet);

	}

	_onMessage(socket, packet){

		if(!this.socketRoom.has(socket.id)){
			return;
		}

		this.roomGame.get(this.socketRoom.get(socket.id)).onMessage(socket.id, packet);

	}

	_onGo(socket, packet){

		if(!this.socketRoom.has(socket.id)){
			return;
		}

		this.roomGame.get(this.socketRoom.get(socket.id)).onGo(socket.id);

	}

}

module.exports = Base; // export app class