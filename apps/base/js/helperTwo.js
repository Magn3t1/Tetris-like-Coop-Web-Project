

class easyElement {


	constructor(type){
		this.element = document.createElement(type);
	}

	//AllStyle is an enumerable object that will be set as the style of the element.
	setStyle(allStyle){
		Object.assign(this.element.style, allStyle);
		return this;
	}

	setAttribute(allAttribute){
		//foreach equivalent
		for(var attrib in allAttribute) {
    		this.element.setAttribute(attrib, allAttribute[attrib]);
  		}
  		return this;
	}

	setText(text){
		this.element.innerHTML = text;
		return this
	}

	attach(parent){
		parent.appendChild(this.element);
		return this;
	}

	getElement(){
		return this.element;
	}

}