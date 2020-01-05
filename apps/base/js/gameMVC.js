
const PIECE_COLOR =	[	"rgb(255, 255, 255)",
						"rgb(252, 232, 3)",
						"rgb(0, 150, 255)",
						"rgb(152, 3, 252)",
						"rgb(28, 156, 45)",
						"rgb(219, 41, 13)",
						"rgb(7, 22, 186)",
						"rgb(242, 126, 31)"	];


const NO_LOOP_KEY = new Set([90, 37, 38, 39, 40, 32, 82]);






class gameModel extends Model {

	constructor() {
		super();

		this.score = 0;

		this.nbPlayer = 1;

		this.boardSize 	= 4;
		this.boardLen 	= 2;
		this.boardRow 	= 2;
		

		this.boardData 		= new Array(this.boardSize);
		this.nextPieceData	= new Array(4 * 4);
		this.nextPieceLen = 4;

		this.nextPiecePlayer = 0;

		this.playersNicknames = [];

		this.gameState = 0;

		
	}

	async initialize(mvc) {
		super.initialize(mvc);
		this.fillData(0);
	}

	fillData(value){
		this.boardData.fill(value);
		this.nextPieceData.fill(value);
	}

	/*
		When receiving start
	*/
	ioStart(packet){

		this.nbPlayer 	= packet.nbPlayer;

		this.boardSize 	= packet.size;
		this.boardLen 	= packet.len;
		this.boardRow 	= this.boardSize / this.boardLen;

		this.fillData(0);		

		this.mvc.view.generateBoard();

		this.gameState = 1;
		this.mvc.view.startProcedure();
	}

	/*
		When receiving end
	*/
	ioEnd(){

		this.gameState = 0;

		this.mvc.view.startEndScreen();

	}


	ioBoardData(packet){
		this.boardData = packet;

		this.mvc.view.draw();
	}

	ioNextPieceData(packet){
		//This packet contain the next piece data in the first index,
		//and the player who get it in the second index

		this.nextPieceData = packet[0];

		this.nextPieceLen = packet[1];

		this.transformNextPieceMatrix();

		///ICI FAIRE QUELQUE CHOSE POUR AFFICHER LA NOUVELLE PIECE RECU
		trace("RECU NEXT PIECE : ", this.nextPieceData);
		this.nextPiecePlayer = packet[2];

		
	}

	//We receive the new score
	ioScore(packet){

		this.score = packet;

		trace("SCORE :", this.score);

		this.mvc.view.actualScoreDiv.innerHTML = "Score: " + this.score;

	}

	ioNicknames(packet){
		this.playersNicknames = packet.nicknames;
		trace("nicknames of player in the game are :", this.playersNicknames);

		this.mvc.view.creatingNicknamesDiv();
	}

	/*
		Transfoming 2*2 matrix in 4 * 4 to see the next player background color
	*/
	transformNextPieceMatrix(){

		/* Do the same as the code below */
		// if(this.nextPieceLen === 2){
		// 	this.nextPieceData = this.nextPieceData.reduce((acc, elem, index) => {
		// 					acc[index%2 + 1 + (Math.trunc(index / 2)+1)*4] = elem;
		// 					return acc;
		// 				}, new Array(4*4).fill(0));

		// 	this.nextPieceLen = 4;
		// }


		if(this.nextPieceLen === 2){
			this.nextPieceData = [...Array(4 * 4)].map((_, index) =>{
				switch(index){
					case 5:
						return this.nextPieceData[0];
					
					case 6:
						return this.nextPieceData[1];
					
					case 9:
						return this.nextPieceData[2];

					case 10:
						return this.nextPieceData[3];

					default:
						return 0;
				}
			});
			this.nextPieceLen  = 4;
		}
	}

}



class gameView extends View {

	constructor() {
		super();

		this.slotWidth = 0;
		this.slotHeight = 0;
		this.slotSpace = 0;

		this.slotWidthNextPiece = 0;
		this.slotHeightNextPiece = 0;
		this.slotSpaceNextPiece = 0;

		this.freeSlotColor = [];
		this.playerColors  = [];

		this.pressedKeyToLoopId = null;

		this.inputLoopId = 0;

		//Elements
		this.boardCanvas = undefined;
		this.nextPieceCanvas = undefined;
		this.endScreenDiv = undefined;

		this.endScreenDivOpacity = undefined;

		//This variable store the animated score
		this.tempoScore = 0;

		this.playerNicknamesDiv = [];


		//For the tactile devices input
		this.touchStartPos = undefined;
		this.untilNextTouch = undefined;

	}

