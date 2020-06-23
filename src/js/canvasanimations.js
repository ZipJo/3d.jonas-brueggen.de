const jb_anim = {

	data: {
		threejs: {},
		options: {}
	},
	// ===================== //
	// ===================== //
	// init & draw-functions //
	// ===================== //
	// ===================== //

	start(qSelector, options, cb){

		let canvas_el = document.querySelector(qSelector);

		// variables with default values
		this.data.canvas = {
			elem: canvas_el,
			width: canvas_el.parentElement.offsetWidth,
			height: canvas_el.parentElement.offsetHeight,			
		}

		jb_scripts.objDeepExtend(this.data.options, jb_anim_options);

		if (options) {
			jb_scripts.objDeepExtend(this.data.options, options);
		}

		//calculate global vars
		this.data.threejs.currentQuaternion = new THREE.Quaternion();
		this.data.threejs.aspect = this.data.canvas.width / this.data.canvas.height;


		//set other options
		if (this.data.options.fps > 30) {
			this.data.options.fps = 60
		}
		this.data.options.camFrustumNearField = this.data.options.camRotationRadius / 3;
		//one rotation = 2PI, autoRotationSpeed is initially in rpm
		this.data.options.autoRotationSpeed = Math.round(this.data.options.autoRotationSpeed * 2 * Math.PI / this.data.options.fps / 60 * 1000000) / 1000000;

		//parameters are set, everything else can begin now!
		//initialize all the things
		this.init();
		
		//start animation-loop
		this.draw();

		this.callback = cb;
	},

	init(){

		//initialize the webgl-canvas and objects
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

		//add html-objects
		if (this.data.options.helpers) {
			//fps-meter
			this.stats = new Stats();
			document.body.append( this.stats.dom );
			
			//slider
			document.body.insertAdjacentHTML( 'beforeend',`
			<div class="sm_wrap" onclick="this.classList.toggle('expand');">
				<div class="sm" onclick="event.stopPropagation();">
					<label for="smoothing">motion-smoothing - current: <span id="sm_value"></span>/1000:</label>
					<input type="range" id="smoothing" name="smoothing" min="900" max="999" value="945">
					
				</div>
			</div>`);

			//infobox
			this.infobox = document.createElement("div");
			this.infobox.classList.add("infobox");
			document.body.append( this.infobox );
			this.infobox.innerHTML = "init";
		}


	},

	//Animation-loop
	draw() {
		// set the redraw-speed according to the fps-parameter; over 30 = as fast as possible
		if (jb_anim.data.options.fps > 30) {
			window.requestAnimationFrame(jb_anim.draw);
		} else {
			setTimeout(jb_anim.draw, 1000 / jb_anim.data.options.fps); //this is not on time, but close enough..!
		}

		//check for new events
		jb_anim.eventLoop();

		//update helpers that need redrawing
		if (jb_anim.data.options.helpers){
			let smoothing = document.getElementById("smoothing").value; //how "heavy" is the previous rotation? Value between 0 and 1
			document.getElementById("sm_value").innerText = smoothing;
			jb_anim.data.options.motionSmoothing = 1-(smoothing/1000);
		}


		//if workers are available, outsource the math into a worker
		if (typeof(jb_anim.backgroundMathWorker) !== "undefined") {
			//only do stuff, if worker returned new Data! (flag is set in the onmessage-listener)
			if (jb_anim.newWorkerData){
				jb_anim.newWorkerData = false;

				let camMatrix = new THREE.Matrix4().fromArray(jb_anim.workerData.camMatrix);

				//translate new data into scene
				jb_anim.data.threejs.camera.position.setFromMatrixPosition(camMatrix);
				jb_anim.data.threejs.camera.rotation.setFromRotationMatrix(camMatrix);
				jb_anim.data.threejs.particleObject.rotation.fromArray(jb_anim.workerData.particleRotation);
				jb_anim.data.threejs.particleObject.updateMatrix();
				jb_anim.backgroundMathWorker.postMessage(jb_anim.getWorkerData());

				jb_anim.data.threejs.camera.updateMatrix();

				//re-render canvas with new values:
				jb_anim.data.threejs.renderer.clear();
				jb_anim.data.threejs.renderer.render(jb_anim.data.threejs.scene, jb_anim.data.threejs.camera);

				if (jb_anim.data.options.helpers){ jb_anim.infobox.thread = "multithread"; }

				if (jb_anim.callback) {
					jb_anim.callback();
					jb_anim.callback = null;
				}
			}
		} else {
			//no web worker support - do the math on the main thread
			jb_anim.renderThreeJs_singlethread();
			jb_anim.data.threejs.camera.updateMatrix();

			//re-render canvas with new values:
			jb_anim.data.threejs.renderer.clear();
			jb_anim.data.threejs.renderer.render(jb_anim.data.threejs.scene, jb_anim.data.threejs.camera);

			if (jb_anim.data.options.helpers){ jb_anim.infobox.thread = "singlethread"; }
			
			if (jb_anim.callback) {
				jb_anim.callback();
				jb_anim.callback = null;
			}
		}
		if (jb_anim.data.options.helpers){
			jb_anim.stats.update();
			jb_anim.infobox.innerHTML = "thread: " + jb_anim.infobox.thread + "<br>perspective-animation: " +
										jb_events.vars.status + "<br>"; 
		}
	},

	getWorkerData(){
		return {
			//camMatrix: this.data.threejs.camera.matrix.toArray(),
			particleMatrix: this.data.threejs.particleObject.matrix.toArray(),
			eventVars: jb_events.vars,
			eventStatus: jb_events.vars.status,
			canvas_width: this.data.canvas.width,
			canvas_height: this.data.canvas.height,
			camInit: this.data.threejs.cameraInitialPosition.toArray(),
			rotationSpeed: this.data.options.autoRotationSpeed
		};
	},

	// ================= //
	// ================= //
	// threejs-functions //
	// ================= //
	// ================= //

	initThreeJs(){
		//setup scene
		this.data.threejs.scene = new THREE.Scene();
		this.data.threejs.scene.background = new THREE.Color(this.data.options.bgColor);
		this.data.threejs.scene.fog = new THREE.Fog({
			color: this.data.options.bgColor,
			near: this.data.options.camFrustumNearField,
			far: this.data.options.camRotationRadius+750
		});

		//setup camera
		this.data.threejs.camera = new THREE.PerspectiveCamera(50, this.data.threejs.aspect, this.data.options.camFrustumNearField-50, 2000);
		this.data.threejs.camera.position.y = this.data.options.camRotationRadius;
		this.data.threejs.cameraInitialPosition = this.data.threejs.camera.position.clone();

		this.data.threejs.scene.add(this.data.threejs.camera);

		//background-particles, spread in a cube from -750 to 750 on each axis
		var geometry = new THREE.BufferGeometry();
		var vertices = [];

		for (var i = 0; i < this.data.options.particleCount; i++) {
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // x
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // y
			vertices.push(THREE.MathUtils.randFloatSpread(1500)); // z
		}

		//push particles inwards, that would clip the frustumNearField
		let minClippingDistance = this.data.options.camRotationRadius - this.data.options.camFrustumNearField,
			clipDistX = this.data.options.camFrustumNearField * this.data.threejs.aspect * Math.tan(25 / 180 * Math.PI),
			clipDistY = minClippingDistance,
			clipDistZ = this.data.options.camFrustumNearField * Math.tan(25 / 180 * Math.PI),
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

		var sprite = new THREE.TextureLoader().load('/js/dot.gif');
		var spriteAlpha = new THREE.TextureLoader().load('/js/dot_alpha.bmp');
		this.data.threejs.particleObject = new THREE.Points(geometry, new THREE.PointsMaterial({
			size: 5,
			map: sprite,
			alphaMap: spriteAlpha,
			color: 0xffffff,
			transparent: true
		}));

		this.data.threejs.scene.add(this.data.threejs.particleObject);

		//setup Helpers
		if (this.data.options.helpers3D) {
			//axes
			var axesHelper = new THREE.AxesHelper(20);
			this.data.threejs.scene.add(axesHelper);

			//arrow+cubes
			var ah_dir = new THREE.Vector3( 0, 1, 0 );
			var ah_origin = new THREE.Vector3( 0, 0, 0 );
			var ah_length = 100;
			var ah_hex = 0xffff00;
			this.data.threejs.arrowHelper = new THREE.ArrowHelper( ah_dir, ah_origin, ah_length, ah_hex );
			this.data.threejs.scene.add( this.data.threejs.arrowHelper );

			var qh_geometry = new THREE.BoxBufferGeometry( 50, 50, 50 );
			var qh_geometry2 = new THREE.BoxBufferGeometry( this.data.canvas.width/8.5, 1, this.data.canvas.height/8.5 );

			var qh_material = new THREE.MeshBasicMaterial( {wireframe: true} );
			this.data.threejs.cubeHelper = new THREE.Mesh( qh_geometry2, qh_material );
			this.data.threejs.cubeHelper.position.x = minClippingDistance;
			this.data.threejs.cubeHelper.rotateZ(Math.PI/2);
			this.data.threejs.scene.add( this.data.threejs.cubeHelper );


			this.data.threejs.cubeHelper2 = new THREE.Mesh( qh_geometry2, qh_material );
			this.data.threejs.cubeHelper2.position.y = 0;
			this.data.threejs.scene.add( this.data.threejs.cubeHelper2 );

			this.data.threejs.cubeHelper3 = new THREE.Mesh( qh_geometry2, qh_material );
			this.data.threejs.cubeHelper3.position.y = minClippingDistance;
			this.data.threejs.cubeHelper3.position.x = 100;
			this.data.threejs.scene.add( this.data.threejs.cubeHelper3 );
		}

		//disable auto-updates. this will be handeled in the draw-method!
		this.data.threejs.camera.matrixAutoUpdate = false;
		this.data.threejs.particleObject.matrixAutoUpdate = false;


		//renderer
		this.data.threejs.renderer = new THREE.WebGLRenderer({
			canvas: this.data.canvas.elem,
			antialias: true
		});
		this.data.threejs.renderer.setPixelRatio(window.devicePixelRatio);
		this.data.threejs.renderer.setSize(this.data.canvas.width, this.data.canvas.height);
		this.data.threejs.renderer.autoClear = false;
	},

	 renderThreeJs_singlethread() {
	 	//do the same stuff the worker does, but on main thread

		// ================== //		
		// 01 - camera-motion //
		// ================== //
		

		let eulerObj = null;
		if (jb_events.vars.deviceOrientation.sensorStatus) {
			eulerObj = this.calc.getEulerObjFromDeviceOrientation(jb_events.vars.deviceOrientation.tilt_alpha,jb_events.vars.deviceOrientation.tilt_beta,jb_events.vars.deviceOrientation.tilt_gamma);			//Calculate stabilized Quaternion
			this.data.threejs.currentQuaternion = this.calc.calculateCurrentQuaternionFromEulerObj(this.data.threejs.currentQuaternion, eulerObj,this.data.options.motionSmoothing);
		} else {
			eulerObj = this.calc.getEulerObjFromMousePosition(jb_events.vars.onhover.pos_x,jb_events.vars.onhover.pos_y, this.data.canvas.width, this.data.canvas.height, this.data.options.hoverPerspectiveContainment);
			//Calculate stabilized Quaternion
			this.data.threejs.currentQuaternion = this.calc.calculateCurrentQuaternionFromEulerObj(this.data.threejs.currentQuaternion, eulerObj,this.data.options.motionSmoothing);
		}

		//the if/else re-calculates this.data.threejs.currentQuaternion, based on either phone-motion, or mousemove. Set it here! 
		let newCameraPos = this.calc.roundVector(this.data.threejs.cameraInitialPosition, this.data.options.vectorAccuracy);
		newCameraPos.applyQuaternion(this.data.threejs.currentQuaternion);

		//set new position
		this.data.threejs.camera.position.x = newCameraPos.x;
		this.data.threejs.camera.position.y = newCameraPos.y;
		this.data.threejs.camera.position.z = newCameraPos.z;

		//set new camera rotation
		this.data.threejs.camera.setRotationFromQuaternion(this.data.threejs.currentQuaternion);
		//rotate around X by 90 degrees, to make the camera look at the center.
		//default camera view direction is -z, my view direction is -y
		this.data.threejs.camera.rotateX(-(Math.PI / 2));

		// ==================== //		
		// 02 - particle-motion //
		// ==================== //
		let particleRotationAxis = new THREE.Vector3(0,1,-4);
		particleRotationAxis.normalize();
		particleRotationAxis.applyQuaternion(this.data.threejs.currentQuaternion);

		this.data.threejs.particleObject.rotateOnAxis(particleRotationAxis,this.data.options.autoRotationSpeed)
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

		getEulerObjFromDeviceOrientation(alpha, beta, gamma) {
			//Map deviceOrientation to ThreeJS Euler-object
			
			//alpha: counterclockwise (0 to 360)
			//beta:  up & down (-180 to 180)
			//gamma: left & right (-90 to 90)

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

			return eulerObj;
		},

		getEulerObjFromMousePosition(pos_x, pos_y, canvas_width, canvas_height, contain){
			//Map mouse-position to ThreeJS Euler-object
			if (pos_x === undefined || pos_y === undefined){
				pos_x = 0.5;
				pos_y = 0.5;
			}
			//normalized percentage
			let percentage_x_mouse = pos_x / canvas_width * contain / 100;
			let percentage_y_mouse = pos_y / canvas_height * contain / 100;
			//so half of containmentPercentage = 0
			percentage_x_mouse = percentage_x_mouse - contain/100/2;
			percentage_y_mouse = percentage_y_mouse - contain/100/2;

			//±100% = ±45° (±π/4)
			let euler_x = Math.PI/4*percentage_x_mouse; //in rad
			let euler_y = -Math.PI/4*percentage_y_mouse; //in rad, y is inverse

			//transform mous-pos into x and z-angles
			let eulerObj = new THREE.Euler(euler_y,0,euler_x,'XYZ');
			return eulerObj;
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
		if (jb_events.vars.isResized){
			this.data.canvas.width = this.data.canvas.elem.parentElement.offsetWidth;
			this.data.canvas.height = this.data.canvas.elem.parentElement.offsetHeight;
			this.data.canvas.elem.width = this.data.canvas.width;
			this.data.canvas.elem.height = this.data.canvas.height;
			this.data.canvas.isPortrait = (this.data.canvas.width < this.data.canvas.height);


			this.data.threejs.aspect = this.data.canvas.width / this.data.canvas.height;

			this.data.threejs.renderer.setSize(this.data.canvas.width, this.data.canvas.height);

			this.data.threejs.camera.aspect = this.data.threejs.aspect;
			this.data.threejs.camera.updateProjectionMatrix();

			jb_events.vars.isResized = false;
		}
	}
}