import {Client, LocalAuth, Message} from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';

export function initWhatsApp(): void {
  const client = new Client({
    authStrategy: new LocalAuth(),
  });

  client.on('qr', (qr: string) => {
    console.log('📱 Escaneie o QR code abaixo para conectar o WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
  });

  client.on('message', async (msg: Message) => {
    const input = msg.body.trim();
    const regexCalc = /^[0-9+\-*/().\s]+$/;

    if (regexCalc.test(input)) {
      try {
          await msg.reply(`🧮 Resultado: ${input}`);
      } catch {
        await msg.reply('❌ Input inválido');
      }
    } else {
      await msg.reply('❌ Input inválido');
    }
  });

  client.initialize();
}
