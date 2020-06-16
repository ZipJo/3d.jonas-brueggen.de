const jb_DOManimation = {
	vars: {
		mouseAccuracy: 1000,
		rotation_accuracy: 50,
		animation: false,
		mod_logo: 10,
		mod_text: 6,
		c_x: 0,
		c_y: 0,
	},

	perspective(){
		//for now, only do animation for home
		if (!document.querySelector("header.top")) {

			if (jb_events.vars.onhover.enable && jb_events.vars.status == 'mousemove') {
				let percentage_x_mouse = -0.5 + Math.round(jb_events.vars.onhover.pos_x / window.innerWidth * this.vars.mouseAccuracy) / this.vars.mouseAccuracy;
				let percentage_y_mouse = -0.5 + Math.round(jb_events.vars.onhover.pos_y / window.innerHeight * this.vars.mouseAccuracy) / this.vars.mouseAccuracy;
				this.vars.c_x = this.ease(this.vars.c_x, percentage_x_mouse, 0.055);
				this.vars.c_y = this.ease(this.vars.c_y, percentage_y_mouse, 0.055);
				this.vars.logo_elem.style.setProperty("transform","rotateY(360deg) translateX("+this.vars.c_x*this.vars.mod_logo+"vmin) translateY("+this.vars.c_y*this.vars.mod_logo+"vmin) translateZ(1px)");
				this.vars.text_elem.style.setProperty("transform","translateX("+this.vars.c_x*this.vars.mod_text+"vmin) translateY("+this.vars.c_y*this.vars.mod_text+"vmin) translateZ(0)");
			}

			if (jb_events.vars.onhover.enable && jb_events.vars.status == 'tilt') {
				let rot_alpha = jb_events.vars.deviceOrientation.rotation_alpha / this.vars.rotation_accuracy,
					rot_beta = jb_events.vars.deviceOrientation.rotation_beta / this.vars.rotation_accuracy;
				this.vars.c_x = this.ease(this.vars.c_x, rot_beta, 0.035);
				this.vars.c_y = this.ease(this.vars.c_y, rot_alpha, 0.035);
				this.vars.logo_elem.style.setProperty("transform","rotateY(360deg) translateX("+this.vars.c_x*this.vars.mod_logo+"vmin) translateY("+this.vars.c_y*this.vars.mod_logo+"vmin) translateZ(1px)");
				this.vars.text_elem.style.setProperty("transform","translateX("+this.vars.c_x*this.vars.mod_text+"vmin) translateY("+this.vars.c_y*this.vars.mod_text+"vmin) translateZ(0)");
			}
		}
	},

	start(){
		this.vars.logo_elem = document.querySelector("header .header_logo");
		this.vars.text_elem = document.querySelector("header .logo_subtext");
		this.vars.c_x = 0;
		this.vars.c_y = 0;
		this.vars.animation = true;

		setTimeout(function(){
			if(jb_DOManimation.vars.animation === true){
				jb_DOManimation.draw();
				jb_DOManimation.vars.logo_elem.style.setProperty("transition","none");
				jb_DOManimation.vars.text_elem.style.setProperty("transition","none");
			}
		},200);
	},

	stop(){
		if(this.vars.animation === true) {
			this.vars.animation = false;
			this.vars.logo_elem.style.removeProperty("transform");
			this.vars.text_elem.style.removeProperty("transform");
			this.vars.logo_elem.style.removeProperty("transition");
			this.vars.text_elem.style.removeProperty("transition");
		}
	},

	draw(){
		if (jb_DOManimation.vars.animation){
			window.requestAnimationFrame(jb_DOManimation.draw);
			jb_DOManimation.perspective();
		}
	},

	ease(current, target, slerp = 0.055){
		let ret = current + ((target - current) * slerp);
		return ret;
	}
}