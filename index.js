// PDF Presenter - Core Logic & Interactive Enhancements

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dragActiveOverlay = document.getElementById('dragActiveOverlay');
const addMoreBtn = document.getElementById('addMoreBtn');
const fileListContainer = document.getElementById('fileListContainer');
const fileList = document.getElementById('fileList');
const fileCountSpan = document.getElementById('fileCount');
const totalSizeText = document.getElementById('totalSizeText');
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const timerInput = document.getElementById('timerInput');
const presetPills = document.querySelectorAll('.preset-pill');

// Presentation Overlay Elements
const presentationOverlay = document.getElementById('presentationOverlay');
const pdfViewer = document.getElementById('pdfViewer');
const imageViewer = document.getElementById('imageViewer');
const currentFileLabel = document.getElementById('currentFileLabel');
const pageCounter = document.getElementById('pageCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const closeBtn = document.getElementById('closeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const presentationProgress = document.getElementById('presentationProgress');

// Slide Timer Elements
const timerPillContainer = document.getElementById('timerPillContainer');
const slideTimerInput = document.getElementById('slideTimerInput');
const slideTimerDisplay = document.getElementById('slideTimerDisplay');
const slideTimerDot = document.getElementById('slideTimerDot');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const addTimeBtn = document.getElementById('addTimeBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');

// Time's Up Alert Elements
const timesUpBanner = document.getElementById('timesUpBanner');
const timesUpAddMinBtn = document.getElementById('timesUpAddMinBtn');
const timesUpNextBtn = document.getElementById('timesUpNextBtn');
const timesUpDismissBtn = document.getElementById('timesUpDismissBtn');
const screenAlertGlow = document.getElementById('screenAlertGlow');

// Theme & Modal Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const shortcutsModalBtn = document.getElementById('shortcutsModalBtn');
const shortcutsModal = document.getElementById('shortcutsModal');
const closeShortcutsModal = document.getElementById('closeShortcutsModal');
const gotItBtn = document.getElementById('gotItBtn');

// State Variables
let pdfFiles = [];
let currentFileIndex = 0;
let slideTimerInterval;
let slideTimeRemaining;
let isTimerRunning = false;
let isSoundEnabled = true;

/* ========================================================
   Theme Management (Light / Dark Mode)
   ======================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    if (!themeIcon) return;
    if (isDark) {
        themeIcon.className = 'ph ph-sun text-lg text-amber-400';
    } else {
        themeIcon.className = 'ph ph-moon text-lg text-slate-600 dark:text-slate-300';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });
}
initTheme();

/* ========================================================
   Keyboard Shortcuts Modal
   ======================================================== */
function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.remove('hidden');
}

function closeShortcutsModalHandler() {
    if (shortcutsModal) shortcutsModal.classList.add('hidden');
}

if (shortcutsModalBtn) shortcutsModalBtn.addEventListener('click', openShortcutsModal);
if (closeShortcutsModal) closeShortcutsModal.addEventListener('click', closeShortcutsModalHandler);
if (gotItBtn) gotItBtn.addEventListener('click', closeShortcutsModalHandler);

if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) closeShortcutsModalHandler();
    });
}

/* ========================================================
   File Upload & Drag-and-Drop Zone
   ======================================================== */
if (dropZone) {
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragActiveOverlay) dragActiveOverlay.style.opacity = '1';
        });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragActiveOverlay) dragActiveOverlay.style.opacity = '0';
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragActiveOverlay) dragActiveOverlay.style.opacity = '0';

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
            file.type === 'application/pdf' || file.type.startsWith('image/')
        );

        if (droppedFiles.length > 0) {
            pdfFiles = [...pdfFiles, ...droppedFiles];
            renderFileList();
        }
    });
}

if (addMoreBtn) {
    addMoreBtn.addEventListener('click', () => {
        fileInput.click();
    });
}

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        pdfFiles = [...pdfFiles, ...files];
        renderFileList();
    }
});

// Clear All Files
clearBtn.addEventListener('click', () => {
    if (pdfFiles.length === 0) return;
    pdfFiles = [];
    renderFileList();
    fileInput.value = '';
});

/* ========================================================
   Render File List & File Cards
   ======================================================== */
