import dotenv from "dotenv";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import type { Message, Chat } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import axios from "axios";

dotenv.config();

const host = process.env.HOST || 'localhost';  // Default é 'localhost'
const port = process.env.PORT || 3000;        // Default é 3000

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
👋 Olá! Eu sou o bot do *Eco Heróis* ♻️
Eu te ajudo a mapear locais com descarte incorreto de lixo.

📸 Por favor, envie uma *imagem* do local com lixo para começarmos.";
`;

const confirmationQuestion = `Essa descrição está correta?\n\nResponda com *sim* ou *não*.`;

const locationRequest = `📍 Agora, por favor, compartilhe a localização exata ou envie o endereço do local da foto.`;

const thankYouMessage = `
✅ Obrigado! Sua contribuição ajuda a combater a poluição e proteger o meio ambiente 🌱
Tenha um ótimo dia!
`;

/** ✅ Função utilitária: salvar arquivo */
function saveFile(dir: string, fileName: string, data: string, encoding: BufferEncoding = "base64"): string {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, data, { encoding });
  return filePath;
}

// 📸 Função de análise da imagem
async function analyzeImage(imagePath: string): Promise<string> {
  const base64Image = fs.readFileSync(imagePath, "base64");
  const systemPrompt = `
    Você é um assistente especializado em análise visual para detecção de lixo em imagens.
    Ao receber uma imagem:
    - Descreva brevemente os tipos de lixo visíveis (ex.: plástico, vidro, papel, metal, orgânico).
    - Cite marcas, logotipos ou rótulos identificáveis, se houver.
    - Informe elementos de contexto do local, como rua, parque, praia, rio, etc.
    Regras especiais:
    - Se a imagem parecer gerada por IA, ilustração, pintura ou irreal, responda exatamente: <fake>.
    - Se não houver lixo visível, responda exatamente: <not-found>.
    Responda de forma objetiva, sem comentários adicionais nem explicações.
  `

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: systemPrompt.replace(/\s\s+/g, ' '),
      },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high",
          },
        ],
      },
    ],
  });

  const textOutput = response.output
    .filter((item) => item.type === "message")
    .flatMap((item: any) => item.content || [])
    .find((c: any) => c.type === "output_text");

  if (!textOutput) throw new Error("Nenhuma saída de texto encontrada na resposta da OpenAI.");
  return textOutput.text.trim();
}

/** ✅ Função principal de inicialização do WhatsApp */
export function initWhatsApp() {
  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth',
      clientId: 'eco-herois-bot',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

    // 🔄 Estado de conversa temporário
  interface UserState {
    stage: "intro" | "image" | "confirm" | "location" | "done";
    imageData?: string;
    imagePath?: string;
    description?: string;
  }

  const userState = new Map<string, UserState>();

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

    // 🔒 Ignora grupos e números não autorizados
    if (chat.isGroup || !allowedNumbers.includes(from)) return;

    const state = userState.get(from) || { stage: "intro" };
    if (msg.type === "image") state.stage = "image"

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

          const imagePath = saveFile("./uploads", `report_${Date.now()}.jpg`, media.data);

          chat.sendStateTyping();
          const analysis = await analyzeImage(imagePath);

          if (analysis.includes("<fake>")) {
            response = "⚠️ Imagem não parece ser real. Tente enviar outra.";
          } else if (analysis.includes("<not-found>")) {
            response = "🧹 Não identifiquei lixo na imagem. Tente outra foto, por favor.";
          } else {
            state.stage = "confirm";
            state.imageData = media.data;
            state.imagePath = imagePath;
            state.description = analysis;
            response = `📸 Análise da imagem:\n\n${analysis}\n\n${confirmationQuestion}`;
          }
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

          const payload = {
            id: Math.random() * 1000000,
            userId: from,
            imageData: state.imageData,
            description: '',
            latitude: msg.location?.latitude,
            longitude: msg.location?.longitude,
            classification: '',
            confidence: ''
          };

          axios.post(`http://${host}:${port}images/`, payload)
            .then(response => {
              console.log('Resposta:', response.data);
            })
            .catch(error => {
              console.error('Erro na requisição:', error);
            });

          if (state.imagePath) {
            fs.unlink(state.imagePath, (err) => {
              if (err) {
                console.error('Error deleting file:', err);
                return;
              }
              console.log('File deleted successfully');
            });
          }

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
    if (response) await msg.reply(response);
  });

  client.initialize();
}
