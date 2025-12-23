const socket = io();
const roomID = location.pathname.split("/").pop();

const playersDiv = document.getElementById("players");
const reiniciarBtn = document.getElementById("reiniciar");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");

const progressText = document.getElementById("progressText");

let estadoJugadores = [];
let yaElegi = false; // 🔒 bloqueo local

socket.emit("unirse-sala", roomID);

/* ===============================
   ESTADO INICIAL
================================ */
socket.on("estado-inicial", (bloqueados) => {
    estadoJugadores = bloqueados;
    renderPlayers();
    actualizarProgreso();
});

/* ===============================
   BLOQUEO GLOBAL (otros jugadores)
================================ */
socket.on("bloquear-boton", (jugador) => {
    estadoJugadores[jugador] = true;
    renderPlayers();
    actualizarProgreso();
});

/* ===============================
   MOSTRAR ROL (solo este cliente)
================================ */
socket.on("mostrar-rol", (rol) => {
    modalTitle.textContent = rol === "IMPOSTOR" ? "IMPOSTOR" : "Tu palabra";
    modalText.innerHTML = `
        <strong>${rol}</strong>
        <p style="margin-top:10px; opacity:.8;">
            Tu rol ya fue revelado. Espera a los demás jugadores.
        </p>
    `;

    modal.classList.remove("hidden");

    yaElegi = true;

    // 🔒 bloquear todo localmente
    Array.from(playersDiv.children).forEach(card => {
        card.classList.add("disabled");
    });
});

/* ===============================
   RENDER DE PLAYERS
================================ */
function renderPlayers() {
    playersDiv.innerHTML = "";

    estadoJugadores.forEach((bloqueado, i) => {
        const card = document.createElement("div");
        card.className = "player-card";
        card.textContent = `Player ${i + 1}`;

        if (bloqueado || yaElegi) {
            card.classList.add("disabled");
        }

        card.onclick = () => {
            if (bloqueado || yaElegi) return;
            socket.emit("revelar-rol", i);
        };

        playersDiv.appendChild(card);
    });
}

/* ===============================
   PROGRESO DE LA PARTIDA
================================ */
function actualizarProgreso() {
    const listos = estadoJugadores.filter(b => b).length;
    const total = estadoJugadores.length;

    if (!progressText) return;

    if (listos === total && total > 0) {
        progressText.textContent = "Todos los jugadores recibieron su rol";
    } else {
        progressText.textContent = `Jugadores listos: ${listos} / ${total}`;
    }
}

/* ===============================
   MODAL
================================ */
function cerrarModal() {
    modal.classList.add("hidden");
}

/* ===============================
   REINICIAR PARTIDA
================================ */
if (reiniciarBtn) {
    reiniciarBtn.onclick = () => {
        socket.emit("reiniciar-juego");
    };
}

socket.on("reinicio", () => {
    location.reload();
});

/* ===============================
   COPIAR ENLACE (BOTÓN)
================================ */
const copiarBtn = document.getElementById("copiarLink");

if (copiarBtn) {
    copiarBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            copiarBtn.textContent = "Enlace copiado ✔";
            setTimeout(() => {
                copiarBtn.textContent = "Copiar enlace de partida";
            }, 2000);
        } catch {
            alert("No se pudo copiar el enlace");
        }
    };
}

/* ===============================
   COPIAR ENLACE (INPUT)
================================ */
const roomLinkInput = document.getElementById("roomLink");
const copyBtn = document.getElementById("copyLinkBtn");

if (roomLinkInput && copyBtn) {
    roomLinkInput.value = window.location.href;

    copyBtn.addEventListener("click", () => {
        roomLinkInput.select();
        document.execCommand("copy");

        copyBtn.textContent = "Copiado ✓";
        setTimeout(() => {
            copyBtn.textContent = "Copiar enlace";
        }, 1500);
    });
}
