importScripts('/js/three.min.js');
importScripts('/js/canvasanimations-config.js');
//depending on the environment, the correct file is either canvasanimations.js, or jb.min.js
//if both fail, hard error!
try {
	importScripts('/js/jb.min.js');
} catch(e) {
	importScripts('/js/canvasanimations.js');
}

const calc = jb_anim.calc;
const config = jb_anim_options;
var newQ = new THREE.Quaternion();
var callcount = 0;


onmessage = function(e) {
	// worker-script, to outsource threejs-math
	// there can't be any "window", or "document"-methods in here!
	
	let data = e.data;

	let cam = new THREE.Object3D(),
		particles = new THREE.Object3D()
		camInit = new THREE.Vector3();

	//cam.applyMatrix4(new THREE.Matrix4().fromArray(data.camMatrix));
	particles.applyMatrix4(new THREE.Matrix4().fromArray(data.particleMatrix));
	camInit.fromArray(data.camInit);

	// ================== //		
	// 01 - camera-motion //
	// ================== //

	let eulerObj = new THREE.Euler();
	if (data.eventVars.status == "tilt") {
		//if possible, use device-orientation
		eulerObj = calc.getEulerObjFromDeviceOrientation(data.eventVars.deviceOrientation.tilt_alpha, data.eventVars.deviceOrientation.tilt_beta, data.eventVars.deviceOrientation.tilt_gamma);			//Calculate stabilized Quaternion
	} else if (data.eventVars.status == "mousemove"){
		//else: use mouse-position
		eulerObj = calc.getEulerObjFromMousePosition(data.eventVars.onhover.pos_x,data.eventVars.onhover.pos_y, data.canvas_width, data.canvas_height, config.hoverPerspectiveContainment);
	}


	//Calculate stabilized Quaternion
	let retQ = new THREE.Quaternion();
	//get Target-Quaternion from Euler-Object
	let targetQuaternion = new THREE.Quaternion();
	targetQuaternion.setFromEuler(eulerObj);
	//Calculate smoothed-position with slerp
	if (callcount < 2){
		newQ = targetQuaternion;
		callcount++;
	}
	THREE.Quaternion.slerp(newQ, targetQuaternion, retQ, config.motionSmoothing);
	newQ = retQ;
	//the if/else re-calculates newQ, based on either phone-motion, or mousemove. Set it here! 
	let newCameraPos = calc.roundVector(camInit.applyQuaternion(newQ), config.vectorAccuracy);
	//set new position
	cam.position.x = newCameraPos.x;
	cam.position.y = newCameraPos.y;
	cam.position.z = newCameraPos.z;

	//set new camera rotation
	cam.setRotationFromQuaternion(newQ);
	//rotate around X by 90 degrees, to make the camera look at the center.
	//default camera view direction is -z, my view direction is -y
	cam.rotateX(-(Math.PI / 2));


	// ==================== //		
	// 02 - particle-motion //
	// ==================== //
	let particleRotationAxis = new THREE.Vector3(0,1,-4);
	particleRotationAxis = calc.roundVector(particleRotationAxis.applyQuaternion(newQ), config.vectorAccuracy);
	particleRotationAxis.normalize();

	particles.rotateOnAxis(particleRotationAxis, data.rotationSpeed);

	cam.updateMatrix();
	particles.updateMatrix();

	let retObj = {
		camMatrix: cam.matrix.toArray(),
		particleRotation: particles.rotation.toArray()
	};

	postMessage(retObj);
}