

window.addEventListener("load", event => new Base());

class Base {

	constructor() {

		trace("loaded");

		this.chatDiv = null;
		this.chatMvc = null;

		this.initialize();

	}

	async initialize() {

		let address = window.location.href;

		this.iospace = "baseapp"; // IO namespace for this app
		this.io = io.connect(address + this.iospace); // connect socket.io
		this.io.on("connect", () => this.onIOConnect()); // listen connect event

		this.mvc = new MVC("connection", this, new MyModel(), new MyView(), new MyController()); // init app MVC
		await this.mvc.initialize(); // run init async tasks
		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface


		this.getData();

	}


	async getData(){

		this.mvc.controller.getHallOfFame();
	
	}


	async changeToGameMVC(model, view, controller){

		this.mvc.destruct();

		this.mvc = new MVC("game", this, model, view, controller); // init app MVC
		await this.mvc.initialize(); // run init async tasks

		this.chatMvc = new MVC("gameChat", this, new ChatModel(), new ChatView(), new ChatController());
		await this.chatMvc.initialize();

		//Creating the chat element
		this.chatDiv = new easyElement("div")
						.setStyle({	position:"absolute",
									left: (- window.innerWidth * 0.5) + "px",
									top: "0px",
									width: (window.innerWidth * 0.5) + "px",
									height: window.innerHeight + "px",
									zIndex: "100" })
						.attach(document.body)
						.getElement();


		//Game
		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface

		//Game Chat
		this.chatMvc.view.attach(this.chatDiv);
		this.chatMvc.view.activate();

	}


	focusChat(){
		this.mvc.view.deactivate();
	}

	stopFocusChat(){
		this.mvc.view.activate();
	}

	/**
	 * @method onIOConnect : socket is connected
	 */
	onIOConnect() {
		trace("IO connected");

		this.io.on("connectedRoom", packet => this.onConnectedRoom(packet));
		

		this.io.on("start", packet => this.onStart(packet));
		this.io.on("end", () => this.onEnd());

		this.io.on("boardData", packet => this.onBoardData(packet));
		this.io.on("nextPieceData", packet => this.onNextPieceData(packet));
		this.io.on("score", packet => this.onScore(packet));
		this.io.on("nicknames", packet => this.onNicknames(packet));

		this.io.on("message", packet => this.onMessage(packet));
	}


	onConnectedRoom(packet){
		this.mvc.controller.ioConnectedRoom(packet);
	}

	onStart(packet){
		this.mvc.model.ioStart(packet);
	}

	onEnd(){
		this.mvc.model.ioEnd();
	}

	onBoardData(packet){
		this.mvc.model.ioBoardData(packet);
	}

	onNextPieceData(packet){
		this.mvc.model.ioNextPieceData(packet);
	}

	onScore(packet){
		this.mvc.model.ioScore(packet);
	}

	onMessage(packet){
		this.chatMvc.model.ioMessage(packet);
	}

	onNicknames(packet){
		this.mvc.model.ioNicknames(packet);
	}

}




class MyModel extends Model {

	constructor() {
		super();
	}

	async initialize(mvc) {
		super.initialize(mvc);
	}


	async hallOfFameData(){
		trace("get hall of fame");

		let result = await Comm.get("hallOfFame");
		return result.response;

	}

}



class MyView extends View {

	constructor() {
		super();
		this.table = null;
	}

	async destruct(){
		this.mvc.view.detach(); // detach view
		this.mvc.view.deactivate(); // deactivate user interface
	}

	async initialize(mvc) {
		super.initialize(mvc);

		this.stage.style.backgroundColor = "rgb(90, 30, 35)";

		this.title = new easyElement("div")
				.setStyle({	position:"absolute",
							fontSize:"6vh",
							top:"1%",
							left:"0%",
							width:"100%",
							height:"9%",
							textAlign:"center",
							fontWeight: "bold"})
				.setText("TETRIS COOP")
				.attach(this.stage)
				.getElement();

		this.connectDiv = new easyElement("div")
						.setStyle({	position:"absolute",
									backgroundColor:"rgb(40, 50, 120)",
									top:"10%",
									left:"0",
									width:"100%",
									height:"35%",
									borderRadius: "2px",
								    border:"5px solid rgb(120, 150, 200)",
								    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.4), 0 6px 20px 0 rgba(0,0,0,0.38)"
								    })
						.attach(this.stage)
						.getElement();

		this.nicknameTitle = new easyElement("div")
				.setStyle({	position:"absolute",
							color:"white",
							fontSize:"4vh",
							top:"11%",
							left:"20%",
							width:"60%",
							height:"5%",
							textAlign:"center"})
				.setText("Nickname")
				.attach(this.stage)
				.getElement();

