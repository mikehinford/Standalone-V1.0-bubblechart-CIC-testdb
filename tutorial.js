document.addEventListener('DOMContentLoaded', () => {
    // Get all slides and separate them by type
    const allSlides = Array.from(document.querySelectorAll('.tutorial-slide'));
    const slides = allSlides.filter(slide => !slide.classList.contains('base-image-slide'));
    const baseImageSlides = document.querySelectorAll('.base-image-slide');
    
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const currentSlideEl = document.querySelector('.current-slide');
    const totalSlidesEl = document.querySelector('.total-slides');
    const whiteFlash = document.querySelector('.white-flash');
    
    let currentSlide = 0;
    let isTransitioning = false;
    let currentBaseSlide = null;
    let hasInitialized = false;
    
    // Set total slides count
    totalSlidesEl.textContent = slides.length;
    
    // Show first slide
    showSlide(currentSlide);
    
    // Event listeners
    prevBtn.addEventListener('click', showPrevSlide);
    nextBtn.addEventListener('click', showNextSlide);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            showPrevSlide();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            showNextSlide();
        } else if (e.key === 'Escape') {
            // Close tutorial if ESC is pressed
            if (window.opener) {
                window.close();
            } else {
                window.history.back();
            }
        }
    });
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
        const swipeThreshold = 50; // Minimum swipe distance in pixels
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next slide
            showNextSlide();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous slide
            showPrevSlide();
        }
    }
    
    function showSlide(n) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        const oldSlide = slides[currentSlide];
        const newSlideIndex = (n + slides.length) % slides.length;
        const newSlide = slides[newSlideIndex];
        
        // Determine whether to trigger white flash (skip for slides 4–6)
        const logicalTarget = newSlideIndex + 1; // 1-based display numbering
        const skipWhiteFlash = logicalTarget >= 4 && logicalTarget <= 6;
        const shouldFlash = !hasInitialized && false ? false : !skipWhiteFlash;
        
        if (whiteFlash && shouldFlash) {
            whiteFlash.classList.add('active');
        }
        
        // Get image references if they exist
        const oldImage = oldSlide && oldSlide.querySelector('img') ? oldSlide.querySelector('img').src : null;
        const newImage = newSlide.querySelector('img') ? newSlide.querySelector('img').src : null;
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Manage base image visibility (keep it when moving between text-overlays)
        const incomingIsOverlay = newSlide.classList.contains('text-overlay');
        if (!incomingIsOverlay && currentBaseSlide) {
            currentBaseSlide.classList.remove('active');
            currentBaseSlide = null;
        }
        
        // Update current slide index
        currentSlide = newSlideIndex;
        
        // Check if this is a text overlay slide
        if (newSlide.classList.contains('text-overlay')) {
            const baseSlideId = newSlide.getAttribute('data-base-slide');
            const baseSlide = document.querySelector(`.base-image-slide[data-slide-id="${baseSlideId}"]`) || baseImageSlides[0];
            if (baseSlide) {
                baseSlide.classList.add('active');
                currentBaseSlide = baseSlide;
            }
        }
        
        // Show current slide
        newSlide.classList.add('active');
        
        // Update pagination (show logical slide number, not array index)
        currentSlideEl.textContent = currentSlide + 1;
        
        // Update button states
        prevBtn.style.display = currentSlide === 0 ? 'none' : 'block';
        nextBtn.textContent = currentSlide === slides.length - 1 ? 'Finish' : '→';
        
        
        // Re-enable transitions after a short delay
        setTimeout(() => {
            isTransitioning = false;
            hasInitialized = true;
        }, 500);
        
        // Remove white flash after a brief moment
        if (whiteFlash && shouldFlash) {
            setTimeout(() => {
                whiteFlash.classList.remove('active');
            }, 220);
        }
    }
    
    function showNextSlide() {
        if (currentSlide === slides.length - 1) {
            // Close the tutorial when clicking Next on the last slide
            if (window.opener) {
                window.close();
            } else {
                window.history.back();
            }
        } else {
            showSlide(currentSlide + 1);
        }
    }
    
    function showPrevSlide() {
        showSlide(currentSlide - 1);
    }
    
    // MutationObserver removed; overlay/base behavior is now handled in showSlide
});

// Add event listener to open the tutorial from the main page
document.addEventListener('DOMContentLoaded', function() {
    const tutorialBtn = document.getElementById('tutorialBtn');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', function() {
            const tutorialWindow = window.open('tutorial.html', 'tutorial', 
                'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
            if (tutorialWindow) {
                tutorialWindow.focus();
            }
        });
    }
});
