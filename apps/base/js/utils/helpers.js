/**
* @export
* @method trace: console.log with file name and line number
* @param {...*} args : 
*/
const trace = (...args) => {
	let stack = new Error().stack.trim(), re = /([\w\.]+)\.js:(\d+)/gmi, fileLine = null, n = 0;
	while(n++ < 2) fileLine = re.exec(stack);
	args.push(("\t" + fileLine[1] + ":" + fileLine[2]).padStart(30, " "));
	console.log.apply(console, args);
};

/**
* @export
* @method die: argh
* @param {...*} args : 
*/
const die = (...args) => {
	
};