const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const comparison = document.querySelector("[data-comparison]");
const comparisonRange = document.querySelector("[data-comparison-range]");
const routeTrigger = document.querySelector("[data-route-trigger]");
const routeModal = document.querySelector("[data-route-modal]");
const routeDialog = document.querySelector("[data-route-dialog]");
const routeCloseControls = document.querySelectorAll("[data-route-close]");
const routeLinks = document.querySelectorAll("[data-route-link]");
const revealItems = document.querySelectorAll(
  ".service-card, .review-card, .image-panel, .content-panel, .team-content, .team-photo, .work-comparison, .contact-card"
);

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

if (header) {
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

if (comparison && comparisonRange) {
  const syncComparison = () => {
    comparison.style.setProperty("--position", `${comparisonRange.value}%`);
  };

  syncComparison();
  comparisonRange.addEventListener("input", syncComparison);
}

if (routeTrigger && routeModal && routeDialog) {
  const closeRouteModal = () => {
    routeModal.hidden = true;
    routeTrigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("route-modal-open");
    routeTrigger.focus();
  };

  const openRouteModal = () => {
    routeModal.hidden = false;
    routeTrigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("route-modal-open");
    window.requestAnimationFrame(() => routeDialog.focus());
  };

  routeTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    openRouteModal();
  });

  routeCloseControls.forEach((control) => {
    control.addEventListener("click", closeRouteModal);
  });

  routeLinks.forEach((link) => {
    link.addEventListener("click", closeRouteModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !routeModal.hidden) {
      closeRouteModal();
    }
  });
}

if (revealItems.length && "IntersectionObserver" in window) {
  document.body.classList.add("reveal-ready");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
