const socket = io();

// Detectar si el jugador está ingresando su palabra
let isPlayer1 = false;  // Esta variable ayuda a gestionar quién es el Jugador 1 o 2

// Función para establecer la palabra secreta
function setWord() {
    const word = document.getElementById('playerWord').value;
    if (word) {
        socket.emit('setWord', { word: word });
        document.getElementById('setWordDiv').style.display = 'none';
    } else {
        alert('Por favor, ingresa una palabra secreta.');
    }
}

// Escuchar los mensajes del servidor
socket.on('waitingForWord', (message) => {
    document.getElementById('gameStatus').innerText = message;
});

socket.on('wordSet', (message) => {
    document.getElementById('gameStatus').innerText = message;
});

socket.on('gameStarted', (message) => {
    document.getElementById('gameStatus').innerText = message;
    document.getElementById('guessWordDiv').style.display = 'block';
});

socket.on('playerRole', (message) => {
    document.getElementById('gameStatus').innerText = message;
    if (message.includes('Jugador 1')) {
        isPlayer1 = true;
    }
});

// Función para adivinar la palabra
function guessWord() {
    const guess = document.getElementById('guessWord').value;
    if (guess) {
        socket.emit('guessWord', { guess: guess });
    } else {
        alert('Por favor, ingresa tu adivinanza.');
    }
}

// Recibir los resultados de la adivinanza
socket.on('guessResult', (data) => {
    if (isPlayer1) {
        document.getElementById('feedback').innerHTML = `<b>${data.player}</b> adivinó: ${data.guess}<br>Resultado: ${data.feedback}`;
    } else {
        document.getElementById('feedback').innerHTML = `<b>${data.player}</b> adivinó: ${data.guess}<br>Resultado: ${data.feedback}`;
    }
});

// Recibir el fin del juego
socket.on('gameOver', (message) => {
    alert(message);
    document.getElementById('gameStatus').innerText = message;
    document.getElementById('guessWordDiv').style.display = 'none';
    // Si deseas reiniciar el juego o finalizarlo completamente:
    // Reiniciar o deshabilitar los botones según lo que prefieras.
});
