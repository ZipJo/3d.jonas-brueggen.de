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
		},
		scroll: {
			homeTouchstart: null
		},
		status: "initial",
		isResized: false
	},

	iosPermission () {
		// (optional) Do something before API request prompt.
		DeviceMotionEvent.requestPermission()
			.then( response => {
			// (optional) Do something after API prompt dismissed.
			if ( response == "granted" ) {
				window.addEventListener("deviceorientation", jb_events.deviceOrientationEvent);
				window.addEventListener("devicemotion", jb_events.deviceMotionEvent);
			}
		}).catch( console.error )
	},


	addEvents(){

		// detect mouse pos on hover
		if (this.vars.onhover.enable) {

			// Add tilt-events, instead of hover for mobile and mouseevent for desktops:
			if ( true || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (/Mac/i.test(navigator.userAgent) && typeof(DeviceOrientationEvent) !== 'undefined')) {
				//mobile!
				//only, if DeviceOrientationEvent is supported.
				if (typeof(DeviceOrientationEvent) !== 'undefined') {
						if (typeof(DeviceOrientationEvent.requestPermission) === 'function' && /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent)) {
						//this shuold be true for all iOS-devices

						//call requestPermission outside of a click-event, to get current response-state
						//this only works on a https-connection, so testing is very annoying!

						DeviceMotionEvent.requestPermission()
						.then(response => {
						    if (response) {
						        //already responded, try to register events
						        window.addEventListener("deviceorientation", this.deviceOrientationEvent);
								window.addEventListener("devicemotion", this.deviceMotionEvent);
						    }
						})
						.catch(function(error) {
							//if there's no response, the 'if'-above fails. trigger popup and bind
							//requestPermission to a click-event!
							let content = "<p>You seem to be using an iOS device.<br>This page is better, if you grant permissions for motion and orientation sensors!</p>";
							let popupElem = jb_scripts.customPopup(content, '250px', null, 'ios_popup' );
							//trigger a popup, to enforce a click

							popupElem.addEventListener('click', jb_events.iosPermission, {once: true});
						});
					} else {
						//no iOS-device, register event
						window.addEventListener("deviceorientation", this.deviceOrientationEvent);
						window.addEventListener("devicemotion", this.deviceMotionEvent);
					}

				}

			} else {
				//desktop!

				//add a small notification on the home-screen
				let infoSpan = document.createElement("span")
				infoSpan.innerHTML = "This page is more fun<br>on a mobile device!";
				infoSpan.classList.add("pc_info_span","visible");
				document.body.prepend(infoSpan);
				//...and remove it after five seconds
				setTimeout(function(){
					infoSpan.classList.remove("visible");
					setTimeout(function(){
						document.body.removeChild(infoSpan);
					},2000);
				},5000);
				/* el on mousemove */
				window.addEventListener('mousemove', this.mouseMoveAction);

				/* el on onmouseleave */
				window.addEventListener('mouseleave', this.mouseLeaveAction);
			
			}
		}

		//click-events
		if (this.vars.onclick.enable) {
			// ontouch event
			window.addEventListener('touch', this.clickAction);
			// onclick event
			window.addEventListener('click', this.clickAction);
		}
		
		// resize, orientationchange events
		window.addEventListener("resize", function(){
			jb_events.vars.isResized = true;
		});

	},

	addHomeScrollEvents(){
		window.addEventListener('wheel',this.home_wheelAction);
		window.addEventListener('touchmove',this.home_touchmoveAction);
	},

	destroyHomeScrollEvents(){
		window.removeEventListener('wheel',this.home_wheelAction);
		window.removeEventListener('touchmove',this.home_touchmoveAction);
	},

	home_wheelAction(e){
		if (e.deltaY > 0) {
			jb_scripts.contentChanger.toggleHash();
			jb_events.destroyHomeScrollEvents();
		}
	},
	home_touchmoveAction(e){
		if (jb_events.vars.scroll.homeTouchstart === null){
			jb_events.vars.scroll.homeTouchstart = e.touches[0].clientY;
		}
		jb_events.vars.scroll.homeTouchdeltaY = jb_events.vars.scroll.homeTouchstart - e.touches[0].clientY;
		if (jb_events.vars.scroll.homeTouchdeltaY > 20) {
			jb_events.vars.scroll.homeTouchstart = null;
			jb_scripts.contentChanger.toggleHash();
			jb_events.destroyHomeScrollEvents();
		}

	},

	mouseMoveAction(e){
		let pos_x = e.clientX,
			pos_y = e.clientY;

		jb_events.vars.onhover.pos_x = pos_x;
		jb_events.vars.onhover.pos_y = pos_y;

		jb_events.vars.status = 'mousemove';
	},

	mouseLeaveAction(){
		jb_events.vars.onhover.pos_x = null;
		jb_events.vars.onhover.pos_y = null;
		jb_events.vars.status = 'mouseleave';
	},

	clickAction(e){
		jb_events.vars.onclick.click_pos_x = e.clientX;
		jb_events.vars.onclick.click_pos_y = e.clientY;
	},

	

	deviceOrientationEvent(e) {
		jb_events.vars.deviceOrientation.sensorStatus = true;
		jb_events.vars.status = 'tilt';

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
		jb_events.vars.deviceOrientation.sensorStatus = true;
		jb_events.vars.status = 'tilt';
		
		//round values to only capture significant motion
		jb_events.vars.deviceOrientation.rotation_alpha = Math.round(e.rotationRate.alpha * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //up & down
		jb_events.vars.deviceOrientation.rotation_beta = Math.round(e.rotationRate.beta * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //left & right
		jb_events.vars.deviceOrientation.rotation_gamma = Math.round(e.rotationRate.gamma * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //counter- & clockwise
	}

}