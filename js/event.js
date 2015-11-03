var EventEmitter = (function () {
    "use strict";
		
	/**
	 * Constructor
	 */
	function eventEmitter() {
		/**
		 * Registered events and their callbacks
		 * @type {Object}
		 */
		this.events = {};
	}

	/**
	 * Registers a callback function to a given event.
     * @param  {String} ev The event identifier.
	 * @param  {Function} callback The callback function.
	 */
	function register(ev, callback) {
		if (!this.events[ev]) {this.events[ev] = []; }
		this.events[ev].push(callback);
	}

	/**
	 * Emits an event by calling all registered callback functions
	 * @param  {String} ev The event identifier
     * @param  {Object} eventObj An optional object giving information on the state of the event
	 */
	function emit(ev, eventObj) {
		if (this.events[ev]) {
			for (var i = 0, len = this.events[ev].length; i < len; i++) {
				this.events[ev][i](eventObj);
			}
		}
	}
	
	eventEmitter.prototype.register = register;
	eventEmitter.prototype.emit = emit;

	return eventEmitter;
}());