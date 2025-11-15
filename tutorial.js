document.addEventListener('DOMContentLoaded', () => {
    // Layered stage setup
    const layerImages = Array.from(document.querySelectorAll('.layer-image'));
    const layerBySuffix = new Map(layerImages.map(img => [img.dataset.suffix, img]));
    const SLIDE_MATRIX = [
        ['002','003','004','000'],
        ['002','003','004','006'],
        ['002','003','004','008'],
        ['002','003','004','010','011'],
        ['002','003','004','010','013'],
        ['002','003','015'],
        ['002','016'],
        ['002','017'],
        ['002','018'],
        ['002','019']
    ];
    
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const currentSlideEl = document.querySelector('.current-slide');
    const totalSlidesEl = document.querySelector('.total-slides');
    const paginationEl = document.querySelector('.pagination');
    
    let currentSlide = 0;
    let isTransitioning = false;
    let currentVisibleLayers = new Set();
    
    // Set total slides count
    totalSlidesEl.textContent = SLIDE_MATRIX.length;
    
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

    function positionPagination(targetLayers) {
        if (!paginationEl) return;
        // Choose top-most visible layer from target order (last in the array)
        const order = Array.from(targetLayers);
        const topSuffix = order[order.length - 1];
        const img = layerBySuffix.get(topSuffix) || layerBySuffix.get('002');
        if (!img) return;
        const containerRect = document.querySelector('.tutorial-container').getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        const offsetX = 16; // padding from image right
        const offsetY = 16 + 30; // padding from image bottom (+30px per request)
        const left = Math.max(containerRect.left, imgRect.right - offsetX) - containerRect.left;
        const top = Math.max(containerRect.top, imgRect.bottom - offsetY) - containerRect.top;
        paginationEl.style.left = `${left - paginationEl.offsetWidth}px`;
        paginationEl.style.top = `${top - paginationEl.offsetHeight}px`;
        paginationEl.style.right = '';
        paginationEl.style.bottom = '';
    }

    window.addEventListener('resize', () => {
        // Reposition pagination based on current layers
        const targetLayers = currentVisibleLayers.size ? currentVisibleLayers : new Set(SLIDE_MATRIX[currentSlide]);
        positionPagination(targetLayers);
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

            // Update pagination
            currentSlideEl.textContent = currentSlide + 1;
            positionPagination(targetLayers);

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
    
    // Initial pagination position
    positionPagination(new Set(SLIDE_MATRIX[currentSlide]));
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
