# hello-node
a basic nodeJS http server

run it :

	- install npm / nodejs
	- clone repo
	- cd to repo directory
	- run > npm install
	- run > node index

test it :

	- navigate to http://localhost/hello/everyone

understand it :

	- This project contains a basic HTTP server (NOT SECURED && NON PRODUCTION READY)
	
	- Server :
		. The main index.js file runs the HTTP server and loads an app, which is a simple ES6 class
		. All methods from this app class are exposed as HTTP routes (first URL part) : http://localhost/{method}/some/arguments
			- these methods must take at least two arguments : req and res, passed on from main server class
			- all remaining url parts are passed as arguments to the method
			- methods that begin with a "_" (i.e. _myMethod(){}) are not exposed (kept private)
		. file URLs matching /some/dir/file.ext (something followed by a dot and more chars) are served directly from the main server
		. urls not handled as method or file are redirected to index.html file if it exists
		. The default app (base) is located in apps/base directory
		. It extends ModuleBase class to easily respond to clients requests with various HTTP status codes
	
	- Apps :
		. directory structure :
			- _server : this directory must contain a file named "index.js", which is the entry point of the app (exposed methods)
			- all other files and directories are made available to public requests
			
	- Base app
		. this app is a simple template :
			- index.html : basic index file
			- css/style.css : main stylesheet file
			- js/main.js : app entry point
			- js/utils/comm.js : wrappers for fetch API to exec async GET/POST requests to server
			- js/utils/merge.js : deep merge object util
			- js/utils/mvc.js : MVC utils
			
		. MVC :
			- extend Model / View / Controller classes to create your own classes
			- call new MVC("myAwesomeMVC", new MyModel(), new MyView(), new MyController());
			- this will initialize mvc components and give cross references between each other :
				. this.mvc.model / this.mvc.view / this.mvc.controller