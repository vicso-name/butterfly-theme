/**
 * ===========================================================
 * General Frontend Interactions
 * ===========================================================
 * Organized into small, readable functions
 * - Header toggle
 * - Smooth scroll
 * - Replace <img.svg> with inline <svg>
 * - AOS-style fade-up animations
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderToggle();
  initSmoothScroll();
  replaceImagesWithInlineSVGs();
});

/* ===========================================================
 * 1. Header Contact Toggle
 * =========================================================== */
function initHeaderToggle() {
  const toggles = document.querySelectorAll(".menu-toggle");

  if (!toggles.length) return;

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const parent = toggle.parentNode;
      parent.classList.toggle("activ");

      const navigationBox = parent.querySelector(".navigation-box");
      if (navigationBox) {
        const isVisible = navigationBox.style.display === "block";
        navigationBox.style.display = isVisible ? "none" : "block";
      }
    });
  });
}

/* ===========================================================
 * 2. Smooth Scroll to Section
 * =========================================================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").slice(1);
      const targetEl = document.getElementById(targetId);

      if (!targetEl) return;
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ===========================================================
 * 3. Convert <img class="svg"> → inline <svg>
 * =========================================================== */
function replaceImagesWithInlineSVGs() {
  const svgImages = document.querySelectorAll("img.svg");
  if (!svgImages.length) return;

  svgImages.forEach((img) => {
    const imgURL = img.src;

    fetch(imgURL)
      .then((res) => res.text())
      .then((data) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "image/svg+xml");
        const svg = xmlDoc.querySelector("svg");

        if (!svg) {
          console.error("SVG not found in:", imgURL);
          return;
        }

        // Copy ID and class
        if (img.id) svg.id = img.id;
        if (img.className) svg.classList.add(...img.classList, "replaced-svg");

        // Remove unnecessary attributes
        svg.removeAttribute("xmlns:a");

        // Add viewBox if missing
        if (
          !svg.hasAttribute("viewBox") &&
          svg.hasAttribute("height") &&
          svg.hasAttribute("width")
        ) {
          svg.setAttribute(
            "viewBox",
            `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`
          );
        }

        img.replaceWith(svg);
      })
      .catch((err) => console.error("Error fetching SVG:", err));
  });
}
