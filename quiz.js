// Chave da API do The Movie Database (TMDB)
const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';

// --- Variáveis de Estado do Jogo ---
let correctMovie = null;
let allMovies = [];
let score = 0;
let errors = 0;
let lives = 3;
let xp = 0;
let streak = 0;
let maxStreak = 0;
let timer;
let countdown = 10;
let gameMode = 'classic'; // 'classic', 'timeAttack', 'survival'
let selectedGenreId = '';
let fiftyFiftyHints = 1;
let extraTimeHints = 1;
let yearHints = 1;
let isMusicPlaying = false;
let gameInProgress = false;

// --- Elementos da DOM ---
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over-screen');
const modeSelection = document.getElementById('mode-selection');
const genreSelection = document.getElementById('genre-selection');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');
const optionsContainer = document.getElementById('options-container');
const actorsListElement = document.getElementById('actors-list');
const scoreCorrectElement = document.getElementById('score-correct');
const livesContainer = document.getElementById('lives-container');
const xpElement = document.getElementById('score-xp');
const finalScoreElement = document.getElementById('final-score');
const finalScoreXpElement = document.getElementById('final-score-xp');
const finalStreakElement = document.getElementById('final-streak');
const streakCounterElement = document.getElementById('streak-counter');
const leaderboardContainer = document.getElementById('leaderboard-container');

// Dicas
const hintFiftyFiftyBtn = document.getElementById('hint-fifty-fifty');
const hintExtraTimeBtn = document.getElementById('hint-extra-time');
const hintYearBtn = document.getElementById('hint-year');
const fiftyFiftyCountElement = document.getElementById('fifty-fifty-count');
const extraTimeCountElement = document.getElementById('extra-time-count');
const yearCountElement = document.getElementById('year-count');

// Botões
const modeButtons = document.querySelectorAll('.mode-btn');
const genreButtons = document.querySelectorAll('.genre-btn');

// Sons
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');
const gameOverSound = document.getElementById('game-over-sound');
const clickSound = document.getElementById('click-sound');
const hintSound = document.getElementById('hint-sound');
const tickSound = document.getElementById('tick-sound');
const backgroundMusic = document.getElementById('background-music');
const musicControlBtn = document.getElementById('music-control');

// Conquistas
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsOverlay = document.getElementById('achievements-overlay');
const closeAchievementsBtn = document.getElementById('close-achievements-btn');
const achievementsList = document.getElementById('achievements-list');
const achievementPopup = document.getElementById('achievement-popup');
const achievementPopupTitle = document.getElementById('achievement-popup-title');

// --- Definição das Conquistas ---
const achievements = {
    first_win: { name: "Cinéfilo Iniciante", description: "Vença sua primeira rodada.", unlocked: false },
    action_hero: { name: "Herói de Ação", description: "Vença 5 vezes na categoria Ação.", unlocked: false },
    comedy_king: { name: "Rei da Comédia", description: "Vença 5 vezes na categoria Comédia.", unlocked: false },
    sci_fi_master: { name: "Mestre da Ficção", description: "Vença 5 vezes na categoria Ficção Científica.", unlocked: false },
    streak_3: { name: "Embalado!", description: "Acerte 3 filmes seguidos.", unlocked: false },
    no_mistakes: { name: "Performance Perfeita", description: "Vença um jogo no modo Clássico sem perder vidas.", unlocked: false },
    time_attack_pro: { name: "Veloz e Curioso", description: "Faça mais de 1500 XP no modo Contra o Relógio.", unlocked: false },
    survivor: { name: "Sobrevivente Nato", description: "Alcance uma sequência de 5 no modo Sobrevivência.", unlocked: false }
};
let unlockedAchievements = {};
let genreWinCounters = {};

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadAchievements();
    loadGenreWinCounters();
    // Adiciona listener a todos os botões para o som de clique
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => playSound(clickSound));
    });
});

