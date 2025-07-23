const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0'; // Sua chave da API
let correctMovie = null;
let allMovies = [];
let score = 0;
let errors = 0;
let timer;
let countdown = 10;

// Elementos da DOM
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');
const optionsContainer = document.getElementById('options-container');
const actorsListElement = document.getElementById('actors-list');
const scoreCorrectElement = document.getElementById('score-correct');
const scoreIncorrectElement = document.getElementById('score-incorrect');


// Event Listener para começar o jogo
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    nextGame();
});

// Event Listener para o botão "Próximo"
nextBtn.addEventListener('click', nextGame);

function nextGame() {
    // Reseta a interface para a nova rodada
    resultElement.textContent = '';
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = ''; // Limpa as capas anteriores
    actorsListElement.textContent = 'Carregando filmes...';

    // Reseta o timer
    clearInterval(timer);
    countdown = 10;
    timerElement.textContent = countdown;
    timerElement.classList.remove('expired', 'warning');
    
    // Inicia a busca pelos filmes e, em seguida, o jogo
    loadMovies().then(() => {
        displayGame();
        startTimer();
    }).catch(error => {
        console.error('Falha crítica ao carregar filmes:', error);
        actorsListElement.textContent = 'Não foi possível carregar os filmes. Tente novamente.';
        // Poderíamos adicionar um botão para "Tentar Novamente" aqui
    });
}

function loadMovies() {
    // Função para buscar um único filme aleatório válido
    const fetchRandomMovieWithPoster = async () => {
        while (true) {
            const randomMovieId = Math.floor(Math.random() * 5000) + 1;
            const response = await fetch(`https://api.themoviedb.org/3/movie/${randomMovieId}?api_key=${apiKey}&language=pt-BR`);
            if (response.ok) {
                const movie = await response.json();
                if (movie.poster_path) { // Garante que o filme tem um poster
                    return movie;
                }
            }
        }
    };
    
    // Busca 4 filmes com poster
    const moviePromises = [fetchRandomMovieWithPoster(), fetchRandomMovieWithPoster(), fetchRandomMovieWithPoster(), fetchRandomMovieWithPoster()];
    
    return Promise.all(moviePromises).then(movies => {
        allMovies = movies;
        // Escolhe um filme aleatório para ser a resposta correta
        correctMovie = allMovies[Math.floor(Math.random() * allMovies.length)];
        // Busca o elenco do filme correto
        return getMovieCast(correctMovie.id);
    }).then(cast => {
        correctMovie.cast = cast;
        if (cast.length === 0) {
            // Se o filme correto não tiver elenco, busca um novo conjunto de filmes
            console.warn('Filme correto sem elenco, recarregando...');
            return loadMovies();
        }
    });
}

function getMovieCast(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=pt-BR`)
        .then(response => response.json())
        .then(data => data.cast.slice(0, 3)); // Pega os 3 atores principais
}

function displayGame() {
    // Exibe os atores como dica
    const actors = correctMovie.cast.map(actor => actor.name).join(", ");
    actorsListElement.textContent = `Atores: ${actors}`;

    // Embaralha as opções de filmes para que a resposta correta não esteja sempre na mesma posição
    allMovies.sort(() => Math.random() - 0.5);

    // Cria e exibe as capas dos filmes
    allMovies.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        img.alt = movie.title;
        img.classList.add('image-option');
        img.onclick = () => checkAnswer(movie, img);
        optionsContainer.appendChild(img);
    });
}

function checkAnswer(selectedMovie, selectedImageElement) {
    clearInterval(timer); // Para o timer

    // Desativa o clique em todas as opções
    const allImages = document.querySelectorAll('.image-option');
    allImages.forEach(img => img.classList.add('disabled'));

    if (selectedMovie.id === correctMovie.id) {
        resultElement.textContent = 'Parabéns! Você acertou!';
        resultElement.style.color = '#4caf50';
        selectedImageElement.classList.add('correct');
        score++;
    } else {
        resultElement.textContent = `Errado! O correto era: "${correctMovie.title}"`;
        resultElement.style.color = '#f44336';
        selectedImageElement.classList.add('incorrect');
        // Encontra e destaca a imagem correta
        allImages.forEach(img => {
            if (img.alt === correctMovie.title) {
                img.classList.add('correct');
            }
        });
        errors++;
    }

    updateScoreDisplay();
    nextBtn.style.display = 'inline-block'; // Mostra o botão para ir para a próxima rodada
}

function updateScoreDisplay() {
    // CORRIGIDO: Atualiza os elementos corretos do placar
    scoreCorrectElement.textContent = `Vitórias: ${score}`;
    scoreIncorrectElement.textContent = `Derrotas: ${errors}`;
}

function startTimer() {
    timer = setInterval(() => {
        countdown--;
        timerElement.textContent = countdown;
        
        // Altera a cor do timer
        if (countdown <= 3) {
            timerElement.classList.add('expired');
            timerElement.classList.remove('warning');
        } else if (countdown <= 5) {
            timerElement.classList.add('warning');
        }

        if (countdown <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    resultElement.textContent = `Tempo esgotado! O correto era: "${correctMovie.title}"`;
    resultElement.style.color = '#f44336';
    errors++;

    // Destaca a resposta correta
    document.querySelectorAll('.image-option').forEach(img => {
        if (img.alt === correctMovie.title) {
            img.classList.add('correct');
        }
        img.classList.add('disabled');
    });

    updateScoreDisplay();
    nextBtn.style.display = 'inline-block';
}