	async initialize(mvc) {
		await super.initialize(mvc);

		this.pressedKeyToLoopId = new Map();

		this.stage.style.backgroundColor = "rgb(120, 41, 54)";

		this.boardCanvas = new easyElement("canvas")
				.setStyle({	position:"absolute",
							backgroundColor:"black"})
				.setAttribute({	width: window.innerWidth  *0.75,
								height: window.innerHeight*0.75})
				.attach(this.stage)
				.getElement();

		this.nextPieceCanvas = new easyElement("canvas")
				.setStyle({	position:"absolute",
							backgroundColor:"black"})
				.setAttribute({	width: window.innerWidth  *0.75,
								height: window.innerHeight*0.75})
				.attach(this.stage)
				.getElement();


		this.endScreenDiv = new easyElement("div")
				.setStyle({	position:"absolute",
							opacity:"0.0",
							width:"100%",
							height:"100%"})
				.getElement();

		this.endScreenDivOpacity = 0.0;


		this.endScreenScoreDiv = new easyElement("div")
				.setStyle({	position:"absolute",
							opacity:"0.0",
							width:"100%",
							top:"50%",
							color:"white",
							textAlign:"center",
							fontSize:"15vw"})
				.setText("0")
				.getElement();

		this.endScreenScoreDivOpacity = 0.0;

		this.startButton = new easyElement("div")
				.setStyle({	position:"absolute",
							opacity:"1.0",
							width:"20%",
							top:"30%",
							left:"40%",
							padding: "3vh 3vw 3vh",
							backgroundColor:"white",
							textAlign:"center",
							fontSize:"5vw",
							borderRadius:"2%",
							boxShadow: "0px 0px 30px 3px black"})
				.setText("Start")
				.attach(this.stage)
				.getElement();

		this.actualScoreDiv = new easyElement("div")
				.setStyle({	position:"absolute",
							width:"100%",
							color:"white",
							textAlign:"center"})
				.setText("Score: 0")
				.getElement();

		
		this.stage.appendChild(this.actualScoreDiv);


		this.generateBoard();

	}

	startProcedure(){

		this.startButton.remove();

		this.endScreenScoreDiv.remove();

		this.endScreenDiv.remove();

	}

	/*Creating each div for players names*/
	creatingNicknamesDiv(){

		this.mvc.model.playersNicknames.forEach((element,index) => {
			this.playerNicknamesDiv.push(new easyElement("div").setStyle({	position:"absolute",color:"black",opacity:"0.7",overflow: "hidden"}).setText("").getElement());
			this.stage.appendChild(this.playerNicknamesDiv[index]);
			this.playerNicknamesDiv[index].innerHTML = element;
		});

		trace("mon tableau:", this.playerNicknamesDiv);
	}

	startEndScreen(){

		/*
			Easy way to correct a bug that happen when
			the player restart the game before the end animation end.
		*/
		if(this.mvc.model.gameState === 1){
			return;
		}

		///TESTTT

		//this.mvc.model.score = 210238900;
		trace("start end");

		///
		this.actualScoreDiv.innerHTML = "";

		this.stage.appendChild(this.endScreenDiv);

		this.endScreenDiv.style.backgroundColor = "rgb(0, 0, 0)";


		this.endScreenDivOpacity = 0.0;
		this.endScreenDiv.style.opacity = 0.0;


		setTimeout(() => this.endAnimationLoop(), 16);
	
	}

	endAnimationLoop(){

		this.endScreenDivOpacity = Math.min(1, this.endScreenDivOpacity + 1 * 0.016);


		let cosDelta = (1- Math.cos(this.endScreenDivOpacity * Math.PI))/2;


		this.endScreenDiv.style.opacity = 0.7 * cosDelta;

		if(this.endScreenDivOpacity === 1) this.startShowScore();
		else setTimeout(() => this.endAnimationLoop(), 16);


	}

	startShowScore(){

		/*
			Easy way to correct a bug that happen when
			the player restart the game before the end animation end.
		*/
		if(this.mvc.model.gameState === 1){
			return;
		}
		
		this.stage.appendChild(this.endScreenScoreDiv);

		this.endScreenScoreDivOpacity = 0.0;
		this.endScreenScoreDiv.style.opacity = 0.0;
		this.endScreenScoreDiv.innerHTML = "0";

		setTimeout(() => this.showEndScoreAnimation(), 16);

	}