nextBtn.addEventListener('click', nextGame);
restartBtn.addEventListener('click', restartGame);
hintFiftyFiftyBtn.addEventListener('click', useFiftyFiftyHint);
hintExtraTimeBtn.addEventListener('click', useExtraTimeHint);
hintYearBtn.addEventListener('click', useYearHint);
achievementsBtn.addEventListener('click', showAchievements);
closeAchievementsBtn.addEventListener('click', () => achievementsOverlay.style.display = 'none');
musicControlBtn.addEventListener('click', toggleMusic);

modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        gameMode = button.dataset.mode;
        modeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        genreSelection.style.display = 'block';
    });
});

genreButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!gameMode) {
            alert("Por favor, selecione um modo de jogo primeiro!");
            return;
        }
        selectedGenreId = button.dataset.genreId;
        startGame();
    });
});

// --- Funções de Som ---
function playSound(soundElement) {
    if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.play().catch(e => console.log("Reprodução de áudio interrompida pelo usuário."));
    }
}

function toggleMusic() {
    playSound(clickSound);
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicControlBtn.classList.add('muted');
        musicControlBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        backgroundMusic.play().catch(e => console.log("Música não pode iniciar automaticamente."));
        musicControlBtn.classList.remove('muted');
        musicControlBtn.innerHTML = '<i class="fas fa-music"></i>';
    }
    isMusicPlaying = !isMusicPlaying;
}

// --- Lógica do Jogo ---
function startGame() {
    gameInProgress = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    score = 0;
    errors = 0;
    xp = 0;
    streak = 0;
    maxStreak = 0;
    fiftyFiftyHints = 1;
    extraTimeHints = 1;
    yearHints = 1;

    switch (gameMode) {
        case 'classic':
            lives = 3;
            countdown = 10;
            timerElement.style.display = 'block';
            livesContainer.style.display = 'block';
            xpElement.style.display = 'block';
            break;
        case 'timeAttack':
            lives = 1;
            countdown = 90;
            timerElement.style.display = 'block';
            livesContainer.style.display = 'none';
            xpElement.style.display = 'block';
            startGlobalTimer();
            break;
        case 'survival':
            lives = 1;
            countdown = 0;
            timerElement.style.display = 'none';
            livesContainer.style.display = 'block';
            xpElement.style.display = 'none';
            break;
    }
    
    nextGame();
}

function restartGame() {
    gameInProgress = false;
    gameMode = null;
    selectedGenreId = '';
    modeButtons.forEach(btn => btn.classList.remove('selected'));
    genreSelection.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameContainer.style.display = 'none';
    startScreen.style.display = 'block';
    clearInterval(timer);
}

function nextGame() {
    resultElement.textContent = '';
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = '';
    actorsListElement.textContent = 'A carregar filmes...';
    streakCounterElement.style.display = streak > 0 ? 'block' : 'none';
    streakCounterElement.textContent = `Sequência de Acertos: ${streak}`;

    updateHintCounts();
    hintFiftyFiftyBtn.disabled = fiftyFiftyHints <= 0;
    hintExtraTimeBtn.disabled = extraTimeHints <= 0;
    hintYearBtn.disabled = yearHints <= 0;
    hintExtraTimeBtn.style.display = gameMode !== 'survival' ? 'inline-block' : 'none';

    if (gameMode === 'classic') {
        clearInterval(timer);
        countdown = 10;
        timerElement.textContent = countdown;
        timerElement.classList.remove('expired', 'warning');
    }
    
    updateScoreDisplay();

    loadMovies().then(() => {
        displayGame();
        if (gameMode === 'classic') {
            startTimer();
        }
    }).catch(error => {
        console.error('Falha crítica ao carregar filmes:', error);
        actorsListElement.textContent = 'Não foi possível carregar filmes desta categoria.';
    });
}

