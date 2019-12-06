

const ModuleBase = load("com/base"); // import ModuleBase class

const BOARD_SIZE = 100;
const BOARD_LEN = 10;


const ALL_PIECE = [
					[	0, 0, 0, 0,
						0, 1, 1, 0,
						0, 1, 1, 0,
						0, 0, 0, 0],

					[	0, 2, 0, 0,
						0, 2, 0, 0,
						0, 2, 0, 0,
						0, 2, 0, 0],

					[	0, 0, 0, 0,
						0, 3, 0, 0,
						3, 3, 3, 0,
						0, 0, 0, 0],

					[	0, 0, 0, 0,
						0, 4, 4, 0,
						4, 4, 0, 0,
						0, 0, 0, 0],

					[	0, 0, 0, 0,
						0, 5, 5, 0,
						0, 0, 5, 5,
						0, 0, 0, 0],

					[	0, 0, 0, 0,
						0, 6, 6, 0,
						0, 6, 0, 0,
						0, 6, 0, 0],

					[	0, 0, 0, 0,
						0, 7, 7, 0,
						0, 0, 7, 0,
						0, 0, 7, 0]

];


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

	destruct(){
		this.model.destruct();
		this.controller.destruct();
	}

	addClient(id){

		this.model.addClient(id);

	}

	removeClient(id){

		this.model.removeClient(id);

	}

	onMovingKey(cliendId, direction){

		this.controller.onMovingKey(cliendId, direction);

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

		this.boardRow 	= this.boardSize / this.boardLen;


		this.board = new Array(this.boardSize);


		this.newPiece = new Array(4 * 4);
		this.newPiecePosition = [0, 0];

		//Board and New piece merged
		this.mergedBoard = new Array(this.boardSize);

	}

	async initialize(mvc) {

		this.mvc = mvc;
		this.name = this.mvc.name + "-model";

		this.board.fill(0);
		this.newPiece.fill(0);
		this.mergedBoard.fill(0);

	}

	destruct(){
		//Nothing to do
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

	removeClient(id){

		this.clients.delete(id);

		//If there is no more client in the room, kill it.
		if(this.clients.size == 0){

			this.mvc.destruct();
			return true;

		}
		
		return false;

	}

	ioBoardData(){
		trace("emit boardData to room :", this.mvc.room);
		this.mvc.app._io.to(this.mvc.room).emit("boardData", this.mergedBoard);
	}


	//Game function :
	generateNewPiece(){
		let maxIndex = ALL_PIECE.length;
		let chosenIndex = Math.floor(Math.random() * (maxIndex));

		this.newPiece = ALL_PIECE[chosenIndex];
		this.newPiecePosition = [0, 0];

	}

	newPieceMove(direction){

		//DOWN
		if(direction == 0){
			this.newPieceMoveDown();
		}
		//LEFT
		else if(direction == 1){
			this.newPieceMoveLeft();
		}
		//RIGHT
		else if(direction == 2){
			this.newPieceMoveRight();
		}
		//UP ???
		else if(direction == 3){
			
		}
		else{
			trace("ERROR moving pos of new piece");
		}

	}

	newPieceMoveLeft(){

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]-1 	+ index%4;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/4);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || x < 0){
					isCollision = true;
					break;
				}

			}
		
		}

		if(!isCollision){
			this.newPiecePosition[0] -= 1;
		}

	}

	newPieceMoveRight(){

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]+1 	+ index%4;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/4);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || x >= this.boardLen){
					isCollision = true;
					break;
				}

			}
		
		}

		if(!isCollision){
			this.newPiecePosition[0] += 1;
		}

	}

	newPieceMoveDown(){

		//Verif Collision

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0] + index%4;
			let y = this.newPiecePosition[1]+1 + Math.trunc(index/4);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || y >= this.boardSize/this.boardLen){
					isCollision = true;
					break;
				}

			}
		
		}

		if(isCollision){

			this.newPieceTouchDown();

		}
		else{
			this.newPiecePosition[1] += 1;
		}


	}

	/*	
	*	This methode find and clear every completed line of the board.
	*	A line is considered as completed when it contain no more 0.
	*/
	findAndCleaCompleteLine(){

					//First we generate an array who has the size of the line number
		this.board = new Array(this.boardRow).fill(0)
					//Then we map on it every line of the board
					.map((element, index) => this.board.slice(index * this.boardLen, (index + 1) * this.boardLen))
					//Then we erase every line that contain no 0 (Note : we could delete the map and let only the reduce that would do the job of the map too)
					.filter(element => element.find(el => el == 0) != undefined)
					//Then concat every line to get a single array again
					.reduce((acc, element) => acc.concat(element), []);

		//Use this variable to increment the score
		let numberOfSlot = this.boardSize - this.board.length;

		//Then we add as many empty slots as there as deleted slot
		this.board = new Array(numberOfSlot).fill(0).concat(this.board);

		/// Use the numberOfSlot deleted to increment the score ?? ///

	}

	/*
		This methode is called when a piece hit the ground
	*/
	newPieceTouchDown(){
		//We firt merge the piece to the board
		this.mergeNewPieceTo(this.board);
		
		//Then we clear every completed line
		this.findAndCleaCompleteLine();

		//And we generate a new piece
		this.generateNewPiece();
	}

	/*
		Shortcut to call mergeNewPieceTo with mergedBoard which is set to board
	*/
	mergeNewPiece(){
		//First assign a copy of board to mergedBoard
		this.mergedBoard = this.board.slice();
		//Then merge the new piece to mergedBoard
		this.mergeNewPieceTo(this.mergedBoard);
	}


	/*
		Merge the actual newPiece to the array passed in argument.

		array: An array of integer value (that represent the game board)
	*/
	mergeNewPieceTo(array){

		this.newPiece.reduce((acc, element, index) => {

			let x = this.newPiecePosition[0] + index%4;
			let y = this.newPiecePosition[1] + Math.trunc(index/4);



			//Ou juste element ?
			if(element > 0){
				acc[x + y * this.boardLen] = element;
			}

			return acc;

		}, array);

	}
	

}

