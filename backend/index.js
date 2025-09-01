import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Conectar ao Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Rota inicial
app.get("/", (req, res) => {
  res.send("API do Evento funcionando!");
});

/* ===================== PARTICIPANTES ===================== */

// Listar participantes
app.get("/participantes", async (req, res) => {
  const { data, error } = await supabase
    .from("participantes")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Adicionar participante (ID manual: só números, ~10 dígitos)
app.post("/participantes", async (req, res) => {
  const { id, nome, documento } = req.body;

  // validações simples
  if (!id || !nome) {
    return res.status(400).json({ error: "ID e Nome são obrigatórios." });
  }
  const soNumeros = /^\d+$/;
  if (!soNumeros.test(id)) {
    return res.status(400).json({ error: "O ID deve conter apenas números." });
  }
  // faixa flexível: 6 a 14 dígitos (média ~10)
  if (id.length < 6 || id.length > 14) {
    return res.status(400).json({ error: "O ID deve ter entre 6 e 14 dígitos." });
  }

  const { data, error } = await supabase
    .from("participantes")
    .insert([{ id, nome, documento }])
    .select();

  if (error) {
    // tratar violação de chave única (id ou documento)
    if (error.code === "23505" || (error.message || "").toLowerCase().includes("duplicate")) {
      return res.status(409).json({ error: "ID ou Documento já cadastrado." });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

/* ===================== BRINDES ===================== */

// Listar brindes
app.get("/brindes", async (req, res) => {
  const { data, error } = await supabase.from("brindes").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Adicionar brinde
app.post("/brindes", async (req, res) => {
  const { nome, quantidade } = req.body;
  const { data, error } = await supabase
    .from("brindes")
    .insert([{ nome, quantidade }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Resgatar brinde
app.post("/brindes/resgatar", async (req, res) => {
  const { participante_id, brinde_id, quantidade } = req.body;

  try {
    // validação básica
    if (!participante_id || !brinde_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({ error: "Dados inválidos para resgate." });
    }

    // busca brinde
    const { data: brindeData, error: errorBrinde } = await supabase
      .from("brindes")
      .select("*")
      .eq("id", brinde_id)
      .single();
    if (errorBrinde || !brindeData) throw new Error("Brinde não encontrado");
    if ((brindeData.quantidade || 0) < quantidade) throw new Error("Estoque insuficiente");

    // atualiza estoque
    const { error: errorUpdate } = await supabase
      .from("brindes")
      .update({ quantidade: brindeData.quantidade - quantidade })
      .eq("id", brinde_id);
    if (errorUpdate) throw errorUpdate;

    // registra histórico
    const { error: errorHist } = await supabase
      .from("historico_brindes")
      .insert([{ participante_id, brinde_id, quantidade }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Brinde resgatado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===================== LOGIN (sem mudanças) ===================== */
// Mantemos seu login como estava (por e-mail). Não mexi aqui.

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const { data: users, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const user = users[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: user.id, perfil: user.perfil }, "chave_secreta", { expiresIn: "1d" });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== PONTUAÇÃO ===================== */

app.post("/pontuacao", async (req, res) => {
  const { participante_id, pontos, motivo } = req.body;

  try {
    const { data: participanteData, error: errorBusca } = await supabase
      .from("participantes")
      .select("*")
      .eq("id", participante_id)
      .single();
    if (errorBusca || !participanteData) throw new Error("Participante não encontrado");

    const novaPontuacao = (participanteData.pontos || 0) + (pontos || 0);

    const { data: participanteAtualizado, error: errorUpdate } = await supabase
      .from("participantes")
      .update({ pontos: novaPontuacao })
      .eq("id", participante_id)
      .select();
    if (errorUpdate) throw errorUpdate;

    const { error: errorHist } = await supabase
      .from("historico_pontos")
      .insert([{ participante_id, pontos, motivo }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Pontuação atualizada", participante: participanteAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===================== SERVER ===================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
