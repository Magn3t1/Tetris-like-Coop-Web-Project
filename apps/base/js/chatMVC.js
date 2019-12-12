
class ChatModel extends Model {

	constructor(){
		super();



	}

	async initialize(mvc){
		await super.initialize(mvc);
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
		this.stage.style.backgroundColor = "rgba(0, 0, 0, 0.8)";

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

	}


	removeListeners() {

		document.removeEventListener("keydown", this.documentKeyDownHandler);

	}

	onKeyDown(event){

							//e
		if(event.keyCode == 69){
			this.changeChat();
		}

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

	showChat(){
		this.mvc.app.chatDiv.style.left = "0px";
	}


	unshowChat(){
		this.mvc.app.chatDiv.style.left = (- window.innerWidth / 2) + "px";
	}

}

class ChatController extends Controller {

	constructor(){
		super();
		
	}

	async initialize(mvc){
		await super.initialize(mvc);
	}

}