// --- Carregamento de Filmes (API) ---
function loadMovies() {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&sort_by=popularity.desc&page=${randomPage}&include_adult=false&vote_count.gte=500`;
    if (selectedGenreId ) {
        url += `&with_genres=${selectedGenreId}`;
    }
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Falha na resposta da rede');
            return response.json();
        })
        .then(data => {
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            if (moviesWithPosters.length < 4) {
                console.warn("Página com poucos filmes válidos, a recarregar...");
                return loadMovies();
            }
            allMovies = moviesWithPosters.sort(() => 0.5 - Math.random()).slice(0, 4);
            correctMovie = allMovies[Math.floor(Math.random() * allMovies.length)];
            return getMovieCast(correctMovie.id);
        })
        .then(cast => {
            if (!cast || cast.length === 0) {
                console.warn('Filme correto não tem elenco. A recarregar nova ronda.');
                return loadMovies();
            }
            correctMovie.cast = cast;
        });
}

function getMovieCast(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=pt-BR` )
        .then(response => response.json())
        .then(data => data.cast.slice(0, 3));
}

function displayGame() {
    const actors = correctMovie.cast.map(actor => actor.name).join(", ");
    actorsListElement.textContent = `Atores: ${actors}`;
    allMovies.sort(() => Math.random() - 0.5);
    optionsContainer.innerHTML = '';
    allMovies.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        img.alt = movie.title;
        img.classList.add('image-option' );
        img.style.visibility = 'visible'; 
        img.onclick = () => checkAnswer(movie, img);
        optionsContainer.appendChild(img);
    });
}

// --- Lógica de Resposta e Fim de Jogo ---
function checkAnswer(selectedMovie, selectedImageElement) {
    if (gameMode !== 'timeAttack') clearInterval(timer);
    const allImages = document.querySelectorAll('.image-option');
    allImages.forEach(img => img.classList.add('disabled'));

    if (selectedMovie.id === correctMovie.id) {
        handleCorrectAnswer(selectedImageElement);
    } else {
        handleIncorrectAnswer(selectedImageElement);
    }
}

function handleCorrectAnswer(selectedImageElement) {
    playSound(correctSound);
    resultElement.textContent = 'Parabéns! Acertou!';
    resultElement.style.color = '#4caf50';
    selectedImageElement.classList.add('correct');
    score++;
    streak++;
    if (streak > maxStreak) maxStreak = streak;

    if (gameMode !== 'survival') {
        const pointsEarned = 100 + (countdown > 0 ? countdown : 0);
        xp += pointsEarned;
    }
    if (gameMode === 'timeAttack') countdown += 5;

    if (streak > 0 && streak % 3 === 0) {
        fiftyFiftyHints++;
        updateHintCounts();
    }

    if (selectedGenreId) {
        genreWinCounters[selectedGenreId] = (genreWinCounters[selectedGenreId] || 0) + 1;
        saveGenreWinCounters();
    }

    updateScoreDisplay();
    checkAllAchievements();
    setTimeout(nextGame, 1500);
}

function handleIncorrectAnswer(selectedImageElement = null) {
    playSound(incorrectSound);
    resultElement.textContent = `Errado! O correto era: "${correctMovie.title}"`;
    resultElement.style.color = '#f44336';
    if(selectedImageElement) selectedImageElement.classList.add('incorrect');
    
    document.querySelectorAll('.image-option').forEach(img => {
        if (img.alt === correctMovie.title) img.classList.add('correct');
    });

    errors++;
    lives--;
    streak = 0;
    updateScoreDisplay();

    if (lives <= 0) {
        setTimeout(showGameOverScreen, 1500);
    } else {
        setTimeout(nextGame, 2500);
    }
}

function handleTimeout() {
    document.querySelectorAll('.image-option').forEach(img => img.classList.add('disabled'));
    handleIncorrectAnswer();
}

