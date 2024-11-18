const socket = io('http://localhost:3000');
let isGameOver = false;
let wordSubmitted = false;

// Manejo de conexión y mensajes del servidor
socket.on('waiting', (message) => {
    document.getElementById('game-status').innerText = message;
});

socket.on('start', (message) => {
    document.getElementById('game-status').innerText = message;
    document.getElementById('game-board').classList.remove('d-none');
});

socket.on('invalid_word', (message) => {
    alert(message);
});

socket.on('game_ready', (message) => {
    document.getElementById('game-status').innerText = message;
    document.getElementById('guess-section').classList.remove('d-none');
});

socket.on('feedback', (feedback) => {
    const guess = document.getElementById('guess-input').value; // Obtener la palabra enviada
    addToHistory(guess, feedback); // Actualizar historial
    document.getElementById('feedback').innerText = `Resultado: ${feedback.join(', ')}`;
});


socket.on('restart', (message) => {
    isGameOver = false;
    wordSubmitted = false; // Permitir enviar una nueva palabra
    document.getElementById('word-input').disabled = false; // Desbloquear campo de palabra
    document.getElementById('submit-word').disabled = false; // Habilitar botón
    document.getElementById('game-status').innerText = message;
    document.getElementById('game-end').classList.add('d-none'); // Ocultar ventana emergente
    document.getElementById('game-board').classList.remove('d-none');
    document.getElementById('history-list').innerHTML = ''; // Limpiar historial
    document.getElementById('history-section').classList.add('d-none'); // Ocultar historial
});

// Enviar palabra del jugador
document.getElementById('submit-word').addEventListener('click', () => {
    const word = document.getElementById('word-input').value;
    if (word.length === 6 && /^[a-z]+$/.test(word)) {
        socket.emit('submit_word', word);

        // Mensaje de confirmación y bloqueo
        wordSubmitted = true;
        document.getElementById('word-input').disabled = true; // Bloquear campo de entrada
        document.getElementById('submit-word').disabled = true; // Deshabilitar botón
        document.getElementById('game-status').innerText = 'Tu palabra ha sido enviada. Esperando al rival...';
    } else {
        alert('La palabra debe tener 6 letras en minúsculas.');
    }
});

// Enviar adivinanza del jugador
document.getElementById('submit-guess').addEventListener('click', () => {
    if (isGameOver) return;
    const guess = document.getElementById('guess-input').value;
    if (guess.length === 6 && /^[a-z]+$/.test(guess)) {
        socket.emit('submit_guess', guess);
        document.getElementById('guess-input').value = '';
    } else {
        alert('La adivinanza debe tener 6 letras en minúsculas.');
    }
});

// Añadir historial de adivinanzas y retroalimentación
function addToHistory(guess, feedback) {
    const historyList = document.getElementById('history-list');
    const historyItem = document.createElement('li');
    historyItem.textContent = `Adivinaste: ${guess} - Resultado: ${feedback.join(', ')}`;
    historyList.appendChild(historyItem);
    document.getElementById('history-section').classList.remove('d-none');
}

// Reiniciar el juego
document.getElementById('restart-game').addEventListener('click', () => {
    socket.emit('restart_game');
    document.getElementById('restart-game').classList.add('d-none'); // Ocultar botón reiniciar
});

// Desconectar juego
document.getElementById('disconnect-game').addEventListener('click', () => {
    socket.emit('game_over', 'Juego terminado debido a desconexión.');
    window.location.reload();
});

// Este código mostrará el mensaje del ganador y los botones de reinicio/desconexión
socket.on('game-over', (message) => {
    socket.on('game-over', (data) => {
        const { winner, message } = data;
        // Mostrar el mensaje de quien ha ganado
        document.getElementById('game-end').classList.remove('d-none');
        document.getElementById('end-message').textContent = message; // Muestra quién ha ganado
    
        // Adaptar para mostrar el ganador en negrita
        const winnerElement = document.getElementById('end-message');
        winnerElement.innerHTML = `<b>${message}</b>`; // Enfatiza el ganador
    });

    // Deshabilitar las entradas y botones relacionados al juego
    document.getElementById('word-input').disabled = true;
    document.getElementById('guess-input').disabled = true;
    document.getElementById('submit-word').disabled = true;
    document.getElementById('submit-guess').disabled = true;
});

// Función para reiniciar el juego
document.querySelector('#restart-game button').addEventListener('click', () => {
    socket.emit('restart_game');  // Enviar evento para reiniciar el juego
    location.reload(); // Recargar la página para reiniciar la UI
});

// Función para desconectar el juego
document.querySelector('#disconnect-game button').addEventListener('click', () => {
    socket.emit('game_over', 'Juego terminado debido a desconexión.');
    location.reload(); // Recargar la página para finalizar la sesión del jugador
});
