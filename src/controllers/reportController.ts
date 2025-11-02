import { Request, Response } from "express";
import db from "../database/connection.js";

// POST /reports — criar relatório
export const createReport = async (req: Request, res: Response) => {
    try {
        const {
            school_id,
            description,
            acoes_recomendadas,
            total_denuncias,
            ia_approved,
            recorrencia_regiao,
            locais_reincidentes,
            bairros_criticos,
            engajamento_colaborativo,
            alunos_engajados,
            parcerias_ativas,
            premio_escola,
            image_ids, // array de IDs de imagens
        } = req.body;

        // cria o relatório
        const [report] = await db("reports")
            .insert({
                school_id,
                description,
                acoes_recomendadas,
                total_denuncias,
                ia_approved,
                recorrencia_regiao,
                locais_reincidentes,
                bairros_criticos,
                engajamento_colaborativo,
                alunos_engajados,
                parcerias_ativas,
                premio_escola,
            })
            .returning("*");

        // vincula imagens (se vierem IDs)
        if (Array.isArray(image_ids) && image_ids.length > 0) {
            const relations = image_ids.map((image_id: string) => ({
                report_id: report.id,
                image_id,
            }));
            await db("report_images").insert(relations);
        }

        return res.status(201).json(report);
    } catch (error: any) {
        console.error("❌ Erro ao criar relatório:", error);
        return res.status(500).json({ message: "Erro ao criar relatório", error: error?.message });
    }
};

// GET /reports — listar relatórios
export const listReports = async (_req: Request, res: Response) => {
    try {
        const reports = await db("reports").select("*").orderBy("created_at", "desc");
        return res.json(reports);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao listar relatórios", error: error?.message });
    }
};

// GET /reports/:id — obter relatório com imagens
export const getReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const report = await db("reports").where({ id }).first();
        if (!report) return res.status(404).json({ message: "Relatório não encontrado" });

        const images = await db("images")
            .join("report_images", "images.id", "report_images.image_id")
            .where("report_images.report_id", id)
            .select("images.*");

        return res.json({ ...report, images });
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao buscar relatório", error: error?.message });
    }
};

// PUT /reports/:id — atualizar
export const updateReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [updated] = await db("reports").where({ id }).update(updates).returning("*");

        if (!updated) return res.status(404).json({ message: "Relatório não encontrado" });

        return res.json(updated);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao atualizar relatório", error: error?.message });
    }
};

// DELETE /reports/:id — deletar
export const deleteReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await db("reports").where({ id }).del();

        if (!deleted)
            return res.status(404).json({ message: "Relatório não encontrado" });

        return res.json({ message: "Relatório deletado com sucesso" });
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao deletar relatório", error: error?.message });
    }
};
