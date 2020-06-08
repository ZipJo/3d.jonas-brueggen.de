const jb_main = {
	init(callback){
		//order is important here!
		
		//initialize eventListeners
		jb_events.addEvents();

		//init contentChanger (watches the hash)
		jb_scripts.contentChanger.init();

		jb_scripts.touchRemover.tester();

		//start main animation
		jb_anim.start('canvas#bg_canvas', {}, callback);
	}
}