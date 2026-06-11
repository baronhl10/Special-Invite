let selectedFood = "";
let isPlaying = false;

// Variables globales para la animación física y LERP del botón "Sí"
let btnTargetX = 0, btnTargetY = 0;
let btnCurrentX = 0, btnCurrentY = 0;
let textTargetX = 0, textTargetY = 0;
let textCurrentX = 0, textCurrentY = 0;

// Variables físicas para el escape inteligente del botón "No"
let noBtnX = 0, noBtnY = 0;
let noTargetX = 0, noTargetY = 0;

const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const mainCard = document.getElementById('mainCard');
const audio = document.getElementById('bgMusic');
const audioBtn = document.getElementById('audioToggle');

// === 1. SÍNTESIS DE AUDIO POR HARDWARE (WEB AUDIO API) ===
function playPopSFX(frequency = 600, type = 'sine') {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency / 3, audioCtx.currentTime + 0.12);

        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        console.log("Audio contextual en espera de interacción.");
    }
}

// === 2. MANEJO DEL PRE-LOADER ===
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const stages = ["Inicializando módulos...", "Renderizando auroras...", "Desplegando magia..."];
    let stepIndex = 0;

    const interval = setInterval(() => {
        if(loaderText) loaderText.innerText = stages[stepIndex % stages.length];
        stepIndex++;
    }, 600);

    setTimeout(() => {
        clearInterval(interval);
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 600);
        }
    }, 1500);
});

// === 3. INICIALIZACIÓN DE COMPONENTES Y LOOP LERP ===
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById('datePicker');
    if(dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
    }

    // Efecto interactivo de la tarjeta (Desactivado en móviles para optimizar batería)
    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', (e) => {
            if (!mainCard) return;
            const rect = mainCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            mainCard.style.setProperty('--mouse-x', `${x}px`);
            mainCard.style.setProperty('--mouse-y', `${y}px`);
            
            const rotX = ((y - rect.height / 2) / rect.height) * -6; 
            const rotY = ((x - rect.width / 2) / rect.width) * 6;
            mainCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        });

        mainCard.addEventListener('mouseleave', () => {
            mainCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }

    // Magnetismo adaptativo del botón Sí
    if(btnYes) {
        const handleMagnetism = (clientX, clientY) => {
            const rect = btnYes.getBoundingClientRect();
            const x = clientX - rect.left - rect.width / 2;
            const y = clientY - rect.top - rect.height / 2;
            btnTargetX = x * 0.35;
            btnTargetY = y * 0.45;
            textTargetX = x * 0.15;
            textTargetY = y * 0.2;
        };

        btnYes.addEventListener('mousemove', (e) => handleMagnetism(e.clientX, e.clientY));
        btnYes.addEventListener('touchmove', (e) => handleMagnetism(e.touches[0].clientX, e.touches[0].clientY));

        const resetMagnetism = () => {
            btnTargetX = 0; btnTargetY = 0;
            textTargetX = 0; textTargetY = 0;
        };
        btnYes.addEventListener('mouseleave', resetMagnetism);
        btnYes.addEventListener('touchend', resetMagnetism);
    }

    updatePhysicsLoop();
});

// === 4. BUCLE DE ANIMACIÓN LERP ===
function updatePhysicsLoop() {
    btnCurrentX += (btnTargetX - btnCurrentX) * 0.12;
    btnCurrentY += (btnTargetY - btnCurrentY) * 0.12;
    textCurrentX += (textTargetX - textCurrentX) * 0.15;
    textCurrentY += (textTargetY - textCurrentY) * 0.15;

    if(btnYes) {
        btnYes.style.transform = `translate(${btnCurrentX}px, ${btnCurrentY}px)`;
    }
    
    const txtNode = btnYes ? btnYes.querySelector('.btn-text') : null;
    if(txtNode) {
        txtNode.style.transform = `translate(${textCurrentX}px, ${textCurrentY}px)`;
    }

    if(btnNo && btnNo.style.position === 'absolute') {
        noBtnX += (noTargetX - noBtnX) * 0.2; // Escape más responsivo en celular
        noBtnY += (noTargetY - noBtnY) * 0.2;
        btnNo.style.left = `${noBtnX}px`;
        btnNo.style.top = `${noBtnY}px`;
    }

    requestAnimationFrame(updatePhysicsLoop);
}

