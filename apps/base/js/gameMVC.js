
const PIECE_COLOR =	[	"rgb(255, 255, 255)",
						"rgb(252, 232, 3)",
						"rgb(0, 150, 255)",
						"rgb(152, 3, 252)",
						"rgb(28, 156, 45)",
						"rgb(219, 41, 13)",
						"rgb(7, 22, 186)",
						"rgb(242, 126, 31)"	]


const NO_LOOP_KEY = new Set([90, 37, 38, 39, 40, 32]);






class gameModel extends Model {

	constructor() {
		super();

		this.nbPlayer = 1;

		this.boardSize 	= 4;
		this.boardLen 	= 2;
		this.boardRow 	= 2;
		

		this.boardData 		= new Array(this.boardSize);
		this.nextPieceData	= new Array(4 * 4);
		this.nextPieceLen = 4;

		this.nextPiecePlayer = 0;

		
	}

	async initialize(mvc) {
		super.initialize(mvc);
		this.fillData(0);
	}

	fillData(value){
		this.boardData.fill(value);
		this.nextPieceData.fill(value);
	}


	ioStart(packet){

		this.nbPlayer 	= packet.nbPlayer;

		this.boardSize 	= packet.size;
		this.boardLen 	= packet.len;
		this.boardRow 	= this.boardSize / this.boardLen;

		this.fillData(0);

		this.mvc.view.generateBoard();

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

			/*Transfoming 2*2 matrix in 4 * 4 for a more beautiful display of the next piece*/

	transformNextPieceMatrix(){
		if(this.nextPieceLen == 2){
			this.nextPieceData = [...Array(4 * 4)].map((_, index) =>{
				switch(index){
					case 5:
						return this.nextPieceData[0];
						break;
					
					case 6:
						return this.nextPieceData[1];
						break;
					
					case 9:
						return this.nextPieceData[2];
						break;

					case 10:
						return this.nextPieceData[3];
						break;

					default:
					return 0;
				}
			});
			trace(this.nextPieceData)
			this.nextPieceLen  = 4
		}
	}

}



class gameView extends View {
	constructor() {
		super();

		this.slotWidth = 0;
		this.slotHeight = 0;
		this.slotSpace = 0;


		this.freeSlotColor = [];
		this.playerColors  = [];

		this.pressedKeyToLoopId = null;

		this.inputLoopId = 0;

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



		this.generateBoard();

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



	}


	removeListeners() {

		window.removeEventListener("resize", this.windowResizeHandler);

		document.removeEventListener("keydown", this.documentKeyDownHandler);

		document.removeEventListener("keyup", this.documentKeyUpHandler);


		///RAJOUTER ENLEVER EVENEMENT INPUT

	}

	onKeyDown(event){

		//Small verif
		if(this.pressedKeyToLoopId.has(event.keyCode)) return;


		this.moveInput(event.keyCode);

		this.pressedKeyToLoopId.set(event.keyCode, setTimeout(() => this.inputLoop(event.keyCode), 100));

	}

	onKeyUp(event){

		//Useless if
		if(this.pressedKeyToLoopId.has(event.keyCode)){
			clearTimeout(this.pressedKeyToLoopId.get(event.keyCode));
			this.pressedKeyToLoopId.delete(event.keyCode);
		}
		else{
			trace("Shoud never happen...");
		}
		
	}

	moveInput(value){
		switch(value){
			case 81:
				this.mvc.controller.movingKey(0);
				break;
			
			case 68:
				this.mvc.controller.movingKey(1);
				break;
			
			case 90:
				this.mvc.controller.movingKey(3);
				break;

			case 37:
				this.mvc.controller.rotateKey(1);
				break;
			case 40:
				this.mvc.controller.rotateKey(1);
				break;

			case 39:
				this.mvc.controller.rotateKey(0);
				break;
			case 38:
				this.mvc.controller.rotateKey(0);
				break;

			case 69:
				this.mvc.controller.movingKey(4);
				break;

			case 65:
				this.mvc.controller.movingKey(5);
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

		/*Resizing the next piece display in function of the board ;)*/
		this.nextPieceCanvas.height = this.slotWidth*this.mvc.model.nextPieceLen;
		this.nextPieceCanvas.width  = this.nextPieceCanvas.height;
	}

	/*
		Draw the board in the canvas
	*/
	draw(){

		/*Drawing the board*/
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


		/*Drawing the next piece*/
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

			canvas2dContextNextPiece.fillRect(x * this.slotWidth * ratioInFunctionOfNextPieceLenght + this.slotSpace* ratioInFunctionOfNextPieceLenght,
						                      y * this.slotHeight* ratioInFunctionOfNextPieceLenght + this.slotSpace* ratioInFunctionOfNextPieceLenght,
						                      this.slotWidth* ratioInFunctionOfNextPieceLenght - this.slotSpace* ratioInFunctionOfNextPieceLenght,
						                      this.slotHeight* ratioInFunctionOfNextPieceLenght - this.slotSpace* ratioInFunctionOfNextPieceLenght);

		});

	}


	/*Keep the board at a central position*/
	setProportinalPosition(){

		let freeBlankSpace = window.innerWidth - this.boardCanvas.width;
		let proportionOfFreeSpace = freeBlankSpace/window.innerWidth;
		let offsetMargin = proportionOfFreeSpace * 0.5;

		this.boardCanvas.style.left = (offsetMargin * window.innerWidth) + "px";


		freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		proportionOfFreeSpace = freeBlankSpace/window.innerHeight;
		offsetMargin = proportionOfFreeSpace * (3/4);

		this.boardCanvas.style.top = (offsetMargin * window.innerHeight) + "px";


		freeBlankSpace = window.innerWidth - this.nextPieceCanvas.width;
		proportionOfFreeSpace = freeBlankSpace/window.innerWidth;
		offsetMargin = proportionOfFreeSpace * 0.5;
		this.nextPieceCanvas.style.left = (offsetMargin * window.innerWidth) + "px";


		freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		proportionOfFreeSpace = freeBlankSpace/window.innerHeight;
		offsetMargin = proportionOfFreeSpace * (3/4);

		this.nextPieceCanvas.style.top = ((offsetMargin * window.innerHeight) - this.nextPieceCanvas.height*1.33) + "px";
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

}