

class gameModel extends Model {

	constructor(size, len) {
		super();

		this.boardSize 	= size;
		this.boardLen 	= len;
		

		this.boardData 	= new Array(this.boardSize).fill(0);

		this.numColor 	= new Map([[0, "rgb(255, 255, 255)"],
									[1, "rgb(252, 232, 3)"],
									[2, "rgb(3, 211, 252)"],
									[3, "rgb(152, 3, 252)"],
									[4, "rgb(28, 156, 45)"],
									[5, "rgb(219, 41, 13)"],
									[6, "rgb(7, 22, 186)"],
									[7, "rgb(242, 126, 31)"]]);
		


	}

	async initialize(mvc) {
		super.initialize(mvc);

	}

	moveNew(where){

		if(where == 0){
			this.newPiecePos[1] += 1;
		}

	}


	ioBoardData(packet){
		this.boardData = packet;

		//this.mvc.model.moveNew(0);
		this.mvc.view.draw();
	}

}



class gameView extends View {
	constructor() {
		super();
	}

	async initialize(mvc) {
		await super.initialize(mvc);

		console.log("lol");

		this.stage.style.backgroundColor = "rgb(120, 41, 54)";

		this.boardCanvas = new easyElement("canvas")
				.setStyle({	position:"absolute",
							backgroundColor:"black"})
				.setAttribute({	width: window.innerWidth  *0.75,
								height: window.innerHeight*0.75})
				.attach(this.stage)
				.getElement();


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

	}

	removeListeners() {

		document.removeEventListener("keydown", this.stageInputHandler);
		//this.stage.removeEventListener("keydown", this.stageInputHandler);

	}

	keyboardInput(event){



		//0 = left, 1 = right
		let direction;
		if(event.keyCode == 81) {
			direction = 0;

		}
		else if(event.keyCode == 68) {
			direction = 1;
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

	/*Handle resize*/
	resize(){

		window.onresize = ()=>{
			this.boardCanvas.width  = window.innerWidth *0.75;
			this.boardCanvas.height = window.innerHeight*0.75;
			this.drawSquareField();		
			this.setProportinalPosition();	
		};
	}

	/*Drawing part*/
	draw(){
		this.drawSquareField();
		this.setProportinalPosition();
		this.resize();
	}

	/*Drawing the play board, pieces, in function of the numbers of cases*/
	drawSquareField(){
		let canvas2dContext = this.boardCanvas.getContext("2d");

		let width  = this.boardCanvas.width;
		let height = this.boardCanvas.height;		

		let slotWidth 	= width/this.mvc.model.boardLen;
		let slotHeight 	= height/(this.mvc.model.boardSize/this.mvc.model.boardLen);

		/*Displaying correctly cases*/
		if ((this.mvc.model.boardSize/this.mvc.model.boardLen) > this.mvc.model.boardLen){
			slotWidth = slotHeight
		}else if ((this.mvc.model.boardSize/this.mvc.model.boardLen) <= this.mvc.model.boardLen){
			slotHeight=slotWidth
		}

		let slotSpace = (slotWidth*0.5 + slotHeight*0.5)*0.03;

		/*Displaying correctly cases*/
		/*BUG UNE DES PROP NEGATIVES WTF ?*/
		if ((this.mvc.model.boardSize/this.mvc.model.boardLen) > this.mvc.model.boardLen){
			this.boardCanvas.width = this.mvc.model.boardLen * slotWidth + slotSpace;

		}else if ((this.mvc.model.boardSize/this.mvc.model.boardLen) <= this.mvc.model.boardLen){
			this.boardCanvas.height = (this.mvc.model.boardSize/this.mvc.model.boardLen)* slotHeight + slotSpace
		}

		//We do all the board
		this.mvc.model.boardData.forEach((element, index) => {
			
			let x = index%this.mvc.model.boardLen;
			let y = Math.trunc(index/this.mvc.model.boardLen);

			canvas2dContext.fillStyle = this.mvc.model.numColor.get(element);
			canvas2dContext.fillRect(x * slotWidth + slotSpace,
						y * slotHeight + slotSpace,
						slotWidth - slotSpace*2,
						slotHeight - slotSpace*2);

		});
	}


	/*Keep the board at a central position*/
	/*BUG UNE DES PROP NEGATIVES WTF ?*/
	setProportinalPosition(){
		let freeBlankSpace = window.innerWidth - this.boardCanvas.width;
		console.log("width " + freeBlankSpace)
		let proportionOfFreeSpace = (freeBlankSpace * 100)/window.innerWidth;

		let offsetMargin = proportionOfFreeSpace/2;

		this.boardCanvas.style.left = offsetMargin.toString() + "%";

		freeBlankSpace = window.innerHeight - this.boardCanvas.height;
		console.log("height " + freeBlankSpace)

		proportionOfFreeSpace = (freeBlankSpace * 100)/window.innerHeight;

		offsetMargin = proportionOfFreeSpace/1.5;

		this.boardCanvas.style.top = offsetMargin.toString() + "%";
	}

}


class gameController extends Controller {

	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}

	//0 = left, 1 = right
	movingKey(direction){
		this.mvc.app.io.emit("movingKey", direction);
	}


}