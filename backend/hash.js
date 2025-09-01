import bcrypt from "bcryptjs";

const senha = "01020366"; // coloque sua senha aqui
const hash = await bcrypt.hash(senha, 10);
console.log(hash);
