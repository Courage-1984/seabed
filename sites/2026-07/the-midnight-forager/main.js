import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Header Scroll Effect
  // ==========================================
  const header = document.querySelector('.site-header');
  
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // ==========================================
  // Scroll Animations (IntersectionObserver)
  // ==========================================
  const animatedSections = document.querySelectorAll('.animate-on-scroll');
  
  if (animatedSections.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animatedSections.forEach(section => {
      sectionObserver.observe(section);
    });
  }

  // ==========================================
  // Smooth Scrolling for Anchor Links
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================
  // Carousel Logic
  // ==========================================
  const carousel = document.getElementById('forager-carousel');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (carousel && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
    });
  }

  // ==========================================
  // Seasonal Calendar Interactivity
  // ==========================================
  const calendarMonths = document.querySelectorAll('.calendar-month');
  const calendarDetail = document.getElementById('calendar-detail');

  const seasonalData = {
    jan: {
      status: 'Closed',
      content: '<strong>January — Closed Season</strong><p>The Highland forest floor is dormant. Sub-zero temperatures and deep snow cover prevent safe nocturnal foraging. We use this period for estate maintenance, trail management, and planning the upcoming season.</p>'
    },
    feb: {
      status: 'Closed',
      content: '<strong>February — Closed Season</strong><p>Conditions remain too severe for safe expedition operations. Our mycologist uses this period for habitat surveys, identifying new fruiting zones, and updating species distribution maps ahead of the spring opening.</p>'
    },
    mar: {
      status: 'Limited',
      content: '<strong>March — Limited Availability</strong><p>Early spring foraging begins with the emergence of scarlet elfcups, velvet shanks, and the first wild garlic shoots. Expeditions are weather-dependent and subject to cancellation. Species available: Scarlet Elfcup, Velvet Shank, Wild Garlic (early shoots), Wood Sorrel.</p>'
    },
    apr: {
      status: 'Open',
      content: '<strong>April — Season Open</strong><p>Wild garlic carpets the forest floor, accompanied by St George\'s mushrooms and the first morels in sheltered glades. The lengthening twilight provides optimal foraging conditions with adequate ambient light during the approach walk. Species available: Wild Garlic, St George\'s Mushroom, Morel, Wood Sorrel, Meadowsweet (early).</p>'
    },
    may: {
      status: 'Open',
      content: '<strong>May — Season Open</strong><p>Peak wild garlic season. Chicken of the Woods begins appearing on ancient oak stumps. The forest canopy is fully leafed, creating the deep shade conditions that favour many of our target species. Species available: Wild Garlic (peak), Chicken of the Woods, Morel (late), Elder Flower, Beefsteak Fungus (early).</p>'
    },
    jun: {
      status: 'Open',
      content: '<strong>June — Season Open</strong><p>The summer solstice creates the shortest foraging window (true darkness from approximately 23:30 to 03:00). Expeditions are timed to exploit the brief period of genuine night. Summer chanterelles begin their fruiting cycle. Species available: Summer Chanterelle, Chicken of the Woods, Elder Flower, Meadowsweet, Puffball (early).</p>'
    },
    jul: {
      status: 'Peak',
      content: '<strong>July — Peak Season</strong><p>Chanterelle season begins in earnest. Warm, wet conditions produce the densest fruiting we see all year. This is our highest-demand period — advance booking of 6+ weeks is essential. Species available: Chanterelle (golden), Summer Cep, Hedgehog Fungus, Giant Puffball, Meadowsweet.</p>'
    },
    aug: {
      status: 'Peak',
      content: '<strong>August — Peak Season</strong><p>The absolute zenith of Highland foraging. Golden chanterelles, ceps, hedgehog fungi, and the first amethyst deceivers create the most diverse species palette of the year. Our degustation menus reach their peak complexity during this month. Species available: Chanterelle (golden), Cep/Porcini, Hedgehog Fungus, Amethyst Deceiver, Giant Puffball, Chicken of the Woods.</p>'
    },
    sep: {
      status: 'Peak',
      content: '<strong>September — Peak Season</strong><p>The autumn equinox marks the transition from summer to autumn fungi. The cooling temperatures and shorter days trigger a spectacular second wave of fruiting. Honey fungus, shaggy ink caps, and the last of the season\'s chanterelles provide extraordinary diversity. Species available: Chanterelle (late), Honey Fungus, Shaggy Ink Cap, Penny Bun Cep, Amethyst Deceiver, Field Blewit (early).</p>'
    },
    oct: {
      status: 'Open',
      content: '<strong>October — Season Open</strong><p>Late autumn brings field blewits, wood blewits, and the distinctive cauliflower fungus. The forest floor is at its most atmospheric — deep leaf litter, heavy dew, and the rich scent of decomposition create an intensely immersive sensory experience. Species available: Wood Blewit, Field Blewit, Cauliflower Fungus, Shaggy Ink Cap, Honey Fungus (late).</p>'
    },
    nov: {
      status: 'Limited',
      content: '<strong>November — Limited Availability</strong><p>The season draws to a close with the last hardy species: velvet shanks, winter chanterelles, and wood ears persist into the early frosts. Expeditions are weather-dependent and may be cancelled at short notice due to early winter storms. Species available: Winter Chanterelle, Velvet Shank, Wood Ear, Oyster Mushroom.</p>'
    },
    dec: {
      status: 'Closed',
      content: '<strong>December — Closed Season</strong><p>The forest enters full winter dormancy. Our team focuses on reviewing the year\'s species data, planning habitat improvements, and preparing the next season\'s foraging calendar based on climate and rainfall projections.</p>'
    }
  };

  calendarMonths.forEach(btn => {
    btn.addEventListener('click', () => {
      const month = btn.dataset.month;
      const data = seasonalData[month];

      // Update selected state
      calendarMonths.forEach(m => m.classList.remove('selected'));
      btn.classList.add('selected');

      // Update detail panel
      if (calendarDetail && data) {
        calendarDetail.innerHTML = data.content;
        calendarDetail.style.borderColor = 'rgba(212, 175, 55, 0.3)';
      }
    });
  });

  // ==========================================
  // Booking Form Submission
  // ==========================================
  const bookingForm = document.getElementById('booking-form');
  const feedback = document.getElementById('form-feedback');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = bookingForm.querySelector('.submit-btn');
      const originalText = btn.textContent;
      
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = 'Enquiry Submitted';
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'var(--color-accent)';
        
        if (feedback) {
          feedback.textContent = 'Your expedition enquiry has been received. We will confirm availability within 48 hours.';
        }

        setTimeout(() => {
          bookingForm.reset();
          btn.textContent = originalText;
          btn.style.backgroundColor = '';
          btn.style.color = '';
          btn.disabled = false;
          if (feedback) feedback.textContent = '';
        }, 4000);
      }, 1500);
    });
  }
});
