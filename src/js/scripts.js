let cc = {

	currentActive: null,

	init(){
		window.onhashchange = function(){ cc.changeContent(); }; 
		
		let name = window.location.hash,
			hashName = name == "" ? "#/home" : name,
			target;
		
		if (hashName =="#/home" ) target = document.querySelector("header");
		else target = document.querySelector("section." + hashName.substr(2));
		
		target.classList.add("active");
		this.currentActive = name;
	},

	changeContent(name = window.location.hash){

		if (name !== this.currentActive){
			let hashName = name == "" ? "#/home" : name,
				current = document.querySelector(".active"), 
				target;

			if (hashName =="#/home" ) target = document.querySelector("header");
			else target = document.querySelector("section." + hashName.substr(2));

			current.classList.remove("active");
			target.classList.add("active");

			current.classList.add("animated")
			target.classList.add("animated");

			this.currentActive = name;
		}
	},

}

function customPopup(content, maxWidth, link = null) {
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
		xhr.onload = function() { customPopup(xhr.response, maxWidth); };
		xhr.send();
	}
}

function removeElementsByClass(className){
	let elements = document.getElementsByClassName(className);
	while(elements.length > 0){
		elements[0].parentNode.removeChild(elements[0]);
	}
}

function setRandomBackgrounds(className){
	let classesBg = ["bg1","bg2","bg3","bg4","bg5"];
	let classesBorder = ["border1","border2","border3","border4","border5"];
	let elems = document.getElementsByClassName(className);
	let prevNumber = -1;
	let modNumbers1 = [-1,-1];
	let modNumbers2 = [-1,-1,-1,-1];

	for(let i = 0; i < elems.length; i++){
		let rNumber = Math.floor(Math.random() * classesBg.length);
		let evilNumber1 = prevNumber;
		let evilNumber2 = modNumbers1[i%2];
		let evilNumber3 = modNumbers2[i%4];
		while (rNumber == evilNumber1 || rNumber == evilNumber2 || rNumber == evilNumber3) rNumber = Math.floor(Math.random() * classesBg.length);
		
		elems[i].classList.add(classesBg[rNumber], classesBorder[rNumber]);

		prevNumber = rNumber;
		modNumbers1[i%2] = rNumber;
		modNumbers2[i%4] = rNumber;
	}
}

function colorLogo(toColor = true) {
	let elem = document.getElementById("id_logo_wrapper");
	if (toColor) elem.classList.add("animate_in");
	else elem.classList.remove("animate_in");
}

function triggerContactTileAnimation(){
	let elem = document.getElementById("id_contact_tiles");
	elem.classList.add("start_animation");
	requestAnimationFrame(function(){
		setTimeout(function(){
			elem.classList.remove("start_animation");
		},1100);
	});
}

function overflowIsHidden(node) {
  var style = getComputedStyle(node);
  return style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';
}

function findNearestScrollableParent(firstNode) {
  var node = firstNode;
  var scrollable = null;
  while(!scrollable && node) {
    if (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight) {
      if (!overflowIsHidden(node)) {
        scrollable = node;
      }
    }
    node = node.parentNode;
  }
  return scrollable;
}

document.addEventListener('DOMContentLoaded', function() {

    document.body.addEventListener('touchmove', function(event) {
      var owner = findNearestScrollableParent(event.target);
      if (!owner || owner === document.documentElement || owner === document.body) {
        event.preventDefault();
      }
    });

}, false);