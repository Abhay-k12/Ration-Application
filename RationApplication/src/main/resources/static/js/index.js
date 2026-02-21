    // Header scroll effect
    window.addEventListener('scroll', function() {
      const header = document.getElementById('header');
      const backToTop = document.getElementById('backToTop');

      if (window.scrollY > 100) {
        header.classList.add('scrolled');
        backToTop.classList.add('active');
      } else {
        header.classList.remove('scrolled');
        backToTop.classList.remove('active');
      }
    });

    // Back to top functionality
    document.getElementById('backToTop').addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile menu toggle (simplified)
    document.querySelector('.mobile-menu').addEventListener('click', function() {
      alert('Mobile menu would open here - implement as needed');
    });

    // Testimonial slider
    let currentTestimonial = 0;
    const testimonialTrack = document.getElementById('testimonialTrack');
    const testimonials = document.querySelectorAll('.testimonial-card');

    window.moveTestimonial = function(direction) {
      currentTestimonial += direction;

      if (currentTestimonial < 0) {
        currentTestimonial = testimonials.length - 1;
      } else if (currentTestimonial >= testimonials.length) {
        currentTestimonial = 0;
      }

      testimonialTrack.style.transform = `translateX(-${currentTestimonial * 100}%)`;
    };

    // Auto-rotate testimonials
    setInterval(() => {
      moveTestimonial(1);
    }, 5000);

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Form submission
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for contacting us! We will respond shortly.');
      this.reset();
    });

    // Active nav link on scroll
    window.addEventListener('scroll', function() {
      const sections = document.querySelectorAll('section[id]');
      const scrollY = window.pageYOffset;

      sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document.querySelectorAll('nav ul li a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    });