function showGameOverScreen() {
    gameInProgress = false;
    playSound(gameOverSound);
    clearInterval(timer);
    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'flex';

    finalScoreElement.style.display = 'none';
    finalScoreXpElement.style.display = 'none';
    finalStreakElement.style.display = 'none';

    let finalValue = 0;
    let isNewHighscore = false;

    switch (gameMode) {
        case 'survival':
            finalStreakElement.style.display = 'block';
            finalStreakElement.innerHTML = `Sequência Máxima: <span>${maxStreak}</span>`;
            finalValue = maxStreak;
            break;
        default: // classic e timeAttack
            finalScoreElement.style.display = 'block';
            finalScoreXpElement.style.display = 'block';
            finalScoreElement.innerHTML = `Vitórias: <span>${score}</span>`;
            finalScoreXpElement.innerHTML = `Pontuação Final: <span>${xp} XP</span>`;
            finalValue = xp;
            break;
    }

    checkAllAchievements(); // Checa conquistas de fim de jogo
    const highscores = getHighScores(gameMode);
    if (finalValue > 0 && (highscores.length < 5 || finalValue > highscores[highscores.length - 1])) {
        isNewHighscore = true;
    }
    saveHighScore(finalValue, gameMode);
    displayLeaderboard(gameMode, finalValue, isNewHighscore);
}

function updateScoreDisplay() {
    scoreCorrectElement.textContent = `Vitórias: ${score}`;
    livesContainer.textContent = `Vidas: ${lives}`;
    xpElement.textContent = `XP: ${xp}`;
}

// --- Dicas ---
function useFiftyFiftyHint() {
    playSound(hintSound);
    if (fiftyFiftyHints <= 0) return;
    fiftyFiftyHints--;
    updateHintCounts();
    hintFiftyFiftyBtn.disabled = true;
    const wrongOptions = Array.from(document.querySelectorAll('.image-option'))
        .filter(img => img.alt !== correctMovie.title);
    wrongOptions.sort(() => Math.random() - 0.5);
    wrongOptions.slice(0, 2).forEach(option => option.style.visibility = 'hidden');
}

function useExtraTimeHint() {
    playSound(hintSound);
    if (extraTimeHints <= 0 || gameMode === 'survival') return;
    extraTimeHints--;
    updateHintCounts();
    hintExtraTimeBtn.disabled = true;
    countdown += 5;
    timerElement.textContent = countdown;
}

function useYearHint() {
    playSound(hintSound);
    if (yearHints <= 0) return;
    yearHints--;
    updateHintCounts();
    hintYearBtn.disabled = true;
    fetch(`https://api.themoviedb.org/3/movie/${correctMovie.id}?api_key=${apiKey}&language=pt-BR` )
        .then(res => res.json())
        .then(data => {
            resultElement.textContent = `Dica: O filme foi lançado em ${new Date(data.release_date).getFullYear()}.`;
            resultElement.style.color = '#ffc107';
        });
}

function updateHintCounts() {
    fiftyFiftyCountElement.textContent = `(${fiftyFiftyHints})`;
    extraTimeCountElement.textContent = `(${extraTimeHints})`;
    yearCountElement.textContent = `(${yearHints})`;
}