	showEndScoreAnimation(){

		this.endScreenScoreDivOpacity = Math.min(100, this.endScreenScoreDivOpacity + 30 * 0.016);

		let cosDelta = Math.log(this.endScreenScoreDivOpacity + 1) / Math.log(100 + 1);

		let interpolatedValue = Math.trunc(this.mvc.model.score * cosDelta);


		this.endScreenScoreDiv.style.opacity = 1 * cosDelta;

		if((interpolatedValue - this.tempoScore) > 0.005 * this.mvc.model.score || this.endScreenScoreDivOpacity === 100){
			this.tempoScore = interpolatedValue;
			this.endScreenScoreDiv.innerHTML = this.tempoScore + "";
		}

		if(this.endScreenScoreDivOpacity === 100) this.startShowStartButton();
		else setTimeout(() => this.showEndScoreAnimation(), 16);

	}

	startShowStartButton(){

		/*
			Easy way to correct a bug that happen when
			the player restart the game before the end animation end.
		*/
		if(this.mvc.model.gameState === 1){
			return;
		}

		this.stage.appendChild(this.startButton);

		this.startButtonOpacity = 0.0;
		this.startButton.style.opacity = 0.0;

		setTimeout(() => this.showStartButtonAnimation(), 16);

	}

	showStartButtonAnimation(){

		this.startButtonOpacity = Math.min(1, this.startButtonOpacity + 1 * 0.016);


		let cosDelta = (1- Math.cos(this.startButtonOpacity * Math.PI))/2;


		this.startButton.style.opacity = 1 * cosDelta;

		if(this.startButtonOpacity === 1) trace("True END");
		else setTimeout(() => this.showStartButtonAnimation(), 16);


	}

	generateBoard(){

		//Generate each color part for each players
		
		///TEST
		//this.mvc.model.nbPlayer = 2;
		///TEST

		this.generateFreeSlotColor(this.mvc.model.nbPlayer);

		//Set the good size
		this.resize();
		this.setProportinalPosition();
	
		//Do the first draw
		this.draw();

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

		this.windowResizeHandler = event => this.onResize(event);
		window.addEventListener("resize", this.windowResizeHandler);


		//Input Event
		this.documentKeyDownHandler = event => this.onKeyDown(event);
		document.addEventListener("keydown", this.documentKeyDownHandler);

		this.documentKeyUpHandler = event => this.onKeyUp(event);
		document.addEventListener("keyup", this.documentKeyUpHandler);



		this.documentTouchStartHandler = event => this.onTouchStart(event);
		document.addEventListener("touchstart", this.documentTouchStartHandler);

		this.documentTouchMoveHandler = event => this.onTouchMove(event);
		document.addEventListener("touchmove", this.documentTouchMoveHandler);

		this.documentTouchEndHandler = event => this.onTouchEnd(event);
		document.addEventListener("touchend", this.documentTouchEndHandler);

		this.documentClickHandler = event => this.onClick(event);
		document.addEventListener("click", this.documentClickHandler);

		this.startButtonClickHandler = event => this.onStartButtonClick(event);
		this.startButton.addEventListener("click", this.startButtonClickHandler);


	}


	removeListeners() {

		window.removeEventListener("resize", this.windowResizeHandler);

		document.removeEventListener("keydown", this.documentKeyDownHandler);

		document.removeEventListener("keyup", this.documentKeyUpHandler);


		document.removeEventListener("touchstart", this.documentTouchStartHandler);

		document.removeEventListener("touchmove", this.documentTouchMoveHandler);

		document.removeEventListener("touchend", this.documentTouchEndHandler);

		document.removeEventListener("click", this.documentClickHandler);



		//We also clear the timeout of the input
		this.pressedKeyToLoopId.forEach((value) => {
			clearTimeout(value);
		});
		this.pressedKeyToLoopId.clear();



	}

	onStartButtonClick(event){

		this.mvc.controller.ioGo();

	}

	onTouchStart(event){

		///A AJOUTER A LINITIALISATION
		this.touchStartPos = [event.touches[0].pageX, event.touches[0].pageY];

		this.untilNextTouch = false;
		///

	}

