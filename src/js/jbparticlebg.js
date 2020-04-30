// jbparticlebg.js

const pBg = function(qSelector, parameters) {

	let canvas_el = document.querySelector(qSelector);

	// variables with default values
	this.pBg = {
		canvas: {
			elem: canvas_el,
			ctx: canvas_el.getContext('2d'),
			width: canvas_el.offsetWidth,
			height: canvas_el.offsetHeight,
			parentElement: canvas_el.parentElement
		},
		interactivity: {
			events: {
				onhover: {
					enable: true
				},
				onclick: {
					enable: true
				},
				resize: true
			},
			mouse: {},
			mobile: {
				tilt_accuracy: 1000 // <- 1 divided by this
			}
		},
		functions: {
			vars: {
				containment: 50 //max-perspective change from 50% - 50 = 25% to 75%
			},
			actions: {}
		},
		classes: {

		},
		vars: {
			particles: 500,
			particleRadius: 2,
			particlePositionAccuracy: 1000
		}
	};

	let pBg = this.pBg;

	if (parameters) {
		Object.deepExtend(pBg, parameters);
	}


	// functions
	pBg.functions.actions.clickAction = function() {
		console.log("click at X:" + pBg.interactivity.mouse.click_pos_x + " Y:" + pBg.interactivity.mouse.click_pos_y);
	};

	pBg.functions.actions.resizeAction = function() {
		pBg.canvas.width = pBg.canvas.elem.offsetWidth;
		pBg.canvas.height = pBg.canvas.elem.offsetHeight;
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);

		if (window.devicePixelRatio > 1) {
			pBg.canvas.elem.width = pBg.canvas.elem.clientWidth * 2;
			pBg.canvas.elem.height = pBg.canvas.elem.clientHeight * 2;
			pBg.canvas.ctx.scale(2, 2);
		} else {
			pBg.canvas.elem.width = pBg.canvas.width;
			pBg.canvas.elem.height = pBg.canvas.height;
		}
	};

	pBg.functions.deviceOrientationEvent = function(e) {
		if (pBg.interactivity.status != 'tilt') {
			pBg.interactivity.mobile.tilt_alpha_initial = Math.round(e.alpha * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //counter- & clockwise (0 to 360)
			pBg.interactivity.mobile.tilt_beta_initial = Math.round(e.beta * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //up & down (-180 to 180)
			pBg.interactivity.mobile.tilt_gamma_initial = Math.round(e.gamma * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //left & right (-90 to 90)
		}
		pBg.interactivity.status = 'tilt';

		pBg.interactivity.mobile.tilt_alpha = Math.round(e.alpha * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //counter- & clockwise (0 to 360)
		pBg.interactivity.mobile.tilt_beta = Math.round(e.beta * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //up & down (-180 to 180)
		pBg.interactivity.mobile.tilt_gamma = Math.round(e.gamma * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //left & right (-90 to 90)
	};

	pBg.functions.deviceMotionEvent = function(e) {
		pBg.interactivity.mobile.rotation_alpha = Math.round(e.rotationRate.alpha / 10); //up & down
		pBg.interactivity.mobile.rotation_beta = Math.round(e.rotationRate.beta / 10); //left & right
		pBg.interactivity.mobile.rotation_gamma = Math.round(e.rotationRate.gamma / 10); //counter- & clockwise
	};

	pBg.functions.eventListeners = function() {
		// detect mouse pos - on hover / click event
		if (pBg.interactivity.events.onhover.enable || pBg.interactivity.events.onclick.enable) {
			// Add tilt-events, instead of hover for mobile and mouseevent for desktops:
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				//mobile!

				//debug-element:
				let elem = document.createElement("div");
				elem.setAttribute("id", "infobox");
				elem.innerHTML = "init";
				pBg.canvas.parentElement.append(elem);

				//only, if DeviceOrientationEvent is supported.
				if (typeof(DeviceOrientationEvent) !== 'undefined') {

					if (typeof(DeviceOrientationEvent.requestPermission) === 'function') {
						document.body.addEventListener('click', function() {
							DeviceOrientationEvent.requestPermission()
								.then(function() {
									window.addEventListener("deviceorientation", throttle(pBg.functions.deviceOrientationEvent, 20));
									window.addEventListener("devicemotion", throttle(pBg.functions.deviceMotionEvent, 100));
									elem.innerHTML = "doe allowed";
								}).catch(function() {
									elem.innerHTML = "doe denied";
								});
						}, {
							once: true
						});
					} else {
						window.addEventListener("deviceorientation", throttle(pBg.functions.deviceOrientationEvent, 20));
						window.addEventListener("devicemotion", throttle(pBg.functions.deviceMotionEvent, 100));
						elem.innerHTML = "doe supported";
					}

				} else {
					elem.innerHTML = "doe NOT supported";
				}

			} else {
				//desktop!

				/* el on mousemove */
				window.addEventListener('mousemove', throttle(function(e) {

					let pos_x = e.clientX,
						pos_y = e.clientY;

					pBg.interactivity.mouse.pos_x = pos_x;
					pBg.interactivity.mouse.pos_y = pos_y;

					pBg.interactivity.status = 'mousemove';
				}), 20);

				/* el on onmouseleave */
				window.addEventListener('mouseleave', function() {

					pBg.interactivity.mouse.pos_x = null;
					pBg.interactivity.mouse.pos_y = null;
					pBg.interactivity.status = 'mouseleave';

				});
			}

			// onclick event
			if (pBg.interactivity.events.onclick.enable) {
				window.addEventListener('click', function(e) {
					pBg.interactivity.mouse.click_pos_x = e.clientX;
					pBg.interactivity.mouse.click_pos_y = e.clientY;
					//insert function-call here
					pBg.functions.actions.clickAction();
				});
			}
		}

		// resize event
		if (pBg.interactivity.events.resize) {
			window.addEventListener("resize", function() {
				pBg.functions.actions.resizeAction();
			}, false);
		}
	};

	pBg.functions.perspective = function(cb) {

		if (pBg.interactivity.events.onhover.enable && pBg.interactivity.status == 'mousemove') {
			let percentage_x_mouse = pBg.interactivity.mouse.pos_x / pBg.canvas.width;
			let percentage_y_mouse = pBg.interactivity.mouse.pos_y / pBg.canvas.height;

			let perspectiveOrigin =
				(100 - (pBg.functions.vars.containment / 2 + percentage_x_mouse * (100 - pBg.functions.vars.containment))) + "% " +
				(100 - (pBg.functions.vars.containment / 2 + percentage_y_mouse * (100 - pBg.functions.vars.containment))) + "%";


			//pBg.canvas.object_elem.style.perspectiveOrigin = perspectiveOrigin;
		}
		if (pBg.interactivity.events.onhover.enable && pBg.interactivity.status == 'tilt') {

			let rotate = function(vec, axis, angle) {
				var c = Math.cos(angle * Math.PI / 180.0),
					s = Math.sin(angle * Math.PI / 180.0),
					x = axis[0],
					y = axis[1],
					z = axis[2],

					// rotation matrix form
					rm00 = c + x * x * (1 - c),
					rm10 = z * s + y * x * (1 - c),
					rm20 = -y * s + z * x * (1 - c),
					rm01 = -z * s + x * y * (1 - c),
					rm11 = c + y * y * (1 - c),
					rm21 = x * s + z * y * (1 - c),
					rm02 = y * s + x * z * (1 - c),
					rm12 = -x * s + y * z * (1 - c),
					rm22 = c + z * z * (1 - c);

				return Array(
					rm00 * vec[0] + rm01 * vec[1] + rm02 * vec[2],
					rm10 * vec[0] + rm11 * vec[1] + rm12 * vec[2],
					rm20 * vec[0] + rm21 * vec[1] + rm22 * vec[2]
				);
			}

			let beta = pBg.interactivity.mobile.tilt_beta,
				gamma = -pBg.interactivity.mobile.tilt_gamma,
				alpha = pBg.interactivity.mobile.tilt_alpha,
				alpha_init = pBg.interactivity.mobile.tilt_alpha_initial,

				rot_beta = pBg.interactivity.mobile.rotation_beta,
				rot_gamma = -pBg.interactivity.mobile.rotation_gamma,
				rot_alpha = pBg.interactivity.mobile.rotation_alpha,

				axis_y = Array(0, 1, 0),
				axis_x = rotate(Array(1, 0, 0), axis_y, gamma),
				axis_z = rotate(rotate(Array(0, 0, 1), axis_y, gamma), axis_x, beta);



			let transformAll =
				"rotate3d(" + axis_z[0] + ", " + axis_z[1] + ", " + axis_z[2] + ", " + (alpha - alpha_init) + "deg) " +
				"rotate3d(" + axis_x[0] + ", " + axis_x[1] + ", " + axis_x[2] + ", " + beta + "deg) " +
				"rotate3d(" + axis_y[0] + ", " + axis_y[1] + ", " + axis_y[2] + ", " + gamma + "deg)";


			let transformLess =
				"rotate3d(" + axis_x[0] + ", " + axis_x[1] + ", " + axis_x[2] + ", " + beta + "deg) " +
				"rotate3d(" + axis_y[0] + ", " + axis_y[1] + ", " + axis_y[2] + ", " + gamma + "deg)";

			let br = "<br>";

			document.getElementById("infobox").innerHTML = alpha + br + beta + br + gamma + br + br + rot_alpha + br + rot_beta + br + rot_gamma;

			//document.querySelector("div.cuboid_container > .cuboid:nth-child(1)").style.transform = transformAll;
			//document.querySelector("div.cuboid_container > .cuboid:nth-child(2)").style.transform = transformLess;


			document.querySelector("span#motion_dot").style.top = rot_alpha + "px";
			document.querySelector("span#motion_dot").style.left = rot_beta + "px";

			let perspectiveX = 50 + rot_beta;
			let perspectiveY = 50 + rot_alpha;

			//map the whole thing to the perspective
			let perspectiveOrigin = "50% 50%";
			if (pBg.canvas.isPortrait) perspectiveOrigin = perspectiveX + "% " + perspectiveY + "%"
			else perspectiveOrigin = perspectiveY + "% " + perspectiveX + "%";

			document.getElementById("infobox").innerHTML += br + br + perspectiveOrigin;

			//document.querySelector("div.cuboid_container").style.perspectiveOrigin = perspectiveOrigin;
		}
		if (cb) cb();
	};

	pBg.functions.initParticles = function() {
		pBg.vars.PERSPECTIVE = pBg.canvas.width * 2; // The field of view of our 3D scene
		pBg.vars.PROJECTION_CENTER_X = pBg.canvas.width / 2; // x center of the canvas
		pBg.vars.PROJECTION_CENTER_Y = pBg.canvas.height / 2; // y center of the canvas
		pBg.vars.dots = []; // Store every particle in this array

		/*console.log(pBg.vars.PERSPECTIVE);
		console.log(pBg.vars.PROJECTION_CENTER_X);
		console.log(pBg.vars.PROJECTION_CENTER_Y);*/

		// Create 800 new dots
		for (let i = 0; i < pBg.vars.particles; i++) {
			// Create a new dot and push it into the array
			pBg.vars.dots.push(new pBg.classes.Dot());
		}
	};

	pBg.functions.renderParticles = function() {
		// Clear the scene from top left to bottom right
		pBg.canvas.ctx.clearRect(0, 0, pBg.canvas.width, pBg.canvas.height);

		// Loop through the dots array and project every dot
		for (let i = 0; i < pBg.vars.dots.length; i++) {
			pBg.vars.dots[i].draw();
		}

		//depth-sorting
		pBg.vars.dots.sort((dot1, dot2) => {
			return dot1.scaleProjected - dot2.scaleProjected;
		});

		// Loop through the dots array and draw the newly sorted dots
		for (let i = 0; i < pBg.vars.dots.length; i++) {
			pBg.vars.dots[i].draw();
		}
	}

	//classes

	pBg.classes.Dot = class {


		constructor() {
			this.SCALE_MIN = 0.3; // smallest allowd scale
			this.ROTATION_SPEED_THETA = (2 * Math.PI) / 10000; // Rotation Speed for theta - 1revolution = 2Pi
			
			this.theta = Math.random() * 2 * Math.PI; // Random value between [0, 2Pi]
			this.phi = Math.acos((Math.random() * 2) - 1); // Random value between [0, Pi]
			this.rad = Math.sqrt(Math.random()) * pBg.vars.PERSPECTIVE / 2; // Random value between [0, Half the perspective]

			// The x, y, z coordinates will be calculated in the project() function
			this.x = 0;
			this.y = 0;
			this.z = 0;

			// The projected coordinates will be calculated in the project() function
			this.xProjected = 0;
			this.yProjected = 0;
			this.scaleProjected = 0;
		}

		// Project our element from its 3D world to the 2D canvas
		project() {
			// Calculate the x, y, z coordinates in the 3D world
			this.x = this.rad * Math.sin(this.phi) * Math.cos(this.theta);
			this.y = this.rad * Math.cos(this.phi);
			this.z = this.rad * Math.sin(this.phi) * Math.sin(this.theta) + pBg.vars.PERSPECTIVE / 2;

			//round values
			this.x = Math.floor(this.x * pBg.vars.particlePositionAccuracy) / pBg.vars.particlePositionAccuracy;
			this.y = Math.floor(this.y * pBg.vars.particlePositionAccuracy) / pBg.vars.particlePositionAccuracy;
			this.z = Math.floor(this.z * pBg.vars.particlePositionAccuracy) / pBg.vars.particlePositionAccuracy;

			// Project the 3D coordinates to the 2D canvas
			// The scaleProjected will store the scale of the element based on its distance from the 'center'. Value between min and 1
			this.scaleProjected =
				Math.floor(
					(this.z / pBg.vars.PERSPECTIVE * (1 - this.SCALE_MIN) + this.SCALE_MIN) * pBg.vars.particlePositionAccuracy
				) / pBg.vars.particlePositionAccuracy;
			// The xProjected is the x position on the 2D world
			this.xProjected = (this.x * this.scaleProjected) + pBg.vars.PROJECTION_CENTER_X;
			// The yProjected is the y position on the 2D world
			this.yProjected = (this.y * this.scaleProjected) + pBg.vars.PROJECTION_CENTER_Y;
		}

		animate() {
			this.theta += this.ROTATION_SPEED_THETA;
			//this.phi += 0.005;
		}

		// Draw the dot on the canvas
		draw() {
			//get new 3d-positions
			this.animate();
			// We first calculate the projected values of our dot
			this.project();
			// We define the opacity of our element based on its distance, minimum visibility is .3
			pBg.canvas.ctx.globalAlpha = this.scaleProjected * 0.7 + 0.3;
			//draw a circle

			pBg.canvas.ctx.beginPath();
			// The arc function takes 5 parameters (x, y, radius, angle start, angle end)
			pBg.canvas.ctx.arc(this.xProjected, this.yProjected, pBg.vars.particleRadius * this.scaleProjected, 0, Math.PI * 2);
			// Fill the circle
			let gradient = pBg.canvas.ctx.createRadialGradient(this.xProjected, this.yProjected, pBg.vars.particleRadius * this.scaleProjected * 0.7, this.xProjected, this.yProjected, pBg.vars.particleRadius * this.scaleProjected * 0.9);
			gradient.addColorStop(0, "hsla(50, 60%, 96%, 1)");
			gradient.addColorStop(1, "hsla(185, 95%, 33%, 1)");
			pBg.canvas.ctx.fillStyle = gradient;
			pBg.canvas.ctx.fill();
			//add a shadow
			pBg.canvas.ctx.shadowColor = "hsla(50, 60%, 96%, 1)";
			pBg.canvas.ctx.shadowBlur = 10;
		}
	};


	pBg.functions.init = function() {
		pBg.functions.actions.resizeAction();
		pBg.functions.initParticles();
	};
	pBg.functions.draw = function() {
		pBg.functions.perspective();
		pBg.functions.renderParticles();
		window.requestAnimationFrame(pBg.functions.draw);
	};

	pBg.functions.start = function() {
		pBg.functions.init();
		pBg.functions.draw();
	};


	// start
	pBg.functions.eventListeners();
	pBg.functions.start();
};

// global functions & vars
Object.deepExtend = function(destination, source) {
	for (var property in source) {
		if (source[property] && source[property].constructor &&
			source[property].constructor === Object) {
			destination[property] = destination[property] || {};
			arguments.callee(destination[property], source[property]);
		} else {
			destination[property] = source[property];
		}
	}
	return destination;
};

const throttle = (func, limit) => {
	let lastFunc
	let lastRan
	return function() {
		const context = this
		const args = arguments
		if (!lastRan) {
			func.apply(context, args)
			lastRan = Date.now()
		} else {
			clearTimeout(lastFunc)
			lastFunc = setTimeout(function() {
				if ((Date.now() - lastRan) >= limit) {
					func.apply(context, args)
					lastRan = Date.now()
				}
			}, limit - (Date.now() - lastRan))
		}
	}
};

//initialize function

window.pBgDom = [];

window.jbParticleBg = function(qSelector, parameters, cb) {
	console.log(parameters);
	pBgDom.push(new pBg(qSelector, parameters));
	if (cb) cb();
};