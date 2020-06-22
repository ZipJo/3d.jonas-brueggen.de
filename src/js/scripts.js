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

						//add special rules between about and projects
						if (this.currentActive == "projects" && hashName == "about") {
							document.querySelector("section.projects").classList.add("active");
							setTimeout(function(){
								document.querySelector("section.projects").classList.remove("active");
								document.querySelector("section.about").classList.add("active");

								document.querySelector("section.about").classList.add("projectsToAbout");
								document.querySelector("section.projects").classList.add("projectsToAbout");
							},250); //start the css-animation _after_ projectCoverAnimation is done

						} else if (this.currentActive == "about" && hashName == "projects") {
							document.querySelector("section.projects").classList.add("active");

							document.querySelector("section.about").classList.add("aboutToProjects");
							document.querySelector("section.projects").classList.add("aboutToProjects");


						} else {
							//fallback for the default:
							document.querySelector("section."+hashName).classList.add("active");

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
							document.querySelector("header > span.enter").classList.add("visible");
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
				classes = ["active","projectsToAbout","aboutToProjects","toHome","fromHome","top"],
				projects = document.querySelectorAll("section.projects .project .cover.active");

			document.querySelector("header > span.enter").classList.remove("visible");
			header.classList.remove(...classes);
			nav.classList.remove(...nav.classList);
			sections.forEach(function(section) {
				section.classList.remove(...classes);
			});
			projects.forEach(function(proj) {
				jb_scripts.projectCoverAnimation(proj);
			});
		},

		toggleHash(hash = window.location.hash) {
			if (hash == "" || hash == "#/home") window.location.hash = "#/projects";
			else window.location.hash = "";
		}

	},

	coverMouseLeaveFromActive(){
		this.classList.remove("fromActive");
		this.removeEventListener("mouseleave", jb_scripts.coverMouseLeaveFromActive);
	},

	projectCoverAnimation(elem){
		if (elem.classList.contains("active")) {
			elem.style.setProperty("--rnd-1","0");
			elem.classList.remove("active");
			elem.classList.add("fromActive");

			elem.style.animation = "";
			elem.style.webkitAnimation = "";
			elem.style.transform = "";
			//add mouseLeave event on desktop
			if (!jb_events.vars.isMobile) {
				setTimeout(function () { elem.addEventListener("mouseleave", jb_scripts.coverMouseLeaveFromActive); }, 600);
			}
			let details = elem.parentElement.querySelector(".details");
			details.style.maxHeight = "";
			details.style.padding = "";
		} else {
			elem.classList.remove("fromActive");

			let cMatrix = new WebKitCSSMatrix(window.getComputedStyle(elem).transform);
			let cTranslateX = Math.round(cMatrix.m41 * 10000) / 10000;

			//create a custom animation that transitions from the current state to "0"
			let customCoverAnimation = [
				{ transform: "translateX("+cTranslateX+"px)" },
				{ transform: "translateX(0px)" }
			];

			let customTiming = {
			duration: 400,
			easing: "cubic-bezier(.4,0,.35,1.35)"
			}

			elem.animate(customCoverAnimation, customTiming);
			
			requestAnimationFrame( function(){
				elem.style.animation = "none";
				elem.style.webkitAnimation = "none";
				elem.style.setProperty("--rnd-1","0");
				elem.style.transform = "translateX("+cTranslateX+"px)";				
				elem.classList.add("active");
				
				requestAnimationFrame( function(){
					elem.style.transform = "translateX(0px)";
					setTimeout( function(){elem.style.animation = "none";},200);

				});

				let details = elem.parentElement.querySelector(".details");
				details.style.maxHeight = 10+details.scrollHeight+"px";
				details.style.padding = "var(--padding)";
				let scrollOffset = 2 * parseInt(getComputedStyle(details).getPropertyValue('--padding'),10) + jb_scripts.fullOffsetTop(details) + details.scrollHeight - window.innerHeight;
				if ( window.pageYOffset < scrollOffset ){
					setTimeout(function(){
						window.scrollTo({behavior: 'smooth', top: scrollOffset});
					},200); //because the css-animation starts 150ms delayed
				}

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

	touchRemover(el) {
		//removes an element and immideately adds it back to remove the sticky-hover on mobile devices
		//should be called ontouchend on all links
		let par = el.parentNode;
		let next = el.nextSibling;
		setTimeout(function(){
			par.removeChild(el);
			par.insertBefore(el, next);
		},500);
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
		elem.scrollIntoView({behavior: "smooth",block:"nearest"});
		elem.classList.add("start_animation");
		requestAnimationFrame(function(){
			setTimeout(function(){
				elem.classList.remove("start_animation");
			},1100);
		});
	},

	fullOffsetTop(elem) {
		let total = 0;
		if (elem.offsetParent) {
			total += this.fullOffsetTop(elem.offsetParent);
		}
		total += elem.offsetTop;
		return total;
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
			pcHtml = '<span>'+pcHtml+'</span>';
			phoneHtml = '<span>'+phoneHtml+'</span>';
		} else {
			pcHtml = '<a href="' + link + '" target="_blank">'+pcHtml+'</a>';
			phoneHtml = '<a href="' + link + '" target="_blank">'+phoneHtml+'</a>';
			
			link = '<a class="pagelink" href="' + link + '" target="_blank" ontouchend="jb_scripts.touchRemover(this);">Visit the page</a>';
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