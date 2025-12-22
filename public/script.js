const socket = io();
const roomID = location.pathname.split("/").pop();

const playersDiv = document.getElementById("players");
const reiniciarBtn = document.getElementById("reiniciar");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");

let yaElegi = false; // 👈 BLOQUEO LOCAL

socket.emit("unirse-sala", roomID);

// Estado inicial
socket.on("estado-inicial", (bloqueados) => {
    playersDiv.innerHTML = "";

    bloqueados.forEach((bloqueado, i) => {
        const card = document.createElement("div");
        card.className = "player-card";
        card.textContent = `Player ${i + 1}`;

        if (bloqueado) card.classList.add("disabled");

        card.onclick = () => {
            if (bloqueado || yaElegi) return; // 👈 clave
            socket.emit("revelar-rol", i);
        };

        playersDiv.appendChild(card);
    });
});

// Bloqueo global (otros jugadores)
socket.on("bloquear-boton", (jugador) => {
    const card = playersDiv.children[jugador];
    if (card) card.classList.add("disabled");
});

// Mostrar rol SOLO a este jugador
socket.on("mostrar-rol", (rol) => {
    modalTitle.textContent = rol === "IMPOSTOR" ? "IMPOSTOR" : "Tu palabra";
    modalText.innerHTML = `
        <strong>${rol}</strong>
        <p style="margin-top:10px; opacity:.8;">
            Rol revelado. Espera a los demás jugadores.
        </p>
    `;

    modal.classList.remove("hidden");

    yaElegi = true;

    // 🔒 Deshabilitar TODAS las tarjetas localmente
    Array.from(playersDiv.children).forEach(card => {
        card.classList.add("disabled");
    });
});

function cerrarModal() {
    modal.classList.add("hidden");
}

reiniciarBtn.onclick = () => {
    socket.emit("reiniciar-juego");
};

socket.on("reinicio", () => {
    location.reload();
});

// Copiar enlace
const copiarBtn = document.getElementById("copiarLink");

if (copiarBtn) {
    copiarBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            copiarBtn.textContent = "Enlace copiado ✔";
            setTimeout(() => {
                copiarBtn.textContent = "Copiar enlace de partida";
            }, 2000);
        } catch (e) {
            alert("No se pudo copiar el enlace");
        }
    };
}

// Input copiar enlace (si existe)
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
