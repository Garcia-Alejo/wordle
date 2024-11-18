const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const players = {};
let playerWords = {};
let guesses = {};
let remainingAttempts = {};
let gameOver = false;

// Socket.io
io.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);
    if (Object.keys(players).length < 2) {
        players[socket.id] = null; // Asignar jugador sin palabra
        socket.emit('waiting', 'Esperando a otro jugador...');
    }

    if (Object.keys(players).length === 2) {
        io.emit('start', 'Ambos jugadores conectados. ¡Ingresa tu palabra de 6 letras!');
    }

    // Desconexión de jugadores
    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);
        delete players[socket.id];
    
        // Verifica si el otro jugador sigue conectado
        if (Object.keys(players).length === 1) {
            io.emit('game_over', 'El juego ha terminado, un jugador se ha desconectado.');
        }
    
        // Si los dos jugadores se desconectan, el juego finaliza.
        if (Object.keys(players).length === 0) {
            gameOver = false;
        }
    });

    // Recibir palabra del jugador
    socket.on('submit_word', (word) => {
        if (word.length !== 6 || !/^[a-z]+$/.test(word)) {
            socket.emit('invalid_word', 'La palabra debe tener 6 letras y ser solo en minúsculas.');
            return;
        }

        players[socket.id] = word;
        playerWords[socket.id] = word;
        guesses[socket.id] = [];
        remainingAttempts[socket.id] = 5;

        // Iniciar el juego cuando ambos jugadores hayan ingresado palabras
        if (Object.values(players).every((word) => word !== null)) {
            io.emit('game_ready', '¡El juego comienza! Adivina la palabra de tu oponente.');
        }
    });

    // Recibir intento de palabra
    socket.on('submit_guess', (guess) => {
        if (gameOver) return;

        const opponentId = Object.keys(players).find((id) => id !== socket.id);
        if (!opponentId) return;

        const opponentWord = playerWords[opponentId];
        const feedback = calculateFeedback(guess, opponentWord);

        guesses[socket.id].push(guess);
        remainingAttempts[socket.id]--;

        // Emitir feedback al jugador
        socket.emit('feedback', feedback);

        // Verificar si el jugador ganó
        if (guess === opponentWord) {
            io.emit('game_over', `¡Jugador ${socket.id} ha ganado!`);
            gameOver = true;
        } else if (remainingAttempts[socket.id] === 0) {
            // Verificar si se acabaron los intentos
            io.emit('game_over', `¡Jugador ${opponentId} ha ganado! Intentos agotados para ${socket.id}.`);
            gameOver = true;
        }        
    });
    socket.on('game_over', (message) => {
        if (guess === opponentWord) {
            io.emit('game_over', { winner: socket.id, message: `¡Jugador ${socket.id} ha ganado!` });
            gameOver = true;
        } else if (remainingAttempts[socket.id] === 0) {
            io.emit('game_over', { winner: opponentId, message: `¡Jugador ${opponentId} ha ganado! Intentos agotados para ${socket.id}.` });
            gameOver = true;
        }
    });

    // Reiniciar el juego
    socket.on('restart_game', () => {
        playerWords = {};
        guesses = {};
        remainingAttempts = {};
        gameOver = false;
        io.emit('restart', 'El juego ha sido reiniciado. Ingresa tu palabra de 6 letras.');
    });
});

// Función para calcular feedback tipo Wordle
function calculateFeedback(guess, word) {
    if (!word || !guess || word.length !== 6 || guess.length !== 6) {
        return ['Palabra o adivinanza inválida'];
    }

    const wordArray = word.split('');
    const guessArray = guess.split('');
    const feedback = Array(6).fill('gris'); // Inicializar todo como 'gris'
    const usedPositions = [];

    // Primero, identificar letras correctas (verde)
    for (let i = 0; i < guessArray.length; i++) {
        if (guessArray[i] === wordArray[i]) {
            feedback[i] = 'verde';
            usedPositions.push(i);
        }
    }

    // Luego, identificar letras presentes pero en posición incorrecta (amarillo)
    for (let i = 0; i < guessArray.length; i++) {
        if (feedback[i] !== 'verde' && wordArray.includes(guessArray[i])) {
            const index = wordArray.findIndex(
                (char, idx) => char === guessArray[i] && !usedPositions.includes(idx)
            );
            if (index !== -1) {
                feedback[i] = 'amarillo';
                usedPositions.push(index);
            }
        }
    }

    return feedback;
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
