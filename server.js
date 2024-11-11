const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const MAX_TRIES = 6;

let players = [];
let gameState = {
  player1Word: '',
  player2Word: '',
  currentTurn: 1,
  attempts: 0,
  maxTries: MAX_TRIES
};

// Servir los archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Configurar las conexiones de los jugadores
io.on('connection', (socket) => {
  console.log('Un jugador se ha conectado:', socket.id);

  if (players.length < 2) {
    players.push(socket.id);
    socket.emit('message', 'Esperando al segundo jugador...');
  }

  if (players.length === 2) {
    io.emit('message', 'Ambos jugadores están conectados, ¡el juego puede comenzar!');
  }

  // Recibir la palabra secreta del jugador
  socket.on('setWord', (word) => {
    if (socket.id === players[0]) {
      gameState.player1Word = word;
      socket.emit('message', 'Palabra secreta de Jugador 1 recibida. Esperando a Jugador 2...');
    } else if (socket.id === players[1]) {
      gameState.player2Word = word;
      socket.emit('message', 'Palabra secreta de Jugador 2 recibida. El juego puede comenzar.');
    }

    if (gameState.player1Word && gameState.player2Word) {
      io.emit('gameStart');
    }
  });

  // Recibir un intento de adivinanza
  socket.on('guess', (guess) => {
    const currentPlayer = gameState.currentTurn === 1 ? players[0] : players[1];
    const secretWord = gameState.currentTurn === 1 ? gameState.player2Word : gameState.player1Word;
    const opponent = gameState.currentTurn === 1 ? players[1] : players[0];

    const feedback = checkGuess(secretWord, guess);

    io.to(currentPlayer).emit('guessResult', { guess, feedback });

    if (guess === secretWord) {
      io.to(currentPlayer).emit('message', '¡Adivinaste correctamente! Has ganado.');
      io.to(opponent).emit('message', 'El jugador ha adivinado tu palabra. Has perdido.');
      resetGame();
    } else {
      gameState.attempts++;

      if (gameState.attempts >= gameState.maxTries) {
        io.to(currentPlayer).emit('message', `Has agotado tus intentos. La palabra era: ${secretWord}`);
        io.to(opponent).emit('message', `¡El juego ha terminado! La palabra era: ${secretWord}`);
        resetGame();
      }

      gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
      io.emit('turnChange', gameState.currentTurn);
    }
  });

  // Si un jugador se desconecta
  socket.on('disconnect', () => {
    console.log('Un jugador se ha desconectado:', socket.id);
    players = players.filter(player => player !== socket.id);
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

// Función para comprobar los intentos
function checkGuess(secretWord, guess) {
  let correctLetters = 0;
  for (let i = 0; i < secretWord.length; i++) {
    if (secretWord[i] === guess[i]) {
      correctLetters++;
    }
  }
  return `${correctLetters} letras correctas`;
}

// Función para resetear el juego
function resetGame() {
  gameState = {
    player1Word: '',
    player2Word: '',
    currentTurn: 1,
    attempts: 0,
    maxTries: MAX_TRIES
  };
  players = [];
  io.emit('gameOver');
}
