import { Request, Response } from "express";
import db from "../database/connection";
import {generateEnvironmentalReport} from "../services/openaiService";

// POST /reports — criar relatório
export const createReport = async (req: Request, res: Response) => {
    try {
        const {
            total_denuncias,
            ia_approved,
            bairros_criticos,
            locais_reincidentes,
            engajamento_colaborativo,
            alunos_engajados,
            parcerias_ativas,
            image_ids
        } = req.body;

        // chama a IA para gerar descrição e recomendações
        const aiResult = await generateEnvironmentalReport({
            total_denuncias,
            ia_approved,
            bairros_criticos,
            locais_reincidentes,
            engajamento_colaborativo,
            alunos_engajados,
            parcerias_ativas,
        });

        const [report] = await db("reports")
            .insert({
                description: aiResult.description,
                acoes_recomendadas: aiResult.acoes_recomendadas,
                total_denuncias,
                ia_approved,
                bairros_criticos: JSON.stringify(bairros_criticos || []),
                locais_reincidentes: JSON.stringify(locais_reincidentes || []),
                engajamento_colaborativo,
                alunos_engajados,
                parcerias_ativas,
            })
            .returning("*");

        // vincula imagens se houver
        if (Array.isArray(image_ids) && image_ids.length > 0) {
            const relations = image_ids.map((image_id: string) => ({
                report_id: report.id,
                image_id,
            }));
            await db("report_images").insert(relations);
        }

        res.status(201).json(report);
    } catch (error: any) {
        console.error("Erro ao gerar relatório IA:", error);
        res.status(500).json({ message: "Erro ao gerar relatório com IA", error: error?.message });
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
