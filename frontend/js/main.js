const BASE_URL = "https://projeto-evento.onrender.com"; // URL do backend no Render

document.addEventListener("DOMContentLoaded", () => {

  // Login
  const loginForm = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const senha = document.getElementById("senha").value;

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha })
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

  // Logout
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // Verificação de login para páginas internas
  if (!window.location.href.includes("index.html")) {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "index.html";
  }

  // Carregar participantes
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

  // Adicionar participante
  // Dentro do DOMContentLoaded, se você estiver usando, ou do jeito que já está:
const addForm = document.getElementById("addParticipanteForm");
if (addForm) {
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("id").value.trim();
    const nome = document.getElementById("nome").value.trim();
    const documento = document.getElementById("documento").value.trim();

    // validação igual à do backend (ajuda UX)
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
        // recarrega a lista
        if (typeof loadParticipantes === "function") {
          loadParticipantes();
        }
      } else {
        alert(data.error || "Erro ao adicionar participante");
      }
    } catch (err) {
      alert("Erro ao conectar com servidor");
    }
  });
}

  loadParticipantes();

  // Carregar brindes
  const loadBrindes = async () => {
    const tbody = document.querySelector("#brindesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    try {
      const res = await fetch(`${BASE_URL}/brindes`);
      const data = await res.json();

      data.forEach(b => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${b.id}</td>
          <td>${b.nome}</td>
          <td>${b.quantidade}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Adicionar brinde
  const addBrindeForm = document.getElementById("addBrindeForm");
  if (addBrindeForm) {
    addBrindeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("brindeNome").value;
      const quantidade = parseInt(document.getElementById("brindeQuantidade").value);

      try {
        const res = await fetch(`${BASE_URL}/brindes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, quantidade })
        });
        if (res.ok) {
          addBrindeForm.reset();
          loadBrindes();
        } else {
          const err = await res.json();
          alert(err.error || "Erro ao adicionar brinde");
        }
      } catch (err) {
        alert("Erro ao conectar com servidor");
      }
    });
  }

  loadBrindes();

  // Atualizar pontuação
  const pontuacaoForm = document.getElementById("pontuacaoForm");
  if (pontuacaoForm) {
    pontuacaoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const participante_id = document.getElementById("participanteId").value;
      const pontos = parseInt(document.getElementById("pontos").value);
      const motivo = document.getElementById("motivo").value;

      try {
        const res = await fetch(`${BASE_URL}/pontuacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participante_id, pontos, motivo })
        });
        const data = await res.json();

        if (res.ok) {
          alert("Pontuação atualizada!");
          pontuacaoForm.reset();
        } else {
          alert(data.error || "Erro ao atualizar pontuação");
        }
      } catch (err) {
        alert("Erro ao conectar com servidor");
      }
    });
  }

});
