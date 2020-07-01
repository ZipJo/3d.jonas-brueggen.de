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
		isResized: false,
		isMobile: false
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
			if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (/Mac/i.test(navigator.userAgent) && typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function')) {
				//mobile!
				this.vars.isMobile = true;
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
							let content = "<p>You seem to be using an iOS device.<br>This page is better, if you grant permissions for motion and orientation sensors!</p><a href='' class='fancy_link' style='pointer-events:none;'>okay</a>";
							let popupElem = jb_scripts.customPopup(content, '250px', null, 'ios_popup' );
							//trigger a popup, to enforce a click

							popupElem.addEventListener('click', jb_events.iosPermission, {once: true});
						});
					} else {
						//no iOS-device, register event
						window.addEventListener("deviceorientation", this.deviceOrientationEvent);
						window.addEventListener("devicemotion", this.deviceMotionEvent);
					}

					// check if screen.orientation is supported
					if ('screen' in window && 'orientation' in window.screen) {
						window.screen.orientation.addEventListener("change",jb_events.screenOrientationAction);
						//also add event on resize, because android is sometimes weird and won't fire the event.
						window.addEventListener("resize",jb_events.screenOrientationAction);

					} else {
						//fallback on deprecated window.orientation (iOS)
						window.addEventListener("orientationchange",jb_events.screenOrientationAction);
					}
					//call the event once, to set the initial values
					jb_events.screenOrientationAction();

				}

			} else {
				//desktop!
				//add a small notification on the home-screen, if there's no support.
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

				/* event on mousemove */
				window.addEventListener('mousemove', this.mouseMoveAction);
				/* event on onmouseleave */
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

	screenOrientationAction() {
		// check if screen.orientation is supported
		if ('screen' in window && 'orientation' in window.screen) {
			jb_events.vars.screenOrientationAngle = screen.orientation.angle;
		} else {
			//fallback on deprecated window.orientation (iOS)
			//window.orientation has different values. fix them here
			jb_events.vars.screenOrientationAngle = window.orientation == -90 ? 270 : window.orientation;
		}
	},

	deviceOrientationEvent(e) {
		jb_events.vars.deviceOrientation.sensorStatus = true;
		jb_events.vars.status = 'tilt';

		let alpha = e.alpha, //counter- & clockwise (0 to 360)
			beta = e.beta, //up & down (-180 to 180)
			gamma = e.gamma; //left & right (-90 to 90)

		//handle screenOrientation:
		if (jb_events.vars.screenOrientationAngle == 90 ) {
			beta = -e.gamma;
			gamma = e.beta;
		} else if (jb_events.vars.screenOrientationAngle == 270 ) {
			beta = e.gamma;
			gamma = -e.beta;
		} 

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

		let alpha = e.rotationRate.alpha,  //up & down
			beta = e.rotationRate.beta,  //left & right
			gamma = e.rotationRate.gamma;  //counter- & clockwise

		//handle screenOrientation:
		if (jb_events.vars.screenOrientationAngle == 90 ) {
			alpha = -e.rotationRate.beta;
			beta = e.rotationRate.alpha;
		} else if (jb_events.vars.screenOrientationAngle == 270 ) {
			alpha = e.rotationRate.beta;
			beta = -e.rotationRate.alpha;
		} 
		
		//round values to only capture significant motion
		jb_events.vars.deviceOrientation.rotation_alpha = Math.round(alpha * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //up & down
		jb_events.vars.deviceOrientation.rotation_beta = Math.round(beta * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //left & right
		jb_events.vars.deviceOrientation.rotation_gamma = Math.round(gamma * jb_events.vars.deviceOrientation.motionAccuracy)/jb_events.vars.deviceOrientation.motionAccuracy; //counter- & clockwise
		

	}

}