// === 5. CONTROLADOR DE AUDIO ===
function toggleAudio() {
    if(!audio || !audioBtn) return;
    if (isPlaying) {
        audio.pause();
        audioBtn.classList.remove('playing');
        audioBtn.querySelector('.audio-icon').innerText = "🔇";
    } else {
        audio.play().catch(() => console.log("Permiso denegado por políticas de navegador"));
        audioBtn.classList.add('playing');
        audioBtn.querySelector('.audio-icon').innerText = "🔊";
    }
    isPlaying = !isPlaying;
}

function startExperience() {
    if(!isPlaying && audio) {
        audio.volume = 0.2;
        audio.play().then(() => {
            isPlaying = true;
            if(audioBtn) {
                audioBtn.classList.add('playing');
                audioBtn.querySelector('.audio-icon').innerText = "🔊";
            }
        }).catch(() => console.log("Audio en cola"));
    }
    nextStep(0, 1);
    initStarParticles(); 
}

// === 6. ALGORITMO DE EVASIÓN VECTORIAL TÁCTIL (MOBILE SAFE) ===
const runFromMouse = (e) => {
    // Detener propagaciones para evitar scroll indeseado en móviles al tocar el botón
    e.preventDefault();
    
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(35);
    }

    const cardRect = mainCard.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Captura inicial simétrica del render para evitar saltos o que desaparezca
    if (btnNo.style.position !== 'absolute') {
        noBtnX = btnRect.left - cardRect.left;
        noBtnY = btnRect.top - cardRect.top;
        
        btnNo.style.width = `${btnRect.width}px`;
        btnNo.style.left = `${noBtnX}px`;
        btnNo.style.top = `${noBtnY}px`;
        btnNo.style.position = 'absolute';
        
        noTargetX = noBtnX;
        noTargetY = noBtnY;
    }

    const mouseLocalX = clientX - cardRect.left;
    const mouseLocalY = clientY - cardRect.top;

    let diffX = (noBtnX + btnRect.width / 2) - mouseLocalX;
    let diffY = (noBtnY + btnRect.height / 2) - mouseLocalY;

    if(diffX === 0 && diffY === 0) { diffX = 1; diffY = 1; }

    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    
    // Fuerza de escape adaptada para pantallas compactas
    const force = window.innerWidth < 480 ? 100 : 140; 
    let pushX = (diffX / distance) * force;
    let pushY = (diffY / distance) * force;

    noTargetX = noBtnX + pushX;
    noTargetY = noBtnY + pushY;

    const margin = 15;
    const maxX = cardRect.width - btnRect.width - margin;
    const maxY = cardRect.height - btnRect.height - margin;

    // Sistema de rebote perimetral inteligente
    if (noTargetX < margin) noTargetX = maxX - Math.random() * 30;
    if (noTargetX > maxX) noTargetX = margin + Math.random() * 30;
    if (noTargetY < margin) noTargetY = maxY - Math.random() * 30;
    if (noTargetY > maxY) noTargetY = margin + Math.random() * 30;

    noBtnX = noTargetX;
    noBtnY = noTargetY;
};

if(btnNo) {
    btnNo.addEventListener('mousemove', runFromMouse);
    btnNo.addEventListener('touchstart', runFromMouse, { passive: false });
}

// === 7. SELECCIÓN DE COMIDA Y CAMBIO DE ATMÓSFERA ===
function selectFood(element, foodName) {
    document.querySelectorAll('.bento-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    selectedFood = foodName;
    
    playPopSFX(550, 'sine');

    const root = document.documentElement;
    if (foodName === 'Sushi' || foodName === 'Ramen') {
        root.style.setProperty('--accent-1', '#00f5d4'); 
        root.style.setProperty('--accent-2', '#7b2cbf'); 
    } else if (foodName === 'Pizza' || foodName === 'Tacos') {
        root.style.setProperty('--accent-1', '#ff9f1c'); 
        root.style.setProperty('--accent-2', '#ff4000'); 
    } else {
        root.style.setProperty('--accent-1', '#ff2a5f'); 
        root.style.setProperty('--accent-2', '#7b2cbf');
    }
}

// === 8. MOTOR DE PARTICULAS OPTIMIZADO PARA MÓVILES ===
const canvas = document.getElementById('starCanvas');
let canvasCtx, starArray = [];

function initStarParticles() {
    if(!canvas) return;
    canvasCtx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => addParticles(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) addParticles(e.touches[0].clientX, e.touches[0].clientY);
    });

    loopParticles();
}

