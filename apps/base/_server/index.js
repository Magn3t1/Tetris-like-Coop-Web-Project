
const ModuleBase = load("com/base"); // import ModuleBase class

const BOARD_SIZE = 70;
const BOARD_LEN = 7;

const NB_PLAYER_MAX = 1;

const ALL_PIECE_AND_LEN = [
					[	1, 1,
						1, 1	], 2,



					[	0, 0, 0, 0,
						2, 2, 2, 2,
						0, 0, 0, 0,
						0, 0, 0, 0], 4,

					[	0, 3, 0,
						3, 3, 3,
						0, 0, 0	], 3,

					[	0, 4, 4,
						4, 4, 0,
						0, 0, 0	], 3,

					[	5, 5, 0,
						0, 5, 5,
						0, 0, 0	], 3,

					[	6, 0, 0,
						6, 6, 6,
						0, 0, 0	], 3,

					[	0, 0, 7,
						7, 7, 7,
						0, 0, 0	], 3

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

		return this.model.removeClient(id);

	}

	onMovingKey(cliendId, direction){
		this.controller.onMovingKey(cliendId, direction);
	}

	onRotateKey(cliendId, direction){
		this.controller.onRotateKey(cliendId, direction);
	}

	state(){
		return this.gameState;
	}

}

class GameModel {

