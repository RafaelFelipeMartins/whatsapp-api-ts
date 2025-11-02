import { Request, Response } from "express";
import db from "../database/connection";
import axios from "axios";

// POST /images — criar imagem
export const createImage = async (req: Request, res: Response) => {
    try {
        const {
            phone,
            imageBase64,
            endereco,
            latitude,
            longitude,
            classification,
            confidence,
        } = req.body;

        console.log(phone, imageBase64);
        if (!phone || !imageBase64) {
            return res
                .status(400)
                .json({ message: "Campos obrigatórios: user_id, phone e imageBase64" });
        }

        // se tiver endereço mas não coordenadas, geocodifica
        let lat = latitude;
        let lon = longitude;
        if (endereco && (!latitude || !longitude)) {
            const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: { q: endereco, format: "json", limit: 1 },
            });
            if (geo.data.length > 0) {
                lat = geo.data[0].lat;
                lon = geo.data[0].lon;
            }
        }

        const [image] = await db("images")
            .insert({
                phone,
                image_base64: imageBase64,
                endereco,
                latitude: lat,
                longitude: lon,
                classification,
                confidence,
            })
            .returning("*");

        return res.status(201).json(image);
    } catch (error: any) {
        console.error("❌ Erro ao salvar imagem:", error);
        return res.status(500).json({ message: "Erro ao salvar imagem", error: error?.message });
    }
};

// GET /images — listar todas
export const listImages = async (_req: Request, res: Response) => {
    try {
        const images = await db("images")
            .select("images.*", "users.nome as user_name")
            .leftJoin("users", "images.user_id", "users.id")
            .orderBy("images.created_at", "desc");

        return res.json(images);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao listar imagens", error: error?.message });
    }
};

// GET /images/:id — obter uma imagem
export const getImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const image = await db("images").where({ id }).first();

        if (!image) return res.status(404).json({ message: "Imagem não encontrada" });

        return res.json(image);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao buscar imagem", error: error?.message });
    }
};

// PUT /images/:id — atualizar imagem (status, classificação, etc.)
export const updateImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { endereco, latitude, longitude, status, classification, confidence } = req.body;

        const data: any = {};
        if (endereco) data.endereco = endereco;
        if (latitude) data.latitude = latitude;
        if (longitude) data.longitude = longitude;
        if (status) data.status = status;
        if (classification) data.classification = classification;
        if (confidence) data.confidence = confidence;

        const [updated] = await db("images").where({ id }).update(data).returning("*");

        if (!updated) return res.status(404).json({ message: "Imagem não encontrada" });

        return res.json(updated);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao atualizar imagem", error: error?.message });
    }
};

// DELETE /images/:id — excluir imagem
export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await db("images").where({ id }).del();

        if (!deleted)
            return res.status(404).json({ message: "Imagem não encontrada" });

        return res.json({ message: "Imagem deletada com sucesso" });
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao deletar imagem", error: error?.message });
    }
};
