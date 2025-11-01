import express from 'express';
import db from '../database/connection.js'; // importa o knex configurado

const router = express.Router();

// GET /capture/:id → retorna todas as imagens de um cliente
router.get('/capture/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const captures = await db('captures').where({ client_id: id });
        res.json(captures);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar capturas', error });
    }
});

// POST /capture → cria uma nova captura
router.post('/capture', async (req, res) => {
    try {
        const { phone, imageBase64 } = req.body;

        if (!phone || !imageBase64) {
            return res.status(400).json({ message: 'Telefone e imagem são obrigatórios' });
        }

        const [newCapture] = await db('captures')
            .insert({
                phone,
                image_base64: imageBase64,
            })
            .returning('*');

        res.status(201).json(newCapture);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar captura', error });
    }
});

// POST /capture/:id/location → atualiza o endereço
router.post('/capture/:id/location', async (req, res) => {
    try {
        const { id } = req.params;
        const { endereco } = req.body;

        if (!endereco) {
            return res.status(400).json({ message: 'O campo endereço é obrigatório' });
        }

        const [updated] = await db('captures')
            .where({ id })
            .update({ endereco })
            .returning('*');

        if (!updated) return res.status(404).json({ message: 'Captura não encontrada' });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar endereço', error });
    }
});

// DELETE /capture/:id → deleta uma captura
router.delete('/capture/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db('captures').where({ id }).del();

        if (!deleted) return res.status(404).json({ message: 'Captura não encontrada' });

        res.json({ message: 'Captura deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar captura', error });
    }
});

export default router;