	/*
		This method will convert a touchmove event into a key event
	*/
	onTouchMove(event){

		let newTouchPos = [event.touches[0].pageX, event.touches[0].pageY];


		if(this.touchStartPos[0] < (newTouchPos[0] - window.innerWidth*0.01)){

			trace("DROITE");
			this.setInputLoop(68);

		}
				
		else if(this.touchStartPos[0] > (newTouchPos[0] + window.innerWidth*0.01)){

			this.cleanInputLoop(68);


			trace("GAUCHE");
			this.setInputLoop(81);

		}
		else{

			this.cleanInputLoop(68);
			this.cleanInputLoop(81);




			if(this.touchStartPos[1] < (newTouchPos[1] - window.innerHeight*0.01)){

				trace("BAS");
				this.setInputLoop(83);

			}
			else if(this.touchStartPos[1] > (newTouchPos[1] + window.innerHeight*0.01) && !this.untilNextTouch){
				
				this.cleanInputLoop(83);

				this.untilNextTouch = true;


				trace("HAUT");
				this.setInputLoop(90);

			}
			else{

				this.cleanInputLoop(83);
				this.cleanInputLoop(90);

			}

		}

		this.touchStartPos = newTouchPos;


	}

	onTouchEnd(event){

		//Clear every input loop
		this.pressedKeyToLoopId.forEach((value) => {
			clearTimeout(value);
		});
		this.pressedKeyToLoopId.clear();

	}

	/*
		Especially for tactile devices
	*/
	onClick(event){
		this.moveInput(39);
	}

	onKeyDown(event){


		this.setInputLoop(event.keyCode);


	}


	setInputLoop(key){

		//Small verif
		if(this.pressedKeyToLoopId.has(key)) return;

		this.moveInput(key);

		this.pressedKeyToLoopId.set(key, setTimeout(() => this.inputLoop(key), 100));

	}

	onKeyUp(event){

		this.cleanInputLoop(event.keyCode);



		
	}

	cleanInputLoop(key){
		
		if(this.pressedKeyToLoopId.has(key)){
			clearTimeout(this.pressedKeyToLoopId.get(key));
			this.pressedKeyToLoopId.delete(key);
		}

	}

	moveInput(value){
		switch(value){
			//Left Q
			case 81:
				this.mvc.controller.movingKey(0);
				break;
			
			//Right D
			case 68:
				this.mvc.controller.movingKey(1);
				break;

			//Down S
			case 83:
				this.mvc.controller.movingKey(2);
				break;
			
			//Fast Fall Z
			case 90:
				this.mvc.controller.movingKey(3);
				break;

			//Rotate Left, left and down arrow
			case 37:
				this.mvc.controller.rotateKey(1);
				break;
			case 40:
				this.mvc.controller.rotateKey(1);
				break;

			//Rotate Right, right and up arrow
			case 39:
				this.mvc.controller.rotateKey(0);
				break;
			case 38:
				this.mvc.controller.rotateKey(0);
				break;

			//Fast Share left, E
			case 69:
				this.mvc.controller.movingKey(4);
				break;

			//Fast Share right, A
			case 65:
				this.mvc.controller.movingKey(5);
				break;

			//Go, R
			case 82:
				this.mvc.controller.ioGo();
				break;

			default:
				trace("Input :", value, " is not a game key.");
		}
	}

	inputLoop(value){

		this.pressedKeyToLoopId.set(value, setTimeout(() => this.inputLoop(value), 100));

		//If this key is not in the NO_LOOP_KEY execute the input
		if(!NO_LOOP_KEY.has(value)){
			this.moveInput(value);
		}

	}

	update(){

	}

	/*
		When receiving the window resize event
	*/
	onResize(){

		//We resize elements
		this.resize();
		//We set the good position to the canvas
		this.setProportinalPosition();
		//And we show the change
		this.draw();

	}

