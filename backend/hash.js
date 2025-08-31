import bcrypt from "bcryptjs";

const senha = "@Allana2580"; // coloque sua senha aqui
const hash = await bcrypt.hash(senha, 10);
console.log(hash);