	constructor(){

		this.name = undefined;
		this.mvc = null;
		
		//This Map contain the player id linked to his Player index (1 to N)
		this.clients = new Map();


		this.boardSize 	= BOARD_SIZE;
		this.boardLen 	= BOARD_LEN;

		this.boardRow 	= this.boardSize / this.boardLen;


		this.board = new Array(this.boardSize);


		this.nextNewPieceIndex = 0;
		//This variable contain the index of the next player who will get a piece
		this.nextNewPiecePlayer = 0;

		this.newPiece = new Array(4 * 4);
		this.newPieceLen = 4;
		this.newPiecePosition = [0, 0];
		//Player who got the hand on the actual new Piece
		this.handlingPlayer = 0;

		//Board and New piece merged
		this.mergedBoard = new Array(this.boardSize);


		this.score = 0;

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

	/*
		This method add a client depending of his socket id.
		Also start the game if the number of client rise to the NB_PLAYER_MAX constant.
	*/
	addClient(id){

		//This should never arrive
		if(this.clients.size === NB_PLAYER_MAX) return;

		let oldSize = this.clients.size;

		this.clients.set(id, oldSize);

		if(this.clients.size === NB_PLAYER_MAX){
			this.mvc.state = 1;

			this.mvc.controller.start();

		}

	}

	/*
		This method remove a client depending of his is socked id,
		It also destruct the Game if the number of client fall to 0.
		Return true if it get destructed (To handle the dead object) and false if not.
	*/
	removeClient(id){

		this.clients.delete(id);

		//Reorganiser les numéro des autres joueurs

		//If there is no more client in the room, KILL IT.
		if(this.clients.size === 0){

			this.mvc.destruct();
			return true;

		}
		
		return false;

	}

	ioBoardData(){
		//trace("emit boardData to room :", this.mvc.room);
		this.mvc.app._io.to(this.mvc.room).emit("boardData", this.mergedBoard);
	}

	ioNextPieceData(){
		//trace("emit nextPieceData to room :", this.mvc.room);
		this.mvc.app._io.to(this.mvc.room).emit("nextPieceData", [ALL_PIECE_AND_LEN[this.nextNewPieceIndex*2], ALL_PIECE_AND_LEN[this.nextNewPieceIndex*2 + 1], this.nextNewPiecePlayer]);
	}

	ioSendScore(){
		this.mvc.app._io.to(this.mvc.room).emit("score", this.score);
	}

	ioStart(){
		trace("emit start to room :", this.mvc.room);
		this.mvc.app._io.to(this.mvc.room).emit("start", {size: BOARD_SIZE, len: BOARD_LEN, nbPlayer: this.clients.size} );
	}
 
	/*
		This method se the newPiece depending of the index is argument.
		It also set the newPiece position and the actual handling Player.
	*/
	setNewPiece(index){
		
		this.newPiece = ALL_PIECE_AND_LEN[index * 2];
		this.newPieceLen = ALL_PIECE_AND_LEN[index * 2 + 1];


		let playerBoardLen = Math.trunc(this.boardLen / this.clients.size);
		let startPosX = Math.trunc(playerBoardLen * 0.5 - this.newPieceLen/2);

		//We use the num of the next player piece to set the position of the newPiece
		this.newPiecePosition = [playerBoardLen * this.nextNewPiecePlayer + startPosX, -1];


		//And we set the handling player to the owner of the new piece.
		this.handlingPlayer = this.nextNewPiecePlayer;
	}

	/*
		This method return one random index that is part of the piece list.
	*/	
	findNewPieceIndex(){
		let maxIndex = ALL_PIECE_AND_LEN.length/2;
		return Math.floor(Math.random() * (maxIndex));
	}

	/*
		This method verify if the actual newPiece is still in the handling player board and return -1
		or if it's totally in another player board and return the it's index.
	*/
	isInActualPlayerBoard(){
		let playerBoardLen = Math.trunc(this.boardLen / this.clients.size);
		let newPlayerBoardIndex = 0;

		let isIn = false;

		//We should not use a forEach because we want to break when we encounter a case isIn become true.
		this.newPiece.forEach((element, index) => {

			if(element > 0){

				let x = this.newPiecePosition[0] + index%this.newPieceLen;

				let playerBoardIndex = Math.trunc(x / playerBoardLen);

				if(playerBoardIndex === this.handlingPlayer){
					isIn = true;
					//We want to break here.
				}
				else{
					newPlayerBoardIndex = playerBoardIndex;
				}

			}

		});

		if(isIn){
			newPlayerBoardIndex = -1;
		}
		
		return newPlayerBoardIndex;
	}

	/*
		This method change the handlingPlayer or not depending of the return of isInActualPlayerBoard()
	*/
	verifyHand(){


		let newBoard = this.isInActualPlayerBoard();

		/*
			If this test pass it mean no part of the actual newPiece
			is in the handling Player side so we change the handling player
		*/
		if(newBoard !== -1){
			this.handlingPlayer = newBoard;
		}

	}

	newPieceMove(direction){

		switch(direction){

			//Down
			case 0:
				this.newPieceMoveDown();
				break;

			//Left
			case 1:
				this.newPieceMoveLeft();
				this.verifyHand();
				break;

			//Right
			case 2:
				this.newPieceMoveRight();
				this.verifyHand();
				break;

			//Down
			case 3:
				this.newPieceMoveDown();
				//After moving down, reset the timer
				this.mvc.controller.resetTimeout();
				break;

			//Fast Fall
			case 4:
				this.newPieceFastFall();
				break;

			//Fast Share Right
			case 5:
				if(this.handlingPlayer === this.clients.size - 1) break;
				
				this.newPieceFastShareToTheRight();
				this.verifyHand();
				break;

			//Fast Share Left
			case 6:
				if(this.handlingPlayer === 0) break;

				this.newPieceFastShareToTheLeft();
				this.verifyHand();
				break;

			default:
				trace("ERROR moving pos of new piece");
				return;

		}

	}


	newPieceRotate(direction){

		//anticlockwise
		if(direction === 0){
			this.rotateAntiClockWise();
			/*
				If this test pass, it mean that with the rotation,
				the piece is now 1 move from a collision,
				so we give 1 more tick to the player to think
			*/
			if(!this.newPieceCanDown()){
				this.mvc.controller.resetTimeout();
			}
		}
		//clockwise
		else if(direction === 1){
			this.rotateClockWise();
			//Same comment as above
			if(!this.newPieceCanDown()){
				this.mvc.controller.resetTimeout();
			}
		}
		else{
			trace("Error in the client packet from rotateKey");
			return;
		}

	}

	/*
		This method will put the newPiece in the nearest board on the left.
		If there is collision on the path, newPice stay at the same place.
	*/
	newPieceFastShareToTheLeft(){

		let playerBoardLen = Math.trunc(this.boardLen / this.clients.size);

		let newPieceX = this.newPiecePosition[0];


		let startBoardX = this.handlingPlayer * playerBoardLen - this.newPieceLen;
		//We stop the board at newPieceX + this.newPieceLen

		//Set up that start Y and stop Y of the piece
		let start = this.newPiecePosition[1];
		let stop = start + this.newPieceLen;

		if(start < 0) start = 0;
		if(stop > this.boardRow) stop = this.boardRow;

		//Return the last index that is not empty (or -1 if they are all empty)
		let indexLastNotEmptySlot = [...Array(stop - start)]
					//Take the lines that can cause collision only
					.map((element, index) => this.board.slice((start + index) * this.boardLen + startBoardX, (start + index) * this.boardLen + newPieceX + this.newPieceLen))
					//Then find the last index where there is a possible collision (return -1 if there is not)
					.reduce((acc, element) => {
											//We reverse before findIndex to get the last one that match (then we reverse the index result)
											let newIndex = (element.length - 1) - element.reverse().findIndex(el => el !== 0);
											if(newIndex !== -1){
												if(acc === -1) acc = newIndex;
												else if(newIndex < acc) acc = newIndex;
											}
											return acc;
										}, -1);

		/*
			This optimistion allow us to skip the first slot that are empty
		*/
		//If there was only empty slot, put the piece near the left side of the board
		if(indexLastNotEmptySlot === -1) this.newPiecePosition[0] = startBoardX + Math.trunc(this.newPieceLen*1.5) + 1;
		//Or put it near the not empty slot
		else this.newPiecePosition[0] = (startBoardX + indexLastNotEmptySlot) + this.newPieceLen;

		//If the piece X position is already further in the board
		if(this.newPiecePosition[0] > newPieceX) this.newPiecePosition[0] = newPieceX;


		/*
			Note : This method would work the same if you comment all the code above
			But the instructions above remove a lot of work for the collision checking we do below
			and when checking the exection time, with the instruction aboce we get up to 4 time faster than without
		*/
		let test = () => true;

		do{

			//If there is a collision, put the old X position and return
			if(this.newPieceTryLeft()){
				this.newPiecePosition[0] = newPieceX;
				return;
			}

			//There is no collision on the left so we move on
			--this.newPiecePosition[0];

			/*
				This optimisation allow the programm to only do the big verification
				when it's realy needed, we know that the piece wont be in
				the next player board before it get at least to the len of a board minus it's len divided by 2.	
			*/
			if(this.newPiecePosition[0] <= startBoardX + Math.trunc(this.newPieceLen*1.5)){
				test = () => this.isInActualPlayerBoard() === -1;
			}

		}
		while(test());

	}

	/*
		Same as newPieceFastShareToTheLeft() but for the right.
		All the comment in it will be nearly the same
	*/
	newPieceFastShareToTheRight(){

		let playerBoardLen = Math.trunc(this.boardLen / this.clients.size);

		let newPieceX = this.newPiecePosition[0];


		//We start the board at newPieceX
		let stopBoardX = this.handlingPlayer * playerBoardLen + playerBoardLen + this.newPieceLen;

		//Set up that start Y and stop Y of the piece
		let start = this.newPiecePosition[1];
		let stop = start + this.newPieceLen;

		if(start < 0) start = 0;
		if(stop > this.boardRow) stop = this.boardRow;

		//Return the first index that is not empty (or -1 if they are all empty)
		let indexFirstNotEmptySlot = [...Array(stop - start)]
					//Take the lines that can cause collision only
					.map((element, index) => this.board.slice((start + index) * this.boardLen + newPieceX, (start + index) * this.boardLen + stopBoardX))
					//Then find the first index where there is a possible collision (return -1 if there is not)
					.reduce((acc, element) => {
										let newIndex = element.findIndex(el => el !== 0);
										if(newIndex !== -1){
											if(acc === -1) acc = newIndex;
											else if(newIndex < acc) acc = newIndex;
										}
										return acc;
									}, -1);

		/*
			This optimistion allow us to skip the first slot that are empty
		*/
		//If there was only empty slot, put the piece near the right side of the board
		if(indexFirstNotEmptySlot === -1) this.newPiecePosition[0] = stopBoardX - Math.trunc(this.newPieceLen*1.5) - 1;
		//Or put it near the not empty slot
		else this.newPiecePosition[0] = (newPieceX + indexFirstNotEmptySlot) - this.newPieceLen;
		//If the piece X position is already further in the board
		if(this.newPiecePosition[0] < newPieceX) this.newPiecePosition[0] = newPieceX;
		
		/*
			Note : This method would work the same if you comment all the code above
			But the instructions above remove a lot of work for the collision checking we do below
			and when checking the exection time, with the instruction aboce we get up to 4 time faster than without
		*/
		let test = () => true;

		do{
			
			//If there is a collision, put the old X position and return
			if(this.newPieceTryRight()){
				this.newPiecePosition[0] = newPieceX;
				return;
			}
			
			//There is no collision on the right so we move on
			++this.newPiecePosition[0];

			/*
				This optimisation allow the programm to only do the big verification
				when it's realy needed, we know that the piece wont be in
				the next player board before it get to the len of a board minus it's len divided by 2.	
			*/
			if(this.newPiecePosition[0] >= stopBoardX - Math.trunc(this.newPieceLen*1.5)){
				test = () => this.isInActualPlayerBoard() === -1;
			}

		}
		while(test());

	}

	newPieceFastFall(){


		let newPieceX = this.newPiecePosition[0];

		let start = newPieceX;
		let stop = start + this.newPieceLen;

		if(start < 0) start = 0;
		////this.boardLen - 1 ???
		if(stop > this.boardLen) stop = this.boardLen;


		let onWayLine = [...Array(this.boardRow)]

			.map((element, index) => {

				return this.board.slice(index * this.boardLen + start, index * this.boardLen + stop);

			});


		//trace(onWayLine);


		let indexFirstNotEmptyLine = onWayLine.findIndex(element => element.find(el => el !== 0) !== undefined);

		if(this.newPiecePosition[1] < indexFirstNotEmptyLine - this.newPieceLen){
			this.newPiecePosition[1] = indexFirstNotEmptyLine - this.newPieceLen;
		}

		while(this.newPieceTryDown());

		this.newPieceTouchDown();

	}

	newPieceTryLeft(){

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]-1 	+ index%this.newPieceLen;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/this.newPieceLen);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || x < 0){
					isCollision = true;
					break;
				}

			}
		
		}

		return isCollision;

	}


	/*
		There is a dedicated methode for each moving direction,
		this was we can optimis each version to check the good collision on side.
	*/	
	newPieceMoveLeft(){

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]-1 	+ index%this.newPieceLen;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/this.newPieceLen);

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

	newPieceTryRight(){
		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]+1 	+ index%this.newPieceLen;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/this.newPieceLen);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || x >= this.boardLen){
					isCollision = true;
					break;
				}

			}
		
		}

		return isCollision;
	}

	newPieceMoveRight(){

		let isCollision = false;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0]+1 	+ index%this.newPieceLen;
			let y = this.newPiecePosition[1] 	+ Math.trunc(index/this.newPieceLen);

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

	/*
		This method check the collision from the board and also from each side.
		return false if there is no collision, and from 1 to 4 if there is a collision depending of the what cause it
	*/
	newPieceCheckCollision(){
		
		let down = false;
		let left = false;
		let right = false;

		//We don't use Array.map method because we want to break if we find any collision
		for (let [index, element] of this.newPiece.entries()) {
			
			let localX = index%this.newPieceLen;
			let localY = Math.trunc(index/this.newPieceLen);

			let x = this.newPiecePosition[0] + localX;
			let y = this.newPiecePosition[1] + localY;

			if(element > 0){

				//Board
				if(this.board[x + y * this.boardLen] > 0){
					
					if(localY > 2){
						down = true;
					}
					
					if(localX <= 1){
						left = true;
					}
					else if(localX >= 2){
						right = true;
					}

				}
				//Down
				if(y >= this.boardSize/this.boardLen){
					down = true;
				}
				//Right
				if(x >= this.boardLen){
					right = true;
				}
				//left
				else if(x < 0){
					left = true;
				}

			}
		
		}

		let where = 0;
		
		if(down) where += 1;
		if(right) where += 2;
		if(left) where += 4;

		return where;
	}



	/*
		Try to move down, return true if it can,
		or return false if cant
	*/
	newPieceCanDown(){

		let isNoCollision = true;
		for (let [index, element] of this.newPiece.entries()) {
		
			let x = this.newPiecePosition[0] + index%this.newPieceLen;
			let y = this.newPiecePosition[1]+1 + Math.trunc(index/this.newPieceLen);

			if(element > 0){

				if(this.board[x + y * this.boardLen] > 0 || y >= this.boardSize/this.boardLen){
					isNoCollision = false;
					break;
				}

			}
		
		}

		return isNoCollision;

	}



	/*
		Try to move down, do it and return true if there was no collision,
		or return false if there is a collision
	*/
	newPieceTryDown(){

		if(this.newPieceCanDown()){
			this.newPiecePosition[1] += 1;
			return true;
		}
		else return false;

	}

	newPieceMoveDown(){

		//If it pass this test, it mean the piece has entered in collision
		if(!this.newPieceTryDown()){
			this.newPieceTouchDown();
		}


	}


	/*
		This method will try to push the piece to the surface if it's in collision.
		Return true if it succeeds and false otherwise.
	*/
	sendToSurface(){

		let success = false;

		let everTouchedLeft = false;
		let everTouchedRight = false;
		let everTouchedDown = false;

		while(1){

			let whereColli = this.newPieceCheckCollision();

			
			let touchedLeft = false;
			let touchedRight = false;
			let touchedDown = false;

			if(whereColli == 0){
				success = true;
				break;
			}
			else{

				if(1 & whereColli){
					touchedDown = true;
				}
				if(2 & whereColli){
					touchedRight = true;
				}
				if(4 & whereColli){
					touchedLeft = true;
				}

			}


			//Right and left
			if(touchedRight && touchedLeft){
				break;
			}
			
			//Down
			

			//Right or Left
			if(touchedRight){
				everTouchedRight = true;
				this.newPiecePosition[0] -= 1;
			}
			else if(touchedLeft){
				everTouchedLeft = true;
				this.newPiecePosition[0] += 1;
			}
			else if(touchedDown){
				everTouchedDown = true;
				this.newPiecePosition[1] -= 1;
			}

			//ever Right and ever left
			if(everTouchedRight && everTouchedLeft){
				break;
			}

		}

		return success;

	}

	rotateClockWise(){
		/*this.newPiece = this.newPiece.map((element, index) =>{
			//recovering 2D indexs as x & y
			//4 is our dimension
			let dimension = 4;
			let x = index%dimension; 
			let y = Math.trunc(index/dimension);

			//calculate the right index
			let rotateX = dimension - y - 1;
			let rotateY = x;

			//returning a 1D index
			return this.newPiece[rotateY * dimension + rotateX];
		});*/
		
		let oldPiece = this.newPiece;
		let oldPosition = this.newPiecePosition;

		//The same but in one line
		this.newPiece = this.newPiece.map((element, index) => this.newPiece[(index%this.newPieceLen) * this.newPieceLen + (this.newPieceLen - Math.trunc(index/this.newPieceLen) - 1)]);


		//If we can't send the piece to the surface, let the older version of the piece
		if(!this.sendToSurface()){
			this.newPiece = oldPiece;
			this.newPiecePosition = oldPosition;
		}


	}

	rotateAntiClockWise(){
		/*
		this.newPiece = this.newPiece.map((element, index) =>{
			//recovering 2D indexs as x & y
			//4 is our dimension
			let dimension = 4;
			let x = index%dimension; 
			let y = Math.trunc(index/dimension);

			//calculate the right index
			let rotateX = y
			let rotateY = dimension - x - 1;

			//returning a 1D index
			return this.newPiece[rotateY * dimension + rotateX];
		});*/

		let oldPiece = this.newPiece;
		let oldPosition = this.newPiecePosition;

		//The same but in one line
		this.newPiece = this.newPiece.map((element, index) => this.newPiece[(this.newPieceLen - (index%this.newPieceLen) - 1) * this.newPieceLen + (Math.trunc(index/this.newPieceLen))]);


		//If we can't send the piece to the surface, let the older version of the piece
		if(!this.sendToSurface()){
			this.newPiece = oldPiece;
			this.newPiecePosition = oldPosition;
		}

	}

	/*	
	*	This methode find and clear every completed line of the board.
	*	A line is considered as completed when it contain no more 0.
	*/
	findAndCleaCompleteLine(){

					//First we generate an array who has the size of the line number
		this.board = [...Array(this.boardRow)]
					//Then we map on it every line of the board
					.map((element, index) => this.board.slice(index * this.boardLen, (index + 1) * this.boardLen))
					//Then we erase every line that contain no 0 (Note : we could delete the map and let only the reduce that would do the job of the map too)
					.filter(element => element.find(el => el === 0) !== undefined)
					//Then concat every line to get a single array again
					.reduce((acc, element) => acc.concat(element), []);

		//Use this variable to increment the score
		let numberOfSlot = this.boardSize - this.board.length;

		//Then we add as many empty slots as there as deleted slot
		this.board = new Array(numberOfSlot).fill(0).concat(this.board);

		this.incrementScore(numberOfSlot/this.boardLen);


	}

	/*
		This Method actualise the current score with the number of breaked line
	*/
	incrementScore(breakedLineNumber){
			
		if(breakedLineNumber === 0) return;

		//Score magic
		let tempoScore = Math.trunc(4 * Math.exp(Math.pow((breakedLineNumber - 1), 1.1143)));
		let score = tempoScore - tempoScore%10;
		if(score < 5) score = 4;

		score *= 10;

		this.score += score;

		trace("New score :", this.score);

	}



	/*
		This methode is called when a piece hit the ground
	*/
	newPieceTouchDown(){
		//We firt merge the piece to the board
		this.mergeNewPieceTo(this.board);
		
		//Then we clear every completed line
		this.findAndCleaCompleteLine();


		this.setNewPiece(this.nextNewPieceIndex);

		//We generate a new piece index
		this.nextNewPieceIndex = this.findNewPieceIndex();
		this.nextNewPiecePlayer = (this.nextNewPiecePlayer + 1)%this.clients.size;

		//We send the data of the next new piece to the clients
		this.ioNextPieceData();

		//And we send the score to the client
		this.ioSendScore();

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

			let x = this.newPiecePosition[0] + index%this.newPieceLen;
			let y = this.newPiecePosition[1] + Math.trunc(index/this.newPieceLen);



			//Ou juste element ?
			if(element > 0){
				acc[x + y * this.boardLen] = element;
			}

			return acc;

		}, array);

	}


	/*
		This method verify if the clientId correspond to the player who got
		the hand on the actual new piece.
	*/
	playerVerification(clientId){
		
		let clientIndex = this.clients.get(clientId);

		if(clientIndex == this.handlingPlayer){
			return true;
		}
		
		return false;

	}
	

}

