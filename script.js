const questions = [
    {
        question: "Rukun Islam yang pertama adalah...",
        options: ["Shalat", "Syahadat", "Zakat"],
        correct: 1 
    },
    {
        question: "Malaikat yang bertugas menyampaikan wahyu adalah...",
        options: ["Mikail", "Israfil", "Jibril"],
        correct: 2 
    },
    {
        question: "Kitab suci umat Islam adalah...",
        options: ["Al-Qur'an", "Injil", "Taurat"],
        correct: 0 
    }
];

let currentQuestionIndex = 0;
let score = 0;
let pointerX = 0;
let pointerY = 0;
let hoverStartTime = null;
let selectedOptionHovered = null;
const HOVER_DURATION_MS = 1500; 

const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const questionText = document.getElementById('question-text');
const scoreDisplay = document.getElementById('score');
const optionButtons = [
    document.getElementById('opt-0'),
    document.getElementById('opt-1'),
    document.getElementById('opt-2')
];

function loadQuestion() {
    let q = questions[currentQuestionIndex];
    questionText.innerText = q.question;
    q.options.forEach((opt, idx) => {
        optionButtons[idx].innerText = opt;
    });
    hoverStartTime = null;
    selectedOptionHovered = null;
}

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
        const indexTip = landmarks[8];
        pointerX = indexTip.x * canvasElement.width;
        pointerY = indexTip.y * canvasElement.height;

        canvasCtx.beginPath();
        canvasCtx.arc(pointerX, pointerY, 12, 0, 2 * Math.PI);
        canvasCtx.fillStyle = '#e74c3c';
        canvasCtx.fill();
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = '#white';
        canvasCtx.stroke();

        checkButtonCollision();
    } else {
        resetHover();
    }
    canvasCtx.restore();
}

function checkButtonCollision() {
    let mirroredX = canvasElement.width - pointerX;
    let hitIndex = -1;

    optionButtons.forEach((btn, index) => {
        const rect = btn.getBoundingClientRect();
        const areaRect = canvasElement.getBoundingClientRect();
        
        let btnLeft = (rect.left - areaRect.left) * (canvasElement.width / areaRect.width);
        let btnRight = (rect.right - areaRect.left) * (canvasElement.width / areaRect.width);
        let btnTop = (rect.top - areaRect.top) * (canvasElement.height / areaRect.height);
        let btnBottom = (rect.bottom - areaRect.top) * (canvasElement.height / areaRect.height);

        if (mirroredX >= btnLeft && mirroredX <= btnRight && pointerY >= btnTop && pointerY <= btnBottom) {
            hitIndex = index;
        }
    });

    if (hitIndex !== -1) {
        optionButtons.forEach((b, i) => {
            if (i === hitIndex) b.classList.add('active-hover');
            else b.classList.remove('active-hover');
        });

        if (selectedOptionHovered !== hitIndex) {
            selectedOptionHovered = hitIndex;
            hoverStartTime = Date.now();
        } else {
            let elapsedTime = Date.now() - hoverStartTime;
            if (elapsedTime >= HOVER_DURATION_MS) {
                submitAnswer(hitIndex);
                resetHover();
            }
        }
    } else {
        resetHover();
    }
}

function resetHover() {
    selectedOptionHovered = null;
    hoverStartTime = null;
    optionButtons.forEach(b => b.classList.remove('active-hover'));
}

function submitAnswer(selectedIndex) {
    let q = questions[currentQuestionIndex];
    if (selectedIndex === q.correct) {
        score += 10;
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

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();

loadQuestion();