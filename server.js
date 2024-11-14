const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameData = {
    player1Socket: null,
    player2Socket: null,
    player1: { word: '', guess: '' },
    player2: { word: '', guess: '' },
    gameStarted: false,
};

// Servir los archivos estáticos (frontend)
app.use(express.static('public'));

// Conectar jugadores y gestionar el flujo del juego
io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado: ' + socket.id);

    // Si no hay jugador 1, asignar al jugador 1
    if (!gameData.player1Socket) {
        gameData.player1Socket = socket;
        socket.emit('playerRole', 'Jugador 1, por favor ingresa tu palabra secreta.');
    }
    // Si ya existe jugador 1 y no hay jugador 2, asignar al jugador 2
    else if (!gameData.player2Socket) {
        gameData.player2Socket = socket;
        socket.emit('playerRole', 'Jugador 2, por favor ingresa tu palabra secreta.');
        io.emit('gameStarted', '¡El juego ha comenzado! Ambos jugadores pueden comenzar.');
        gameData.gameStarted = true;
    }
    // Si ambos jugadores ya están conectados, los nuevos jugadores deben esperar
    else {
        socket.emit('waitingForOtherPlayer', 'Esperando que el otro jugador ingrese su palabra...');
    }

    // Establecer la palabra secreta
    socket.on('setWord', (data) => {
        if (socket === gameData.player1Socket) {
            gameData.player1.word = data.word;
            socket.emit('wordSet', 'Tu palabra secreta fue establecida, espera al Jugador 2.');
            gameData.player2Socket.emit('waitingForWord', 'Jugador 2, por favor ingresa tu palabra secreta.');
        } else if (socket === gameData.player2Socket) {
            gameData.player2.word = data.word;
            socket.emit('wordSet', 'Tu palabra secreta fue establecida, espera al Jugador 1 para adivinar.');
        }
    });

    // Adivinar la palabra
    socket.on('guessWord', (data) => {
        if (socket === gameData.player1Socket) {
            gameData.player1.guess = data.guess;
            const feedback = getFeedback(gameData.player1.guess, gameData.player2.word);
            io.emit('guessResult', {
                player: 'Jugador 1',
                guess: data.guess,
                feedback: feedback
            });

            // Si el jugador 1 adivina correctamente
            if (gameData.player1.guess === gameData.player2.word) {
                io.emit('gameOver', '¡Jugador 1 ganó!');
                gameData.gameStarted = false; // Terminar el juego
                return;
            }
        } else if (socket === gameData.player2Socket) {
            gameData.player2.guess = data.guess;
            const feedback = getFeedback(gameData.player2.guess, gameData.player1.word);
            io.emit('guessResult', {
                player: 'Jugador 2',
                guess: data.guess,
                feedback: feedback
            });

            // Si el jugador 2 adivina correctamente
            if (gameData.player2.guess === gameData.player1.word) {
                io.emit('gameOver', '¡Jugador 2 ganó!');
                gameData.gameStarted = false; // Terminar el juego
                return;
            }
        }
    });

    // Comprobar si la adivinanza es correcta
    function getFeedback(guess, word) {
        let feedback = '';
        let tempWord = word.split('');
        let tempGuess = guess.split('');
        
        // Verificar letras correctas en la posición correcta
        for (let i = 0; i < guess.length; i++) {
            if (tempGuess[i] === tempWord[i]) {
                feedback += `<span class="correct">${tempGuess[i]}</span>`;  // Correctas
                tempWord[i] = null;  // Marcar como ya procesada
                tempGuess[i] = null;
            } else {
                feedback += `<span class="incorrect">${tempGuess[i]}</span>`;  // Incorrectas
            }
        }

        // Verificar letras incorrectas que están en la palabra, pero no en la posición correcta
        for (let i = 0; i < guess.length; i++) {
            if (tempGuess[i] !== null && tempWord.includes(tempGuess[i])) {
                feedback = feedback.substring(0, i * 23) + `<span class="wrong-position">${tempGuess[i]}</span>` + feedback.substring((i + 1) * 23);
                tempWord[tempWord.indexOf(tempGuess[i])] = null;  // Marcar como procesada
            }
        }

        return feedback;
    }

    // Desconectar jugador
    socket.on('disconnect', () => {
        console.log('Jugador desconectado: ' + socket.id);
        if (socket === gameData.player1Socket) {
            gameData.player1Socket = null;
        } else if (socket === gameData.player2Socket) {
            gameData.player2Socket = null;
        }
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