	/*
		Addapt the slot size and canvas size to the new window size
	*/
	resize(){

		let maxWidth  = window.innerWidth *0.75;
		let maxHeight = window.innerHeight*0.75;


		let finalWidth = maxWidth;
		let finalHeight = this.mvc.model.boardRow * finalWidth / this.mvc.model.boardLen;


		if(finalHeight > maxHeight){

			this.slotHeight = maxHeight/this.mvc.model.boardRow;
			this.slotWidth = this.slotHeight;
		
			this.slotSpace = (this.slotWidth*0.5 + this.slotHeight*0.5)*0.03;
			

			this.boardCanvas.height = maxHeight;
			this.boardCanvas.width = this.mvc.model.boardLen * this.slotWidth + this.slotSpace/2;

		}
		else{

			this.slotWidth 	= maxWidth/this.mvc.model.boardLen;
			this.slotHeight = this.slotWidth;
			
			this.slotSpace = (this.slotWidth*0.5 + this.slotHeight*0.5)*0.03;


			this.boardCanvas.width = maxWidth;
			this.boardCanvas.height = this.mvc.model.boardRow * this.slotHeight + this.slotSpace/2;

		}

		/* Resizing the next piece display in function of the board */

		let freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		let proportionOfFreeSpace = freeBlankSpace/window.innerHeight;
		let offsetMargin = proportionOfFreeSpace * (3/4);

		let result = (offsetMargin * window.innerHeight);

		let finalSize = result * (3/4);

		//limiting the next piece width to the boardsize
		if(finalSize > this.boardCanvas.width*(2/3)) finalSize =  this.boardCanvas.width *(2/3);

		this.nextPieceCanvas.height = finalSize;
		this.nextPieceCanvas.width  = this.nextPieceCanvas.height;

		this.slotHeightNextPiece = this.nextPieceCanvas.height/4;
		this.slotWidthNextPiece = this.slotHeightNextPiece;
	
		this.slotSpaceNextPiece = (this.slotWidthNextPiece*0.5 + this.slotHeightNextPiece*0.5)*0.03;
			
	}

	/*
		Draw the board in the canvas
	*/
	draw(){

		/* Drawing the board */
		let canvas2dContextBoard = this.boardCanvas.getContext("2d");
		canvas2dContextBoard.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);


		this.mvc.model.boardData.forEach((element, index) => {
			
			let x = index%this.mvc.model.boardLen;
			let y = Math.trunc(index/this.mvc.model.boardLen);

			/*Choosing the Slot color in fucntion of the number of players*/
			if(element == 0){
				canvas2dContextBoard.fillStyle = this.freeSlotColor[x];
			}
			else{
				canvas2dContextBoard.fillStyle = PIECE_COLOR[element];
			}


			canvas2dContextBoard.fillRect(x * this.slotWidth + this.slotSpace,
						y * this.slotHeight + this.slotSpace,
						this.slotWidth - this.slotSpace*2,
						this.slotHeight - this.slotSpace*2);

		});


