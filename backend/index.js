import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- Rota inicial ---
app.get("/", (req, res) => {
  res.send("API do Evento funcionando!");
});

// --- Listar participantes ---
app.get("/participantes", async (req, res) => {
  const { data, error } = await supabase.from("participantes").select("*");
  if (error) return res.status(500).json(error);
  res.json(data);
});

// --- Adicionar participante ---
app.post("/participantes", async (req, res) => {
  const { id, nome, documento } = req.body;
  try {
    const { data, error } = await supabase
      .from("participantes")
      .insert([{ id, nome, documento }])
      .select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Login por ID do usuário ---
app.post("/login", async (req, res) => {
  const { id, senha } = req.body;

  try {
    const { data: users, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (error || users.length === 0) return res.status(400).json({ error: "Usuário não encontrado" });

    const user = users[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: user.id, perfil: user.perfil }, "chave_secreta", { expiresIn: "1d" });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Adicionar pontos ao participante ---
app.post("/pontuacao", async (req, res) => {
  const { participante_id, pontos, admin_id } = req.body;

  try {
    // Validar usuário admin
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", admin_id)
      .single();
    if (userError || !user) throw new Error("Usuário administrador inválido");

    // Buscar participante
    const { data: participanteData, error: errorBusca } = await supabase
      .from("participantes")
      .select("*")
      .eq("id", participante_id)
      .single();
    if (errorBusca || !participanteData) throw new Error("Participante não encontrado");

    // Atualizar pontos
    const novaPontuacao = (participanteData.pontos || 0) + pontos;
    const { data: participanteAtualizado, error: errorUpdate } = await supabase
      .from("participantes")
      .update({ pontos: novaPontuacao })
      .eq("id", participante_id)
      .select();
    if (errorUpdate) throw errorUpdate;

    // Registrar histórico
    const { error: errorHist } = await supabase
      .from("historico_pontos")
      .insert([{ participante_id, pontos }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Pontuação atualizada", participante: participanteAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Resgatar pontos ---
app.post("/resgatar", async (req, res) => {
  const { participante_id, pontos, admin_id } = req.body;

  try {
    // Validar usuário admin
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", admin_id)
      .single();
    if (userError || !user) throw new Error("Usuário administrador inválido");

    // Buscar participante
    const { data: participanteData, error: errorBusca } = await supabase
      .from("participantes")
      .select("*")
      .eq("id", participante_id)
      .single();
    if (errorBusca || !participanteData) throw new Error("Participante não encontrado");

    if (participanteData.pontos < pontos) throw new Error("Pontuação insuficiente");

    // Atualizar pontos
    const novaPontuacao = participanteData.pontos - pontos;
    const { data: participanteAtualizado, error: errorUpdate } = await supabase
      .from("participantes")
      .update({ pontos: novaPontuacao })
      .eq("id", participante_id)
      .select();
    if (errorUpdate) throw errorUpdate;

    // Registrar histórico
    const { error: errorHist } = await supabase
      .from("historico_pontos")
      .insert([{ participante_id, pontos: -pontos }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Pontos resgatados", participante: participanteAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
// Resgatar pontos para brindes
app.post("/resgatar", async (req, res) => {
  const { participante_id, pontos, admin_id } = req.body;

  try {
    if (!participante_id || !admin_id || !pontos) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Verifica se o admin existe
    const { data: adminData, error: errorAdmin } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", admin_id)
      .single();

    if (errorAdmin || !adminData) return res.status(401).json({ error: "Usuário logado inválido" });

    // Verifica se o participante existe
    const { data: participanteData, error: errorParticipante } = await supabase
      .from("participantes")
      .select("*")
      .eq("id", participante_id)
      .single();

    if (errorParticipante || !participanteData) {
      return res.status(404).json({ error: "Participante não encontrado" });
    }

    if ((participanteData.pontos || 0) < pontos) {
      return res.status(400).json({ error: "Pontuação insuficiente" });
    }

    // Subtrai os pontos
    const novaPontuacao = participanteData.pontos - pontos;
    const { data: participanteAtualizado, error: errorUpdate } = await supabase
      .from("participantes")
      .update({ pontos: novaPontuacao })
      .eq("id", participante_id)
      .select();

    if (errorUpdate) throw errorUpdate;

    // Registra histórico
    const { error: errorHist } = await supabase
      .from("historico_pontos")
      .insert([{ participante_id, pontos: -pontos, motivo: "Resgate de brinde" }]);
    if (errorHist) throw errorHist;

    res.json({ message: "Pontos resgatados com sucesso!", participante: participanteAtualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
