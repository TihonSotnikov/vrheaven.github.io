document.addEventListener('DOMContentLoaded', () => {

    // 1. Плавное появление элементов
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(section => {
        revealObserver.observe(section);
    });

    // 2. Логика Аккордеона
    const accordionItems = document.querySelectorAll('.accordion__item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion__header');
        
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            accordionItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // 3. БЕСШОВНАЯ БЕСКОНЕЧНАЯ КАРУСЕЛЬ (АВТОСКРОЛЛ + МЫШЬ + ТРЕКПАД)
    const carousel = document.getElementById('reviews-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (carousel && prevBtn && nextBtn) {
        const wrapper = carousel.parentElement;
        const originalSlides = Array.from(carousel.children);
        
        // Клонируем элементы для создания бесшовности
        originalSlides.forEach(slide => carousel.appendChild(slide.cloneNode(true)));
        originalSlides.forEach(slide => carousel.appendChild(slide.cloneNode(true)));

        // Отключаем стандартное перетаскивание картинок браузером, чтобы не мешало свайпу мышью
        carousel.querySelectorAll('img').forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
        });

        let isAnimating = false;
        
        function getStep() {
            const slide = carousel.querySelector('.carousel__slide');
            const gap = parseFloat(window.getComputedStyle(carousel).gap) || 0;
            return slide.offsetWidth + gap;
        }

        function moveNext() {
            if (isAnimating) return;
            isAnimating = true;
            const step = getStep();
            carousel.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            carousel.style.transform = `translateX(-${step}px)`;
            setTimeout(() => {
                carousel.style.transition = 'none';
                carousel.style.transform = 'translateX(0)';
                carousel.appendChild(carousel.firstElementChild);
                isAnimating = false;
            }, 500);
        }

        function movePrev() {
            if (isAnimating) return;
            isAnimating = true;
            const step = getStep();
            carousel.style.transition = 'none';
            carousel.prepend(carousel.lastElementChild);
            carousel.style.transform = `translateX(-${step}px)`;
            void carousel.offsetWidth;
            carousel.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            carousel.style.transform = 'translateX(0)';
            setTimeout(() => {
                isAnimating = false;
            }, 500);
        }

        // --- ЛОГИКА АВТОПЛЕЯ ---
        let autoplay;
        let isStarted = false;

        const startAutoplay = () => {
            clearInterval(autoplay);
            autoplay = setInterval(moveNext, 7500);
        };

        const stopAutoplay = () => {
            clearInterval(autoplay);
        };

        const carouselObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    isStarted = true;
                    moveNext(); 
                    startAutoplay(); 
                    observer.disconnect(); 
                }
            });
        }, { threshold: 0.15 });

        carouselObserver.observe(wrapper);

        // --- ЛОГИКА КНОПОК ---
        nextBtn.addEventListener('click', () => { 
            moveNext(); 
            if (isStarted) startAutoplay(); 
        });
        prevBtn.addEventListener('click', () => { 
            movePrev(); 
            if (isStarted) startAutoplay(); 
        });

        // --- ЛОГИКА ПАУЗЫ ПРИ НАВЕДЕНИИ ---
        wrapper.addEventListener('mouseenter', () => {
            if (isStarted) stopAutoplay();
        });

        // --- ЛОГИКА СВАЙПОВ (МЫШЬ + ТАЧ) ---
        let startX = 0;
        let isDragging = false;
        wrapper.style.cursor = 'grab';

        const handleDragStart = (e) => {
            isDragging = true;
            wrapper.style.cursor = 'grabbing';
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            if (isStarted) stopAutoplay();
        };

        const handleDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            wrapper.style.cursor = 'grab';
            
            const endX = e.type.includes('mouse') ? e.pageX : e.changedTouches[0].pageX;
            const diffX = startX - endX;

            if (diffX > 50) {
                moveNext();
            } else if (diffX < -50) {
                movePrev();
            }
            
            // Перезапускаем автоплей, если мышь уже не над каруселью
            if (isStarted && !wrapper.matches(':hover')) {
                startAutoplay();
            }
        };

        // События мыши
        wrapper.addEventListener('mousedown', handleDragStart);
        wrapper.addEventListener('mouseup', handleDragEnd);
        wrapper.addEventListener('mouseleave', (e) => {
            if (isDragging) handleDragEnd(e);
            if (isStarted && !isDragging) startAutoplay(); 
        });

        // События тачскрина
        wrapper.addEventListener('touchstart', handleDragStart, {passive: true});
        wrapper.addEventListener('touchend', handleDragEnd, {passive: true});

        // --- ЛОГИКА ТРЕКПАДА (Горизонтальный скролл) ---
        wrapper.addEventListener('wheel', (e) => {
            // Реагируем только если скролл больше горизонтальный, чем вертикальный
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault(); // Предотвращаем стандартный свайп "назад/вперед" в браузере

                if (isAnimating) return; // Ждем окончания анимации, чтобы не пролистывать по 10 слайдов за раз
                
                if (e.deltaX > 20) {
                    moveNext();
                    if (isStarted) { stopAutoplay(); startAutoplay(); }
                } else if (e.deltaX < -20) {
                    movePrev();
                    if (isStarted) { stopAutoplay(); startAutoplay(); }
                }
            }
        }, { passive: false });
    }

    // 4. Плавный скролл 
    document.querySelectorAll('.js-smooth-scroll').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if(targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 64; 
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    // 5. ЛОГИКА МОДАЛЬНЫХ ОКОН
    const contactModal = document.getElementById('contact-modal');
    const callConfirmModal = document.getElementById('call-confirm-modal');
    
    const openContactBtns = document.querySelectorAll('.js-open-contact-modal');
    const triggerCallConfirm = document.getElementById('trigger-call-confirm');
    const callCancel = document.getElementById('call-cancel');
    const callFinalTrigger = document.getElementById('call-final-trigger');

    const openModal = (modal) => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = (modal) => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    };

    openContactBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(contactModal);
        });
    });

    const closeContactBtn = contactModal.querySelector('.js-close-contact-modal');
    closeContactBtn.addEventListener('click', () => closeModal(contactModal));

    if (triggerCallConfirm) {
        triggerCallConfirm.addEventListener('click', () => {
            openModal(callConfirmModal);
        });
    }

    if (callCancel) {
        callCancel.addEventListener('click', () => closeModal(callConfirmModal));
    }
    
    if (callFinalTrigger) {
        callFinalTrigger.addEventListener('click', () => {
            setTimeout(() => {
                closeModal(callConfirmModal);
                closeModal(contactModal);
            }, 500);
        });
    }

    [contactModal, callConfirmModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (callConfirmModal.classList.contains('active')) {
                closeModal(callConfirmModal);
            } else if (contactModal.classList.contains('active')) {
                closeModal(contactModal);
            }
        }
    });
});