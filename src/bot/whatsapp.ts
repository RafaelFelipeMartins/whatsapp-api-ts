import dotenv from "dotenv";
import { Client, LocalAuth, Message, Chat } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

dotenv.config();

const allowedNumbers = [
  '554197309009@c.us',
  '554184611703@c.us',
  '554197399754@c.us'
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const client = new Client({
  authStrategy: new LocalAuth(),
});

// 🗣️ Mensagens padrão
const introMessage = `
👋 Olá! Eu sou o bot do *EcoLendas* ♻️  
Eu te ajudo a mapear locais com descarte incorreto de lixo.  
Envie uma *foto* de um local poluído para começarmos!
`;

const confirmationQuestion = `Essa descrição está correta?\n\nResponda com *sim* ou *não*.`;

const locationRequest = `📍 Agora, por favor, compartilhe a localização exata ou envie o endereço do local da foto.`;

const thankYouMessage = `
✅ Obrigado! Sua contribuição ajuda a combater a poluição e proteger o meio ambiente 🌱  
Tenha um ótimo dia!
`;

// 📸 Função de análise da imagem
async function analyzeImage(imagePath: string): Promise<string> {
  const base64Image = fs.readFileSync(imagePath, "base64");

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
          Você é um assistente que analisa imagens para detectar lixo.
          Você deve descrever brevemente os tipos de lixo presentes, marcas de produtos identificadas e o cenário.
          Se a imagem parecer falsa, responda apenas "Imagem não aparenta ser verdadeira".
          Se não houver lixo, responda "Lixo não encontrado".
        `,
      },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high"
          },
        ],
      },
    ],
  });

  const textOutput = response.output
    .filter((item) => item.type === "message")
    .flatMap((item: any) => item.content || [])
    .find((c: any) => c.type === "output_text");

  if (!textOutput) {
    throw new Error("No text output found in OpenAI response");
  }

  return textOutput.text.trim();
}

// 🔄 Estado de conversa temporário
interface UserState {
  stage: "intro" | "image" | "confirm" | "location" | "done";
  imagePath?: string;
  description?: string;
}

const userState = new Map<string, UserState>();

// 🚀 Inicialização
client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR code abaixo para conectar:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Bot conectado e pronto!");
});

client.on("message", async (msg: Message) => {
  const chat: Chat = await msg.getChat();
  const from = msg.from;

  if (chat.isGroup || !allowedNumbers.includes(from)) return;

  const state = userState.get(from) || { stage: "intro" };
  let response = "";

  switch (state.stage) {
    case "intro":
      response = introMessage;
      state.stage = "image";
      break;

    case "image":
      if (msg.type === "image") {
        const media = await msg.downloadMedia();
        if (!media?.data) {
          response = "⚠️ Não consegui baixar a imagem, envie novamente.";
          break;
        }

        const dir = "./uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const imagePath = path.join(dir, `report_${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, media.data, { encoding: "base64" });

        const analysis = await analyzeImage(imagePath);

        if (analysis.includes("não aparenta ser verdadeira")) {
          response = "⚠️ Imagem não parece real. Tente enviar outra.";
        } else if (analysis.includes("Lixo não encontrado")) {
          response = "🧹 Não identifiquei lixo na imagem. Tente outra foto, por favor.";
        } else {
          state.stage = "confirm";
          state.imagePath = imagePath;
          state.description = analysis;
          response = `📸 Análise da imagem:\n\n${analysis}\n\n${confirmationQuestion}`;
        }
      } else {
        response = "📸 Por favor, envie uma *imagem* do local com lixo.";
      }
      break;

    case "confirm":
      if (msg.body.toLowerCase().includes("sim")) {
        state.stage = "location";
        response = locationRequest;
      } else if (msg.body.toLowerCase().includes("não")) {
        response = "😅 Tudo bem! Envie novamente a *foto correta*.";
        state.stage = "image";
      } else {
        response = "Por favor, responda apenas com *sim* ou *não*.";
      }
      break;

    case "location":
      if (msg.type === "location" || msg.type === "chat") {
        const locationData =
          msg.type === "location"
            ? `Latitude: ${msg.location?.latitude}, Longitude: ${msg.location?.longitude}`
            : msg.body.trim();

        const reportDir = "./reports";
        if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

        const reportContent = `
Descrição: ${state.description}
Localização: ${locationData}
Imagem: ${state.imagePath}
Data: ${new Date().toLocaleString()}
        `;

        fs.writeFileSync(
          path.join(reportDir, `report_${Date.now()}.txt`),
          reportContent
        );

        response = thankYouMessage;
        state.stage = "done";
      } else {
        response = "📍 Envie a localização ou um endereço válido.";
      }
      break;

    case "done":
      response = "🌍 Obrigado novamente! Caso queira fazer outro envio, reinicie a conversa.";
      break;
  }

  userState.set(from, state);

  if (response) {
    await msg.reply(response);
  }
});

client.initialize();
