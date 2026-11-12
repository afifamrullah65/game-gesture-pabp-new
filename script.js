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
        correct: 3 // D (Telunjuk Saja)
    }
];

let playerName = "";
let currentQuestionIndex = 0;
let score = 0;
let holdStartTime = null;
let detectedGestureTarget = null;
const HOLD_DURATION_MS = 1500; // Tahan gestur 1.5 detik untuk memilih
const WEB_APP_URL = "GANTI_DENGAN_URL_DEPLOY_APPS_SCRIPT_ANDA"; // Masukkan URL Apps Script di sini nanti

const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score');
const statusGesture = document.getElementById('status-gesture');

function startQuiz() {
    const inputName = document.getElementById('student-name').value.trim();
    if (!inputName) {
        alert("Silakan masukkan nama Anda terlebih dahulu!");
        return;
    }
    playerName = inputName;
    document.getElementById('display-name').innerText = playerName;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    loadQuestion();
    camera.start();
}

function loadQuestion() {
    let q = questions[currentQuestionIndex];
    questionText.innerText = q.question;
    optionsContainer.innerHTML = "";
    
    const labels = ['A (Mengepal)', 'B (Piece)', 'C (Lima Jari)', 'D (Telunjuk)'];
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
        let gestureIndex = recognizeGesture(landmarks);
        
        if (gestureIndex !== -1) {
            let gestureNames = ['A (Mengepal)', 'B (Piece)', 'C (Lima Jari)', 'D (Telunjuk)'];
            statusGesture.innerText = `Terdeteksi: ${gestureNames[gestureIndex]}`;
            
            highlightButton(gestureIndex);
            handleSelection(gestureIndex);
        } else {
            statusGesture.innerText = "Tunjukkan Gestur A, B, C, atau D";
            resetHold();
        }
    } else {
        statusGesture.innerText = "Tangan Tidak Terdeteksi";
        resetHold();
    }
    canvasCtx.restore();
}

// --- KLASIFIKASI 4 GESTUR TANGAN ---
function recognizeGesture(lm) {
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const wrist = lm[0];

    const isThumbOpen = dist(lm[4], wrist) > dist(lm[3], wrist);
    const isIndexOpen = lm[8].y < lm[6].y;
    const isMiddleOpen = lm[12].y < lm[10].y;
    const isRingOpen = lm[16].y < lm[14].y;
    const isPinkyOpen = lm[20].y < lm[18].y;

    // A: Mengepal (Semua jari menekuk)
    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return 0;

    // B: Piece / V-Sign (Telunjuk & Tengah lurus, lainnya menekuk)
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return 1;

    // C: Lima Jari (Semua terbuka)
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return 2;

    // D: Telunjuk Saja (Telunjuk lurus ke atas, jari lain mengepal)
    if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return 3;

    return -1;
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
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion(); // Langsung lanjut tanpa popup
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('finish-screen').style.display = 'block';
    document.getElementById('final-name').innerText = playerName;
    document.getElementById('final-score').innerText = score;

    // Kirim data otomatis ke Google Spreadsheet via Apps Script
    sendDataToSpreadsheet(playerName, score);
}

function sendDataToSpreadsheet(name, finalScore) {
    if (WEB_APP_URL.includes("GANTI_DENGAN_URL")) {
        document.getElementById('sync-status').innerText = "Catatan: URL Google Apps Script belum diatur.";
        return;
    }

    let data = { nama: name, skor: finalScore };
    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(() => {
        document.getElementById('sync-status').innerText = "Data nilai berhasil disimpan ke Google Spreadsheet!";
    })
    .catch((error) => {
        document.getElementById('sync-status').innerText = "Gagal menyimpan data ke spreadsheet.";
        console.error("Error:", error);
    });
}

// Inisialisasi Kamera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});