		/* Drawing the next piece */
		let canvas2dContextNextPiece = this.nextPieceCanvas.getContext("2d");
		canvas2dContextNextPiece.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);

		this.mvc.model.nextPieceData.forEach((element, index) => {
			
			let x = index%this.mvc.model.nextPieceLen;
			let y = Math.trunc(index/this.mvc.model.nextPieceLen);
			let ratioInFunctionOfNextPieceLenght = 4/this.mvc.model.nextPieceLen;
			if(element == 0){
				if(x%2 == 0){
					canvas2dContextNextPiece.fillStyle = this.playerColors[(this.mvc.model.nextPiecePlayer*2)];
				} else {
					canvas2dContextNextPiece.fillStyle = this.playerColors[((this.mvc.model.nextPiecePlayer*2)+1)];
				}
			} else {
				canvas2dContextNextPiece.fillStyle = PIECE_COLOR[element];
			}

			/*canvas2dContextBoard.fillRect(x * this.slotWidthNextPiece + this.slotSpaceNextPiece ,
						y * this.slotHeightNextPiece  + this.slotSpaceNextPiece ,
						this.slotWidthNextPiece  - this.slotSpaceNextPiece *2,
						this.slotHeightNextPiece  - this.slotSpaceNextPiece *2);*/

			canvas2dContextNextPiece.fillRect(x * this.slotWidthNextPiece * ratioInFunctionOfNextPieceLenght + this.slotSpaceNextPiece* ratioInFunctionOfNextPieceLenght,
						                      y * this.slotHeightNextPiece* ratioInFunctionOfNextPieceLenght + this.slotSpaceNextPiece* ratioInFunctionOfNextPieceLenght,
						                      this.slotWidthNextPiece* ratioInFunctionOfNextPieceLenght - this.slotSpaceNextPiece* ratioInFunctionOfNextPieceLenght,
						                      this.slotHeightNextPiece* ratioInFunctionOfNextPieceLenght - this.slotSpaceNextPiece* ratioInFunctionOfNextPieceLenght);

		});

	}


	/*
		Keep the board at a central position
	*/
	setProportinalPosition(){

		let freeBlankSpace = window.innerWidth - this.boardCanvas.width;
		let proportionOfFreeSpace = freeBlankSpace/window.innerWidth;
		let offsetMargin = proportionOfFreeSpace * 0.5;

		let boardStartH = (offsetMargin * window.innerWidth)
		this.boardCanvas.style.left = boardStartH + "px";


		freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		proportionOfFreeSpace = freeBlankSpace/window.innerHeight;
		offsetMargin = proportionOfFreeSpace * (3/4);

		let boardStartV = (offsetMargin * window.innerHeight)
		this.boardCanvas.style.top = boardStartV + "px";


		freeBlankSpace = window.innerWidth - this.nextPieceCanvas.width;
		proportionOfFreeSpace = freeBlankSpace/window.innerWidth;
		offsetMargin = proportionOfFreeSpace * 0.5;
		this.nextPieceCanvas.style.left = (offsetMargin * window.innerWidth) + "px";


		freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		proportionOfFreeSpace = freeBlankSpace/window.innerHeight;
		offsetMargin = proportionOfFreeSpace * (3/4);

		let result = (offsetMargin * window.innerHeight) * (3/4);

		this.nextPieceCanvas.style.top = (boardStartV - (result))/2  + "px";

		//this.actualScoreDiv.style.left = window.innerWidth/2 + (result)/2 + 1 + "px";
		this.actualScoreDiv.style.top = boardStartV + this.boardCanvas.height + "px";
		this.actualScoreDiv.style.fontSize = this.boardCanvas.height/2 + "%";


		this.mvc.model.playersNicknames.forEach((_,index) => {
			this.mvc.view.playerNicknamesDiv[index].style.width = this.boardCanvas.width/this.mvc.model.nbPlayer + "px";
			this.mvc.view.playerNicknamesDiv[index].style.top = boardStartV + "px";
			this.mvc.view.playerNicknamesDiv[index].style.fontSize = this.boardCanvas.height/3 + "%";
			this.mvc.view.playerNicknamesDiv[index].style.left = boardStartH + (this.boardCanvas.width/this.mvc.model.nbPlayer) * index + 5 + "px";
		});

		/*this.playerLeft.style.width = this.boardCanvas.width/2.2 + "px";
		this.playerRight.style.width = this.playerLeft.style.width;

		this.playerLeft.style.top = boardStartV + "px";
		this.playerRight.style.top = this.playerLeft.style.top;


		this.playerLeft.style.fontSize = this.boardCanvas.height/3 + "%";
		this.playerRight.style.fontSize = this.boardCanvas.height/3 + "%";

		this.playerLeft.style.left = boardStartH + 5 + "px";
		this.playerRight.style.left = boardStartH + this.boardCanvas.width/2 + 5 + "px";*/
	}

	/*
		Segment the board's colors for each players
	*/
	generateFreeSlotColor(nbPlayer){
		/*Generate some pair color*/
		let r  = Math.random() * (135 - 200) + 200;
		let g  = Math.random() * (135 - 200) + 200;
		let b  = Math.random() * (135 - 200) + 200;
		this.playerColors = new Array(nbPlayer).fill(0).map(() =>{
			let rt  = b
			let gt  = r
			let bt  = g

			/*retry while we don't have a colourful color*/
			while(rt - gt < 50 && gt - bt <50 && bt - rt <50){
				rt  = Math.random() * (135 - 200) + 200;
				gt  = Math.random() * (135 - 200) + 200;
				bt  = Math.random() * (135 - 200) + 200;
			}

			r = rt
			b = bt
			g = gt
			return ["rgb("+ r +","+ g +"," + b + ")", "rgb("+(r+45)+","+(g+45)+"," + (b+45) +")"]
		});

		/*Concat pairs in one tab*/
		this.playerColors = this.playerColors.reduce((acc, elem) => {
			return acc.concat(elem);
		});


		/*Filling a tab of every color a X can take, we will use it in the draw function for knowing which slot is colored with a color*/
		this.freeSlotColor = new Array(this.mvc.model.boardLen).fill(0).map((element,x) =>{
			if(element == 0){
				if(x%2 == 0){
					return this.playerColors[0 + 2 *Math.floor(x/(this.mvc.model.boardLen/nbPlayer))];
				} else {
					return this.playerColors[1 + 2 *Math.floor(x/(this.mvc.model.boardLen/nbPlayer))];
				}
			}
		});

	}

}


class gameController extends Controller {

	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}

	//0 = left, 1 = right, 3 = fastFall
	movingKey(direction){
		this.mvc.app.io.emit("movingKey", direction);
	}

	rotateKey(direction){
		this.mvc.app.io.emit("rotateKey", direction);
	}

	/*
		This method send Go event to the server
	*/
	ioGo(){
		this.mvc.app.io.emit("go");
	}

}