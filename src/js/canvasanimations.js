const jb_anim = {

	// ================== //
	// ================== //
	// Default parameters //
	// ================== //
	// ================== //

	//will be merged with this.obj and init-parameters in this.start

	defaults: {
		tjs_vars: {
			camRotationRadius: 500,
			autoRotationSpeed: 0.05, //in rpm
			vectorAccuracy: 1000,
			particleCount: 5000,
			motionSmoothing: 945, //from 0 to 1000
			helpers: true
		},
		hoverPerspectiveContainment: 10, //100% = 90° (π/2)
		fps: 60,
		threejs: {}
	},

	// ===================== //
	// ===================== //
	// init & draw-functions //
	// ===================== //
	// ===================== //

	start(qSelector, parameters, cb){

		let canvas_el = document.querySelector(qSelector);

		// variables with default values
		this.obj = {
			canvas: {
				elem: canvas_el,
				width: canvas_el.parentElement.offsetWidth,
				height: canvas_el.parentElement.offsetHeight,
			}
		}

		jb_scripts.objDeepExtend(this.obj, this.defaults);

		if (parameters) {
			jb_scripts.objDeepExtend(this.obj, parameters);
		}

		//set other vars
		if (this.obj.fps > 30) {
			this.obj.fps = 60
		}

		this.obj.tjs_vars.camFrustumNearField = this.obj.tjs_vars.camRotationRadius / 3;


		//parameters are set, everything else can begin now!
		//initialize all the things
		this.init();
		
		//start animation-loop ~three frames delayed, to give the eventlisteners time to do their stuff
		//last call before the animation counts as initialized!
		setTimeout(function(){
			jb_anim.draw();
			if (cb) cb();
		}, 3 * 1000 / this.obj.fps);
	},

	init(){

		//initialize the background-animation
		this.initThreeJs();

		//add worker + event, if feature available
		if (typeof(Worker) !== "undefined") {
			this.backgroundMathWorker = new Worker("/js/canvasworker.js");
			//register event and store response in workerData
			this.backgroundMathWorker.onmessage = function(e) {
				jb_anim.newWorkerData = true;
				jb_anim.workerData = e.data;
			}
			//start worker once
			this.backgroundMathWorker.postMessage(this.getWorkerData());
		}

		//add the fps-meter
		if (this.obj.tjs_vars.helpers) {
			this.stats = new Stats();
			document.body.appendChild( this.stats.dom );
		}

	},

	//Animation-loop
	draw() {
		// set the redraw-speed according to the fps-parameter; over 30 = as fast as possible
		if (jb_anim.obj.fps > 30) {
			window.requestAnimationFrame(jb_anim.draw);
		} else {
			setTimeout(jb_anim.draw, 1000 / jb_anim.obj.fps); //this is not on time, but close enough..!
		}

		//check for new events
		jb_anim.eventLoop();

		jb_anim.renderThreeJs();

		//if workers are available, outsource the math into a worker
		if (typeof(jb_anim.backgroundMathWorker) !== "undefined") {
			//only do stuff, if worker returned new Data! (flag is set in the onmessage-listener)
			if (jb_anim.newWorkerData){
				jb_anim.backgroundMathWorker.postMessage(jb_anim.getWorkerData());
				jb_anim.newWorkerData = false;

				//translate new data into scene
				jb_anim.workerData;

				//re-render canvas with new values:
				jb_anim.obj.threejs.renderer.clear();
				jb_anim.obj.threejs.renderer.render(jb_anim.obj.threejs.scene, jb_anim.obj.threejs.camera);
			}
		} else {
			//no web worker support - do the math on the main thread
			jb_anim.updateCanvasObjects();
			
			//re-render canvas with new values:
			jb_anim.obj.threejs.renderer.clear();
			jb_anim.obj.threejs.renderer.render(jb_anim.obj.threejs.scene, jb_anim.obj.threejs.camera);
		}


		if (jb_anim.obj.tjs_vars.helpers) jb_anim.stats.update();
	},

	getWorkerData(){
		let retObj = {};


		return retObj;
	},

	// ================= //
	// ================= //
	// threejs-functions //
	// ================= //
	// ================= //

	initThreeJs(){
		//setup variables
		this.obj.tjs_vars.timer = 0;
		this.obj.threejs.currentQuaternion = new THREE.Quaternion();
		this.obj.threejs.prevQuaternion = new THREE.Quaternion();

		//one rotation = 2PI
		this.obj.tjs_vars.autoRotationSpeed = Math.round(this.obj.tjs_vars.autoRotationSpeed * 2 * Math.PI / this.obj.fps / 60 * 1000000) / 1000000;

		this.obj.threejs.aspect = this.obj.canvas.width / this.obj.canvas.height;

		//setup scene
		this.obj.threejs.scene = new THREE.Scene();
		this.obj.threejs.scene.background = new THREE.Color(0x011823);
		this.obj.threejs.scene.fog = new THREE.Fog({
			color: 0x011823,
			near: this.obj.tjs_vars.camFrustumNearField,
			far: this.obj.tjs_vars.camRotationRadius+750
		});

		//setup camera
		this.obj.threejs.camera = new THREE.PerspectiveCamera(50, this.obj.threejs.aspect, this.obj.tjs_vars.camFrustumNearField-50, 2000);
		this.obj.threejs.camera.position.y = this.obj.tjs_vars.camRotationRadius;
		this.obj.threejs.cameraInitialPosition = this.obj.threejs.camera.position.clone();

		this.obj.threejs.scene.add(this.obj.threejs.camera);

		//background-particles, spread in a cube from -750 to 750 on each axis
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for (var i = 0; i < this.obj.tjs_vars.particleCount; i++) {
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // x
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // y
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // z
		}

		//push particles inwards, that would clip the frustumNearField
		let minClippingDistance = this.obj.tjs_vars.camRotationRadius - this.obj.tjs_vars.camFrustumNearField,
			clipDistX = this.obj.tjs_vars.camFrustumNearField * this.obj.threejs.aspect * Math.tan(25 / 180 * Math.PI),
			clipDistY = minClippingDistance,
			clipDistZ = this.obj.tjs_vars.camFrustumNearField * Math.tan(25 / 180 * Math.PI),
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

		var sprite = new THREE.TextureLoader().load('/js/dot.png');
		this.obj.threejs.particleObject = new THREE.Points(geometry, new THREE.PointsMaterial({
			size: 5,
			map: sprite,
			color: 0xffffff,
			transparent: true
		}));

		this.obj.threejs.scene.add(this.obj.threejs.particleObject);

		//setup Helpers
		if (this.obj.tjs_vars.helpers) {
			//axes
			var axesHelper = new THREE.AxesHelper(20);
			this.obj.threejs.scene.add(axesHelper);

			//arrow+cube
			var ah_dir = new THREE.Vector3( 0, 1, 0 );
			var ah_origin = new THREE.Vector3( 0, 0, 0 );
			var ah_length = 100;
			var ah_hex = 0xffff00;
			this.obj.threejs.arrowHelper = new THREE.ArrowHelper( ah_dir, ah_origin, ah_length, ah_hex );
			this.obj.threejs.scene.add( this.obj.threejs.arrowHelper );

			var qh_geometry = new THREE.BoxBufferGeometry( 50, 50, 50 );
			var qh_geometry2 = new THREE.BoxBufferGeometry( this.obj.canvas.width/8.5, 1, this.obj.canvas.height/8.5 );

			var qh_material = new THREE.MeshBasicMaterial( {wireframe: true} );
			this.obj.threejs.cubeHelper = new THREE.Mesh( qh_geometry2, qh_material );
			this.obj.threejs.cubeHelper.position.x = minClippingDistance;
			this.obj.threejs.cubeHelper.rotateZ(Math.PI/2);
			this.obj.threejs.scene.add( this.obj.threejs.cubeHelper );


			this.obj.threejs.cubeHelper2 = new THREE.Mesh( qh_geometry2, qh_material );
			this.obj.threejs.cubeHelper2.position.y = 0;
			this.obj.threejs.scene.add( this.obj.threejs.cubeHelper2 );

			this.obj.threejs.cubeHelper3 = new THREE.Mesh( qh_geometry2, qh_material );
			this.obj.threejs.cubeHelper3.position.y = minClippingDistance;
			//this.obj.threejs.cubeHelper3.position.x = 100;
			this.obj.threejs.scene.add( this.obj.threejs.cubeHelper3 );
		}


		//renderer
		this.obj.threejs.renderer = new THREE.WebGLRenderer({
			canvas: this.obj.canvas.elem,
			antialias: true
		});
		this.obj.threejs.renderer.setPixelRatio(window.devicePixelRatio);
		this.obj.threejs.renderer.setSize(this.obj.canvas.width, this.obj.canvas.height);
		this.obj.threejs.renderer.autoClear = false;
	},

	 renderThreeJs() {

		// ================== //		
		// 01 - camera-motion //
		// ================== //
		
		if (this.obj.tjs_vars.helpers){
			let smoothing = document.getElementById("smoothing").value; //how "heavy" is the previous rotation? Value between 0 and 1
			document.getElementById("sm_value").innerText = smoothing;
			this.obj.tjs_vars.motionSmoothing = smoothing
		}
		let motion_smoothing = 1-(this.obj.tjs_vars.motionSmoothing/1000);
		let eulerObj = null;

		if (jb_events.vars.deviceOrientation.sensorStatus) {
			//Map camera to deviceOrientation
			let alpha = jb_events.vars.deviceOrientation.tilt_alpha, //counterclockwise (0 to 360)
				beta = jb_events.vars.deviceOrientation.tilt_beta, //up & down (-180 to 180)
				gamma = jb_events.vars.deviceOrientation.tilt_gamma; //left & right (-90 to 90)

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
			eulerObj = new THREE.Euler(alphaTjs, betaTjs, gammaTjs, 'YXZ');
			eulerObj.reorder('XYZ');

			//Calculate stabilized Quaternion
			this.obj.threejs.currentQuaternion = this.calc.calculateCurrentQuaternionFromEulerObj(this.obj.threejs.currentQuaternion, eulerObj,motion_smoothing);

		} else {
			//Map camera to mouse-position
			//normalized percentage
			let percentage_x_mouse = jb_events.vars.onhover.pos_x / this.obj.canvas.width * this.obj.hoverPerspectiveContainment / 100;
			let percentage_y_mouse = jb_events.vars.onhover.pos_y / this.obj.canvas.height * this.obj.hoverPerspectiveContainment / 100;
			//so half of containmentPercentage = 0
			percentage_x_mouse = percentage_x_mouse - this.obj.hoverPerspectiveContainment/100/2;
			percentage_y_mouse = percentage_y_mouse - this.obj.hoverPerspectiveContainment/100/2;

			//±100% = ±45° (±π/4)
			let euler_x = Math.PI/4*percentage_x_mouse; //in rad
			let euler_y = -Math.PI/4*percentage_y_mouse; //in rad, y is inverse


			//transform mous-pos into x and z-angles
			eulerObj = new THREE.Euler(euler_y,0,euler_x,'XYZ');

			//Calculate stabilized Quaternion
			this.obj.threejs.currentQuaternion = this.calc.calculateCurrentQuaternionFromEulerObj(this.obj.threejs.currentQuaternion, eulerObj,motion_smoothing);
		}

		//the if/else re-calculates this.obj.threejs.currentQuaternion, based on either phone-motion, or mousemove. Set it here! 
		let newCameraPos = this.calc.roundVector(this.obj.threejs.cameraInitialPosition.clone(), this.obj.tjs_vars.vectorAccuracy);
		newCameraPos.applyQuaternion(this.obj.threejs.currentQuaternion);

		//set new position
		this.obj.threejs.camera.position.x = newCameraPos.x;
		this.obj.threejs.camera.position.y = newCameraPos.y;
		this.obj.threejs.camera.position.z = newCameraPos.z;

		//set new camera rotation
		this.obj.threejs.camera.setRotationFromQuaternion(this.obj.threejs.currentQuaternion);
		//rotate around X by 90 degrees, to make the camera look at the center.
		//default camera view direction is -z, my view direction is -y
		this.obj.threejs.camera.rotateX(-(Math.PI / 2));

		//update camera position
		this.obj.threejs.camera.updateProjectionMatrix();

		// ==================== //		
		// 02 - particle-motion //
		// ==================== //
		//timer is in rad
		this.obj.tjs_vars.timer += this.obj.tjs_vars.autoRotationSpeed;

		let particleRotationAxis = new THREE.Vector3(0,1,-4);
		particleRotationAxis.normalize();
		particleRotationAxis.applyQuaternion(this.obj.threejs.currentQuaternion);

		if (this.obj.tjs_vars.helpers) this.obj.threejs.arrowHelper.setDirection(particleRotationAxis);
		this.obj.threejs.particleObject.rotateOnAxis(particleRotationAxis,this.obj.tjs_vars.autoRotationSpeed)
	},

	// ================================= //
	// ================================= //
	// calculations and helper-functions //
	// ================================= //
	// ================================= //

	//all calculations go in here! they will either be performed locally, or in a worker, if available!
	calc: {
		roundVector(vector, roundBy) {
			let newVector = new THREE.Vector3();

			newVector.x = Math.round(vector.x * roundBy) / roundBy;
			newVector.y = Math.round(vector.y * roundBy) / roundBy;
			newVector.z = Math.round(vector.z * roundBy) / roundBy;

			return newVector;
		},

		calculateCurrentQuaternionFromEulerObj(startQt, eulerObj, smoothing) {
			//Calculate stabilized Quaternion
			let retQt = new THREE.Quaternion();
			//get Target-Quaternion from Euler-Object
			let targetQuaternion = new THREE.Quaternion();
			targetQuaternion.setFromEuler(eulerObj);
			//Calculate smoothed-position with slerp
			THREE.Quaternion.slerp(startQt, targetQuaternion, retQt, smoothing);
			
			return retQt;
		},

	},

	
	// =================== //
	// =================== //
	// event-loop function //
	// =================== //
	// =================== //

	eventLoop() {
		if (jb_events.isResized){
			this.obj.canvas.width = this.obj.canvas.elem.parentElement.offsetWidth;
			this.obj.canvas.height = this.obj.canvas.elem.parentElement.offsetHeight;
			this.obj.canvas.isPortrait = (this.obj.canvas.width < this.obj.canvas.height);


			this.obj.threejs.aspect = this.obj.canvas.width / this.obj.canvas.height;

			this.obj.threejs.renderer.setSize(this.obj.canvas.width, this.obj.canvas.height);

			this.obj.threejs.camera.aspect = this.obj.threejs.aspect;
			this.obj.threejs.camera.updateProjectionMatrix();

			jb_events.isResized = false;
		}
	}
}