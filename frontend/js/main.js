const BASE_URL = "https://projeto-evento.onrender.com"; // URL do backend no Render

document.addEventListener("DOMContentLoaded", () => {

  // --- Login ---
  const loginForm = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("id").value; // login agora é por ID
      const senha = document.getElementById("senha").value;

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, senha })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          msg.textContent = "Login realizado com sucesso!";
          window.location.href = "participantes.html";
        } else {
          msg.textContent = data.error;
        }
      } catch (err) {
        msg.textContent = "Erro ao conectar com o servidor.";
      }
    });
  }

  // --- Logout ---
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // --- Verificação de login ---
  if (!window.location.href.includes("index.html")) {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "index.html";
  }

  // --- Carregar participantes ---
  const loadParticipantes = async () => {
    const tbody = document.querySelector("#participantesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    try {
      const res = await fetch(`${BASE_URL}/participantes`);
      const data = await res.json();

      data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.nome}</td>
          <td>${p.documento}</td>
          <td>${p.pontos || 0}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  };

  loadParticipantes();

  // --- Adicionar participante ---
  const addForm = document.getElementById("addParticipanteForm");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("id").value.trim();
      const nome = document.getElementById("nome").value.trim();
      const documento = document.getElementById("documento").value.trim();

      if (!/^\d+$/.test(id)) {
        alert("O ID deve conter apenas números.");
        return;
      }
      if (id.length < 6 || id.length > 14) {
        alert("O ID deve ter entre 6 e 14 dígitos.");
        return;
      }
      if (!nome) {
        alert("Informe o nome.");
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/participantes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, nome, documento })
        });

        const data = await res.json();

        if (res.ok) {
          addForm.reset();
          loadParticipantes();
        } else {
          alert(data.error || "Erro ao adicionar participante");
        }
      } catch (err) {
        alert("Erro ao conectar com servidor");
      }
    });
  }

  // --- Pontuação com modal para admin ---
  const pontuacaoForm = document.getElementById("pontuacaoForm");
  const adminModal = document.getElementById("adminModal");
  let pontosData = {};

  if (pontuacaoForm) {
    pontuacaoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      pontosData = {
        participante_id: document.getElementById("participanteId").value,
        pontos: parseInt(document.getElementById("pontos").value)
      };
      // abrir modal para ID do admin
      if (adminModal) adminModal.style.display = "block";
    });
  }

  const confirmAdminBtn = document.getElementById("confirmAdmin");
  if (confirmAdminBtn) {
    confirmAdminBtn.addEventListener("click", async () => {
      const admin_id = document.getElementById("adminId").value;
      if (!admin_id) return alert("Informe o ID do usuário");

      try {
        const res = await fetch(`${BASE_URL}/pontuacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pontosData, admin_id })
        });

        const data = await res.json();
        if (res.ok) {
          alert("Pontuação atualizada!");
          pontuacaoForm.reset();
          if (adminModal) adminModal.style.display = "none";
          loadParticipantes();
        } else {
          alert(data.error || "Erro ao atualizar pontuação");
        }
      } catch (err) {
        console.error(err);
        alert("Erro no servidor");
      }
    });
  }

});
// --- Resgatar pontos para brindes ---
const resgatarForm = document.getElementById("resgatarForm");
const adminModalBrinde = document.getElementById("adminModalBrinde");
let resgatarData = {};

if (resgatarForm) {
  resgatarForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const participante_id = document.getElementById("resgatarParticipanteId").value.trim();
    const pontos = parseInt(document.getElementById("resgatarPontos").value);

    if (!participante_id) return alert("Informe o ID do participante");
    if (isNaN(pontos) || pontos <= 0) return alert("Informe uma quantidade válida de pontos");

    resgatarData = { participante_id, pontos };
    if (adminModalBrinde) adminModalBrinde.style.display = "block"; // abrir modal para ID do admin
  });
}

// Confirmar admin no modal
const confirmAdminBrindeBtn = document.getElementById("confirmAdminBrinde");
if (confirmAdminBrindeBtn) {
  confirmAdminBrindeBtn.addEventListener("click", async () => {
    const admin_id = document.getElementById("adminIdBrinde").value.trim();
    if (!admin_id) return alert("Informe o ID do usuário logado");

    try {
      const res = await fetch(`${BASE_URL}/resgatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...resgatarData, admin_id })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Pontos resgatados com sucesso!");
        resgatarForm.reset();
        if (adminModalBrinde) adminModalBrinde.style.display = "none";
        loadParticipantes(); // atualizar tabela de participantes
      } else {
        alert(data.error || "Erro ao resgatar pontos");
      }
    } catch (err) {
      console.error(err);
      alert("Erro no servidor");
    }
  });
}
