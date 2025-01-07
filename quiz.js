const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0'; // Sua chave da API
let correctMovie = null;
let allMovies = [];
let retryCount = 0; // Contador para as tentativas de recarga
let score = 0; // Placar de acertos
let errors = 0; // Contador de erros
let timer; // Variável para o timer
let countdown = 10; // Contagem regressiva de 10 segundos

document.addEventListener('DOMContentLoaded', () => {
    nextGame();
});

function nextGame() {
    // Limpar a tela e o resultado anterior
    document.getElementById('result').textContent = '';
    document.getElementById('next-btn').style.display = 'none';

    // Atualiza os placares de vitórias e derrotas separadamente
    document.getElementById('score-correct').textContent = `Vitórias: ${score}`;
    document.getElementById('score-incorrect').textContent = `Derrotas: ${errors}`;

    // Reiniciar a contagem regressiva
    countdown = 10;
    document.getElementById('timer').textContent = formatTime(countdown); // Exibe o tempo inicial como relógio digital

    // Limpa qualquer estilo do timer (remove a classe 'expired' e 'warning')
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('expired', 'warning'); 

    clearInterval(timer); // Limpa qualquer timer anterior
    startTimer(); // Inicia a contagem regressiva

    // Tentar buscar 4 filmes aleatórios com atores principais
    loadMovies()
        .then(() => {
            displayGame();
        })
        .catch(error => {
            console.error('Erro ao carregar os filmes:', error);
            // Tentar recarregar automaticamente após erro
            nextGame(); // Tenta recarregar
        });
  
      document.getElementById('next-btn').style.display = 'inline-block'; 
      console.log("Botão 'Próximo Filme' exibido.");
}



function loadMovies() {
    // Faz a requisição de 4 filmes aleatórios
    return Promise.all([getRandomMovie(), getRandomMovie(), getRandomMovie(), getRandomMovie()])
        .then(movies => {
            // Filtrando filmes que têm elenco principal
            return Promise.all(movies.map(movie => getMovieCast(movie.id)))
                .then(casts => {
                    // Associando atores aos filmes
                    movies.forEach((movie, index) => {
                        movie.cast = casts[index];
                    });

                    // Filtrando filmes que têm pelo menos um ator principal
                    allMovies = movies.filter(movie => movie.cast.length > 0);

                    // Se não houver nenhum filme com elenco, tenta novamente
                    if (allMovies.length === 0) {
                        throw new Error('Nenhum filme com elenco encontrado.');
                    }

                    // Escolher um filme aleatório com elenco
                    correctMovie = allMovies[Math.floor(Math.random() * allMovies.length)];
                });
        });
}

function getRandomMovie() {
    const randomMovieId = Math.floor(Math.random() * 1000) + 1; // Número aleatório para filme
    return fetch(`https://api.themoviedb.org/3/movie/${randomMovieId}?api_key=${apiKey}&language=pt-BR`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do filme');
            }
            return response.json();
        });
}

function getMovieCast(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=pt-BR`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar elenco');
            }
            return response.json();
        })
        .then(data => data.cast.slice(0, 3)); // Pegamos os 3 primeiros atores principais
}

function displayGame() {
    // Exibir os atores principais como dica
    const actors = correctMovie.cast.map(actor => actor.name).join(", ") || "Elenco não disponível.";
    document.getElementById('synopsis').textContent = `Atores principais: ${actors}`;

    // Gerar as opções de capas
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Limpar opções anteriores

    allMovies.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        img.alt = movie.title;
        img.classList.add('image-option');
        img.onclick = () => checkAnswer(movie);
        optionsContainer.appendChild(img);
    });
}

function checkAnswer(selectedMovie) {
    clearInterval(timer); // Parar o timer quando o jogador fizer a escolha

    if (selectedMovie === correctMovie) {
        document.getElementById('result').textContent = 'Parabéns! Você acertou!';
        score++; // Incrementar o placar de acertos
    } else {
        document.getElementById('result').textContent = `Errado! A resposta correta era: "${correctMovie.title}"`;
        errors++; // Incrementar o contador de erros
    }

    // Atualiza o placar e muda as cores
    updateScoreDisplay();

    document.getElementById('next-btn').style.display = 'inline-block'; // Mostrar o botão de próximo filme
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Acertos: ${score} | Erros: ${errors}`;

    // Atualiza a cor de acordo com o número de acertos/erros
    scoreElement.classList.remove('correct', 'incorrect');
    if (score > errors) {
        scoreElement.classList.add('correct');
    } else {
        scoreElement.classList.add('incorrect');
    }
}

// Função para formatar o tempo no estilo de relógio digital
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer() {
    // Iniciar a contagem regressiva
    timer = setInterval(() => {
        countdown--;
        document.getElementById('timer').textContent = formatTime(countdown); // Atualiza o tempo no formato digital

        // Alterar cor conforme o tempo vai acabando
        const timerElement = document.getElementById('timer');
        if (countdown <= 3) {
            timerElement.classList.add('expired');
            timerElement.classList.remove('warning');
        } else if (countdown <= 5) {
            timerElement.classList.add('warning');
        }

        if (countdown <= 0) {
            clearInterval(timer); // Parar o timer
            document.getElementById('result').textContent = `Tempo esgotado! A resposta correta era: "${correctMovie.title}"`;
            errors++; // Incrementar o contador de erros
            updateScoreDisplay(); // Atualiza o placar
            document.getElementById('next-btn').style.display = 'inline-block'; // Mostrar o botão de próximo filme
        }
    }, 1000);
}
