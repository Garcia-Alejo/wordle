const socket = io();  // Establece la conexión con el servidor
const messages = document.getElementById('messages');
const wordInput = document.getElementById('wordInput');
const guessInput = document.getElementById('guessInput');
const wordInputField = document.getElementById('word');
const guessInputField = document.getElementById('guess');

const setWordBtn = document.getElementById('setWordBtn');
const submitGuessBtn = document.getElementById('submitGuessBtn');

// Recibir y mostrar mensajes del servidor
socket.on('message', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

// Iniciar el juego y cambiar entre pantallas de ingreso de palabra y adivinanza
socket.on('gameStart', () => {
    wordInput.classList.add('hidden');
    guessInput.classList.remove('hidden');
});

// Mostrar los resultados de cada intento
socket.on('guessResult', ({ guess, feedback }) => {
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = `Intento: ${guess} - ${feedback}`;
    messages.appendChild(feedbackElement);
});

// Cambiar el turno entre los jugadores
socket.on('turnChange', (currentTurn) => {
    const turnMessage = currentTurn === 1 ? 'Turno de Jugador 1' : 'Turno de Jugador 2';
    messages.appendChild(document.createElement('div')).textContent = turnMessage;
});

// Finalizar el juego y mostrar el mensaje correspondiente
socket.on('gameOver', () => {
    wordInput.classList.remove('hidden');
    guessInput.classList.add('hidden');
    messages.appendChild(document.createElement('div')).textContent = 'El juego ha terminado.';
});

// Enviar la palabra secreta al servidor
setWordBtn.addEventListener('click', () => {
    const word = wordInputField.value.trim().toLowerCase();
    if (word.length === 5) {
        socket.emit('setWord', word);
    } else {
        alert('La palabra debe tener 5 letras.');
    }
});

// Enviar el intento de adivinanza al servidor
submitGuessBtn.addEventListener('click', () => {
    const guess = guessInputField.value.trim().toLowerCase();
    if (guess.length === 5) {
        socket.emit('guess', guess);
    } else {
        alert('El intento debe tener 5 letras.');
    }
});
