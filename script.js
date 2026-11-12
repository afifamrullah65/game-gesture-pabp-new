// --- 5 SOAL CONTOH PABP ---
const questions = [
    {
        question: "1. Rukun Islam yang pertama adalah...",
        options: ["Shalat", "Syahadat", "Zakat", "Haji"],
        correct: 1 // B (Syahadat)
    },
    {
        question: "2. Malaikat yang bertugas menyampaikan wahyu adalah...",
        options: ["Mikail", "Israfil", "Jibril", "Malik"],
        correct: 2 // C (Jibril)
    },
    {
        question: "3. Kitab suci umat Islam adalah...",
        options: ["Al-Qur'an", "Injil", "Taurat", "Zabur"],
        correct: 0 // A (Al-Qur'an)
    },
    {
        question: "4. Salat wajib dalam sehari semalam dikerjakan sebanyak...",
        options: ["3 Waktu", "4 Waktu", "5 Waktu", "6 Waktu"],
        correct: 2 // C (5 Waktu)
    },
    {
        question: "5. Nabi dan Rasul yang terakhir adalah...",
        options: ["Nabi Musa AS", "Nabi Isa AS", "Nabi Ibrahim AS", "Nabi Muhammad SAW"],
        correct: 3 // D (Nabi Muhammad SAW)
    }
];

let currentQuestionIndex = 0;
let score = 0;
let holdStartTime = null;
let detectedGestureTarget = null;
const HOLD_DURATION_MS = 1500; // Tahan gestur selama 1.5 detik untuk memilih

const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score');
const statusGesture = document.getElementById('status-gesture');

function loadQuestion() {
    let q = questions[currentQuestionIndex];
    questionText.innerText = q.question;
    optionsContainer.innerHTML = "";
    
    const labels = ['A (Mengepal)', 'B (Piece)', 'C (Lima Jari)', 'D (Jempol)'];
    q.options.forEach((opt, idx) => {
        let btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.id = `opt-${idx}`;
        btn.innerText = `${labels[idx]}: ${opt}`;
        optionsContainer.appendChild(btn);
    });

    holdStartTime = null;
    detectedGestureTarget = null;
}

// --- MEDIAPIPE HANDS SETUP ---
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults(onHandResults);

function onHandResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Deteksi Gestur Berdasarkan Posisi Jari
        let gestureIndex = recognizeGesture(landmarks);
        
        if (gestureIndex !== -1) {
            let gestureNames = ['A (Mengepal)', 'B (Piece)', 'C (Lima Jari)', 'D (Jempol)'];
            statusGesture.innerText = `Terdeteksi Gestur: ${gestureNames[gestureIndex]}`;
            
            highlightButton(gestureIndex);
            handleSelection(gestureIndex);
        } else {
            statusGesture.innerText = "Tunjukkan Gestur A, B, C, atau D";
            resetHold();
        }
    } else {
        statusGesture.innerText = "Tangan Tidak Terdeteksi di Kamera";
        resetHold();
    }
    canvasCtx.restore();
}

// --- LOGIKA KLASIFIKASI GESTUR TANGAN ---
function recognizeGesture(lm) {
    // Helper hitung jarak ujung jari ke pergelangan tangan (landmark 0)
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const wrist = lm[0];

    // Cek status jari (tekuk / lurus) berdasarkan jarak ke pergelangan
    const isThumbOpen = dist(lm[4], wrist) > dist(lm[3], wrist) && (lm[4].x - lm[3].x > 0.02 || lm[4].y < lm[3].y);
    const isIndexOpen = lm[8].y < lm[6].y;
    const isMiddleOpen = lm[12].y < lm[10].y;
    const isRingOpen = lm[16].y < lm[14].y;
    const isPinkyOpen = lm[20].y < lm[18].y;

    // 1. GESTUR A: Mengepal (Semua jari menekuk)
    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
        return 0; // Pilihan A
    }

    // 2. GESTUR B: Piece / V-Sign (Telunjuk & Tengah lurus, manis & kelingking menekuk)
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
        return 1; // Pilihan B
    }

    // 3. GESTUR C: Melambai Lima Jari (Semua jari terbuka)
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
        return 2; // Pilihan C
    }

    // 4. GESTUR D: Sip / Jempol (Jempol terbuka ke atas/samping, jari lain mengepal)
    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen && lm[4].y < lm[2].y) {
        return 3; // Pilihan D
    }

    return -1; // Tidak dikenal
}

function highlightButton(activeIndex) {
    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById(`opt-${i}`);
        if (btn) {
            if (i === activeIndex) btn.classList.add('active-hover');
            else btn.classList.remove('active-hover');
        }
    }
}

function handleSelection(gestureIndex) {
    if (detectedGestureTarget !== gestureIndex) {
        detectedGestureTarget = gestureIndex;
        holdStartTime = Date.now();
    } else {
        let elapsed = Date.now() - holdStartTime;
        if (elapsed >= HOLD_DURATION_MS) {
            submitAnswer(gestureIndex);
            resetHold();
        }
    }
}

function resetHold() {
    detectedGestureTarget = null;
    holdStartTime = null;
    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById(`opt-${i}`);
        if (btn) btn.classList.remove('active-hover');
    }
}

function submitAnswer(selectedIndex) {
    let q = questions[currentQuestionIndex];
    if (selectedIndex === q.correct) {
        score += 20;
        scoreDisplay.innerText = score;
        alert("Benar! Hebat!");
    } else {
        alert("Kurang tepat!");
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        alert("Permainan Selesai! Skor Akhir Anda: " + score);
        currentQuestionIndex = 0;
        score = 0;
        scoreDisplay.innerText = score;
        loadQuestion();
    }
}

// Inisialisasi Kamera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();

loadQuestion();