class GameController {
	constructor() {
		this.name = undefined;
		this.mvc = null;

		this.timeoutTime = 0;
	}
	
	async initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-controller";
	}

	destruct(){

		//Stop timeout :
		this.stop();

	}

	//Input
	onMovingKey(cliendId, direction){

		///Verifier si c'est le joueur "clientId" qui a la main

		///

		//0 = left, 1 = right, so we put +1 to correpond to newPieceMove
		this.mvc.model.newPieceMove(direction+1);

		this.mvc.model.mergeNewPiece();
		this.mvc.model.ioBoardData();
	}


	//STARTING
	start(){
		this.mvc.model.generateNewPiece();

		this.timeoutTime = setTimeout(() => this.gameLoop(), 300);

	}

	stop(){
		if(this.timeoutTime){
			clearTimeout(this.timeoutTime);
			this.timeoutTime = 0;
		}
	}

	//Main game loop
	gameLoop(){
		//Prepare next loop
		this.timeoutTime = setTimeout(() => this.gameLoop(), 300);

		//Update the falling piece
		this.update();
		//Send data to clients
		this.mvc.model.ioBoardData();
	}

	update(){
		
		///MAKE THE PIECE FALL
		this.mvc.model.newPieceMove(0);
		///

		//Merge the board with the moving piece
		this.mvc.model.mergeNewPiece();

	}



}




class Base extends ModuleBase {

	constructor(app, settings) {
		super(app, new Map([["name", "baseapp"], ["io", true]]));

		//Relie numéro de room à une Game
		this.roomGame = new Map();

		//Relie l'identifiant a une room
		this.socketRoom = new Map();

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
		socket.on("movingKey", packet => this._onMovingKey(socket, packet));
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

		if(!/^[0-9]+$/.test(nbRoom)){
			trace(nbRoom, "is not a room number");
			///Envoyer (emit) erreur ?
			return;
		}


		//Check if the room exist
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
		this.socketRoom.set(socket.id, nbRoom);

		this.roomGame.get(nbRoom).addClient(socket.id);

		trace("EMIT CONNECTED ROOM ", nbRoom, " TO : ", socket.id);
		socket.emit("connectedRoom", {room: nbRoom, size: BOARD_SIZE, len: BOARD_LEN});


		//setTimeout(() => {this._ioTickLoop(nbRoom)}, 1000);


	}


	_onMovingKey(socket, packet){

		if(!this.socketRoom.has(socket.id)){
			//ERROR 

			//Send error message ? (Not in room)

			return
		}


		this.roomGame.get(this.socketRoom.get(socket.id)).onMovingKey(socket.id, packet);


	}

}

module.exports = Base; // export app class