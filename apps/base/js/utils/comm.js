/**
* @nocollapse
* @export
*/
class Comm {
    
    /**
     * @method request: 
     * @param {string} url: 
     * @param {Object} options: 
     */
	static async request(url, options) {
		options = merge({"method": "GET", "headers": {}, "body": undefined, "mode": "cors", "credentials": "same-origin", "progress": die, "type": "json"}, options);
		//trace("request", options);
		let result = await fetch(url, /** @type {(!RequestInit|undefined)} */(options));
		result["response"] = await result[options["type"]]();
		//trace("result", result);
		return result;
    }

    /**
     * @method urlrequest: 
     * @param {string} url: 
     * @param {Object} options: 
     */
    static async urlrequest(url, options) {
		// TODO switch to new URLParams() and append keys
		if(options.hasOwnProperty("body")) options["body"] = Object.keys(options["body"]).map(key => encodeURIComponent(key) + "=" + encodeURIComponent(options["body"][key])).join("&");
		return await this.request(url, merge(options, {"headers": {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}}));
	}
    
    /**
	 * @export
     * @method jwtrequest: 
     * @param {string} url: 
     * @param {Object} options: 
     * @param {string} jwt: 
     */
	static async jwtrequest(url, options, jwt) {
		return await this.urlrequest(url, merge(options, {"headers": {"Authorization": "Bearer " + jwt}}));
	}
    
	/**
	 * @export
	 * @method upload: 
	 * @param {string} url: 
	 * @param {Object} options: 
	 * @param {Function} progress: 
	 */
	static async upload(url, options, progress) {
		return await this.request(url, merge(options, {"method": "PUT", "headers": {"Accept": "multipart/form-data"}, "progress": progress})); // NO HEADERS, AUTO MULTIPART BOUNDARY FROM FETCH API
	}
    
    /**
	 * @export
     * @method jwtupload: 
     * @param {string} url: 
     * @param {Object} options: 
     * @param {Function} progress: 
     * @param {string} jwt: 
     */
	static async jwtupload(url, options, progress, jwt) {
		return await this.upload(url, merge(options, {"headers": {"Authorization": "Bearer " + jwt}}), progress);
	}
	
	/**
	 * @export
     * @method get: 
	 * @param url: 
	 */
	static async get(url) {
		return await this.urlrequest(url, {});
	}
	
	/**
	 * @export
     * @method post: 
	 * @param url: 
	 * @param data: 
	 */
	static async post(url, data) {
		return await this.urlrequest(url, {"method": "POST", "body": data});
	}
    
}