
const PIECE_COLOR =	[	"rgb(255, 255, 255)",
						"rgb(252, 232, 3)",
						"rgb(3, 211, 252)",
						"rgb(152, 3, 252)",
						"rgb(28, 156, 45)",
						"rgb(219, 41, 13)",
						"rgb(7, 22, 186)",
						"rgb(242, 126, 31)"	]

const NB_PLAYER = 2

class gameModel extends Model {

	constructor(size, len) {
		super();

		this.boardSize 	= size;
		this.boardLen 	= len;
		this.boardRow 	= size/len;
		

		this.boardData 		= new Array(this.boardSize);
		this.nextPieceData	= new Array(4 * 4);
		
	}

	async initialize(mvc) {
		super.initialize(mvc);

		this.boardData.fill(0);
		this.nextPieceData.fill(0);
	}


	ioBoardData(packet){
		this.boardData = packet;

		this.mvc.view.draw();
	}

	ioNextPieceData(packet){

		this.nextPieceData = packet;

		///ICI FAIRE QUELQUE CHOSE POUR AFFICHER LA NOUVELLE PIECE RECU
		trace("RECU NEXT PIECE : ", this.nextPieceData);

	}


}



class gameView extends View {
	constructor() {
		super();

		this.slotWidth = 0;
		this.slotHeight = 0;
		this.slotSpace = 0;


		this.freeSlotColor = [];

	}

	async initialize(mvc) {
		await super.initialize(mvc);

		this.stage.style.backgroundColor = "rgb(120, 41, 54)";

		this.boardCanvas = new easyElement("canvas")
				.setStyle({	position:"absolute",
							backgroundColor:"black"})
				.setAttribute({	width: window.innerWidth  *0.75,
								height: window.innerHeight*0.75})
				.attach(this.stage)
				.getElement();

		//Generate each color part for each players
		this.generateFreeSlotColor()

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

		this.stageInputHandler = event => this.keyboardInput(event);
		document.addEventListener("keydown", this.stageInputHandler);
		//this.stage.addEventListener("keydown", this.stageInputHandler);


		//ICI RESIZE
		this.windowResizeHandler = event => this.onResize(event);
		window.addEventListener("resize", this.windowResizeHandler);


	}

	removeListeners() {

		document.removeEventListener("keydown", this.stageInputHandler);

		//ICI RESIZE
		window.removeEventListener("resize", this.windowResizeHandler);

	}

	keyboardInput(event){



		//0 = left, 1 = right
		let direction;
		if(event.keyCode == 81) {
			direction = 0;

		}
		else if(event.keyCode == 68){
			direction = 1;
		}
		else if(event.keyCode == 90){
			direction = 3;
		}
		else{
			trace("The pressed key is not one of the moving key");
			return;
		}

		trace("move to :", direction);

		this.mvc.controller.movingKey(direction);

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

	}

	/*
		Draw the board in the canvas
	*/
	draw(){

		let canvas2dContext = this.boardCanvas.getContext("2d");
		canvas2dContext.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);


		this.mvc.model.boardData.forEach((element, index) => {
			
			let x = index%this.mvc.model.boardLen;
			let y = Math.trunc(index/this.mvc.model.boardLen);

			/*Choosing the Slot color in fucntion of the number of players*/
			if(element == 0){
				canvas2dContext.fillStyle = this.freeSlotColor[x];
			}
			else{
				canvas2dContext.fillStyle = PIECE_COLOR[element];
			}


			canvas2dContext.fillRect(x * this.slotWidth + this.slotSpace,
						y * this.slotHeight + this.slotSpace,
						this.slotWidth - this.slotSpace*2,
						this.slotHeight - this.slotSpace*2);

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
		offsetMargin = proportionOfFreeSpace * (2/3);

		this.boardCanvas.style.top = (offsetMargin * window.innerHeight) + "px";
	}

	/*Segment the board's colors for each players*/
	generateFreeSlotColor(){
		/*Generate some pair color*/
		let r  = Math.random() * (125 - 200) + 200;
		let g  = Math.random() * (125 - 200) + 200;
		let b  = Math.random() * (125 - 200) + 200;
		let playerColors = new Array(NB_PLAYER).fill(0).map(() =>{
			let rt  = b
			let gt  = r
			let bt  = g

			/*retry while we don't have a colerful color*/
			while(rt - gt < 50 && gt - bt <50 && bt - rt <50){
				rt  = Math.random() * (125 - 200) + 200;
				gt  = Math.random() * (125 - 200) + 200;
				bt  = Math.random() * (125 - 200) + 200;
			}

			r = rt
			b = bt
			g = gt
			return ["rgb("+ r +","+ g +"," + b + ")", "rgb("+(r+45)+","+(g+45)+"," + (b+45) +")"]
		});

		/*Concat pairs in one tab*/
		playerColors = playerColors.reduce((acc, elem) => {
			return acc.concat(elem);
		});

		/*Filling a tab of every color a X can take, we will use it in the draw function for knowing which slot is colored with a color*/
		this.freeSlotColor = new Array(this.mvc.model.boardLen).fill(0).map((element,x) =>{
			if(element == 0){
				if(x%2 == 0){
					return playerColors[0 +2*Math.floor(x/(this.mvc.model.boardLen/NB_PLAYER))];
				} else {
					return playerColors[1 +2*Math.floor(x/(this.mvc.model.boardLen/NB_PLAYER))];
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


}