class GameController {
	constructor() {
		this.name = undefined;
		this.mvc = null;

		this.timeoutTime = 0;
		this.tick = 0;
	}
	
	async initialize(mvc) {
		this.mvc = mvc;
		this.name = this.mvc.name + "-controller";
	
		this.tick = 500;

	}

	destruct(){

		//Stop timeout :
		this.stop();

	}



	//Input
	onMovingKey(clientId, direction){

		//If we pass this test it mean that the client who send the moving request do not have the hand.
		if(!this.mvc.model.playerVerification(clientId)) return;


		//0 = left, 1 = right, 3 = fastFall, so we put +1 to correpond to newPieceMove
		this.mvc.model.newPieceMove(direction+1);

		this.mvc.model.mergeNewPiece();
		this.mvc.model.ioBoardData();
	}

	onRotateKey(clientId, direction){

		//If we pass this test it mean that the client who send the rotate request do not have the hand.
		if(!this.mvc.model.playerVerification(clientId)) return;


		this.mvc.model.newPieceRotate(direction);

		this.mvc.model.mergeNewPiece();
		this.mvc.model.ioBoardData();
	}

	/*
		This method reset the timeout of the game loop
	*/
	resetTimeout(){
		
		if(this.timeoutTime){

			clearTimeout(this.timeoutTime);

			this.timeoutTime = setTimeout(() => this.gameLoop(), this.tick);


		}

	}


