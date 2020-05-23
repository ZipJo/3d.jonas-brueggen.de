const jb_scripts = {
	
	contentChanger: {
		currentActive: null,
		allowedNames: ["home","projects","about","x404"],

		init() {
			window.onhashchange = function(){ jb_scripts.contentChanger.changeContent(); }; 
			this.changeContent();
		},

		changeContent( name = window.location.hash ) {
			let hashName = name == "" ? "home" : name.substr(2);

			this.clearClasses();
			jb_events.destroyHomeScrollEvents();

			if (this.allowedNames.includes(hashName)){

				if (hashName !== this.currentActive && this.currentActive !== null &&  this.currentActive != "home"){
					if (hashName == "home") {
						// from section to home 
						document.querySelector("header").classList.remove("top");
						document.querySelector("section."+this.currentActive).classList.add("toHome");
						jb_events.addHomeScrollEvents();
					} else {
						// from section to section
						document.querySelector("header").classList.add("top");
						if (this.allowedNames.indexOf(this.currentActive) < this.allowedNames.indexOf(hashName)){
							document.querySelector("section."+hashName).classList.add("active", "rightToCenter");
							document.querySelector("section."+this.currentActive).classList.add("centerToLeft");
						} else {
							document.querySelector("section."+hashName).classList.add("active", "leftToCenter");
							document.querySelector("section."+this.currentActive).classList.add("centerToRight");						
						}
					}
				} else if (this.currentActive == "home" && hashName != "home"){
					// from home to section
					document.querySelector("header").classList.add("top");
					document.querySelector("section."+hashName).classList.add("active", "fromHome");
				} else if (this.currentActive === null && hashName != "home"){
					//first call (init) for not-home
					setTimeout(function() {
						document.querySelector("header").classList.add("top");
						document.querySelector("section."+hashName).classList.add("active", "fromHome");
					}, 200)
				} else if (this.currentActive === null && hashName == "home"){
					//first call (init) forhome
					jb_events.addHomeScrollEvents();
					setTimeout(function() {
						if (jb_scripts.contentChanger.currentActive == "home"){
							document.querySelector("header > span.enter").classList.add("visible")
						}
					}, 5000);
				}

				//section specific js
				if (hashName == "projects") {
					// rng for projects
					let pElem = document.querySelectorAll(".wrapper section.projects .project .cover"),
						bgs = ["bg1","bg2","bg3","bg4","bg5"];

					pElem.forEach(function(cElem){
						cElem.style.setProperty("--rnd-1",Math.random());
						cElem.style.setProperty("--rnd-2",Math.random());
						cElem.classList.remove(...bgs);
					});
					jb_scripts.setRandomBackgrounds(".wrapper section.projects .project .cover");
				} 

			} else {
				//unknown hash!
				this.changeContent("#/x404");
				return;
			}
			
			this.currentActive = hashName;
		},

		clearClasses() {
			let sections = document.querySelectorAll("section"),
				header = document.querySelector("header"),
				classes = ["active","rightToCenter","leftToCenter","centerToRight","centerToLeft","toHome","fromHome","top"];

			document.querySelector("header > span.enter").classList.remove("visible");
			header.classList.remove(...classes);
			sections.forEach(function(section) {
				section.classList.remove(...classes);
			});
		},

		toggleHash(hash = window.location.hash) {
			if (hash == "" || hash == "#/home") window.location.hash = "#/projects";
			else window.location.hash = "";
		}

	},

	projectCoverAnimation(elem){

		if (elem.classList.contains("active")) {

			elem.classList.remove("active");
			elem.classList.add("fromActive");
			elem.style.removeProperty("animation-name");
			setTimeout(function () {
				elem.classList.remove("fromActive");
			}, 800);

			let details = elem.parentElement.querySelector(".details");
			details.style.removeProperty("max-height");
			details.style.removeProperty("padding");


		} else {

			let cTransform = window.getComputedStyle(elem).transform;
			elem.style.setProperty("transform",cTransform);
			elem.style.setProperty("animation-name","none");
			window.requestAnimationFrame(function(){
				elem.classList.add("active");
				elem.style.removeProperty("transform");
				elem.style.setProperty("--rnd-1","0s");

				let details = elem.parentElement.querySelector(".details");
				details.style.setProperty("max-height", details.scrollHeight+"px");
				details.style.setProperty("padding", "var(--padding)");
			});

		}
	},

	customPopup(content, maxWidth, link = null) {
		if (link == null){
			//use "content"
			popupContainer = document.querySelector(".popup_container");
			//cleanup
			while (popupContainer.firstChild) {
				popupContainer.removeChild(popupContainer.firstChild);
			}
			let popupElem = document.createElement("div");
			popupElem.innerHTML = content;
			popupElem.style.maxWidth=maxWidth;
			popupContainer.appendChild(popupElem);
			popupContainer.classList.add("active");
			requestAnimationFrame(function(){
				setTimeout(function(){popupElem.classList.add("move");},10);
			});
		} else {
			//load and display link
			let xhr = new XMLHttpRequest();

			xhr.open('get', link);
			xhr.onload = function() { jb_scripts.customPopup(xhr.response, maxWidth); };
			xhr.send();
		}
	},

	removeElementsByClass(className){
		let elements = document.getElementsByClassName(className);
		while(elements.length > 0){
			elements[0].parentNode.removeChild(elements[0]);
		}
	},

	setRandomBackgrounds(qsa){
		let classesBg = ["bg1","bg2","bg3","bg4","bg5"],
			//classesBorder = ["border1","border2","border3","border4","border5"],
			elems = document.querySelectorAll(qsa),
			prevNumber1 = -1,
			prevNumber2 = -1;
			//modNumbers1 = [-1,-1],
			//modNumbers2 = [-1,-1,-1,-1];

		for(let i = 0; i < elems.length; i++){
			let rNumber = Math.floor(Math.random() * classesBg.length),
				evilNumber1 = prevNumber1,
				evilNumber2 = prevNumber2;
				//evilNumber3 = modNumbers2[i%4];
			//while (rNumber == evilNumber1 || rNumber == evilNumber2 || rNumber == evilNumber3) rNumber = Math.floor(Math.random() * classesBg.length);
			while (rNumber == evilNumber1 || rNumber == evilNumber2 ) rNumber = Math.floor(Math.random() * classesBg.length);
			
			elems[i].classList.add(classesBg[rNumber]);
			prevNumber2 = prevNumber1;
			prevNumber1 = rNumber;
			//modNumbers1[i%2] = rNumber;
			//modNumbers2[i%4] = rNumber;
		}
	},

	colorLogo(toColor = true) {
		let elem = document.getElementById("id_logo_wrapper");
		if (toColor) elem.classList.add("animate_in");
		else elem.classList.remove("animate_in");
	},

	triggerContactTileAnimation(){
		let elem = document.getElementById("id_contact_tiles");
		elem.classList.add("start_animation");
		requestAnimationFrame(function(){
			setTimeout(function(){
				elem.classList.remove("start_animation");
			},1100);
		});
	},

	objDeepExtend(destination, source) {
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
	},
}