function renderFileList() {
    fileList.innerHTML = '';
    fileCountSpan.textContent = pdfFiles.length;

    let totalBytes = 0;

    if (pdfFiles.length > 0) {
        fileListContainer.classList.remove('hidden');

        pdfFiles.forEach((file, index) => {
            totalBytes += file.size;

            const isImage = file.type.startsWith('image/');
            const typeClass = isImage ? 'image' : 'pdf';
            const iconName = isImage ? 'ph-file-image' : 'ph-file-pdf';

            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.index = index;
            li.fileObj = file;

            li.innerHTML = `
                <div class="file-item-left">
                    <span class="file-drag-handle" title="ลากเพื่อย้ายตำแหน่ง">
                        <i class="ph ph-dots-six-vertical text-lg"></i>
                    </span>
                    <span class="file-badge-index">#${index + 1}</span>
                    <div class="file-type-icon ${typeClass}">
                        <i class="ph ${iconName}"></i>
                    </div>
                    <div class="file-info">
                        <span class="file-name-text" title="${file.name}">${file.name}</span>
                        <div class="file-meta-sub">
                            <span>${formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>${isImage ? 'รูปภาพ' : 'เอกสาร PDF'}</span>
                        </div>
                    </div>
                </div>
                <div class="file-item-actions">
                    <button type="button" class="file-delete-btn" title="ลบไฟล์นี้" data-index="${index}">
                        <i class="ph ph-trash text-base"></i>
                    </button>
                </div>
            `;

            // Delete single file event
            const deleteBtn = li.querySelector('.file-delete-btn');
            deleteBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                removeFileAtIndex(index);
            });

            // Drag Events
            li.addEventListener('dragstart', () => {
                li.classList.add('dragging');
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                updatePdfFilesOrder();
            });

            fileList.appendChild(li);
        });

        if (totalSizeText) {
            totalSizeText.textContent = `ขนาดรวม: ${formatFileSize(totalBytes)}`;
        }
    } else {
        fileListContainer.classList.add('hidden');
        if (totalSizeText) totalSizeText.textContent = 'ขนาดรวม: 0 MB';
    }
}

function removeFileAtIndex(index) {
    pdfFiles.splice(index, 1);
    renderFileList();
    if (pdfFiles.length === 0) {
        fileInput.value = '';
    }
}

// Drag & Drop Reorder Logic
fileList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(fileList, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (!draggable) return;

    if (afterElement == null) {
        fileList.appendChild(draggable);
    } else {
        fileList.insertBefore(draggable, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updatePdfFilesOrder() {
    const newFiles = [];
    const listItems = fileList.querySelectorAll('li');
    listItems.forEach((li, idx) => {
        if (li.fileObj) {
            newFiles.push(li.fileObj);
            const indexBadge = li.querySelector('.file-badge-index');
            if (indexBadge) indexBadge.textContent = `#${idx + 1}`;
            const deleteBtn = li.querySelector('.file-delete-btn');
            if (deleteBtn) deleteBtn.dataset.index = idx;
        }
    });
    pdfFiles = newFiles;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/* ========================================================
   Timer Presets
   ======================================================== */
if (presetPills) {
    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const time = pill.dataset.time;
            if (timerInput) timerInput.value = time;
            if (slideTimerInput) slideTimerInput.value = time;

            presetPills.forEach(p => {
                p.classList.remove('bg-brand-50', 'dark:bg-brand-950', 'text-brand-700', 'dark:text-brand-300', 'border-brand-200', 'dark:border-brand-800');
                p.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
            });

            pill.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
            pill.classList.add('bg-brand-50', 'dark:bg-brand-950', 'text-brand-700', 'dark:text-brand-300', 'border-brand-200', 'dark:border-brand-800');
        });
    });
}

if (timerInput) {
    timerInput.addEventListener('change', () => {
        const val = parseInt(timerInput.value) || 5;
        if (slideTimerInput) slideTimerInput.value = val;
    });
}

/* ========================================================
   Start Presentation
   ======================================================== */
startBtn.addEventListener('click', () => {
    if (pdfFiles.length === 0) return;
    currentFileIndex = 0;

    // Sync timer setting
    if (timerInput && slideTimerInput) {
        const presetMinutes = parseInt(timerInput.value) || 5;
        slideTimerInput.value = presetMinutes;
    }

    resetSlideTimer();
    toggleSlideTimer();
    showPresentationOverlay();
    loadCurrentFile();
});

/* ========================================================
   Web Audio Sound Synthesizer (Crystal Chime Tone)
   ======================================================== */
