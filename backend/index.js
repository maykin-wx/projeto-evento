import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://projeto-evento.netlify.app/"
}));

app.use(express.json());

// Conectar ao Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Rota inicial
app.get("/", (req, res) => {
  res.send("API do Evento funcionando!");
});

// Listar participantes
app.get("/participantes", async (req, res) => {
  const { data, error } = await supabase.from("participantes").select("*");
  if (error) return res.status(500).json(error);
  res.json(data);
});

// Adicionar participante
app.post("/participantes", async (req, res) => {
  const { nome, documento } = req.body;
  const { data, error } = await supabase
    .from("participantes")
    .insert([{ nome, documento }])
    .select();
  if (error) return res.status(500).json(error);
  res.status(201).json(data);
});

// Listar brindes
app.get("/brindes", async (req, res) => {
  const { data, error } = await supabase.from("brindes").select("*");
  if (error) return res.status(500).json(error);
  res.json(data);
});

// Adicionar brinde
app.post("/brindes", async (req, res) => {
  const { nome, quantidade } = req.body;
  const { data, error } = await supabase
    .from("brindes")
    .insert([{ nome, quantidade }])
    .select();
  if (error) return res.status(500).json(error);
  res.status(201).json(data);
});

// Resgatar brinde (sem função SQL)
app.post("/brindes/resgatar", async (req, res) => {
  const { participante_id, brinde_id, quantidade } = req.body;

  try {
    // Busca brinde
    const { data: brindeData, error: errorBrinde } = await supabase
      .from("brindes")
      .select("*")
      .eq("id", brinde_id)
      .single();
    if (errorBrinde || !brindeData) throw new Error("Brinde não encontrado");
    if (brindeData.quantidade < quantidade) throw new Error("Estoque insuficiente");

    // Atualiza estoque
    const { error: errorUpdate } = await supabase
      .from("brindes")
      .update({ quantidade: brindeData.quantidade - quantidade })
      .eq("id", brinde_id);
    if (errorUpdate) throw errorUpdate;

    // Registra no histórico
    const { error: errorHist } = await supabase
      .from("historico_brindes")
      .insert([{ participante_id, brinde_id, quantidade }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Brinde resgatado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const { data: users, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error || users.length === 0) {
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

// Adicionar/remover pontos de participante
app.post("/pontuacao", async (req, res) => {
  const { participante_id, pontos, motivo } = req.body;

  try {
    // Busca participante
    const { data: participanteData, error: errorBusca } = await supabase
      .from("participantes")
      .select("*")
      .eq("id", participante_id)
      .single();
    if (errorBusca || !participanteData) throw new Error("Participante não encontrado");

    // Atualiza pontos
    const novaPontuacao = (participanteData.pontos || 0) + pontos;
    const { data: participanteAtualizado, error: errorUpdate } = await supabase
      .from("participantes")
      .update({ pontos: novaPontuacao })
      .eq("id", participante_id)
      .select();
    if (errorUpdate) throw errorUpdate;

    // Registra histórico
    const { error: errorHist } = await supabase
      .from("historico_pontos")
      .insert([{ participante_id, pontos, motivo }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Pontuação atualizada", participante: participanteAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
