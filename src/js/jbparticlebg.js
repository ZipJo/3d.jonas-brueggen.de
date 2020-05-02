// jbparticlebg.js

let pBg = function(qSelector, parameters) {

	let canvas_el = document.querySelector(qSelector);

	// variables with default values
	this.pBg = {
		canvas: {
			elem: canvas_el,
			width: canvas_el.parentElement.offsetWidth,
			height: canvas_el.parentElement.offsetHeight,
		},
		interactivity: {
			events: {
				onhover: {
					enable: true,
					sensorStatus: false
				},
				onclick: {
					enable: true
				},
				ondeviceorientation: {
					initialOffset: null
				},
				resize: true
			},
			mouse: {},
			mobile: {
				tiltAccuracy: 1000 // <- 1 divided by this
			}
		},
		functions: {
			vars: {
				containment: 50
			},
			actions: {}
		},
		threejs: {
			vars: {
				camRotationRadius: 500,
				autoRotationSpeed: 0.001
			}
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

	pBg.functions.actions.resizeAction = function() {
		pBg.canvas.width = pBg.canvas.elem.parentElement.offsetWidth;
		pBg.canvas.height = pBg.canvas.elem.parentElement.offsetHeight;
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);


		pBg.threejs.aspect = pBg.canvas.width / pBg.canvas.height;

		pBg.threejs.renderer.setSize(pBg.canvas.width, pBg.canvas.height);

		pBg.threejs.camera.aspect = pBg.threejs.aspect;
		pBg.threejs.camera.updateProjectionMatrix();

	};

	pBg.functions.deviceOrientationEvent = function(e) {
		pBg.interactivity.status = 'tilt';

		//normalize alpha (game-based calibration):
		if(pBg.interactivity.events.ondeviceorientation.initialOffset === null) {
			pBg.interactivity.events.ondeviceorientation.initialOffset = e.alpha;
		}
		let alpha = e.alpha - pBg.interactivity.events.ondeviceorientation.initialOffset;

		if(alpha < 0) {
			alpha += 360;
		}

		//set and round global vars - use normalized alpha
		pBg.interactivity.mobile.tilt_alpha = Math.round(alpha * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy; //counter- & clockwise (0 to 360)
		pBg.interactivity.mobile.tilt_beta = Math.round(e.beta * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy; //up & down (-180 to 180)
		pBg.interactivity.mobile.tilt_gamma = Math.round(e.gamma * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy; //left & right (-90 to 90)
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
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
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
									pBg.interactivity.events.onhover.sensorStatus = true;
								}).catch(function() {
									pBg.interactivity.events.onhover.sensorStatus = false;
								})
						}, {
							once: true
						});
					} else {
						window.addEventListener("deviceorientation", throttle(pBg.functions.deviceOrientationEvent, 20));
						window.addEventListener("devicemotion", throttle(pBg.functions.deviceMotionEvent, 100));
						pBg.interactivity.events.onhover.sensorStatus = true;
					}

				} else {
					pBg.interactivity.events.onhover.sensorStatus = false;
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

			let alpha = pBg.interactivity.mobile.tilt_alpha,
				beta = pBg.interactivity.mobile.tilt_beta,
				gamma = pBg.interactivity.mobile.tilt_gamma,

				aRad = alpha * Math.PI / 180.0,
				bRad = beta * Math.PI / 180.0,
				gRad = gamma * Math.PI / 180.0,

				rot_alpha = pBg.interactivity.mobile.rotation_alpha,
				rot_beta = pBg.interactivity.mobile.rotation_beta,
				rot_gamma = pBg.interactivity.mobile.rotation_gamma;

			let br = "<br>";
			let sp = " - ";

			document.getElementById("infobox").innerHTML = alpha + sp+ aRad+br + beta + sp+bRad+br + gamma +sp+gRad+ br + br + rot_alpha + br + rot_beta + br + rot_gamma;
			document.getElementById("infobox").innerHTML = alpha + br + beta + br + gamma + br + br + rot_alpha + br + rot_beta + br + rot_gamma;
			document.querySelector("span#motion_dot").style.top = rot_alpha + "px";
			document.querySelector("span#motion_dot").style.left = rot_beta + "px";

		}
		if (cb) cb();
	};

	pBg.functions.initThreeJs = function() {

		pBg.threejs.vars.timer = 0;

		pBg.threejs.aspect = pBg.canvas.width / pBg.canvas.height;
		pBg.threejs.scene = new THREE.Scene();
		pBg.threejs.scene.background = new THREE.Color( 0x011b28 );

		//setup camera
		pBg.threejs.camera = new THREE.PerspectiveCamera(50, pBg.threejs.aspect, 1, 10000);
		pBg.threejs.camera.position.y = 250;
		pBg.threejs.scene.add(pBg.threejs.camera);


		//setup Helpers
		//axes
		var axesHelper = new THREE.AxesHelper(20);
		pBg.threejs.scene.add(axesHelper);

		//arrow
		arrowDir = THREE.Object3D.DefaultUp;
		arrowDir.normalize();
		var origin = new THREE.Vector3( 0, 0, 0 );
		var length = 80;
		pBg.threejs.arrowHelper = new THREE.ArrowHelper( arrowDir, origin, length+20 );
		pBg.threejs.arrowHelperx = new THREE.ArrowHelper( arrowDir, origin, length-50, 0xff0000 );
		pBg.threejs.arrowHelpery = new THREE.ArrowHelper( arrowDir, origin, length-50, 0x00ff00 );
		pBg.threejs.arrowHelperz = new THREE.ArrowHelper( arrowDir, origin, length-50, 0x0000ff );
		pBg.threejs.scene.add(pBg.threejs.arrowHelper);
		pBg.threejs.scene.add(pBg.threejs.arrowHelperx);
		pBg.threejs.scene.add(pBg.threejs.arrowHelpery);
		pBg.threejs.scene.add(pBg.threejs.arrowHelperz);

		//background-particles, spread in a cube from -1000 to 1000 on each axis
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for (var i = 0; i < 1000; i++) {
			vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
			vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
			vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
		}


		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

		var particles = new THREE.Points(geometry, new THREE.PointsMaterial({
			color: "hsla(50, 60%, 96%, 1)"
		}));
		pBg.threejs.scene.add(particles);


		//cube
		var geometry = new THREE.BoxGeometry(100, 100, 100);
		var material = new THREE.MeshBasicMaterial({
			color: "white",
			wireframe: true
		});
		pBg.threejs.cube = new THREE.Mesh(geometry, material);

		pBg.threejs.cube.position.x = 0;
		pBg.threejs.cube.position.z = 0;
		pBg.threejs.cube.position.y = 0;

		pBg.threejs.scene.add(pBg.threejs.cube);

		//renderer
		pBg.threejs.renderer = new THREE.WebGLRenderer({
			canvas: pBg.canvas.elem,
			antialias: true
		});
		pBg.threejs.renderer.setPixelRatio(window.devicePixelRatio);
		pBg.threejs.renderer.setSize(pBg.canvas.width, pBg.canvas.height);
		pBg.threejs.renderer.autoClear = false;

	}

	pBg.functions.renderThreeJs = function() {

		//timer is rad
		pBg.threejs.vars.timer += pBg.threejs.vars.autoRotationSpeed;
		//object properties


		//camera position
		//pBg.threejs.camera.far = pBg.threejs.cube.position.length();
		pBg.threejs.camera.updateProjectionMatrix();
		pBg.threejs.camera.lookAt(pBg.threejs.cube.position);



		if (pBg.interactivity.events.onhover.sensorStatus) {
			//Map ArrowHelper to deviceOrientation
			let alpha = pBg.interactivity.mobile.tilt_alpha, //counterclockwise (0 to 360)
				beta = pBg.interactivity.mobile.tilt_beta, //up & down (-180 to 180)
				gamma = pBg.interactivity.mobile.tilt_gamma; //left & right (-90 to 90)

			//Phone-to-ThreeJS-coordinate-System: XYZ -> XZY
			//ThreeJS Order of application: XYZ
			//Phone Order of application: ZXY
			//Phone-to-ThreeJS-Trait-Bryan-Order: ZXY -> YXZ
			//Phone-to-ThreeJS-Trait-Bryan-Angles: αβγ -> βαγ

			//convert & norm PhoneEulerAngles from deg
	    	let alphaTjs = beta * Math.PI / 180.0,
				betaTjs = alpha * Math.PI / 180.0,
				gammaTjs = -gamma * Math.PI / 180.0;
			//do eulermovement
			let eulerMove = new THREE.Euler( alphaTjs, betaTjs, gammaTjs, 'YXZ' );

			//initial vector = up!
			let a = new THREE.Vector3(0,1,0);
			a.applyEuler(eulerMove);
			//xy&z-helper arrows
			let ax = new THREE.Vector3(0,a.y,a.z),
				ay = new THREE.Vector3(a.x,0,a.z),
				az = new THREE.Vector3(a.x,a.y,0);

			pBg.threejs.arrowHelper.setDirection( a );   //yellow
			pBg.threejs.arrowHelperx.setDirection( ax ); //red
			pBg.threejs.arrowHelpery.setDirection( ay ); //green
			pBg.threejs.arrowHelperz.setDirection( az ); //blue

		} else {
			//Map camera to mouse-position
			let a = new THREE.Vector3( 1, 1, 1 );
			a.normalize();
			pBg.threejs.arrowHelper.setDirection( a );
			//pBg.interactivity.mouse.pos_x;
			//pBg.interactivity.mouse.pos_y;
		}
		//describe a circular path
		pBg.threejs.camera.position.x = pBg.threejs.vars.camRotationRadius * Math.sin(pBg.threejs.vars.timer);
		pBg.threejs.camera.position.z = pBg.threejs.vars.camRotationRadius * Math.cos(pBg.threejs.vars.timer);


		//re-render scene
		pBg.threejs.renderer.clear();
		pBg.threejs.renderer.render(pBg.threejs.scene, pBg.threejs.camera);
	}

	pBg.functions.init = function() {
		pBg.canvas.width = pBg.canvas.elem.parentElement.offsetWidth;
		pBg.canvas.height = pBg.canvas.elem.parentElement.offsetHeight;
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);
	}
	pBg.functions.draw = function() {
		pBg.functions.renderThreeJs();

		pBg.functions.perspective();
		window.requestAnimFrame(pBg.functions.draw);
	};

	pBg.functions.start = function() {
		pBg.functions.init();
		pBg.functions.initThreeJs();
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
};



//initialize function

window.pBgDom = [];

window.jbParticleBg = function(qSelector, parameters, cb) {
	//console.log(parameters);

	pBgDom.push(new pBg(qSelector, parameters));

	if (cb) cb();
};