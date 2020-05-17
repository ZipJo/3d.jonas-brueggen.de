//completely unused at the moment!
const jb_DOManimation = {


	vars: {
		containmentPercentage: 50,
		mouseAccuracy: 1000
	},

	perspective(){
		//for now, only do animation for home
		// TODO!
		if (!document.querySelector("header.top")) {

			if (jb_events.vars.onhover.enable && jb_events.interactivity.status == 'mousemove') {
				let percentage_x_mouse = Math.round(jb_events.vars.onhover.pos_x / window.innerWidth * this.vars.mouseAccuracy) / this.vars.mouseAccuracy;
				let percentage_y_mouse = Math.round(jb_events.vars.onhover.pos_y / window.innerHeight * this.vars.mouseAccuracy) / this.vars.mouseAccuracy;
				let cP = this.vars.containmentPercentage,
					pMax = (100 + cP) / 2,

					perspectiveOrigin = 
						(pMax - (cP * percentage_x_mouse)) + "vw " +
						(pMax - (cP * percentage_y_mouse)) + "vh";

				document.querySelector("header").style.perspectiveOrigin = perspectiveOrigin;
			}

			if (jb_events.vars.onhover.enable && jb_events.interactivity.status == 'tilt') {

				let rot_alpha = jb_events.vars.deviceOrientation.rotation_alpha,
					rot_beta = jb_events.vars.deviceOrientation.rotation_beta;

				document.querySelector("header").style.top = rot_alpha + "px";
				document.querySelector("header").style.left = rot_beta + "px";

			}
		}
	}
}