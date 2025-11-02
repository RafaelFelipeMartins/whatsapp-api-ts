import express, { Request, Response } from 'express';
//import { initWhatsApp } from './bot/whatsapp';
import userRoutes from "./routes/userRoutes";
import imagesRouter from "./routes/imagesRouter";
import dotenv from "dotenv";
import cors from "cors";
import reportRouter from "./routes/reportRouter";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'API está rodando 🚀',
        timestamp: new Date().toISOString(),
    });
});

//initWhatsApp();

app.use("/users", userRoutes);
app.use("/images", imagesRouter);
app.use("/reports", reportRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}/health`);
});