		this.nicknameTextField = new easyElement("input")
						.setStyle({	position:"absolute",
									fontSize:"4vh",
									top:"16%",
									left:"20%",
									width:"60%",
									height:"7%",
									zIndex:"0",
									textAlign:"center",
									border:"5px solid rgb(120, 150, 200)",
									borderRadius: "5px",
									boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)"})
						.setAttribute({	type:"text",
										pattern:"^[A-Za-z0-9]+$",
										autoFocus:"autofocus"})
						.attach(this.stage)
						.getElement();

		this.roomTitle = new easyElement("div")
				.setStyle({	position:"absolute",
							color:"white",
							fontSize:"4vh",
							top:"24%",
							left:"20%",
							width:"60%",
							height:"5%",
							textAlign:"center"})
				.setText("Room")
				.attach(this.stage)
				.getElement();

		this.roomIDTextField = new easyElement("input")
						.setStyle({	position:"absolute",
									fontSize:"4vh",
									top:"29%",
									left:"20%",
									width:"60%",
									height:"7%",
									zIndex:"0",
									textAlign:"center",
									border:"5px solid rgb(120, 150, 200)",
									borderRadius: "5px",
									boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)"})
						.setAttribute({	type:"text",
										pattern:"^[0-9]+$"})
						.attach(this.stage)
						.getElement();



		this.connectButton = new easyElement("button")
						.setStyle({	position:"absolute",
									top:"37.5%",
									left:"35%",
									width:"30%",
									height:"5%",
									fontSize:"2vh",
									backgroundColor:"white",
									border:"5px solid rgb(120, 150, 255)",
									borderRadius: "5px",
									boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)"})
						.setText("Connect")
						.attach(this.stage)
						.getElement();

		
		this.colorChanger();
	}

	/*
		This method animate the hallOfFame and make it move
	*/
	move(){
		this.hallOfFameText.forEach((element,index) => {
			element.style.left = this.hallOfFamePositions[index] + "px";
			//trace("taille ", element.offsetWidth)
			if(this.hallOfFamePositions[index] > -element.offsetWidth + this.hallOfFameScore[index].offsetWidth)
				this.hallOfFamePositions[index]--;
			else if(this.hallOfFamePositions[index] <= -element.offsetWidth + this.hallOfFameScore[index].offsetWidth)
				this.hallOfFamePositions[index] = window.innerWidth;
		});
		setTimeout(() => this.move(),1000/60);
	}

	colorChanger(){
		this.title.style.color = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + + Math.floor(Math.random() * 255) + ")";
		setTimeout(() => this.colorChanger(), 250);
	}

	//Creating some div, variables for hall of fame animations..
	createHallOfFame(packet){

		//Title div of HoF
		this.hallOfFameTitleDiv = new easyElement("div")
						.setStyle({	position:"absolute",
									backgroundColor:"rgb(35, 80, 50)",
									top:"55%",
									left:"0",
									width:"100%",
									height:"7%",borderRadius: "2px",
								    border:"5px solid rgb(40, 100, 50)",
								    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.4), 0 6px 20px 0 rgba(0,0,0,0.38)"})
						.attach(this.stage)
						.getElement();

		//Title of Hall of Fame
		this.hallOfFameTitle = new easyElement("div")
				.setStyle({	position:"absolute",
							color:"white",
							fontSize:"4vh",
							top:"56%",
							left:"20%",
							width:"60%",
							height:"5%",
							textAlign:"center"})
				.setText("Hall of Fame")
				.attach(this.stage)
				.getElement();

		//Creating sub div for HoF, only colored box
		this.hallOfFameDiv = [...Array(5)].map((element, index) =>{
				return new easyElement("div")
						.setStyle({	position:"absolute",
									backgroundColor:"rgb(40, 100, 50)",
									top: 62 + (28/5) * index + "%",
									left:"0",
									width:"100%",
									height:(28/5) + "%",
								    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.4), 0 6px 20px 0 rgba(0,0,0,0.38)",
									overflow: "hidden"})
						.getElement();
		});

		//Creating sub div, only for the text which is moving
		this.hallOfFameText = [...Array(5)].map((element, index) =>{
				return new easyElement("div")
						.setStyle({	position:"absolute",
									top: 62.5 + (28/5) * index + "%",
									left: "100%",
									height:(28/5) + "%",
								    fontSize:"4vh",
									whiteSpace: "nowrap"})
						.setText("Etienne & Guillaume")
						.getElement();
		});

		//Creating sub divs for the scores
		this.hallOfFameScore = [...Array(5)].map((element, index) =>{
				return new easyElement("div")
						.setStyle({	position:"absolute",
									backgroundColor:"rgb(40, 100, 50)",
									top: 62 + (28/5) * index + "%",
									height:(28/5) + "%",
									fontSize:"4vh",
								    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)",
									overflow: "hidden"})
						.setAttribute({	align: "right"})
						.getElement();
		});

		//
		this.hallOfFameDiv.forEach((element,index) => {
			this.stage.appendChild(element);
		});

		this.hallOfFameText.forEach((element,index) => {
			this.stage.appendChild(element);
		});

		this.hallOfFameScore.forEach((element,index) => {
			this.stage.appendChild(element);
		});

		this.hallOfFamePositions = [...Array(5)].fill(0);


		
		//Filling our hall with score and name from JSON
		packet.top5.forEach((element,index) => {
			this.hallOfFameScore[index].innerHTML = element.score + ":";
			this.hallOfFameText[index].innerHTML = element.names; //On peut faire ca mdr ?
		});


		//Coloring the HoF in function of placement or things...
		this.hallOfFameScore.forEach((_,index) => {
			if(index == 0){
				this.hallOfFameText[index].style.color = "gold";
				this.hallOfFameScore[index].style.color= "gold";
			} else if(index == 1){
				this.hallOfFameText[index].style.color = "silver";
				this.hallOfFameScore[index].style.color= "silver";
			} else if(index == 2){
				this.hallOfFameText[index].style.color = "#cd7f32";
				this.hallOfFameScore[index].style.color= "#cd7f32";
			}

			if(index%2 == 0){
				this.hallOfFameDiv[index].style.backgroundColor = "rgb(30, 100, 70)";
				this.hallOfFameScore[index].style.backgroundColor = "rgb(30, 100, 70)";
			}
		});

		this.move();

	}

	// activate UI
	activate() {
		super.activate();
		this.addListeners(); // listen to events
		//this.move();
	}

	// deactivate
	deactivate() {
		super.deactivate();
		this.removeListeners();
	}

	addListeners() {

		this.connectButtonHandler = event => this.connectButtonClick(event);
		this.connectButton.addEventListener("click", this.connectButtonHandler);


		this.roomIDTextFieldInputHandler = event => {
			//trace(event.target.value);
			event.target.value = event.target.value.replace(/[^0-9]/, "");
		}
		this.roomIDTextField.addEventListener("input", this.roomIDTextFieldInputHandler);


		/*Handling the enter button to the text input*/
		this.roomIDTextFieldKeyHandler = event => {
			if(event.keyCode == 13)
				this.connectButtonClick();
		};

		this.roomIDTextField.addEventListener("keydown",this.roomIDTextFieldKeyHandler);





		this.nicknameTextFieldInputHandler = event => {
			//trace(event.target.value);
			event.target.value = event.target.value.replace(/[^A-Za-z0-9]/, "");
		}
		this.nicknameTextField.addEventListener("input", this.nicknameTextFieldInputHandler);

		
		/*Handling the enter button to the text input*/
		this.nicknameTextFieldKeyHandler = event => {
			if(event.keyCode == 13)
				this.roomIDTextField.focus();
		};

		this.nicknameTextField.addEventListener("keydown",this.nicknameTextFieldKeyHandler);
	}

	removeListeners() {
		this.connectButton.removeEventListener("click", this.connectButtonHandler); 
		this.roomIDTextField.removeEventListener("input", this.roomIDTextFieldInputHandler);
		this.roomIDTextField.removeEventListener("keydown",this.roomIDTextFieldKeyHandler);
	}


	connectButtonClick(event){
		this.mvc.controller.connectButtonWasClicked(this.roomIDTextField.value, this.nicknameTextField.value);
	}



	update(data) {
		while(this.table.firstChild) this.table.removeChild(this.table.firstChild); // empty table
		data.forEach(el => { // loop data
			let line = document.createElement("tr"); // create line
			Object.keys(el).forEach(key => { // loop object keys
				let cell = document.createElement("td"); // create cell
				cell.innerHTML = el[key]; // display
				line.appendChild(cell); // add cell
			});
			this.table.appendChild(line); // add line
		});
	}


}




class MyController extends Controller {

	constructor() {
		super();
	}

	initialize(mvc) {
		super.initialize(mvc);

	}


	async getHallOfFame(){
		this.mvc.view.createHallOfFame(await this.mvc.model.hallOfFameData());
	}


	async connectButtonWasClicked(roomNb, nickname){


		if(!/^[0-9]+$/.test(roomNb)){//J'ai écris ca parceque ca marche 
			trace(roomNb, "is an invalid room number.");
			return;
		}

		if(!/^[A-Za-z0-9]+$/.test(nickname)){
			trace(nickname, "is an invalid nickname.");
			return;
		}

		this.mvc.app.io.emit("connectRoom", {value: roomNb, nickname: nickname});
	}


	async ioConnectedRoom(packet){
		trace("CONNECTED TO ROOM :", packet.room); //test


		this.mvc.app.changeToGameMVC(new gameModel(), new gameView(), new gameController());

	}

}
