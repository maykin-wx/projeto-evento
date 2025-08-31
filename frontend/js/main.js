const loginForm = document.getElementById("loginForm");
const msg = document.getElementById("msg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      msg.textContent = "Login realizado com sucesso!";
      // redireciona para página de participantes
      window.location.href = "participantes.html";
    } else {
      msg.textContent = data.error;
    }
  } catch (err) {
    msg.textContent = "Erro ao conectar com o servidor.";
  }
});
// Função para carregar participantes
async function loadParticipantes() {
  const tbody = document.querySelector("#participantesTable tbody");
  tbody.innerHTML = "";
  try {
    const res = await fetch("http://localhost:3000/participantes");
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
}

// Adicionar participante
const addForm = document.getElementById("addParticipanteForm");
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value;
  const documento = document.getElementById("documento").value;

  try {
    const res = await fetch("http://localhost:3000/participantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, documento })
    });
    if (res.ok) {
      addForm.reset();
      loadParticipantes();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao adicionar participante");
    }
  } catch (err) {
    alert("Erro ao conectar com servidor");
  }
});

// Carrega a lista ao abrir a página
loadParticipantes();
// Função para carregar brindes
async function loadBrindes() {
  const tbody = document.querySelector("#brindesTable tbody");
  tbody.innerHTML = "";
  try {
    const res = await fetch("http://localhost:3000/brindes");
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
}

// Adicionar brinde
const addBrindeForm = document.getElementById("addBrindeForm");
addBrindeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("brindeNome").value;
  const quantidade = parseInt(document.getElementById("brindeQuantidade").value);

  try {
    const res = await fetch("http://localhost:3000/brindes", {
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

// Carrega brindes ao abrir
loadBrindes();
const pontuacaoForm = document.getElementById("pontuacaoForm");

pontuacaoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const participante_id = document.getElementById("participanteId").value;
  const pontos = parseInt(document.getElementById("pontos").value);
  const motivo = document.getElementById("motivo").value;

  try {
    const res = await fetch("http://localhost:3000/pontuacao", {
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
// Logout
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });
}

// Proteção de páginas (verifica se está logado)
if (window.location.pathname !== "/index.html") {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
  }
}
