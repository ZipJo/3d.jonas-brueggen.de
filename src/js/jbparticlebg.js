// jbparticlebg.js

let pBg = function(tag_id, parameters){

	let canvas_el = document.getElementById(tag_id);
	let object_el = document.getElementById('object_container');

	// variables with default values
	this.pBg = {
		canvas: {
			elem: canvas_el,
			width: canvas_el.offsetWidth,
			height: canvas_el.offsetHeight,
			object_elem: object_el
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
			mouse:{},
			mobile:{
				tilt_accuracy: 1000 // <- 1 divided by this
			}
		},
		functions: {
			vars: {
				containment: 50
			},
			actions:{}
		},
	};

	let pBg = this.pBg;

	if(parameters){
		Object.deepExtend(pBg, parameters);
	}


	// functions
	pBg.functions.actions.clickAction = function(){
		console.log("click at X:"+pBg.interactivity.mouse.click_pos_x+" Y:"+pBg.interactivity.mouse.click_pos_y);
	}

	pBg.functions.deviceOrientationChange = function(e) {
		if(pBg.interactivity.status != 'tilt') {
			pBg.interactivity.mobile.tilt_alpha_initial = Math.round(e.alpha * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //counter- & clockwise (-180 to 180)
			pBg.interactivity.mobile.tilt_beta_initial = Math.round(e.beta * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //up & down (-180 to 180)
			pBg.interactivity.mobile.tilt_gamma_initial = Math.round(e.gamma * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //left & right (-90 to 90)
		}
		pBg.interactivity.status = 'tilt';

		pBg.interactivity.mobile.tilt_alpha = Math.round(e.alpha * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //counter- & clockwise (-180 to 180)
		pBg.interactivity.mobile.tilt_beta = Math.round(e.beta * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //up & down (-180 to 180)
		pBg.interactivity.mobile.tilt_gamma = Math.round(e.gamma * pBg.interactivity.mobile.tilt_accuracy) / pBg.interactivity.mobile.tilt_accuracy; //left & right (-90 to 90)
	}

	pBg.functions.eventListeners = function(){
		// detect mouse pos - on hover / click event
		if(pBg.interactivity.events.onhover.enable || pBg.interactivity.events.onclick.enable){
			// Add tilt-events, instead of hover for mobile and mouseevent for desktops:
			if( true || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				//mobile!

				if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
					document.body.addEventListener('click', function () {
						DeviceOrientationEvent.requestPermission()
						.then(function() {}).catch(function () {})
					}, {once: true});
				}

				//debug-element:
				let elem = document.createElement("div");
					elem.setAttribute("id","infobox");
					elem.innerHTML = "init";
				document.querySelector("main").append(elem);

				window.addEventListener("deviceorientation", pBg.functions.deviceOrientationChange);



			} else {
				//desktop!

				/* el on mousemove */
				window.addEventListener('mousemove', function(e){

					let pos_x = e.clientX,
						pos_y = e.clientY;

					pBg.interactivity.mouse.pos_x = pos_x;
					pBg.interactivity.mouse.pos_y = pos_y;

					pBg.interactivity.status = 'mousemove';
				});

				/* el on onmouseleave */
				window.addEventListener('mouseleave', function(e){

					pBg.interactivity.mouse.pos_x = null;
					pBg.interactivity.mouse.pos_y = null;
					pBg.interactivity.status = 'mouseleave';

				});
			}

			// onclick event
			if(pBg.interactivity.events.onclick.enable){
				window.addEventListener('click', function(e){
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

	pBg.functions.perspective = function(cb){

		if(pBg.interactivity.events.onhover.enable && pBg.interactivity.status == 'mousemove'){
			let percentage_x_mouse = pBg.interactivity.mouse.pos_x / pBg.canvas.width;
			let percentage_y_mouse = pBg.interactivity.mouse.pos_y / pBg.canvas.height;

			let perspectiveOrigin =
				(100 - (pBg.functions.vars.containment/2 + percentage_x_mouse*(100 - pBg.functions.vars.containment))) + "% " +
				(100 - (pBg.functions.vars.containment/2 + percentage_y_mouse*(100 - pBg.functions.vars.containment))) + "%";


			pBg.canvas.object_elem.style.perspectiveOrigin = perspectiveOrigin;
		}
		if(pBg.interactivity.events.onhover.enable && pBg.interactivity.status == 'tilt'){
			function rotate(vec, axis, angle) {
				var c = Math.cos(angle * Math.PI / 180.0),
					s = Math.sin(angle * Math.PI / 180.0),
					x = axis[0], y = axis[1], z = axis[2],

					// rotation matrix form
					rm00 =    c + x*x * (1-c),
					rm10 =  z*s + y*x * (1-c),
					rm20 = -y*s + z*x * (1-c),
					rm01 = -z*s + x*y * (1-c),
					rm11 =    c + y*y * (1-c),
					rm21 =  x*s + z*y * (1-c),
					rm02 =  y*s + x*z * (1-c),
					rm12 = -x*s + y*z * (1-c),
					rm22 =    c + z*z * (1-c);

				return Array(
					rm00 * vec[0] + rm01 * vec[1] + rm02 * vec[2],
					rm10 * vec[0] + rm11 * vec[1] + rm12 * vec[2],
					rm20 * vec[0] + rm21 * vec[1] + rm22 * vec[2]
				);
			}
			document.getElementById("infobox").innerHTML = "";
			let maxPivot_beta = 30;  // 60degree = 100% tilt front/back!
			let maxPivot_gamma = 20; // 40degree = 100% tilt left/right!

			let b = pBg.interactivity.mobile.tilt_beta,
				g = -pBg.interactivity.mobile.tilt_gamma,
				a = pBg.interactivity.mobile.tilt_alpha,
				axis_y = Array(0,1,0),
				axis_x = rotate(Array(1,0,0), axis_y, g),
				axis_z = rotate(rotate(Array(0,0,1), axis_y, g), axis_x, b);

			 let transform =
				"rotate3d(" + axis_z[0] + ", " + axis_z[1] + ", " + axis_z[2] + ", " + a + "deg) " +
				"rotate3d(" + axis_x[0] + ", " + axis_x[1] + ", " + axis_x[2] + ", " + b + "deg) " +
				"rotate3d(" + axis_y[0] + ", " + axis_y[1] + ", " + axis_y[2] + ", " + g + "deg)";


			document.querySelector("div.cuboid_container > .cuboid").style.transform = transform;

			// pBg.interactivity.mobile.tilt_alpha: current tilt counter-/clockwise
			// pBg.interactivity.mobile.tilt_beta: current tilt front/back
			// pBg.interactivity.mobile.tilt_gamma: current tilt left/right
			// pBg.interactivity.mobile.tilt_alpha_initial: initial tilt counter-/clockwise
			// pBg.interactivity.mobile.tilt_beta_initial: initial tilt front/back
			// pBg.interactivity.mobile.tilt_gamma_initial: initial tilt left/right

			//euler-stuff:
			let rad = Math.PI / 180;
			let qCurrent = Quaternion.fromEuler(pBg.interactivity.mobile.tilt_alpha * rad, pBg.interactivity.mobile.tilt_beta * rad, (-pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCf_0 = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta * rad, -pBg.interactivity.mobile.tilt_gamma * rad, 'ZXY');
			//let qCf_1 = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta * rad, -(180+pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCf_2 = Quaternion.fromEuler(0, (90+pBg.interactivity.mobile.tilt_beta) * rad, -(pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCf_3 = Quaternion.fromEuler(0, (90+pBg.interactivity.mobile.tilt_beta) * rad, -(pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCf_4 = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta * rad, -(90+pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCf_5 = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta * rad, -(90+pBg.interactivity.mobile.tilt_gamma) * rad, 'ZXY');
			//let qCurrent = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta * rad, -pBg.interactivity.mobile.tilt_gamma * rad, 'ZXY');
			//let qInit = Quaternion.fromEuler(pBg.interactivity.mobile.tilt_alpha_initial * rad, pBg.interactivity.mobile.tilt_beta_initial * rad, pBg.interactivity.mobile.tilt_gamma_initial * rad, 'ZXY');
			//let qInit = Quaternion.fromEuler(0, pBg.interactivity.mobile.tilt_beta_initial * rad, pBg.interactivity.mobile.tilt_gamma_initial * rad, 'ZXY');

			// let cssArrayCf_0 = qCf_0.conjugate().toMatrix4();
			// cssArrayCf_0[14] = 50;
			// let cssArrayCf_1 = qCf_1.conjugate().toMatrix4();
			// cssArrayCf_1[14] = -50;
			// let cssArrayCf_2 = qCf_2.conjugate().toMatrix4();
			// cssArrayCf_2[13] = 50;
			// let cssArrayCf_3 = qCf_3.conjugate().toMatrix4();
			// cssArrayCf_3[13] = -50;
			// let cssArrayCf_4 = qCf_4.conjugate().toMatrix4();
			// cssArrayCf_4[12] = 50;
			// let cssArrayCf_5 = qCf_5.conjugate().toMatrix4();
			// cssArrayCf_5[12] = -50;

			// Set the CSS style to the element you want to rotate
			//let eulerString = "Current Euler-3D-Matrix(" + qCurrent.conjugate().toMatrix4() + ")";
			//let eulerStringInit = "Initial Euler-3D-Matrix(" + qInit.conjugate().toMatrix4() + ")";
			// document.getElementById("infobox").innerHTML += eulerString+"<br />";
			// document.getElementById("infobox").innerHTML += eulerStringInit+"<br /><br />";

			//document.querySelector("div.cuboid_container > .cuboid").style.transform = "matrix3d(" + qCurrent.conjugate().toMatrix4() + ")";          
			
			// document.querySelector("div.cuboid_container > .cf_0").style.transform = "matrix3d(" + cssArrayCf_0 + ")";           
			// document.querySelector("div.cuboid_container > .cf_0").style.transformOrigin = "center center";          
			// document.querySelector("div.cuboid_container > .cf_1").style.transform = "matrix3d(" + cssArrayCf_1 + ")";           
			// document.querySelector("div.cuboid_container > .cf_1").style.transformOrigin = "center center";          
			// document.querySelector("div.cuboid_container > .cf_2").style.transform = "matrix3d(" + cssArrayCf_2 + ")";           
			// document.querySelector("div.cuboid_container > .cf_3").style.transform = "matrix3d(" + cssArrayCf_3 + ")";           
			// document.querySelector("div.cuboid_container > .cf_4").style.transform = "matrix3d(" + cssArrayCf_4 + ")";           
			// document.querySelector("div.cuboid_container > .cf_5").style.transform = "matrix3d(" + cssArrayCf_5 + ")";           

			// beta_init: value between -180 and 180
			// absolute difference. negative = front, positive = back
			let beta_diff = pBg.interactivity.mobile.tilt_beta - pBg.interactivity.mobile.tilt_beta_initial;
			
			// gamma_init: value between -90 and 90
			// absolute difference. negative = left, positive = right
			let gamma_diff = pBg.interactivity.mobile.tilt_gamma - pBg.interactivity.mobile.tilt_gamma_initial;
			
			let percentage_beta_tilt = (maxPivot_beta + beta_diff) / (maxPivot_beta * 2);
			let percentage_gamma_tilt = (maxPivot_gamma + gamma_diff) / (maxPivot_gamma * 2);

			let perspectiveX = 100 - (pBg.functions.vars.containment/2 + percentage_gamma_tilt*(100 - pBg.functions.vars.containment));
			let perspectiveY = 100 - (pBg.functions.vars.containment/2 +  percentage_beta_tilt*(100 - pBg.functions.vars.containment));

			//debug-infobox
			// document.getElementById("infobox").innerHTML +=
			//  "tilt_beta_initial: "+Math.round(pBg.interactivity.mobile.tilt_beta_initial * 100)/100+
			//  "<br />tilt_beta: "+Math.round(pBg.interactivity.mobile.tilt_beta * 100)/100+
			//  "<br />beta_diff: "+Math.round(beta_diff * 100)/100+
			//  "<br />percentage_beta_tilt: "+Math.round(percentage_beta_tilt * 100)/100+
			//  "<br /><br />tilt_gamma_initial: "+Math.round(pBg.interactivity.mobile.tilt_gamma_initial * 100)/100+
			//  "<br />tilt_gamma: "+Math.round(pBg.interactivity.mobile.tilt_gamma * 100)/100+
			//  "<br />gamma_diff: "+Math.round(gamma_diff * 100)/100+
			//  "<br />percentage_gamma_tilt: "+Math.round(percentage_gamma_tilt * 100)/100+
			//  "<br /><br />perspectiveX: "+Math.round(perspectiveX * 100)/100+
			//  "<br />perspectiveY: "+Math.round(perspectiveY * 100)/100;

			//map the whole thing to the perspective
			let perspectiveOrigin = "50% 50%";
			//if (pBg.canvas.isPortrait) perspectiveOrigin = perspectiveX + "% " + perspectiveY + "%"
			//else perspectiveOrigin = perspectiveY + "% " + perspectiveX + "%";

			document.querySelector("div.cuboid_container > .cuboid").style.perspectiveOrigin = perspectiveOrigin;
		}
		if(cb) cb();
	};

	pBg.functions.init = function(){
		pBg.canvas.isPortrait = (pBg.canvas.width < pBg.canvas.height);
	}
	pBg.functions.draw = function(){
		pBg.functions.perspective(function(){setTimeout(pBg.functions.draw, 10);});
	};

	pBg.functions.start = function(){
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

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function(callback){
			window.setTimeout(callback, 1000 / 60);
		};
})();



//initialize function

window.pBgDom = [];

window.jbParticleBg = function(tag_id, parameters, cb){
	//console.log(parameters);

	pBgDom.push(new pBg(tag_id, parameters));

	if(cb) cb();
};