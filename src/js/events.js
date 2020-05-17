const jb_events = {

	vars: {
		onhover: {
			enable: true
		},
		onclick: {
			enable: true
		},
		deviceOrientation: {
			sensorStatus: false,
			tiltAccuracy: 1000, // <- 1 divided by this
			motionAccuracy: 1000, // <- 1 divided by this
		}
	},

	interactivity: {
		status: "initial"
	},

	addEvents(){

		// detect mouse pos - on hover / click event
		if (this.vars.onhover.enable || this.vars.onclick.enable) {

			// Add tilt-events, instead of hover for mobile and mouseevent for desktops:
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				//mobile!

				//only, if DeviceOrientationEvent is supported.
				if (typeof(DeviceOrientationEvent) !== 'undefined') {

					if (typeof(DeviceOrientationEvent.requestPermission) === 'function') {
						window.addEventListener("deviceorientation", this.deviceOrientationEvent);
						window.addEventListener("devicemotion", this.deviceMotionEvent);
						document.body.addEventListener('click', function(){
							DeviceOrientationEvent.requestPermission()
								.then(function(){
									window.addEventListener("deviceorientation", this.deviceOrientationEvent);
									window.addEventListener("devicemotion", this.deviceMotionEvent);
									this.vars.deviceOrientation.sensorStatus = true;
								}).catch(function(){
									this.vars.deviceOrientation.sensorStatus = false;
								})
						}, {
							once: true
						});
					} else {
						window.addEventListener("deviceorientation", this.deviceOrientationEvent);
						window.addEventListener("devicemotion", this.deviceMotionEvent);
						this.vars.deviceOrientation.sensorStatus = true;
					}

				} else {
					this.vars.deviceOrientation.sensorStatus = false;
				}

			} else {
				//desktop!

				/* el on mousemove */
				window.addEventListener('mousemove', this.mouseMoveAction);

				/* el on onmouseleave */
				window.addEventListener('mouseleave', this.mouseLeaveAction);
			}

			// onclick event
			if (this.vars.onclick.enable) {
				window.addEventListener('click', this.clickAction);
			}
		}


		// resize event
		window.addEventListener("resize", function(){
			this.isResized = true;
		});


		//remove iOS rubber-scroll on body
		document.addEventListener('DOMContentLoaded', function(){
			document.body.addEventListener('touchmove', function(event) {
				var owner = jb_scripts.findNearestScrollableParent(event.target);
				if (!owner || owner === document.documentElement || owner === document.body) {
					event.preventDefault();
				}
			});
		}, false);
	},

	mouseMoveAction(e){
		let pos_x = e.clientX,
			pos_y = e.clientY;

		jb_events.vars.onhover.pos_x = pos_x;
		jb_events.vars.onhover.pos_y = pos_y;

		jb_events.interactivity.status = 'mousemove';
	},

	mouseLeaveAction(){
		jb_events.vars.onhover.pos_x = null;
		jb_events.vars.onhover.pos_y = null;
		jb_events.interactivity.status = 'mouseleave';
	},

	clickAction(e){
		jb_events.vars.onclick.click_pos_x = e.clientX;
		jb_events.vars.onclick.click_pos_y = e.clientY;
		console.log("click at X:" + jb_events.vars.onclick.click_pos_x + " Y:" + jb_events.vars.onclick.click_pos_y);
	},

	

	deviceOrientationEvent(e) {
		jb_events.interactivity.status = 'tilt';

		let alpha = e.alpha, //counter- & clockwise (0 to 360)
			beta = e.beta, //up & down (-180 to 180)
			gamma = e.gamma; //left & right (-90 to 90)

		//normalize alpha (game-based calibration):
		if (jb_events.vars.deviceOrientation.initialOffset == undefined) {
			jb_events.vars.deviceOrientation.initialOffset = e.alpha;
		}
		alpha = e.alpha - jb_events.vars.deviceOrientation.initialOffset;

		if (alpha < 0) {
			alpha += 360;
		}

		//round and save
		jb_events.vars.deviceOrientation.tilt_alpha = Math.round(alpha * jb_events.vars.deviceOrientation.tiltAccuracy) / jb_events.vars.deviceOrientation.tiltAccuracy;
		jb_events.vars.deviceOrientation.tilt_beta = Math.round(beta * jb_events.vars.deviceOrientation.tiltAccuracy) / jb_events.vars.deviceOrientation.tiltAccuracy;
		jb_events.vars.deviceOrientation.tilt_gamma = Math.round(gamma * jb_events.vars.deviceOrientation.tiltAccuracy) / jb_events.vars.deviceOrientation.tiltAccuracy;
	},

	deviceMotionEvent(e) {
		jb_events.interactivity.status = 'tilt';
		
		//round values to only capture significant motion
		jb_events.vars.deviceOrientation.rotation_alpha = Math.round(e.rotationRate.alpha * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //up & down
		jb_events.vars.deviceOrientation.rotation_beta = Math.round(e.rotationRate.beta * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //left & right
		jb_events.vars.deviceOrientation.rotation_gamma = Math.round(e.rotationRate.gamma * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //counter- & clockwise
	}
}