function addParticles(x, y) {
    // Capacidad limitada de partículas en móviles para asegurar 60fps estables
    const cap = window.innerWidth < 480 ? 1 : 2;
    for(let i = 0; i < cap; i++) {
        starArray.push(new CosmicParticle(x, y));
    }
}

class CosmicParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.4;
        this.speedX = Math.random() * 1.4 - 0.7;
        this.speedY = Math.random() * 1.4 - 0.7;
        this.alpha = Math.random() * 0.6 + 0.4;
        this.decay = Math.random() * 0.015 + 0.01;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
    }
    draw() {
        canvasCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        canvasCtx.beginPath();
        canvasCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        canvasCtx.fill();
    }
}

function loopParticles() {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < starArray.length; i++) {
        starArray[i].update();
        starArray[i].draw();
        if(starArray[i].alpha <= 0) {
            starArray.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(loopParticles);
}

// === 9. LOGICA DE FLUJO ===
function nextStep(current, next) {
    const currentStep = document.getElementById('step' + current);
    const nextStepElem = document.getElementById('step' + next);

    playPopSFX(650, 'triangle');

    if (current === 1 && next === 2) {
        triggerCascadingConfetti();
    }

    if(currentStep && nextStepElem) {
        currentStep.style.opacity = '0';
        currentStep.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            currentStep.classList.remove('active');
            nextStepElem.classList.add('active');
            void nextStepElem.offsetWidth; 
            nextStepElem.style.opacity = '1';
            nextStepElem.style.transform = 'translateY(0)';
        }, 450);
    }
}

function goToSummary() {
    const dateInput = document.getElementById('datePicker').value;
    const timeInput = document.getElementById('timePicker').value;

    if (!dateInput || !timeInput) {
        alert("Campos incompletos. Se requiere fecha y hora válidas para agendar. 🗓️");
        return;
    }
    if (!selectedFood) {
        alert("Por favor, selecciona una de las opciones gastronómicas del Bento Grid. 🍽️");
        return;
    }

    const dateObj = new Date(dateInput + 'T00:00:00');
    const formatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    let formattedDate = dateObj.toLocaleDateString('es-ES', formatOptions);
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    
    const timeDisplay = document.getElementById('timePicker').options[document.getElementById('timePicker').selectedIndex].text.split(' - ')[0];

    document.getElementById('resDate').innerText = formattedDate;
    document.getElementById('resTime').innerText = timeDisplay;
    document.getElementById('resFood').innerText = selectedFood;

    bindCalendarAPI(dateInput, timeInput, selectedFood);
    nextStep(4, 5);
}

function bindCalendarAPI(dateStr, timeStr, food) {
    const start = new Date(`${dateStr}T${timeStr}:00`);
    const end = new Date(start.getTime() + (2 * 60 * 60 * 1000)); 
    
    const convertToISO = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Cita con María Paula 💖")}&dates=${convertToISO(start)}/${convertToISO(end)}&details=${encodeURIComponent(`Plan verificado. Menú seleccionado: ${food}.`)}&location=${encodeURIComponent("Armenia, Quindío")}`;
    
    const btn = document.getElementById('calendarBtn');
    if(btn) { btn.href = url; btn.setAttribute('target', '_blank'); }
}

// === 10. CONFETTI CINEMÁTICO ===
function triggerCascadingConfetti() {
    const runtime = 2500;
    const expiry = Date.now() + runtime;
    const colors = ['#ff2a5f', '#ffffff', '#ffd700', '#7b2cbf'];

    (function frame() {
        confetti({ particleCount: 3, angle: 55, spread: 55, origin: { x: 0, y: 0.75 }, colors });
        confetti({ particleCount: 3, angle: 125, spread: 55, origin: { x: 1, y: 0.75 }, colors });

        if (Date.now() < expiry) requestAnimationFrame(frame);
    }());
}

function copyPlan() {
    const dateText = document.getElementById('resDate').innerText;
    const timeText = document.getElementById('resTime').innerText;
    const msg = `¡Plan confirmado! ✨\nNos vemos el ${dateText} a las ${timeText} para ir por ${selectedFood}.`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(() => {
            alert("Los parámetros del plan han sido copiados al portapapeles. Procede a pegarlo en el canal de WhatsApp 🚀");
        });
    } else {
        alert("Copiado automático no soportado. Toma una captura de pantalla para confirmar el despliegue 📱");
    }
}
