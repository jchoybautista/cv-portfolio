// --- 1. Rotating Text Effect (Hero Section) ---
document.addEventListener("DOMContentLoaded", function () {
  const roles = ["UI/UX Designer", "Front-End Developer"];
  const textElement = document.getElementById("rotating-text");
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentRole = roles[roleIndex];
    const display = isDeleting
      ? currentRole.substring(0, charIndex - 1)
      : currentRole.substring(0, charIndex + 1);

    textElement.textContent = display;

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(type, 2500); // Pause before deleting
      return;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, 100); // Pause before typing next role
      return;
    }

    charIndex += isDeleting ? -1 : 1;
    const typingSpeed = isDeleting ? 15 : 25;
    setTimeout(type, typingSpeed);
  }

  type();
});

// --- 2. Scroll Reveal Animation (Intersection Observer) ---
document.addEventListener("DOMContentLoaded", function () {
  const revealElements = document.querySelectorAll(".reveal");

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((element) => {
    if (!element.classList.contains("active")) {
      observer.observe(element);
    }
  });
});

// --- 3. Resume Tab Functionality ---
document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".resume-tab-btn");
  const contentContainer = document.getElementById("resume-content-container");

  // Find the initially active content and set its display to block
  const initialActiveContent = contentContainer.querySelector(
    ".resume-tab-content.active"
  );
  if (initialActiveContent) {
    initialActiveContent.style.display = "block";
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetTabId = this.getAttribute("data-tab");

      // 1. Remove 'active' from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // 2. Add 'active' to the clicked button
      this.classList.add("active");

      // 3. Hide all content with a fade effect
      const allContents = contentContainer.querySelectorAll(
        ".resume-tab-content"
      );
      allContents.forEach((content) => {
        content.classList.remove("active"); // Remove active for opacity transition
        setTimeout(() => (content.style.display = "none"), 400); // Wait for fade out (400ms defined in CSS transition)
      });

      // 4. Show the target content with a fade in effect
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        setTimeout(() => {
          targetContent.style.display = "block";
          // Trigger reflow/repaint to ensure transition works
          targetContent.offsetWidth;
          targetContent.classList.add("active");
        }, 400);
      }
    });
  });
});
