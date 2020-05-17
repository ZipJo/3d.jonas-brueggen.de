importScripts('/js/three.min.js');
//depending on the environment, the correct file is either canvasanimations.js, or jb.min.js
//if both fail, hard error!
try {
	importScripts('/js/jb.min.js');
} catch(e) {
	importScripts('/js/canvasanimations.js');
}

const calc = jb_anim.calc;


onmessage = function(e) {
	// worker-script, to outsource threejs-math
	// there can't be any "window", or "document"-methods in here!
	let retObj = {};

	postMessage(retObj);
}