import express, { Application, Request, Response } from 'express';
import routes from './routes/index';
import { initWhatsApp } from './bot/whatsapp';
import dotenv from "dotenv";
import cors from "cors";
// import db from './database/connection.js'; // 🔹 conexão com o PostgreSQL

dotenv.config();
const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'API está rodando 🚀',
        timestamp: new Date().toISOString(),
    });
});

// 🔹 rota temporária pra testar o banco
app.get('/dbtest', async (_req: Request, res: Response) => {
    try {
        const result = await db.raw('SELECT NOW()');
        res.status(200).json({
            status: 'connected ✅',
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error('❌ Erro de conexão com o banco:', error);
        res.status(500).json({ status: 'error', message: 'Falha ao conectar no banco', error });
    }
});

initWhatsApp();

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}/health`);
});
