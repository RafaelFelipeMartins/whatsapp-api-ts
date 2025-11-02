import { Request, Response } from "express";
import db from "../database/connection";
import axios from "axios";

// GET /images/:id c retorna todas as imagens de um cliente
export const getImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const images = await db("images").where({ client_id: id });
    return res.json(images);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar capturas", error });
  }
};

// POST /images → cria uma nova captura
export const postImages = async (req: Request, res: Response) => {
    try {
        const { phone, imageBase64, endereco, latitude, longitude } = req.body;

        // Campos obrigatórios mínimos
        if (!phone || !imageBase64) {
            return res
                .status(400)
                .json({ message: "Telefone e imagem são obrigatórios" });
        }

        let lat = latitude;
        let lon = longitude;
        let address = endereco;

        // Se tiver endereço mas não coordenadas → tenta geocodificar
        if (endereco && (!latitude || !longitude)) {
            try {
                const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
                    params: { q: endereco, format: "json", limit: 1 },
                });
                if (geoRes.data.length > 0) {
                    lat = geoRes.data[0].lat;
                    lon = geoRes.data[0].lon;
                }
            } catch (geoError) {
                console.warn("⚠️ Falha ao converter endereço em coordenadas:", geoError);
            }
        }

        // Se tiver coordenadas mas não endereço → tenta buscar endereço reverso
        if ((!endereco || endereco.trim() === "") && latitude && longitude) {
            try {
                const revRes = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                    params: {
                        lat: latitude,
                        lon: longitude,
                        format: "json",
                    },
                });
                address = revRes.data.display_name || null;
            } catch (revError) {
                console.warn("⚠️ Falha ao converter coordenadas em endereço:", revError);
            }
        }

        // Inserção no banco
        const [newImage] = await db("images")
            .insert({
                phone,
                image_base64: imageBase64,
                endereco: address,
                latitude: lat,
                longitude: lon,
            })
            .returning("*");

        return res.status(201).json(newImage);
    } catch (error) {
        console.error("❌ Erro ao salvar captura:", error);
        return res.status(500).json({ message: "Erro ao salvar captura", error });
    }
};


// DELETE /images/:id → deleta uma captura
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db("images").where({ id }).del();

    if (!deleted)
      return res.status(404).json({ message: "Captura não encontrada" });

    return res.json({ message: "Captura deletada com sucesso" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao deletar captura", error });
  }
};
