// jbparticlebg.js

let pBg = function(qSelector, parameters) {

	let canvas_el = document.querySelector(qSelector);

	// variables with default values
	this.pBg = {
		canvas: {
			elem: canvas_el,
			width: canvas_el.offsetWidth,
			height: canvas_el.offsetHeight,
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
				containment: 50
			},
			actions: {}
		},
		threejs: {
			
			frustumSize: 600;
		}
	};

	let pBg = this.pBg;

	if (parameters) {
		Object.deepExtend(pBg, parameters);
	}


	// functions
	pBg.functions.actions.clickAction = function() {
		console.log("click at X:" + pBg.interactivity.mouse.click_pos_x + " Y:" + pBg.interactivity.mouse.click_pos_y);
	}

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
	}

	pBg.functions.deviceMotionEvent = function(e) {
		pBg.interactivity.mobile.rotation_alpha = Math.round(e.rotationRate.alpha / 10); //up & down
		pBg.interactivity.mobile.rotation_beta = Math.round(e.rotationRate.beta / 10); //left & right
		pBg.interactivity.mobile.rotation_gamma = Math.round(e.rotationRate.gamma / 10); //counter- & clockwise
	}

	pBg.functions.eventListeners = function() {
		// detect mouse pos - on hover / click event
		if (pBg.interactivity.events.onhover.enable || pBg.interactivity.events.onclick.enable) {
			// Add tilt-events, instead of hover for mobile and mouseevent for desktops:
			if (true || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				//mobile!

				//debug-element:
				let elem = document.createElement("div");
				elem.setAttribute("id", "infobox");
				elem.innerHTML = "init";
				document.querySelector("main").append(elem);

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
								})
						}, {
							once: true
						});
					} else {
						window.addEventListener("deviceorientation", throttle(pBg.functions.deviceOrientationEvent, 20));
						window.addEventListener("devicemotion", throttle(pBg.functions.deviceMotionEvent, 100));
						elem.innerHTML = "doe supported";
					}

				} else elem.innerHTML = "doe NOT supported";


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
				window.addEventListener('mouseleave', function(e) {

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

			// resize event to determine portrait/landscape
			window.addEventListener("resize", function() {
				pBg.canvas.width = pBg.canvas.elem.offsetWidth;
				pBg.canvas.height = pBg.canvas.elem.offsetHeight;
				pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);
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

			function rotate(vec, axis, angle) {
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
			let br = "<br>";

			document.getElementById("infobox").innerHTML = alpha + br + beta + br + gamma + br + br + rot_alpha + br + rot_beta + br + rot_gamma;
			document.querySelector("span#motion_dot").style.top = rot_alpha + "px";
			document.querySelector("span#motion_dot").style.left = rot_beta + "px";

			let transformAll =
				"rotate3d(" + axis_z[0] + ", " + axis_z[1] + ", " + axis_z[2] + ", " + (alpha - alpha_init) + "deg) " +
				"rotate3d(" + axis_x[0] + ", " + axis_x[1] + ", " + axis_x[2] + ", " + beta + "deg) " +
				"rotate3d(" + axis_y[0] + ", " + axis_y[1] + ", " + axis_y[2] + ", " + gamma + "deg)";


			let transformLess =
				"rotate3d(" + axis_x[0] + ", " + axis_x[1] + ", " + axis_x[2] + ", " + beta + "deg) " +
				"rotate3d(" + axis_y[0] + ", " + axis_y[1] + ", " + axis_y[2] + ", " + gamma + "deg)";



		}
		if (cb) cb();
	};

	pBg.functions.initThreeJs = function() {
		pBg.threejs.aspect = pBg.canvas.width / pBg.canvas.height;
		pBg.threejs.scene = new THREE.Scene();
		pBg.threejs.camera = new THREE.PerspectiveCamera(50, 0.5*pBg.threejs.aspect, 150, 1000);

		pBg.threejs.cameraHelper = new THREE.CameraHelper( pBg.threejs.camera );
		pBg.threejs.scene.add( pBg.threejs.cameraHelper );

		pBg.threejs.camera.rotation.y = Math.PI;


		//background-particles
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for ( var i = 0; i < 10000; i ++ ) {
			vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
			vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
			vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z
		}


		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

		var particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: "hsla(50, 60%, 96%, 1)" } ) );
		pBg.threejs.scene.add( particles );


		pBg.threejs.renderer = new THREE.WebGLRenderer({
			canvas: pBg.canvas.elem,
			antialias: true
		});
		pBg.threejs.renderer.setPixelRatio( window.devicePixelRatio )
		pBg.threejs.renderer.autoClear = false;
		pBg.threejs.renderer

		var geometry = new THREE.BoxGeometry();
		var material = new THREE.MeshBasicMaterial({
			color: "white"
		});
		var cube = new THREE.Mesh(geometry, material);
		pBg.threejs.scene.add(cube);


	}

	pBg.functions.init = function() {
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);
	}
	pBg.functions.draw = function() {
		pBg.functions.initThreeJs();
		pBg.threejs.renderer.render(pBg.threejs.scene, pBg.threejs.camera);
		
		pBg.functions.perspective();
		//window.requestAnimFrame(pBg.functions.draw);
	};

	pBg.functions.start = function() {
		pBg.functions.init();
		pBg.functions.draw();
	};


	// start
	pBg.functions.eventListeners();
	pBg.functions.start();
};

// global functions
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

window.requestAnimFrame = (function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();


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
}



//initialize function

window.pBgDom = [];

window.jbParticleBg = function(qSelector, parameters, cb) {
	//console.log(parameters);

	pBgDom.push(new pBg(qSelector, parameters));

	if (cb) cb();
};