// --- Cronômetro ---
function startTimer() {
    timer = setInterval(() => {
        countdown--;
        timerElement.textContent = countdown;
        if (countdown <= 5 && countdown > 3) {
            timerElement.classList.add('warning');
        } else if (countdown <= 3) {
            timerElement.classList.remove('warning');
            timerElement.classList.add('expired');
            if(countdown > 0) playSound(tickSound);
        }
        if (countdown <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function startGlobalTimer() {
    timer = setInterval(() => {
        countdown--;
        timerElement.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(timer);
            showGameOverScreen();
        }
    }, 1000);
}

// --- Sistema de Recordes (Leaderboard) ---
function saveHighScore(score, mode) {
    if (score <= 0) return;
    const highscores = getHighScores(mode);
    highscores.push(score);
    highscores.sort((a, b) => b - a);
    highscores.splice(5); // Mantém apenas os 5 melhores
    localStorage.setItem(`highscores_${mode}`, JSON.stringify(highscores));
}

function getHighScores(mode) {
    const scores = localStorage.getItem(`highscores_${mode}`);
    return scores ? JSON.parse(scores) : [];
}

function displayLeaderboard(mode, currentScore, isNewHighscore) {
    const highscores = getHighScores(mode);
    const table = document.getElementById('leaderboard-table');
    table.innerHTML = `<thead><tr><th>Pos.</th><th>Pontuação</th></tr></thead>`;
    const tbody = document.createElement('tbody');
    
    if (highscores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2">Nenhum recorde ainda!</td></tr>';
    } else {
        highscores.forEach((score, index) => {
            const tr = document.createElement('tr');
            let scoreText = (mode === 'survival' ? `${score} acertos` : `${score} XP`);
            if (isNewHighscore && score === currentScore) {
                tr.classList.add('new-highscore');
                scoreText += ' (Seu Novo Recorde!)';
                isNewHighscore = false; // Garante que a marcação apareça apenas uma vez
            }
            tr.innerHTML = `<td>${index + 1}º</td><td>${scoreText}</td>`;
            tbody.appendChild(tr);
        });
    }
    table.appendChild(tbody);
}

// --- Sistema de Conquistas ---
function loadAchievements() {
    const saved = localStorage.getItem('unlockedAchievements');
    if (saved) {
        unlockedAchievements = JSON.parse(saved);
        Object.keys(unlockedAchievements).forEach(key => {
            if (achievements[key]) achievements[key].unlocked = true;
        });
    }
}

function saveAchievements() {
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
}

function loadGenreWinCounters() {
    const saved = localStorage.getItem('genreWinCounters');
    if (saved) {
        genreWinCounters = JSON.parse(saved);
    } else {
        // Inicializa se não existir
        genreWinCounters = { '28': 0, '35': 0, '878': 0, '27': 0, '16': 0, '18': 0, '53': 0 };
    }
}

function saveGenreWinCounters() {
    localStorage.setItem('genreWinCounters', JSON.stringify(genreWinCounters));
}

function unlockAchievement(id) {
    if (!achievements[id] || achievements[id].unlocked) return;
    
    achievements[id].unlocked = true;
    unlockedAchievements[id] = true;
    saveAchievements();

    achievementPopupTitle.textContent = achievements[id].name;
    achievementPopup.style.display = 'block';
    setTimeout(() => {
        achievementPopup.style.display = 'none';
    }, 5000);
}

function checkAllAchievements() {
    if (score > 0) unlockAchievement('first_win');
    if (streak >= 3) unlockAchievement('streak_3');
    if (gameMode === 'survival' && maxStreak >= 5) unlockAchievement('survivor');
    
    if (selectedGenreId && genreWinCounters[selectedGenreId] >= 5) {
        if (selectedGenreId === '28') unlockAchievement('action_hero');
        if (selectedGenreId === '35') unlockAchievement('comedy_king');
        if (selectedGenreId === '878') unlockAchievement('sci_fi_master');
    }

    if (!gameInProgress) { // Apenas checar no fim do jogo
        if (gameMode === 'classic' && lives === 3 && score > 0) unlockAchievement('no_mistakes');
        if (gameMode === 'timeAttack' && xp >= 1500) unlockAchievement('time_attack_pro');
    }
}

function showAchievements() {
    achievementsList.innerHTML = '';
    for (const id in achievements) {
        const ach = achievements[id];
        const div = document.createElement('div');
        div.className = 'achievement';
        if (ach.unlocked) {
            div.classList.add('unlocked');
        }
        div.innerHTML = `<h4>${ach.name}</h4><p>${ach.description}</p>`;
        achievementsList.appendChild(div);
    }
    achievementsOverlay.style.display = 'flex';
}
