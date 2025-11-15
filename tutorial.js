document.addEventListener('DOMContentLoaded', () => {
    // Layered stage setup
    const layerImages = Array.from(document.querySelectorAll('.layer-image'));
    const layerBySuffix = new Map(layerImages.map(img => [img.dataset.suffix, img]));
    const SLIDE_MATRIX = [
        ['002','003','004','005'],
        ['002','003','004','007'],
        ['002','003','004','009'],
        ['002','003','004','011','012'],
        ['002','003','004','011','014'],
        ['002','003','016'],
        ['002','017'],
        ['002','018'],
        ['002','019'],
        ['002','020']
    ];
    
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentSlide = 0;
    let isTransitioning = false;
    let currentVisibleLayers = new Set();
    
    // Initialize nav button visibility
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'block';
    // Show first slide
    showSlide(currentSlide);
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', showPrevSlide);
    if (nextBtn) nextBtn.addEventListener('click', showNextSlide);
    
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
        
        // Clamp slide index to [0, last]
        const lastIndex = SLIDE_MATRIX.length - 1;
        const newSlideIndex = Math.max(0, Math.min(n, lastIndex));
        const targetLayers = new Set(SLIDE_MATRIX[newSlideIndex]);

        // Determine which layers to hide/show (do not change layers that persist)
        const toHide = [...currentVisibleLayers].filter(s => !targetLayers.has(s));
        const toShow = [...targetLayers].filter(s => !currentVisibleLayers.has(s));

        // Start fade-out of layers that are changing out
        toHide.forEach(suffix => {
            const img = layerBySuffix.get(suffix);
            if (img) img.classList.remove('visible');
        });

        // After fade-out duration + desired gap, fade in new layers
        const fadeDurationMs = 300; // matches CSS
        const gapMs = 100; // requested gap between out and in (0.1s)

        setTimeout(() => {
            toShow.forEach(suffix => {
                const img = layerBySuffix.get(suffix);
                if (img) img.classList.add('visible');
            });
        }, fadeDurationMs + gapMs);

        // Layers that persist remain visible; update state after transitions
        setTimeout(() => {
            currentVisibleLayers = new Set(targetLayers);
            currentSlide = newSlideIndex;

            // Update button states
            if (prevBtn) prevBtn.style.display = currentSlide === 0 ? 'none' : 'block';
            nextBtn.textContent = '\u276F';
            nextBtn.style.display = currentSlide === lastIndex ? 'none' : 'block';

            isTransitioning = false;
        }, fadeDurationMs + gapMs + fadeDurationMs);
    }
    
    function showNextSlide() {
        const lastIndex = SLIDE_MATRIX.length - 1;
        if (currentSlide < lastIndex) {
            showSlide(currentSlide + 1);
        }
    }
    
    function showPrevSlide() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
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
