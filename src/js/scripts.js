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
			jb_DOManimation.stop();

			if (this.allowedNames.includes(hashName)){

				if (hashName !== this.currentActive && this.currentActive !== null &&  this.currentActive != "home"){
					if (hashName == "home") {
						// from section to home 
						document.querySelector("header").classList.remove("top");
						document.querySelector("section."+this.currentActive).classList.add("toHome");
						jb_events.addHomeScrollEvents();
						setTimeout(function(){jb_DOManimation.start();},600);
					} else {
						// from section to section
						document.querySelector("header").classList.add("top");
						document.querySelector("header nav").classList.add(hashName);
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
					document.querySelector("header nav").classList.add(hashName);
					document.querySelector("section."+hashName).classList.add("active", "fromHome");
				} else if (this.currentActive === null && hashName != "home"){
					//first call (init) for not-home
					setTimeout(function() {
						document.querySelector("header nav").classList.add(hashName);
						document.querySelector("header").classList.add("top");
						document.querySelector("section."+hashName).classList.add("active", "fromHome");
					}, 500)
				} else if (this.currentActive === null && hashName == "home"){
					//first call (init) for home
					jb_events.addHomeScrollEvents();
					jb_DOManimation.start();
					setTimeout(function() {
						if (jb_scripts.contentChanger.currentActive == "home"){
							document.querySelector("header > span.enter").classList.add("visible")
						}
					}, 5000);
				}

				//section specific js
				if (hashName == "projects") {
					// rng for projects
					let pElem = document.querySelectorAll(".wrapper section.projects .project .cover");

					pElem.forEach(function(cElem){
						cElem.style.setProperty("--rnd-1",Math.floor(Math.random()*1000) / 1000);
						cElem.style.setProperty("--rnd-2",Math.floor(Math.random()*1000) / 1000);
					});
					jb_scripts.removeRandomBackgrounds();
					jb_scripts.setRandomBackgrounds();
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
				nav = document.querySelector("header nav"),
				classes = ["active","rightToCenter","leftToCenter","centerToRight","centerToLeft","toHome","fromHome","top"];

			document.querySelector("header > span.enter").classList.remove("visible");
			header.classList.remove(...classes);
			nav.classList.remove(...nav.classList);
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

			elem.style.setProperty("--rnd-1","0");
			elem.classList.remove("active");
			elem.classList.add("fromActive");
			elem.style.removeProperty("animation-name");
			setTimeout(function () {
				elem.addEventListener("mouseleave", function oml() {
					elem.classList.remove("fromActive");
					elem.removeEventListener("mouseleave", oml);
				});
			}, 800);

			let details = elem.parentElement.querySelector(".details");
			details.style.removeProperty("max-height");
			details.style.removeProperty("padding");


		} else {

			let cTransform = window.getComputedStyle(elem).transform;
			elem.style.setProperty("transform",cTransform);
			elem.style.setProperty("animation-name","none");
			elem.classList.remove("fromActive");
			
			window.requestAnimationFrame(function(){
				elem.style.setProperty("--rnd-1","0");
				
				elem.classList.add("active");
				window.requestAnimationFrame(function(){ elem.style.removeProperty("transform"); });

				let details = elem.parentElement.querySelector(".details");
				details.style.setProperty("max-height", 10+details.scrollHeight+"px");
				details.style.setProperty("padding", "var(--padding)");
			});

		}
	},

	customPopup(content, maxWidth, link = null, classes = "") {
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
			popupElem.className = classes;
			popupContainer.append(popupElem);
			popupContainer.classList.add("active");

			//add a history entry, in prep for adding "back"-support.
			history.pushState(null,null);
			window.addEventListener("popstate",jb_scripts.closePopup);

			requestAnimationFrame(function(){
				setTimeout(function(){
					popupElem.classList.add("move");

				},10);
			});
			return popupContainer;
		} else {
			//load and display link
			let xhr = new XMLHttpRequest();

			xhr.open('get', link);
			xhr.onload = function() { jb_scripts.customPopup(xhr.response, maxWidth); };
			xhr.send();
		}
	},

	closePopup() {
		document.querySelector(".popup_container.active").classList.remove("active");
		window.removeEventListener("popstate",jb_scripts.closePopup);
	},

	touchRemover: {
		init() {

		},
		tester() {
			let elem = document.createElement("div");
			elem.classList.add("touchinfo");
			document.body.append(elem);
			console.log("aEL");
			window.addEventListener("touch", this.touchHandler);

		},
		touchHandler(e){
			console.log(e);
		},
		unsetTouch() {

		}
	},

	setRandomBackgrounds(){
		let classesBg = ["bg1","bg2","bg3","bg4","bg5"],
			elems = document.querySelectorAll(".wrapper section.projects .project"),
			prevNumber1 = -1,
			prevNumber2 = -1;

		for(let i = 0; i < elems.length; i++){
			let rNumber = Math.floor(Math.random() * classesBg.length),
				evilNumber1 = prevNumber1,
				evilNumber2 = prevNumber2;
			while (rNumber == evilNumber1 || rNumber == evilNumber2 ) rNumber = Math.floor(Math.random() * classesBg.length);
			
			elems[i].classList.add(classesBg[rNumber]);
			prevNumber2 = prevNumber1;
			prevNumber1 = rNumber;
		}
	},


	removeRandomBackgrounds(){
		let classesBg = ["bg1","bg2","bg3","bg4","bg5"],
			elems = document.querySelectorAll(".wrapper section.projects .project");

		elems.forEach(function(cElem){
			cElem.classList.remove(...classesBg);
		});
	},

	colorLogo(toColor = true) {
		let elem = document.getElementById("id_logo_wrapper");
		if (toColor) elem.classList.add("animate_in");
		else elem.classList.remove("animate_in");
	},

	triggerContactTileAnimation(){
		let elem = document.getElementById("id_contact_tiles");
		elem.scrollIntoView({behavior: "smooth"});
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

	addProject(shortName, link, longName, subtitle, paragraph1, paragraph2, placeAndDate){
		let parent = document.querySelector("section.projects"),
			pElem = document.createElement("div"),
			innerHTML = `
<div class="cover" onclick="jb_scripts.projectCoverAnimation(this);">
	<div class="logo">
		<picture>
			<source srcset="files/projects/${shortName}/logo_${shortName}_small.png, files/projects/${shortName}/logo_${shortName}_medium.png 1.5x" media="(max-width: 900px)">
			<source srcset="files/projects/${shortName}/logo_${shortName}_medium.png, files/projects/${shortName}/logo_${shortName}_large.png 1.5x" media="(min-width: 900px)">
			<img src="files/projects/${shortName}/logo_${shortName}_medium.png" alt="logo project ${longName}" />
		</picture>
	</div>
	<div class="title">
		<h1>${longName}</h1>
		<h2>${subtitle}</h2>
	</div>
</div>
<div class="details">
	<div class="description">
		<p>${paragraph1}</p>
		<p>${paragraph2}</p>
		<h4>${placeAndDate}</h4>
	</div>
	<span class="btn" onclick="jb_scripts.customPopup(jb_scripts.projectPopupHtml('${shortName}','${longName}','${link}'), '1400px', null, this.parentElement.parentElement.className );">preview</span>
</div>`;
			pElem.classList.add("project");
			pElem.innerHTML = innerHTML;

			parent.append(pElem);
			return;
	},

	projectPopupHtml(shortName, longName, link){


		let pcHtml = `
<picture>
	<source srcset="files/projects/${shortName}/pc_${shortName}_medium.png, files/projects/${shortName}/pc_${shortName}_large.png 1.5x">
	<img onload="this.parentElement.parentElement.parentElement.classList.add('loaded');" src="files/projects/${shortName}/pc_${shortName}_medium.png" alt="Project ${longName}, PC view" />
</picture>`;
		let phoneHtml = `
<picture>
	<source srcset="files/projects/${shortName}/phone_${shortName}_small.png, files/projects/${shortName}/phone_${shortName}_medium.png 1.5x">
	<img onload="this.parentElement.parentElement.parentElement.classList.add('loaded');" src="files/projects/${shortName}/phone_${shortName}_small.png" alt="Project ${longName}, smartphone view" />
</picture>`;
		
		if (link == "") {
			link = "No live version available";
		} else {
			pcHtml = '<a href="' + link + '" target="_blank">'+pcHtml+'</a>';
			phoneHtml = '<a href="' + link + '" target="_blank">'+phoneHtml+'</a>';
			
			link = '<a class="pagelink" href="' + link + '" target="_blank">Visit the page</a>';
		}


		let retHtml = "";
		
		if (window.innerWidth < 900){
			retHtml = '<div class="pictures image_phone">' + phoneHtml;
		} else {
			retHtml = '<div class="pictures image_pc">' + pcHtml;
		}

		retHtml += '<span class="loader"></span><p>' + link + ' - <a>close</a></p></div>';

		return retHtml;
	}
}