

class gameModel extends Model {

	constructor(size, len) {
		super();

		this.boardSize 	= size;
		this.boardLen 	= len;
		

		this.boardData 	= new Array(this.boardSize).fill(0);

		this.numColor 	= new Map([[0, "rgb(255, 255, 255)"], [1, "rgb(255, 0, 0)"]]);
		


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

		this.stage.style.backgroundColor = "green";

		this.boardCanvas = new easyElement("canvas")
				.setStyle({	position:"absolute",
							backgroundColor:"black",
							top:"10%",
							left:"10%"})
				.setAttribute({	width: window.innerWidth*0.8,
								height: window.innerHeight*0.8})
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

	draw(){

		let canvas2dContext = this.boardCanvas.getContext("2d");

		let width 	= this.boardCanvas.width;
		let height 	= this.boardCanvas.height

		let slotWidth 	= width/this.mvc.model.boardLen;
		let slotHeight 	= height/(this.mvc.model.boardSize/this.mvc.model.boardLen);

		let slotSpace = (slotWidth*0.5 + slotHeight*0.5)*0.03;



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