function playTimesUpSound() {
    if (!isSoundEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();

        // 2-tone melodic chime: G5 -> C6
        const notes = [
            { freq: 783.99, time: 0, duration: 0.4 },     // G5
            { freq: 1046.50, time: 0.18, duration: 0.8 }  // C6
        ];

        notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime + note.time);

            gain.gain.setValueAtTime(0.25, audioCtx.currentTime + note.time);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + note.time + note.duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(audioCtx.currentTime + note.time);
            osc.stop(audioCtx.currentTime + note.time + note.duration);
        });
    } catch (e) {
        console.warn('Audio playback error', e);
    }
}

/* ========================================================
   Time's Up Alert System
   ======================================================== */
function triggerTimesUpAlert() {
    if (timesUpBanner) timesUpBanner.classList.remove('hidden');
    if (screenAlertGlow) screenAlertGlow.classList.remove('hidden');
    if (timerPillContainer) {
        timerPillContainer.classList.remove('timer-warning');
        timerPillContainer.classList.add('timer-danger');
    }
    playTimesUpSound();
}

function clearTimesUpAlert() {
    if (timesUpBanner) timesUpBanner.classList.add('hidden');
    if (screenAlertGlow) screenAlertGlow.classList.add('hidden');
    if (timerPillContainer) {
        timerPillContainer.classList.remove('timer-warning', 'timer-danger');
    }
}

// Add 1 Minute Extension
function addOneMinute() {
    slideTimeRemaining = (slideTimeRemaining > 0 ? slideTimeRemaining : 0) + 60;
    clearTimesUpAlert();
    updateSlideTimerDisplay();
    if (!isTimerRunning) {
        toggleSlideTimer();
    }
}

if (addTimeBtn) addTimeBtn.addEventListener('click', addOneMinute);
if (timesUpAddMinBtn) timesUpAddMinBtn.addEventListener('click', addOneMinute);

if (timesUpDismissBtn) {
    timesUpDismissBtn.addEventListener('click', clearTimesUpAlert);
}

if (timesUpNextBtn) {
    timesUpNextBtn.addEventListener('click', () => {
        clearTimesUpAlert();
        if (currentFileIndex < pdfFiles.length - 1) {
            currentFileIndex++;
            loadCurrentFile();
        }
    });
}

// Sound Mute / Unmute Toggle
if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        if (isSoundEnabled) {
            soundIcon.className = 'ph ph-bell';
            soundToggleBtn.title = 'ปิดเสียงแจ้งเตือนเมื่อหมดเวลา';
            soundToggleBtn.classList.remove('text-rose-400');
            soundToggleBtn.classList.add('text-slate-300');
        } else {
            soundIcon.className = 'ph ph-bell-slash text-rose-400';
            soundToggleBtn.title = 'เปิดเสียงแจ้งเตือนเมื่อหมดเวลา';
            soundToggleBtn.classList.remove('text-slate-300');
            soundToggleBtn.classList.add('text-rose-400');
        }
    });
}

/* ========================================================
   Per-File Slide Timer Logic
   ======================================================== */
function resetSlideTimer() {
    clearInterval(slideTimerInterval);
    isTimerRunning = false;
    clearTimesUpAlert();

    if (timerToggleBtn) {
        timerToggleBtn.innerHTML = '<i class="ph ph-play"></i>';
        timerToggleBtn.title = "เริ่มจับเวลา";
    }

    const minutes = parseInt(slideTimerInput.value) || 5;
    slideTimeRemaining = minutes * 60;
    updateSlideTimerDisplay();
}

function toggleSlideTimer() {
    if (isTimerRunning) {
        // Pause
        clearInterval(slideTimerInterval);
        isTimerRunning = false;
        if (timerToggleBtn) {
            timerToggleBtn.innerHTML = '<i class="ph ph-play"></i>';
            timerToggleBtn.title = "เริ่มจับเวลาต่อ";
        }
    } else {
        // Start
        if (slideTimeRemaining <= 0) resetSlideTimer();

        isTimerRunning = true;
        if (timerToggleBtn) {
            timerToggleBtn.innerHTML = '<i class="ph ph-pause"></i>';
            timerToggleBtn.title = "หยุดจับเวลาชั่วคราว";
        }

        slideTimerInterval = setInterval(() => {
            slideTimeRemaining--;
            updateSlideTimerDisplay();

            if (slideTimeRemaining <= 0) {
                clearInterval(slideTimerInterval);
                isTimerRunning = false;
                if (timerToggleBtn) {
                    timerToggleBtn.innerHTML = '<i class="ph ph-play"></i>';
                }
                triggerTimesUpAlert();
            }
        }, 1000);
    }
}

