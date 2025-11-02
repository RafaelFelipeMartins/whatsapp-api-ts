import { Request, Response } from "express";
import db from "../database/connection.js";

// POST /users — criar
export const createUser = async (req: Request, res: Response) => {
    const { nome, email, phone, role } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ message: "Nome e email são obrigatórios" });
    }

    try {
        const payload: any = { nome, email };
        if (phone) payload.phone = phone;
        if (role)  payload.role  = role; // 'user' | 'gestor' | 'primary'

        const [user] = await db("users").insert(payload).returning("*");
        return res.status(201).json(user);
    } catch (error: any) {
        // conflito de único (email/phone duplicado)
        if (error?.code === "23505") {
            return res.status(409).json({ message: "Email ou telefone já cadastrado" });
        }
        return res.status(500).json({ message: "Erro ao cadastrar usuário", error: error?.message });
    }
};

// PUT /users/:id — editar (parcial)
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, email, phone, role } = req.body;

    try {
        const data: any = {};
        if (nome !== undefined)  data.nome  = nome;
        if (email !== undefined) data.email = email;
        if (phone !== undefined) data.phone = phone;
        if (role  !== undefined) data.role  = role;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "Informe algum campo para atualizar" });
        }

        data.updated_at = db.fn.now();

        const updated = await db("users").where({ id }).update(data).returning("*");

        if (!updated || updated.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        return res.json(updated[0]);
    } catch (error: any) {
        if (error?.code === "23505") {
            return res.status(409).json({ message: "Email ou telefone já cadastrado" });
        }
        return res.status(500).json({ message: "Erro ao atualizar usuário", error: error?.message });
    }
};

// DELETE /users/:id — excluir
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await db("users").where({ id }).del();

        if (!deleted) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        return res.json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao deletar usuário", error: error?.message });
    }
};

// GET /users — listar
export const listUsers = async (_req: Request, res: Response) => {
    const items = await db("users").select("*").orderBy("created_at", "desc");
    return res.json(items);
};

// GET /users/:id — obter
export const getUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await db("users").where({ id }).first();
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    return res.json(user);
};
