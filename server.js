const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

// helper para servir archivos (PKG-safe)
function serveFile(res, filePath, contentType) {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
}

// ===== PARTIDAS =====
const partidas = {};

function crearNuevaPartida(maxJugadores = 4) {

    const categorias = {
        clasico: [
            "Avión", "Playa", "Escuela", "Computadora", "Libro", "Pizza",
            "Doctor", "Hospital", "Bosque", "Montaña", "Cine", "Teléfono"
        ],

        comida: [
            "Hamburguesa", "Tacos", "Pizza", "Sushi", "Pollo frito",
            "Pupusas", "Baleadas", "Tamales", "Yuca frita"
        ],

        honduras: [
            "Baleada", "Tajadas", "Pollo chuco", "El Progreso", "San Pedro Sula",
            "Tegucigalpa", "La Ceiba", "Tela", "Islas de la Bahía",
            "Guaro", "Pulpería", "Mototaxi", "Catracho"
        ],

        elsalvador: [
            "Pupusa", "Curtido", "Atol de elote", "San Salvador",
            "Santa Ana", "Soyapango", "Guaro", "Mercado",
            "Microbús", "Selecta", "Salvadoreño"
        ],

        random: [
            "Fantasma", "Extraterrestre", "Fiesta", "Carnaval",
            "Discoteca", "Influencer", "Streamer", "Memes",
            "Criptomoneda", "Video viral"
        ]
    };

    // Unir todas las categorías
    const todasLasPalabras = Object.values(categorias).flat();

    const palabraSecreta =
        todasLasPalabras[Math.floor(Math.random() * todasLasPalabras.length)];

    let roles = ["Impostor"];
    for (let i = 1; i < maxJugadores; i++) {
        roles.push("Tripulante");
    }

    roles.sort(() => Math.random() - 0.5);

    return {
        palabraSecreta,
        roles,
        botonesBloqueados: Array(maxJugadores).fill(false),
        maxJugadores
    };
}


// ===== RUTAS =====
app.get("/", (req, res) => {
    serveFile(res, path.join(__dirname, "public/lobby.html"), "text/html");
});

app.get("/style.css", (req, res) => {
    serveFile(res, path.join(__dirname, "public/style.css"), "text/css");
});

app.get("/script.js", (req, res) => {
    serveFile(res, path.join(__dirname, "public/script.js"), "application/javascript");
});

app.get("/crear-partida", (req, res) => {
    const maxJugadores = parseInt(req.query.max) || 4;
    const roomID = uuidv4();
    partidas[roomID] = crearNuevaPartida(maxJugadores);
    res.json({ roomID });
});

app.get("/game/:roomID", (req, res) => {
    serveFile(res, path.join(__dirname, "public/index.html"), "text/html");
});

// ===== SOCKET.IO =====
io.on("connection", (socket) => {

    socket.on("unirse-sala", (roomID) => {
        const partida = partidas[roomID];
        if (!partida) return;

        socket.join(roomID);
        socket.emit("estado-inicial", partida.botonesBloqueados);

        socket.on("revelar-rol", (jugador) => {
            if (partida.botonesBloqueados[jugador]) return;

            partida.botonesBloqueados[jugador] = true;
            io.to(roomID).emit("bloquear-boton", jugador);

            const rol = partida.roles[jugador] === "Impostor"
                ? "IMPOSTOR"
                : `Palabra secreta: ${partida.palabraSecreta}`;

            socket.emit("mostrar-rol", rol);
        });

        socket.on("reiniciar-juego", () => {
            partidas[roomID] = crearNuevaPartida(partida.maxJugadores);
            io.to(roomID).emit("reinicio");
        });
    });
});

http.listen(PORT, () => {
    console.log("Servidor activo en http://localhost:3000");
});