function updateSlideTimerDisplay() {
    const m = Math.floor(Math.max(0, slideTimeRemaining) / 60);
    const s = Math.max(0, slideTimeRemaining) % 60;
    slideTimerDisplay.textContent = `${pad(m)}:${pad(s)}`;

    if (slideTimeRemaining <= 0) {
        slideTimerDisplay.style.color = "#ef4444";
        if (slideTimerDot) {
            slideTimerDot.className = "w-2 h-2 rounded-full bg-rose-500 animate-ping";
        }
    } else if (slideTimeRemaining <= 30) {
        slideTimerDisplay.style.color = "#f59e0b"; // Warning amber
        if (slideTimerDot) {
            slideTimerDot.className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
        }
        if (timerPillContainer) {
            timerPillContainer.classList.remove('timer-danger');
            timerPillContainer.classList.add('timer-warning');
        }
    } else {
        slideTimerDisplay.style.color = "#34d399"; // Calming emerald
        if (slideTimerDot) {
            slideTimerDot.className = "w-2 h-2 rounded-full bg-emerald-400";
        }
        if (timerPillContainer) {
            timerPillContainer.classList.remove('timer-warning', 'timer-danger');
        }
    }
}

timerToggleBtn.addEventListener('click', toggleSlideTimer);
timerResetBtn.addEventListener('click', resetSlideTimer);
slideTimerInput.addEventListener('change', resetSlideTimer);

function pad(num) {
    return num.toString().padStart(2, '0');
}

/* ========================================================
   Presentation Overlay View Controls
   ======================================================== */
function showPresentationOverlay() {
    presentationOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hidePresentationOverlay() {
    presentationOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    pdfViewer.src = '';
    imageViewer.src = '';
    imageViewer.classList.add('hidden');
    pdfViewer.classList.remove('hidden');

    clearInterval(slideTimerInterval);
    isTimerRunning = false;
    clearTimesUpAlert();

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

function loadCurrentFile() {
    const file = pdfFiles[currentFileIndex];
    if (!file) return;

    const fileURL = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
        pdfViewer.classList.add('hidden');
        imageViewer.classList.remove('hidden');
        imageViewer.src = fileURL;
    } else {
        imageViewer.classList.add('hidden');
        pdfViewer.classList.remove('hidden');
        pdfViewer.src = fileURL + "#toolbar=0&navpanes=0&scrollbar=0&view=FitV&zoom=page-fit";
    }

    currentFileLabel.textContent = file.name;
    pageCounter.textContent = `File ${currentFileIndex + 1} of ${pdfFiles.length}`;

    // Update Progress Bar
    if (presentationProgress && pdfFiles.length > 0) {
        const progressPercent = ((currentFileIndex + 1) / pdfFiles.length) * 100;
        presentationProgress.style.width = `${progressPercent}%`;
    }

    prevBtn.disabled = currentFileIndex === 0;
    nextBtn.disabled = currentFileIndex === pdfFiles.length - 1;
}

// Navigation Controls
prevBtn.addEventListener('click', () => {
    if (currentFileIndex > 0) {
        currentFileIndex--;
        loadCurrentFile();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentFileIndex < pdfFiles.length - 1) {
        currentFileIndex++;
        loadCurrentFile();
    }
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        presentationOverlay.requestFullscreen().catch(err => {
            alert(`ไม่สามารถเปิดโหมดเต็มจอได้: ${err.message}`);
        });
    } else {
        document.exitFullscreen().catch(() => {});
    }
});

closeBtn.addEventListener('click', () => {
    hidePresentationOverlay();
});

// Global Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // If overlay is hidden, check if Enter is pressed to start
    if (presentationOverlay.classList.contains('hidden')) {
        if (e.key === 'Enter' && pdfFiles.length > 0 && document.activeElement !== timerInput) {
            startBtn.click();
        }
        return;
    }

    // When in presentation mode
    if (e.key === 'ArrowRight' || e.key === ' ') {
        if (e.key === ' ') e.preventDefault();
        if (currentFileIndex < pdfFiles.length - 1) {
            currentFileIndex++;
            loadCurrentFile();
        }
    } else if (e.key === 'ArrowLeft') {
        if (currentFileIndex > 0) {
            currentFileIndex--;
            loadCurrentFile();
        }
    } else if (e.key === 'Escape') {
        hidePresentationOverlay();
    } else if (e.key === 'f' || e.key === 'F') {
        fullscreenBtn.click();
    }
});
