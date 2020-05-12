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
				containmentPercentage: 10 //100% = 90° (π/2)
			},
			actions: {}
		},
		threejs: {
			vars: {
				camRotationRadius: 500,
				autoRotationSpeed: 0.05, //in rpm
				zeroVector: new THREE.Vector3(0, 0, 0),
				vectorAccuracy: 1000,
				particleCount: 5000,
				helpers: true
			}
		},
		fps: 60
	};

	let pBg = this.pBg;

	if (parameters) {
		Object.deepExtend(pBg, parameters);
	}


	//set other vars
	if (pBg.fps > 30) {
		pBg.fps = 60
	}

	pBg.threejs.vars.camFrustumNearField = pBg.threejs.vars.camRotationRadius / 3;


	// ======================= //
	// ======================= //
	// eventlistener-functions //
	// ======================= //
	// ======================= //

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


	// ======================== //
	// ======================== //
	// 2D-perspective-functions //
	// ======================== //
	// ======================== //

	pBg.functions.perspective = function() {

		if (pBg.interactivity.events.onhover.enable && pBg.interactivity.status == 'mousemove') {
			let percentage_x_mouse = pBg.interactivity.mouse.pos_x / pBg.canvas.width;
			let percentage_y_mouse = pBg.interactivity.mouse.pos_y / pBg.canvas.height;

			let perspectiveOrigin =
				(100 - (pBg.functions.vars.containmentPercentage / 2 + percentage_x_mouse * (100 - pBg.functions.vars.containmentPercentage))) + "% " +
				(100 - (pBg.functions.vars.containmentPercentage / 2 + percentage_y_mouse * (100 - pBg.functions.vars.containmentPercentage))) + "%";


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
	};


	// ================= //
	// ================= //
	// threejs-functions //
	// ================= //
	// ================= //

	pBg.functions.calculateCurrentQuaternionFromEulerObj = function(eulerObj,smoothing) {
		//Calculate stabilized Quaternion
		if (pBg.threejs.hasPrevQuaternion) {
			//get Target-Quaternion from Euler-Object
			let targetQuaternion = new THREE.Quaternion();
			targetQuaternion.setFromEuler(eulerObj);
			//Calculate smoothed-position with slerp
			THREE.Quaternion.slerp(pBg.threejs.prevQuaternion, targetQuaternion, pBg.threejs.currentQuaternion, smoothing );
			//save new position in prevQuaternion for next smoothing-operation
			pBg.threejs.prevQuaternion.copy(pBg.threejs.currentQuaternion);
		} else if(!pBg.threejs.hasPrevQuaternion){
			//first calculation
			pBg.threejs.currentQuaternion.setFromEuler(eulerObj);
			pBg.threejs.prevQuaternion.copy(pBg.threejs.currentQuaternion);
			pBg.threejs.hasPrevQuaternion = true;
		}
	}



	pBg.functions.initThreeJs = function() {

		//setup variables
		pBg.threejs.vars.timer = 0;
		pBg.threejs.currentQuaternion = new THREE.Quaternion();
		pBg.threejs.prevQuaternion = new THREE.Quaternion();
		pBg.threejs.hasPrevQuaternion = false;

		//one rotation = 2PI
		pBg.threejs.vars.autoRotationSpeed = Math.round(pBg.threejs.vars.autoRotationSpeed * 2 * Math.PI / pBg.fps / 60 * 1000000) / 1000000;

		pBg.threejs.aspect = pBg.canvas.width / pBg.canvas.height;

		//setup scene
		pBg.threejs.scene = new THREE.Scene();
		pBg.threejs.scene.background = new THREE.Color(0x011823);
		pBg.threejs.scene.fog = new THREE.Fog({
			color: 0x011823,
			near: pBg.threejs.vars.camFrustumNearField,
			far: pBg.threejs.vars.camRotationRadius+750
		});

		//setup camera
		pBg.threejs.camera = new THREE.PerspectiveCamera(50, pBg.threejs.aspect, pBg.threejs.vars.camFrustumNearField-50, 2000);
		pBg.threejs.camera.position.y = pBg.threejs.vars.camRotationRadius;
		pBg.threejs.cameraInitialPosition = pBg.threejs.camera.position.clone();

		pBg.threejs.scene.add(pBg.threejs.camera);

		//background-particles, spread in a cube from -750 to 750 on each axis
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for (var i = 0; i < pBg.threejs.vars.particleCount; i++) {
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // x
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // y
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // z
		}

		//push particles inwards, that would clip the frustumNearField
		let minClippingDistance = pBg.threejs.vars.camRotationRadius - pBg.threejs.vars.camFrustumNearField,
			clipDistX = pBg.threejs.vars.camFrustumNearField * pBg.threejs.aspect * Math.tan(25 / 180 * Math.PI),
			clipDistY = minClippingDistance,
			clipDistZ = pBg.threejs.vars.camFrustumNearField * Math.tan(25 / 180 * Math.PI),
			maxClippingDistance = new THREE.Vector3(clipDistX,clipDistY,clipDistZ).length(),
			clipDiff = maxClippingDistance - minClippingDistance;
		
		for (var i = 0; i < vertices.length; i+=3) {
			let cX = vertices[i], // x
				cY = vertices[i+1], // y
				cZ = vertices[i+2], // z
				cV = new THREE.Vector3(cX,cY,cZ),
				cL = cV.length();

			if (cL > minClippingDistance & cL < maxClippingDistance) {
				cV.setLength(cL - clipDiff);
				vertices[i] = cV.x;
				vertices[i+1] = cV.y;
				vertices[i+2] = cV.z;
			}
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

		var sprite = new THREE.TextureLoader().load('js/dot.png');
		pBg.threejs.particleObject = new THREE.Points(geometry, new THREE.PointsMaterial({
			size: 5,
			map: sprite,
			color: 0xffffff,
			transparent: true
		}));

		pBg.threejs.scene.add(pBg.threejs.particleObject);

		//setup Helpers
		if (pBg.threejs.vars.helpers) {
			//axes
			var axesHelper = new THREE.AxesHelper(20);
			pBg.threejs.scene.add(axesHelper);

			//arrow+cube
			var ah_dir = new THREE.Vector3( 0, 1, 0 );
			var ah_origin = new THREE.Vector3( 0, 0, 0 );
			var ah_length = 100;
			var ah_hex = 0xffff00;
			pBg.threejs.arrowHelper = new THREE.ArrowHelper( ah_dir, ah_origin, ah_length, ah_hex );
			pBg.threejs.scene.add( pBg.threejs.arrowHelper );

			var qh_geometry = new THREE.BoxBufferGeometry( 50, 50, 50 );
			var qh_geometry2 = new THREE.BoxBufferGeometry( pBg.canvas.width/8.5, 1, pBg.canvas.height/8.5 );

			var qh_material = new THREE.MeshBasicMaterial( {wireframe: true} );
			pBg.threejs.cubeHelper = new THREE.Mesh( qh_geometry2, qh_material );
			pBg.threejs.cubeHelper.position.x = minClippingDistance;
			pBg.threejs.cubeHelper.rotateZ(Math.PI/2);
			pBg.threejs.scene.add( pBg.threejs.cubeHelper );


			pBg.threejs.cubeHelper2 = new THREE.Mesh( qh_geometry2, qh_material );
			pBg.threejs.cubeHelper2.position.y = 0;
			pBg.threejs.scene.add( pBg.threejs.cubeHelper2 );

			pBg.threejs.cubeHelper3 = new THREE.Mesh( qh_geometry2, qh_material );
			pBg.threejs.cubeHelper3.position.y = minClippingDistance;
			//pBg.threejs.cubeHelper3.position.x = 100;
			pBg.threejs.scene.add( pBg.threejs.cubeHelper3 );
		}


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

		// ================== //		
		// 01 - camera-motion //
		// ================== //
		let motion_smoothing = document.getElementById("smoothing").value; //how "heavy" is the previous rotation? Value between 0 and 1
		document.getElementById("sm_value").innerText = motion_smoothing;
		motion_smoothing = 1-(motion_smoothing/1000); 

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
			pBg.functions.calculateCurrentQuaternionFromEulerObj(eulerObj,motion_smoothing);

		} else {
			//Map camera to mouse-position
			//normalized percentage
			let percentage_x_mouse = pBg.interactivity.mouse.pos_x / pBg.canvas.width * pBg.functions.vars.containmentPercentage / 100;
			let percentage_y_mouse = pBg.interactivity.mouse.pos_y / pBg.canvas.height * pBg.functions.vars.containmentPercentage / 100;
			//so half of containmentPercentage = 0
			percentage_x_mouse = percentage_x_mouse - pBg.functions.vars.containmentPercentage/100/2;
			percentage_y_mouse = percentage_y_mouse - pBg.functions.vars.containmentPercentage/100/2;

			//±100% = ±45° (±π/4)
			let euler_x = Math.PI/4*percentage_x_mouse; //in rad
			let euler_y = -Math.PI/4*percentage_y_mouse; //in rad, y is inverse


			//transform mous-pos into x and z-angles
			let eulerObj = new THREE.Euler(euler_y,0,euler_x,'XYZ');

			//Calculate stabilized Quaternion
			pBg.functions.calculateCurrentQuaternionFromEulerObj(eulerObj,motion_smoothing);
		}

		//the if/else re-calculates pBg.threejs.currentQuaternion, based on either phone-motion, or mousemove. Set it here! 
		let newCameraPos = roundVector(pBg.threejs.cameraInitialPosition.clone(), pBg.threejs.vars.vectorAccuracy);
		newCameraPos.applyQuaternion(pBg.threejs.currentQuaternion);

		//set new position
		pBg.threejs.camera.position.x = newCameraPos.x;
		pBg.threejs.camera.position.y = newCameraPos.y;
		pBg.threejs.camera.position.z = newCameraPos.z;

		//set new camera rotation
		pBg.threejs.camera.setRotationFromQuaternion(pBg.threejs.currentQuaternion);
		//rotate around X by 90 degrees, to make the camera look at the center.
		//default camera view direction is -z, my view direction is -y
		pBg.threejs.camera.rotateX(-(Math.PI / 2));

		//update camera position
		pBg.threejs.camera.updateProjectionMatrix();

		// ==================== //		
		// 02 - particle-motion //
		// ==================== //
		//timer is in rad
		pBg.threejs.vars.timer += pBg.threejs.vars.autoRotationSpeed;

		let particleRotationAxis = new THREE.Vector3(0,1,-4);
		particleRotationAxis.normalize();
		particleRotationAxis.applyQuaternion(pBg.threejs.currentQuaternion);

		if (pBg.threejs.vars.helpers) pBg.threejs.arrowHelper.setDirection(particleRotationAxis);
		pBg.threejs.particleObject.rotateOnAxis(particleRotationAxis,pBg.threejs.vars.autoRotationSpeed)

		// ==================== //		
		// 03 - re-render scene //
		// ==================== //
		pBg.threejs.renderer.clear();
		pBg.threejs.renderer.render(pBg.threejs.scene, pBg.threejs.camera);
	}


	// ===================== //
	// ===================== //
	// init & draw-functions //
	// ===================== //
	// ===================== //

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