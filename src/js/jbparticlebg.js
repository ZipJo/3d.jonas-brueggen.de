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
				tiltAccuracy: 1000, // <- 1 divided by this
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
				autoRotationSpeed: 0.1, //in rpm
				zeroVector: new THREE.Vector3(0, 0, 0),
				vectorAccuracy: 1000,
				particles: 10000
			}
		},
		fps: 60
	};

	let pBg = this.pBg;

	if (parameters) {
		Object.deepExtend(pBg, parameters);
	}

	if (pBg.fps > 30) {
		pBg.fps = 60
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



		let alpha = e.alpha, //counter- & clockwise (0 to 360)
			beta = e.beta, //up & down (-180 to 180)
			gamma = e.gamma; //left & right (-90 to 90)

		//normalize alpha (game-based calibration):
		if (pBg.interactivity.events.ondeviceorientation.initialOffset === null) {
			pBg.interactivity.events.ondeviceorientation.initialOffset = e.alpha;
		}
		alpha = e.alpha - pBg.interactivity.events.ondeviceorientation.initialOffset;

		if (alpha < 0) {
			alpha += 360;
		}

		//round and save
		pBg.interactivity.mobile.tilt_alpha = Math.round(alpha * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy;
		pBg.interactivity.mobile.tilt_beta = Math.round(beta * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy;
		pBg.interactivity.mobile.tilt_gamma = Math.round(gamma * pBg.interactivity.mobile.tiltAccuracy) / pBg.interactivity.mobile.tiltAccuracy;
	}

	pBg.functions.deviceMotionEvent = function(e) {
		//round values to only capture significant motion
		pBg.interactivity.mobile.rotation_alpha = Math.round(e.rotationRate.alpha * 1000)/10000; //up & down
		pBg.interactivity.mobile.rotation_beta = Math.round(e.rotationRate.beta * 1000)/10000; //left & right
		pBg.interactivity.mobile.rotation_gamma = Math.round(e.rotationRate.gamma * 1000)/10000; //counter- & clockwise
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
				//document.querySelector("main").append(elem);

				//only, if DeviceOrientationEvent is supported.
				if (typeof(DeviceOrientationEvent) !== 'undefined') {

					if (typeof(DeviceOrientationEvent.requestPermission) === 'function') {
						window.addEventListener("deviceorientation", pBg.functions.deviceOrientationEvent);
						window.addEventListener("devicemotion", pBg.functions.deviceMotionEvent);
						document.body.addEventListener('click', function() {
							DeviceOrientationEvent.requestPermission()
								.then(function() {
									window.addEventListener("deviceorientation", pBg.functions.deviceOrientationEvent);
									window.addEventListener("devicemotion", pBg.functions.deviceMotionEvent);
									pBg.interactivity.events.onhover.sensorStatus = true;
								}).catch(function() {
									pBg.interactivity.events.onhover.sensorStatus = false;
								})
						}, {
							once: true
						});
					} else {
						window.addEventListener("deviceorientation", pBg.functions.deviceOrientationEvent);
						window.addEventListener("devicemotion", pBg.functions.deviceMotionEvent);
						pBg.interactivity.events.onhover.sensorStatus = true;
					}

				} else {
					pBg.interactivity.events.onhover.sensorStatus = false;
				}

			} else {
				//desktop!

				/* el on mousemove */
				window.addEventListener('mousemove', function(e) {

					let pos_x = e.clientX,
						pos_y = e.clientY;

					pBg.interactivity.mouse.pos_x = pos_x;
					pBg.interactivity.mouse.pos_y = pos_y;

					pBg.interactivity.status = 'mousemove';
				});

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

			//document.getElementById("infobox").innerHTML = alpha + sp+ aRad+br + beta + sp+bRad+br + gamma +sp+gRad+ br + br + rot_alpha + br + rot_beta + br + rot_gamma;

			document.getElementById("infobox").innerHTML = alpha + br + beta + br + gamma + br + br + br + rot_alpha + br + rot_beta + br + rot_gamma;
			document.querySelector("span#motion_dot").style.top = rot_alpha + "px";
			document.querySelector("span#motion_dot").style.left = rot_beta + "px";

		}
		if (cb) cb();
	};



	pBg.functions.initThreeJs = function() {

		//setup variables
		pBg.threejs.vars.timer = 0;
		pBg.threejs.currentQuaternion = new THREE.Quaternion();
		pBg.threejs.prevQuaternion = new THREE.Quaternion();
		pBg.threejs.hasPrevQuaternion = false;

		//one rotation = 2PI
		pBg.threejs.vars.autoRotationSpeed = Math.round(pBg.threejs.vars.autoRotationSpeed * 2 * Math.PI / pBg.fps / 60 * 10000) / 10000;

		pBg.threejs.aspect = pBg.canvas.width / pBg.canvas.height;

		//setup scene
		pBg.threejs.scene = new THREE.Scene();
		pBg.threejs.scene.background = new THREE.Color(0x011b28);
		pBg.threejs.scene.fog = new THREE.Fog({
			color: 0x011b28,
			near: pBg.threejs.vars.camRotationRadius,
			far: 2000
		});

		//setup camera
		pBg.threejs.camera = new THREE.PerspectiveCamera(50, pBg.threejs.aspect, pBg.threejs.vars.camRotationRadius/3, 2000);
		pBg.threejs.camera.position.y = pBg.threejs.vars.camRotationRadius;
		pBg.threejs.cameraInitialPosition = pBg.threejs.camera.position.clone();

		pBg.threejs.scene.add(pBg.threejs.camera);

		//setup Helpers
		//axes
		var axesHelper = new THREE.AxesHelper(20);
		//pBg.threejs.scene.add(axesHelper);

		//arrow
		arrowDir = THREE.Object3D.DefaultUp;
		arrowDir.normalize();
		var origin = new THREE.Vector3(0, 0, 0);
		var length = 80;
		pBg.threejs.arrowHelper = new THREE.ArrowHelper(arrowDir, origin, length + 20);
		//pBg.threejs.scene.add(pBg.threejs.arrowHelper);

		//background-particles, spread in a cube from -1000 to 1000 on each axis
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for (var i = 0; i < pBg.threejs.vars.particles; i++) {
			vertices.push(THREE.MathUtils.randFloatSpread(1000)); // x
			vertices.push(THREE.MathUtils.randFloatSpread(1000)); // y
			vertices.push(THREE.MathUtils.randFloatSpread(1000)); // z
		}


		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

		var sprite = new THREE.TextureLoader().load('js/dot.png');
		var particles = new THREE.Points(geometry, new THREE.PointsMaterial({
			size: 5,
			map: sprite,
			color: 0xffffff,
			transparent: true
		}));
		pBg.threejs.scene.add(particles);


		//cube
		var geometry1 = new THREE.BoxGeometry(20, 20, 20);
		var geometry2 = new THREE.BoxGeometry(20, 40, 20);
		var material1 = new THREE.MeshBasicMaterial({ color: "blue", wireframe: true });
		var material2 = new THREE.MeshBasicMaterial({ color: "hsla(25, 100%, 54%, 1)", wireframe: true });
		var material3 = new THREE.MeshBasicMaterial({ color: "white", wireframe: true });
		var material4 = new THREE.MeshBasicMaterial({ color: "hsla(25, 100%, 77%, 1)", wireframe: true });

		pBg.threejs.cube1 = new THREE.Mesh(geometry1, material1);
		pBg.threejs.cube2 = new THREE.Mesh(geometry2, material2);
		pBg.threejs.cube3 = new THREE.Mesh(geometry2, material3);
		pBg.threejs.cube4 = new THREE.Mesh(geometry2, material4);

		pBg.threejs.cube1.position.x = 0;
		pBg.threejs.cube1.position.y = -40;
		pBg.threejs.cube1.position.z = 0;

		pBg.threejs.cube2.position.x = -50;
		pBg.threejs.cube2.position.y = 40;
		pBg.threejs.cube2.position.z = 0;

		pBg.threejs.cube3.position.x = 50;
		pBg.threejs.cube3.position.y = 40;
		pBg.threejs.cube3.position.z = 0;
		
		pBg.threejs.cube3.rotateZ(-Math.PI/2);

		pBg.threejs.cube4.position.x = 0;
		pBg.threejs.cube4.position.y = 40;
		pBg.threejs.cube4.position.z = 0;

		var q = new THREE.Quaternion();
		THREE.Quaternion.slerp( pBg.threejs.cube2.quaternion, pBg.threejs.cube3.quaternion, q, 0.5 );

		pBg.threejs.cube4.applyQuaternion(q);

		//pBg.threejs.scene.add(pBg.threejs.cube1);
		//pBg.threejs.scene.add(pBg.threejs.cube2);
		//pBg.threejs.scene.add(pBg.threejs.cube3);
		//pBg.threejs.scene.add(pBg.threejs.cube4);

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

		//timer is in rad
		pBg.threejs.vars.timer += pBg.threejs.vars.autoRotationSpeed;
		//object properties

		pBg.threejs.cube1.rotateY(pBg.threejs.vars.autoRotationSpeed);
		pBg.threejs.cube1.rotateX(pBg.threejs.vars.autoRotationSpeed / 2);


		if (pBg.interactivity.events.onhover.sensorStatus) {
			//Map camera to deviceOrientation
			let alpha = pBg.interactivity.mobile.tilt_alpha, //counterclockwise (0 to 360)
				beta = pBg.interactivity.mobile.tilt_beta, //up & down (-180 to 180)
				gamma = pBg.interactivity.mobile.tilt_gamma; //left & right (-90 to 90)

			//Phone-to-ThreeJS-coordinate-System: XYZ -> XZY
			//ThreeJS Order of application: XYZ
			//Phone Order of application: ZXY
			//Phone-to-ThreeJS-Trait-Bryan-Order: ZXY -> YXZ
			//Phone-to-ThreeJS-Trait-Bryan-Angles: αβγ -> βαγ
			//convert & norm PhoneEulerAngles from deg
			let alphaTjs = Math.round((beta * Math.PI / 180.0) * 10000) / 10000,
				betaTjs = Math.round((alpha * Math.PI / 180.0) * 10000) / 10000,
				gammaTjs = -Math.round((gamma * Math.PI / 180.0) * 10000) / 10000;
			//Calculate ThreeJS Euler-Object
			let eulerObj = new THREE.Euler(alphaTjs, betaTjs, gammaTjs, 'YXZ');
			eulerObj.reorder('XYZ');

			//Calculate stabilized Quaternion
			if (pBg.threejs.hasPrevQuaternion) {
				//default
				let prevWeight = document.getElementById("smoothing").value; //how "heavy" is the previous rotation? Value between 0 and 1
				document.getElementById("sm_value").innerText = prevWeight;
				prevWeight = 1-(prevWeight/101); 
				//get actual Phone-Quaternion from Euler-Object
				let phoneQuaternion = new THREE.Quaternion();
				phoneQuaternion.setFromEuler(eulerObj);
				//Calculate smoothed-position with slerp
				THREE.Quaternion.slerp(pBg.threejs.prevQuaternion, phoneQuaternion, pBg.threejs.currentQuaternion, prevWeight );
				//save new position in prevQuaternion for next smoothing-operation
				pBg.threejs.prevQuaternion.copy(pBg.threejs.currentQuaternion);
			} else if(!pBg.threejs.hasPrevQuaternion){
				//first calculation
				pBg.threejs.currentQuaternion.setFromEuler(eulerObj);
				pBg.threejs.prevQuaternion.copy(pBg.threejs.currentQuaternion);
				pBg.threejs.hasPrevQuaternion = true;
			}



			let newCameraPos = roundVector(pBg.threejs.cameraInitialPosition.clone(), pBg.threejs.vars.vectorAccuracy);
			newCameraPos.applyQuaternion(pBg.threejs.currentQuaternion);

			//set new position
			pBg.threejs.camera.position.x = newCameraPos.x;
			pBg.threejs.camera.position.y = newCameraPos.y;
			pBg.threejs.camera.position.z = newCameraPos.z;

			//set new rotation
			pBg.threejs.camera.setRotationFromQuaternion(pBg.threejs.currentQuaternion);
			//rotate around X by 90 degrees, to make the camera look at the center.
			//default camera view direction is -z, my view direction is -y
			pBg.threejs.camera.rotateX(-(Math.PI / 2));

		} else {
			//document.querySelector("div.sm").style.display = "none";
			//Map camera to mouse-position

			//pBg.interactivity.mouse.pos_x;
			//pBg.interactivity.mouse.pos_y;

			//describe a circular path
			let newCameraPos = new THREE.Vector3();

			newCameraPos.y = pBg.threejs.vars.camRotationRadius / 4;
			newCameraPos.x = pBg.threejs.vars.camRotationRadius * Math.sin(pBg.threejs.vars.timer);
			newCameraPos.z = pBg.threejs.vars.camRotationRadius * Math.cos(pBg.threejs.vars.timer);

			newCameraPos = roundVector(newCameraPos, pBg.threejs.vars.vectorAccuracy);

			pBg.threejs.camera.position.x = newCameraPos.x;
			pBg.threejs.camera.position.y = newCameraPos.y;
			pBg.threejs.camera.position.z = newCameraPos.z;
			pBg.threejs.camera.lookAt(pBg.threejs.vars.zeroVector);
		}


		//camera position
		pBg.threejs.camera.updateProjectionMatrix();

		//re-render scene
		pBg.threejs.renderer.clear();
		pBg.threejs.renderer.render(pBg.threejs.scene, pBg.threejs.camera);
	}

	pBg.functions.init = function() {
		pBg.canvas.width = pBg.canvas.elem.parentElement.offsetWidth;
		pBg.canvas.height = pBg.canvas.elem.parentElement.offsetHeight;
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);

		stats = new Stats();
		document.body.appendChild( stats.dom );

	}
	//Animation-loop
	pBg.functions.draw = function() {
		if (pBg.fps > 30) {
			window.requestAnimFrame(pBg.functions.draw);
		} else {
			setTimeout(pBg.functions.draw, 1000 / pBg.fps); //this is not on time, but close enough..!
		}
		//pBg.functions.perspective();
		stats.update();
		pBg.functions.renderThreeJs();
	};

	pBg.functions.start = function() {
		pBg.functions.init();
		pBg.functions.initThreeJs();
		//start ~three frames delayed, to give the eventlisteners time to do their stuff
		setTimeout(pBg.functions.draw, 3 * 1000 / pBg.fps);
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

function roundVector(vector, roundBy) {
	let newVector = new THREE.Vector3();

	newVector.x = Math.round(vector.x * roundBy) / roundBy;
	newVector.y = Math.round(vector.y * roundBy) / roundBy;
	newVector.z = Math.round(vector.z * roundBy) / roundBy;

	return newVector;
}



//initialize function

window.pBgDom = [];

window.jbParticleBg = function(qSelector, parameters, cb) {
	//console.log(parameters);

	pBgDom.push(new pBg(qSelector, parameters));

	if (cb) cb();
};