	//STARTING
	start(){
		
		this.mvc.model.setNewPiece(this.mvc.model.findNewPieceIndex());
		this.mvc.model.nextNewPieceIndex = this.mvc.model.findNewPieceIndex();
		this.mvc.model.nextNewPiecePlayer = (this.mvc.model.nextNewPiecePlayer + 1)%this.mvc.model.clients.size;


		//Send start and the number of player in the game
		this.mvc.model.ioStart();


		//To send the first terrain before the loop start
		this.mvc.model.mergeNewPiece();
		this.mvc.model.ioBoardData();

		this.mvc.model.ioNextPieceData();

		this.timeoutTime = setTimeout(() => this.gameLoop(), this.tick);

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
		this.timeoutTime = setTimeout(() => this.gameLoop(), this.tick);

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
		socket.on("rotateKey", packet => this._onRotateKey(socket, packet));
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
			///Envoyer (emit) erreur ?
			return;
		}

		if(!/^[^A-Za-z0-9]+$/.test(nickname)){
			trace(nickname, "is not a correct nickname");
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


		//Send connectedRoom before adding the client to the Game to prevent starting game before the client load the game.
		trace("EMIT CONNECTED ROOM ", nbRoom, " TO : ", socket.id);
		socket.emit("connectedRoom", {room: nbRoom});

		this.roomGame.get(nbRoom).addClient(socket.id);

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

}

module.exports = Base; // export app class