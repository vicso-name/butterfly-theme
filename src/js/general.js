window.addEventListener("DOMContentLoaded", () => {

    // Heder contact
    document.querySelectorAll('.menu-toggle').forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const parent = this.parentNode; 
            parent.classList.toggle('activ'); 
    
            const navigationBox = parent.querySelector('.navigation-box'); 
            if (navigationBox) {
                if (navigationBox.style.display === 'block') {
                    navigationBox.style.display = 'none'; 
                } else {
                    navigationBox.style.display = 'block'; 
                }
            }
        });
    });
	
	/** SCROLL TO SECTION **/
	document.querySelectorAll('a[href^="#"]').forEach(link => {
		const btnId = link.getAttribute('href').slice(1); 
	  
		link.addEventListener("click", function(e) {
		  e.preventDefault();
	  
		  const targetSection = document.getElementById(btnId);
		  if (targetSection) {
			targetSection.scrollIntoView({ behavior: "smooth" });
		  }
		});
	  });


	/** Image to SVG **/
	document.querySelectorAll("img.svg").forEach(function (img) {
		var imgID = img.id;
		var imgClass = img.className;
		var imgURL = img.src;
	
		fetch(imgURL)
			.then(function (response) {
				return response.text();
			})
			.then(function (data) {

				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(data, "image/svg+xml");
				var svg = xmlDoc.querySelector("svg");
	
				if (!svg) {
					console.error("SVG not found in the file:", imgURL);
					return;
				}

				if (imgID) {
					svg.setAttribute("id", imgID);
				}
	
				if (imgClass) {
					svg.setAttribute("class", imgClass + " replaced-svg");
				}
	
				svg.removeAttribute("xmlns:a");
	
				if (!svg.hasAttribute("viewBox") && svg.hasAttribute("height") && svg.hasAttribute("width")) {
					svg.setAttribute(
						"viewBox",
						"0 0 " + svg.getAttribute("width") + " " + svg.getAttribute("height")
					);
				}
				img.replaceWith(svg);
			})
			.catch(function (error) {
				console.error("Error fetching SVG:", error);
			});
	});

    // Animation scroll
    function onEntry(entry) {
        entry.forEach(change => {
        if (change.isIntersecting) {
            change.target.classList.add('aos-animate');
        }
        });
    }
    let options = { threshold: [0.25] };
    let observer = new IntersectionObserver(onEntry, options);
    let elements = document.querySelectorAll('[data-aos="fade-up"]');
    for (let elm of elements) {
        observer.observe(elm);
    }


});
