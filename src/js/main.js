const jb_main = {
	init(callback){
		//order is important here!
		
		//initialize eventListeners
		jb_events.addEvents();

		//start main animation
		jb_anim.start('canvas#bg_canvas', {}, callback);

		//init contentChanger (watches the hash)
		jb_scripts.contentChanger.init();

		//everything is done. callback!
		if (callback) callback();
	},
	mainVar: null
}