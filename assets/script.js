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
      setTimeout(type, 1200); // Pause before deleting
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
    ".resume-tab-content.active",
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
        ".resume-tab-content",
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

// --- 4. Load More Projects Logic ---
document.addEventListener("DOMContentLoaded", function () {
  const projects = document.querySelectorAll(".portfolio-item");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const itemsPerLoad = 6;
  let visibleCount = 6;

  // Initially hide projects beyond the first 6
  projects.forEach((project, index) => {
    if (index >= visibleCount) {
      project.classList.add("hidden");
    }
  });

  // Hide button if total projects <= itemsPerLoad
  if (projects.length <= itemsPerLoad) {
    loadMoreBtn.style.display = "none";
  }

  loadMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const hiddenProjects = document.querySelectorAll(".portfolio-item.hidden");

    for (let i = 0; i < itemsPerLoad; i++) {
      if (hiddenProjects[i]) {
        hiddenProjects[i].classList.remove("hidden");
      }
    }

    const remainingHidden = document.querySelectorAll(".portfolio-item.hidden");
    if (remainingHidden.length === 0) {
      loadMoreBtn.style.display = "none";
    }
  });
});

// --- 5. Portfolio Modal Logic (New Feature) ---
document.addEventListener("DOMContentLoaded", function () {
  // DATA: Details for the first 2 items
  const portfolioData = {
    1: {
      title: "NBL Basketball Website Redesign Concept",
      desc: "A conceptual design project created entirely in Figma. I focused on improving the visual appeal and content organization of the National Basketball League website for a more engaging fan experience.",

      created: "2025",
      role: "Designer",
      image: "assets/img/project-1.png",
      // LINKS: Empty string means hide button
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=14-2&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    2: {
      title: "Playtech E-Commerce Website and Mobile App Concept",
      desc: "Personal UI/UX design project created entirely in Figma. This concept reimagines the online shopping experience for gaming electronics, focusing on intuitive product discovery, clear specification displays, and an optimized checkout process across both website and mobile app interfaces.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-3.png",
      // LINKS: Testing conditional hiding (Only Figma visible)
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=1-893&t=q81CPdX7Ki9ehocw-1",
      xdLink: "", // Hidden
      websiteLink: "", // Hidden
    },
    3: {
      title: "Codecrafted CV Website Concept",
      desc: "A personal UI/UX design project created entirely in Figma. This concept focuses on crafting a unique, highly organized, and aesthetically professional online CV to present experience, education, and projects with clarity and impact.",
      created: "2025",
      role: "App Designer",
      image: "assets/img/project-4.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=1-142&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    4: {
      title: "Gamestop E-Commerce Website Concept",
      desc: "A personal UI/UX design concept created in Figma. This project focused on modernizing the GameStop digital storefront for video games. The core deliverable showcases comprehensive responsive layout design, demonstrating how the e-commerce experience is optimized for every screen size while enhancing product visibility and checkout flow.",
      created: "2025",
      role: "App Designer",
      image: "assets/img/project-5.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=0-1&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    5: {
      title: "Content House Web App",
      desc: "As the Senior UI/UX Designer at Content House Inc. from July 2020 to December 2025, I was responsible for the end-to-end design of the company's proprietary, in-house web applications. Content House specializes in high-end real estate marketing services (such as photography, video, drone, floor plans, copywriting, etc.), and my designs were critical in providing real estate agents—our direct users—with the intuitive tools they needed to efficiently manage and showcase properties, securing a distinct edge in their sales efforts. My design process was highly structured and collaborative: I began by conducting thorough user and market research, as well as looking into our key competitors, maintained constant communication with our CEO, Product Manager, and the development team, and utilized Figma to execute every stage, moving systematically from initial wireframes through high-fidelity mockups, and creating detailed prototypes for comprehensive usability testing.",
      created: "2020-2025",
      role: "Designer",
      image: "assets/img/project-23.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/d8mVV2q97RtrVJSPWg66j8/Content-House-Web?node-id=10-40239&t=pYixpo1NXFlICUOt-1",
      xdLink: "",
      websiteLink: "",
    },
    6: {
      title: "Content House Mobile App",
      desc: "As the Senior UI/UX Designer at Content House Inc. from July 2020 to December 2025, I was responsible for the end-to-end design of the company's proprietary, in-house mobile application. This app was conceptualized and created simultaneously with the web application, ensuring a consistent cross-platform user experience for our agents. Content House specializes in high-end real estate marketing services (such as photography, video, drone, floor plans, copywriting, etc.), and my designs were critical in providing real estate agents—our direct users—with the intuitive tools they needed to manage assets on the go and efficiently showcase properties, securing a distinct edge in their sales efforts. My design process was highly structured and collaborative: I began by conducting thorough user and market research, as well as looking into our key competitors, maintained constant communication with the CEO, Product Manager, and the development team, and utilized Figma to execute every stage, moving systematically from initial wireframes through high-fidelity mockups, and creating detailed prototypes for comprehensive usability testing.",
      created: "2020-2025",
      role: "Designer",
      image: "assets/img/project-22.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/p2IiGez2N7lAKeNA7bdbr8/Content-House-Mobile-App?node-id=1-69106&t=TkHSp5qjfGxgS5HC-1",
      xdLink: "",
      websiteLink: "",
    },
    7: {
      title: "Content House Inc. Marketing Website",
      desc: "This project involved the full redesign and deployment of the main marketing website for Content House, replacing the initial version I created in 2020. The 2024 redesign focused on visually elevating the company's brand and clearly communicating the full suite of high-end real estate marketing services offered (photography, video, drone, floor plans, copywriting, etc.). The design process started with user research and moved through wireframing to high-fidelity mockups created in Figma. I then finalized the UX with detailed prototypes for usability testing. Critically, I then translated the final design into an actual, mobile-web responsive website using Squarespace. This implementation required advanced technical skills, utilizing custom HTML, CSS, and JavaScript to extend Squarespace's core capabilities. Furthermore, in 2025, I was responsible for subsequent content and feature updates, making direct code and content modifications within the Squarespace platform to maintain the site's functionality and relevance.",
      created: "2024-2025",
      role: "Designer and Developer",
      image: "assets/img/project-6.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/7dfXILsjej7ZVP2LkhUP9h/Marketing-Website?node-id=0-1&t=GGwW7AbNOWGooq9b-1",
      xdLink: "",
      websiteLink: "",
    },
    8: {
      title: "Agents Space Artwork Editor",
      desc: "This project involved the UI/UX design of a complex, feature-rich artwork editor integrated within the Agent's Space web application for real estate agents. The editor's core is powered by Chili Publish, enabling users to customize and generate high-quality marketing collateral (flyers, brochures, signs, etc.) using pre-approved, brand-compliant templates. Executed entirely in Figma, my design process was structured to ensure user-centricity and usability for a technical tool. I began with user research, followed by defining the architecture through wireframing. I then created detailed high-fidelity mockups and built prototypes for comprehensive usability testing, ultimately delivering an intuitive, professional editing environment that simplifies asset customization and ensures a quick, error-free workflow for property marketing material production.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-7.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/6674NGZUI86pZ5h0nALOSK/Agents-Space-Web?node-id=15-186&t=BfNky61zPcENvgJA-1",
      xdLink: "",
      websiteLink: "",
    },
    9: {
      title: "Agents Space Web App",
      desc: "Agent's Space is the primary, proprietary web application developed for Content House clients, serving as an all-in-one operational hub for real estate agents. The platform’s complexity stems from its wide range of interconnected, critical features, including: property detail creation, quote generation, artwork customization, product/supplier management, category reconciliation, and property sharing tools. Executed entirely in Figma, the core design challenge was creating a highly structured, scalable, and secure interface that supports multi-level user roles. I designed a sophisticated access management system where available features dynamically change based on the user's role (user, admin, or group member). My design process was rigorous and user-centric: I began with thorough user and market research, as well as looking into our key competitors, to map out complex agent workflows. I defined the entire information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure efficiency and ease-of-use across all user types.",
      created: "2023-2025",
      role: "Designer",
      image: "assets/img/project-8.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/6674NGZUI86pZ5h0nALOSK/Agents-Space-Web?node-id=1-34205&t=BfNky61zPcENvgJA-1",
      xdLink: "",
      websiteLink: "",
    },
    10: {
      title: "Agents Space Mobile App",
      desc: "The Agent's Space Mobile Application was designed simultaneously with the web application to provide Content House clients with critical, on-the-go access to their operational hub. The platform supports a wide array of interconnected, complex features, including property detail creation, quote generation, artwork review, product management, property sharing, and data reconciliation. Executed entirely in Figma, the core design challenge was adapting this high-complexity toolset to the constraints of a mobile interface while maintaining user security. I designed a sophisticated role-based access management system where features dynamically adjust based on the user's role (user, admin, or group member). My design process was rigorous and user-centric, starting with user research to map out complex agent workflows. I defined the mobile information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure a highly efficient, seamless, and secure experience for agents in the field.",
      created: "2023-2025",
      role: "Designer",
      image: "assets/img/project-9.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/2dw24WW2YdNzGkje7rNbQh/Agents-Space-Mobile?node-id=1-13749&t=OQp39AaaDTkfl31s-1",
      xdLink: "",
      websiteLink: "",
    },
    11: {
      title: "Agents Space Mobile App",
      desc: "The Agent's Space Mobile Application was designed simultaneously with the web application to provide Content House clients with critical, on-the-go access to their operational hub. The platform supports a wide array of interconnected, complex features, including property detail creation, quote generation, artwork review, product management, property sharing, and data reconciliation. Executed entirely in Figma, the core design challenge was adapting this high-complexity toolset to the constraints of a mobile interface while maintaining user security. I designed a sophisticated role-based access management system where features dynamically adjust based on the user's role (user, admin, or group member). My design process was rigorous and user-centric, starting with user research to map out complex agent workflows. I defined the mobile information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure a highly efficient, seamless, and secure experience for agents in the field.",
      created: "2024",
      role: "Designer and Developer",
      image: "assets/img/project-10.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      websiteLink: "",
    },
    12: {
      title: "Travelbook PH Website Revamp and Mobile App",
      desc: "This was my first major project at Coreproc Inc., where I was the main UI/UX Designer and Front-End Developer for the client's Travelbook PH platform revamp, while also serving as the project representative for client communication. The application is a vital travel resource, enabling users to book accommodations (hotels, houses, etc.) across the Philippines with filters for preferred dates and locations, and allowing them to create detailed reviews to inform other users' booking decisions. My design process was initiated with thorough market and user research, including an analysis of many key competitors, to define product strategy, and I ensured I followed the branding guidelines precisely. My role included the full design of the website and the dedicated mobile apps for both Android and iOS. Since this was 2014, I created wireframes using Balsamiq Mockups and detailed high-fidelity designs in Adobe Photoshop, which were compiled into prototypes for usability testing. I was responsible for translating the final web design into a fully functional, mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap. Furthermore, I managed the project by conducting frequent meetings with our Japanese clients and working side-by-side with them to align on scope and deliverables. Note: Travelbook PH ceased its operations in 2020.",
      created: "2014-2016",
      role: "Designer and Developer",
      image: "assets/img/project-12.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Travelbook-PH?node-id=2-86&t=lEg93tpqWyTGkHwj-1",
      xdLink: "",
    },
    13: {
      title: "Nexgo Express Website",
      desc: "This project involved the complete redesign, UI/UX conceptualization, and front-end development of the Nexgo Express website. Nexgo Express is a crucial door-to-door pick-up and express delivery service provider for eCommerce businesses and online sellers operating within Metro Manila. The website's primary function is to empower users with essential information: the ability to easily track their packages and quickly view accurate shipping rates across the Philippines. My process was an end-to-end blend of design strategy and implementation: I started with comprehensive market and user research, including identifying and analyzing key competitors, to define the platform’s information architecture. I maintained constant communication with the CTO and Project Manager to ensure technical and business alignment. I then moved to designing high-fidelity websites and prototypes for the tracking and rating features. Finally, I executed the front-end development to create a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, ensuring a fast, reliable, and user-friendly experience for all online sellers. (Note: Last time I checked, it seems Nexgo does not have the website anymore and I am unsure to this day if the company is still operational.)",
      created: "2016",
      role: "Designer and Developer",
      image: "assets/img/project-13.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=2-128&t=lEg93tpqWyTGkHwj-1",
      xdLink: "assets/files/nexgo.xd",
      websiteLink: "",
    },
    14: {
      title: "MyPocketDoctor Website and Mobile App",
      desc: "This project involved the complete design and front-end implementation of the Mypocketdoctor platform (2016), one of the pioneers in the Philippine telemedicine and teleconsult sector. Our core mission was to provide quality, fast, and affordable telemedicine services to patients 24/7/365 with a consistently high service level and utmost customer satisfaction. I handled two primary roles: serving as the UI/UX Designer for both the website and the mobile apps (Android and iOS), and as the Front-End Developer for the website. My design process was strategically informed: I began with extensive market and user research, including identifying and analyzing key competitors, and ensured alignment by maintaining clear communication with the Client, CTO, and Project Manager throughout the lifecycle. I then focused on creating high-fidelity websites and apps using Adobe XD,  also did prototyping for comprehensive usability testing. Finally, I executed the web development, translating the design into a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, delivering a secure and highly accessible digital healthcare solution.)",
      created: "2016",
      role: "Designer and Developer",
      image: "assets/img/project-14.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=14-132&t=lEg93tpqWyTGkHwj-1",
      xdLink: "assets/files/mypocketdoctor.xd",
      websiteLink: "",
    },
    15: {
      title: "It's More Fun in the Philippines Website",
      desc: "This was a key project handled early in my tenure at Coreproc Inc., where I served as both the UI/UX Designer and Front-End Developer for the official It's More Fun in the Philippines tourism website. My design process was focused on creating an engaging and functional platform to promote travel and tourism. I began with user research to understand traveler needs, and made sure to follow the branding guidelines for the campaign. I maintained clear communication with our client and the CTO throughout the project lifecycle. For design execution, I utilized Balsamiq Mockups for wireframing and Adobe Photoshop for high-fidelity design. Following approval, I executed the front-end development, translating the design into a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, ensuring the site was accessible and visually impactful across all devices.",
      created: "2014",
      role: "Designer and Developer",
      image: "assets/img/project-15.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=20-10&t=BovGgegej1hnWJNf-1",
      xdLink: "",
      websiteLink: "",
    },
    16: {
      title: "Coreproc Inc. Website",
      desc: "This project, executed in 2018, involved the complete UI/UX design and front-end development of the Coreproc Inc. corporate website. Leveraging direct insight from the CEO and CTO regarding necessary content and showcase elements, I streamlined the design process. I moved immediately to designing the high-fidelity mockups using Adobe XD, bypassing extensive wireframing to achieve a fast turnaround. A key focus of this project was exploring new front-end technology: I adopted Tailwind CSS as the main CSS framework, utilizing its utility-first approach to accelerate development. Following the design phase, I executed the front-end implementation to create a fully mobile-web responsive website, delivering a modern, performance-driven digital presence for the company.",
      created: "2018",
      role: "Designer and Developer",
      image: "assets/img/project-16.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=22-14&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/coreproc_website.xd",
      websiteLink: "https://coreproc.com/",
    },
    17: {
      title: "Mansmith Conference 2020 mobile app",
      desc: "This project, created in 2019, was one of the last initiatives I was responsible for at Coreproc Inc., focusing on the complete UI/UX design for the Mansmith 2020 Conference mobile application. The app served as a centralized digital event hub, requiring a highly efficient and visually polished interface for attendees to access rich content, including schedules, speaker details, and networking features. My structured design process began with extensive market and user research to identify critical conference needs. I maintained continuous communication with the CTO and Project Manager to align the design with technical requirements. The process moved rapidly through high-fidelity prototyping and designing the final interface, culminating in thorough usability testing to ensure the mobile experience was seamless and highly effective for all conference attendees. The tool I used for the design is Adobe XD.",
      created: "2019",
      role: "Designer",
      image: "assets/img/project-17.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=22-22&t=BovGgegej1hnWJNf-1",
      xdLink: "",
      websiteLink: "",
    },
    18: {
      title: "Yamaha Motors Philippines Mobile App",
      desc: "This project, conducted in 2018, involved the complete UI/UX redesign of Yamaha Motors Philippines' digital ecosystem, encompassing both their customer-facing mobile applications and the specialized internal backend platform (YZone). The goal was to modernize the entire digital experience, from customer product browsing and reservations to dealer management of motorcycle inventory, parts, and appointments. My design process was highly structured and client-focused: I began with extensive market and user research, including identifying and analyzing key competitors, to inform the strategic direction, and made sure to follow the Yamaha branding guidelines precisely. I attended meetings with our Yamaha clients alongside the Project Manager, ensuring clear and continuous alignment throughout the lifecycle. The tool I used for the design is Adobe XD. The process involved creating high-fidelity prototyping and designing the new interfaces, culminating in thorough usability testing to ensure a highly efficient, seamless experience for both consumer users and internal administrators.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-18.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=26-39&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/yamaha_motors.xd",
      websiteLink: "",
    },
    19: {
      title: "Figaro Coffee Mobile App",
      desc: "This project involved the complete UI/UX design of the Figaro Coffee customer-facing mobile application, completed in 2018. The application was designed to serve as a comprehensive tool for coffee lovers, facilitating easy menu browsing, customized item selection, order placement, reward tracking, and store location lookups. My design process was strategically focused on enhancing the customer experience and maintaining brand integrity: I began with extensive market and user research, including identifying and analyzing key competitors within the fast-casual dining sector, and made sure to follow strict branding guidelines throughout the process. I maintained continuous communication with the CTO and Project Manager to align the app design with business goals and technical feasibility. The final high-fidelity design was created using Adobe XD, moving through detailed prototyping and culminating in usability testing to ensure a seamless and intuitive mobile ordering experience.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-19.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=33-43&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/figaro_coffee.xd",
      websiteLink: "",
    },
    20: {
      title: "Angels Pizza Mobile App",
      desc: "This project involved the complete UI/UX design of the Angel's Pizza customer mobile application, completed in 2018. The app was designed as a direct-to-consumer platform to streamline the entire ordering process, supporting essential functions like delivery, order ahead, menu browsing, item customization (sizes, quantity), and store location mapping. My design process was focused on efficiency and brand fidelity: I began with extensive market and user research, including identifying and analyzing key competitors, while meticulously ensuring the design adhered to existing branding guidelines. I maintained continuous communication with the CTO and Project Manager to align the app with business and technical needs. The final high-fidelity design was created using Adobe XD, moving through detailed prototyping and culminating in usability testing to deliver a fast, intuitive, and brand-consistent mobile ordering experience.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-20.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=36-80&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/angels_pizza.xd",
      websiteLink: "",
    },
    21: {
      title: "Aeon Cambodia Mobile App Redesign",
      desc: "This project, conducted in 2019, involved the complete UI/UX redesign of AEON Cambodia's digital payment ecosystem for a prominent Japanese Fintech company. My role encompassed redesigning both the consumer mobile application (as seen in the screenshot, likely focusing on mVisa payments, loyalty points, and payment confirmation flows) and the corresponding merchant mobile application. The objective was to modernize the user experience, enhance functionality, and improve overall usability for both customer transactions and business operations. My design process was highly systematic and client-driven: It began with thorough information gathering from clients and the Project Manager, followed by extensive market and user research to understand the specific needs of the Cambodian market and fintech landscape. I then initiated the design process using Adobe XD, starting with detailed wireframes, progressing to high-fidelity designs, and concluding with comprehensive prototyping for usability testing and gathering user feedback to refine the final product.",
      created: "2018-2019",
      role: "Designer",
      image: "assets/img/project-21.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=45-24&t=D51t5yxzyOLmX6hR-1",
      xdLink: "assets/files/aeon_consumer.xd",
      websiteLink: "",
    },
    22: {
      title: "KicksMart E-Commerce App - Figma Make(AI)",
      desc: "This is just a personal project that demonstrates a high-speed approach to mobile e-commerce design and prototyping. I designed and built the foundational Splash Screen and Home Page mockups. For efficiency, the remaining app pages were generated using Figma AI and quickly assembled into an interactive prototype. This exercise prioritizes showcasing rapid ideation and leveraging AI tools in the design workflow, resulting in a functional, albeit unpolished, proof-of-concept. This design is for mobile only.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-24.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/SVqMjYICFN33aFoWVmD5ej/Kicksmart?node-id=0-1&p=f",
      xdLink: "",
      websiteLink: "https://export-glad-87190303.figma.site/",
    },
    23: {
      title: "Vanguard Admin Dashboard - Figma Make(AI)",
      desc: "This UI/UX design project for the Vanguard Admin Dashboard utilized a modern, efficient workflow. I designed the main dashboard pages, including the complete visual system for both the Light Mode and the high-contrast Dark Mode. After these core interfaces were completed, the remaining pages, secondary screens, and interactive components of the website were automatically built using AI technology through Figma Make. Crucially, I directed the AI to ensure the entire output was fully mobile web responsive. Furthermore, thanks to my solid understanding of frontend development, I was able to review and comprehend the underlying code created by the AI. This dual workflow serves as proof of concept, demonstrating my ability to effectively integrate and utilize AI tools to enhance and efficiently scale my design output while maintaining technical control.",
      created: "2025",
      role: "Designer and Developerr",
      image: "assets/img/project-25.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/gs2Nkkk9qEV8Ya0mRc6vvn/Vanguar---Admin-Dashboard?node-id=0-1&t=7tKlPFrrco00moGz-1",
      xdLink: "",
      websiteLink: "https://found-grasp-74066159.figma.site",
    },
    24: {
      title: "Vanguard Landing Page - Figma Make(AI)",
      desc: "This personal project was created to explore the frontier of AI-assisted UI design, specifically showcasing my proficiency with Figma Make. By leveraging Figma’s AI capabilities, I built a cohesive and modern landing page for Vanguard, focusing on how AI can be directed to produce high-quality, brand-aligned layouts. This project demonstrates my ability to integrate emerging technologies into the design process to accelerate production without losing sight of the core user experience.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-26.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink:
        "https://www.figma.com/design/hjJ1SeflUvchY1X6Wq3C7Y/Vanguard-Landing-Page?node-id=0-1&t=uqzJgVTmhkbcRpC6-1",
      xdLink: "",
      websiteLink: "https://pear-jeep-99379078.figma.site",
    },
    25: {
      title: "Gacha Social App - Designed and built using Figma Make(AI)",
      desc: "I developed and designed this gacha platform as a primary showcase of my AI skills, utilizing Figma AI to architect a system where users can pull and collect unique characters while engaging in a highly interactive community. The application facilitates deep social engagement through features like player battling, liking, commenting, and direct messaging. My extensive front-end development experience provided a significant advantage during the build; because I deeply understand the code the AI generates, I was able to refine every component to ensure the entire system functions perfectly. This technical oversight was key to achieving a fully mobile-web responsive design, allowing the platform to work seamlessly on both desktop and mobile browsers. Users can enjoy a high-fidelity, app-like experience on any device without the need for a separate download, maintaining a consistent and polished feel across all screens.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-27.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      websiteLink: "https://try-undo-36289219.figma.site",
    },

    26: {
      title:
        "Dragon Ball Flappy Goku Game (Retro Style) - Designed and built using Figma Make(AI)",
      desc: "I developed and designed this Retro Style Dragon Ball Flappy Goku game as a dedicated showcase of my AI skills, utilizing Figma AI to bring this Flappy Bird-inspired experience to life. My background in front-end development provided the necessary technical foundation to ensure the game functions perfectly; because I have a deep understanding of the code the AI generates, I was able to bridge the gap between AI-driven design and a fully playable, high-performance product. This project highlights a completely mobile-web responsive design, ensuring that the fast-paced gameplay remains smooth and intuitive whether you are playing on a desktop or a smartphone. By focusing on a seamless browser-based experience, I’ve ensured that the game delivers a polished, app-like feel on any device without the need for an external download.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-28.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      websiteLink: "https://sniff-ahead-92042786.figma.site",
    },

    27: {
      title:
        "Final Fantasy VII Marketing Landing Page - Designed and built using Claude",
      desc: "I developed this Final Fantasy VII marketing landing page to showcase my ability to leverage Claude Code for end-to-end web development. By using this agentic tool, I managed the entire design and implementation process directly from my terminal, while my front-end expertise allowed me to refine and optimize the AI-generated code for production-level performance. The result is a fully mobile-web responsive experience that maintains its cinematic impact and fluid navigation across both desktop and mobile. This project demonstrates how combining technical oversight with AI-driven workflows produces polished, high-performance results without the need for a separate app.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-29.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://final-fantasy-7.vercel.app/",
    },

    28: {
      title: "Velocità E-Commerce Website - Designed and built using Claude",
      desc: "I built the Velocità E-Commerce platform and its companion admin dashboard as a personal project to showcase my design and development workflow using Claude. By leveraging Claude Code to build the system with React, Tailwind, and Supabase, I managed everything from initial design to final deployment. My front-end expertise was essential for refining the code to ensure a robust, high-performance experience. Both applications are fully mobile-web responsive, providing a seamless experience across all devices. This project highlights my ability to use AI as a force multiplier while maintaining the technical oversight required to deliver professional, scalable solutions.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-30.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://scooter-store.vercel.app/",
    },

    29: {
      title: "Velocità Admin Page - Designed and built using Claude",
      desc: "As the companion admin page for the Velocità E-Commerce platform, I built this dashboard as a personal project to showcase my end-to-end design and development workflow using Claude. By leveraging Claude Code to build this system with React, Tailwind, and Supabase, I handled everything from the initial interface design to final deployment. My front-end expertise was essential for refining the code to ensure a robust, high-performance experience. This dashboard serves as the command center for the store, allowing for seamless management of product content and orders. Fully mobile-web responsive, it provides a fluid, professional experience across any device, highlighting my ability to use AI as a force multiplier while maintaining the technical oversight required to deliver complete, scalable solutions.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-31.png",
      // LINKS: Testing conditional hiding (Only Web visible)
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://scooter-store-admin.vercel.app/dashboard/",
    },
  };
  const modal = document.getElementById("portfolio-modal");
  const closeBtn = document.getElementById("modal-close");
  const items = document.querySelectorAll(".portfolio-item[data-id]");

  // Select the Link Buttons inside the Modal
  const figmaBtn = modal.querySelector(".figma-link");
  const xdBtn = modal.querySelector(".xd-link");
  const webBtn = modal.querySelector(".website-link");
  const claudebBtn = modal.querySelector(".claude-link");

  // Function to Open Modal
  items.forEach((item) => {
    item.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const data = portfolioData[id];

      if (data) {
        // Populate Standard Data
        document.getElementById("modal-img").src = data.image;
        document.getElementById("modal-img").onerror = function () {
          this.src = "https://via.placeholder.com/600x400";
        };

        document.getElementById("modal-title").textContent = data.title;
        document.getElementById("modal-desc").textContent = data.desc;
        document.getElementById("modal-created").textContent = data.created;
        document.getElementById("modal-role").textContent = data.role;

        // --- HANDLE LINKS (Hide/Show Logic) ---

        // 1. Figma Link
        if (data.figmaLink) {
          figmaBtn.href = data.figmaLink;
          figmaBtn.style.display = "inline-flex"; // Show
        } else {
          figmaBtn.style.display = "none"; // Hide
        }

        // 2. XD Link
        if (data.xdLink) {
          xdBtn.href = data.xdLink;
          xdBtn.style.display = "inline-flex"; // Show
        } else {
          xdBtn.style.display = "none"; // Hide
        }

        // 3. Website Link
        if (data.websiteLink) {
          webBtn.href = data.websiteLink;
          webBtn.style.display = "inline-flex"; // Show
        } else {
          webBtn.style.display = "none"; // Hide
        }

        // 4. Claude Link
        if (data.claudeLink) {
          claudebBtn.href = data.claudeLink;
          claudebBtn.style.display = "inline-flex"; // Show
        } else {
          claudebBtn.style.display = "none"; // Hide
        }

        // Show Modal
        modal.classList.add("open");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
      }
    });
  });

  // Function to Close Modal
  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = ""; // Restore scrolling
  }

  // Event Listeners for Closing
  closeBtn.addEventListener("click", closeModal);

  // Close if clicking outside the content (on the dark overlay)
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });
});
