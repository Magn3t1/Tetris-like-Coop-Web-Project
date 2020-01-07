
class ChatModel extends Model {

	constructor(){
		super();
	}

	async initialize(mvc){
		await super.initialize(mvc);
	}

	ioMessage(packet){
		let sender =  packet.from;
		let message = packet.message;

		this.mvc.controller.receiveMessage(sender, message);
	}

}

class ChatView extends View {

	constructor(){
		super();

		this.chatDirection = false;
		this.chatPosition = 0;

		this.isChatMoving = false;
		
		this.animationLastTime = null;
	}

	async initialize(mvc){
		await super.initialize(mvc);

		//Background color of the chat
		this.stage.style.backgroundColor = "rgba(20, 100, 170, 0.7)";


		this.chatContent = new easyElement("div")
					.attach(this.stage)
					.getElement();

		this.chatContent.id = "chat";



		this.chatUL = new easyElement("ul")
				.attach(this.chatContent)
				.getElement();


		this.chatInputDiv = new easyElement("div")
				.setStyle({	backgroundColor:"rgb(29, 100, 89)"})
				.attach(this.stage)
				.getElement();
		this.chatInputDiv.id = "inputDiv";

		this.chatTextInput = new easyElement("input")
				.attach(this.chatInputDiv)
				.getElement();

		this.chatButton = new easyElement("button")
				.setText("Send")
				.attach(this.chatInputDiv)
				.getElement();


		this.openChatButton = new easyElement("div")
				.setStyle({ position:"absolute",
							left: "105%",
							top: "2%",
							width: "10vmin",
							height: "10vmin",
							backgroundColor: "white",
							textAlign:"center",
							fontSize:"3vmin",
							padding: "3vmin 0vw 3vmin",
							borderRadius:"2%",
							boxShadow: "0px 0px 30px 3px black"})
				.setText("Chat")
				.attach(this.stage)
				.getElement();

	}

	async destruct(){
		this.mvc.view.detach(); // detach view
		this.mvc.view.deactivate(); // deactivate user interface
	}

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

		this.documentKeyDownHandler = event => this.onKeyDown(event);
		document.addEventListener("keydown", this.documentKeyDownHandler);

		this.windowResizeHandler = event => this.onResize(event);
		window.addEventListener("resize", this.windowResizeHandler);

		this.chatButtonHandler = event => this.onChatButtonClick(event);
		this.chatButton.addEventListener("click", this.chatButtonHandler);

		this.chatTextInputFocusHandler = event => this.onChatTextInputFocus(event);
		this.chatTextInput.addEventListener("focus", this.chatTextInputFocusHandler);
	

		this.chatTextInputBlurHandler = event => this.onChatTextInputBlur(event);
		this.chatTextInput.addEventListener("blur", this.chatTextInputBlurHandler);

		this.openChatButtonClickHandler = event => this.onOpenChatButtonClick(event);
		this.openChatButton.addEventListener("click", this.openChatButtonClickHandler);

	}


	removeListeners() {

		document.removeEventListener("keydown", this.documentKeyDownHandler);

		window.removeEventListener("resize", this.windowResizeHandler);

		this.chatButton.removeEventListener("click", this.chatButtonHandler);

		this.chatTextInput.removeEventListener("focus", this.chatTextInputFocusHandler);
	
		this.chatTextInput.removeEventListener("blur", this.chatTextInputBlurHandler);


	}

	onOpenChatButtonClick(event){
		this.mvc.view.changeChat();
	}

	onChatTextInputFocus(){
		this.mvc.controller.gainFocus();
	}

	onChatTextInputBlur(){
		this.mvc.controller.loseFocus();
	}

	onResize(event){

		this.mvc.app.chatDiv.style.width = (window.innerWidth * 0.5) + "px";
		this.mvc.app.chatDiv.style.height = window.innerHeight + "px";

		//Peut se faire en une ligne mais paye ta ligne..
		let delta = (1 - Math.cos((this.chatPosition/100)*Math.PI))/2;
		let position = (- window.innerWidth / 2) * (1 - delta);
		this.mvc.app.chatDiv.style.left = position + "px";


	}

	onKeyDown(event){
							//C
		if(event.keyCode === 67){
			this.mvc.controller.cIsPressed();
		}
		else if(event.keyCode === 13){
			this.mvc.controller.enterPressed();
		}

	}

	onChatButtonClick(event){
		this.mvc.controller.chatButtonWasClicked();
	}





	resetInputMessage(){
		this.chatTextInput.value = "";
	}

	addUserMessage(sender, message){

		new easyElement("li")
				.setText(sender + " : " + message)
				.attach(this.chatUL)
				.getElement();

		this.chatContent.scrollTo(0, this.chatContent.scrollHeight);

	}


	changeChat(){

		this.chatDirection = 1 - this.chatDirection;

		if(!this.isChatMoving){
			window.requestAnimationFrame((delta) => {
				
				this.animationLastTime = delta;

				this.transitionAnimation(delta + 16);

			});
		}

	}

	transitionAnimation(time){

		let deltaTime = time/1000 - this.animationLastTime/1000;

		this.animationLastTime = time;


		if(this.chatDirection){
			this.chatPosition += 100 * deltaTime;
		}
		else{
			this.chatPosition -= 100 * deltaTime;
		}


		if(this.chatPosition >= 100){
			this.chatPosition = 100;
			this.isChatMoving = false;
		}
		else if(this.chatPosition <= 0){
			this.chatPosition = 0;
			this.isChatMoving = false;
		}
		else{
			window.requestAnimationFrame((delta) => this.transitionAnimation(delta));
		}

		//Calcul du coeficiant d'interpolation
		//let delta = Math.sin((this.chatPosition/100) * Math.PI/2 );
		let delta = (1 - Math.cos((this.chatPosition/100)*Math.PI))/2;


		//Interpolation, la deuxieme position est 0 donc elle n'apparait pas dans le calcul
		let position = (- window.innerWidth / 2) * (1 - delta);

		this.mvc.app.chatDiv.style.left = position + "px";


	}

}

class ChatController extends Controller {

	constructor(){
		super();

		this.hasFocus = false;
		
	}

	async initialize(mvc){
		await super.initialize(mvc);
	}

	cIsPressed(){
		if(!this.hasFocus){
			this.mvc.view.changeChat();
		}
	}

	enterPressed(){
		this.changeFocus();
		if(!this.hasFocus){
			this.sendMessageWithViewInput();
		}
	}

	changeFocus(){
		this.hasFocus = 1 - this.hasFocus;

		trace("VALEUR DE HAS FOCUS:", this.hasFocus);

		if(this.hasFocus){
			this.mvc.view.chatTextInput.focus();
			//this.gainFocus();
		}
		else{
			this.mvc.view.chatTextInput.blur();
			//this.loseFocus();
		}

	}

	gainFocus(){
		this.mvc.app.focusChat();
	}

	loseFocus(){
		this.mvc.app.stopFocusChat();
	}

	receiveMessage(sender, message){

		///TEST SI SENDER === SYSTEM

		this.mvc.view.addUserMessage(sender, message);

	}

	chatButtonWasClicked(){
		this.sendMessageWithViewInput();
	}

	sendMessageWithViewInput(){
		this.ioSendMessage(this.mvc.view.chatTextInput.value);
		this.mvc.view.resetInputMessage();
	}

	ioSendMessage(message){
		this.mvc.app.io.emit("message", message);
	}

}