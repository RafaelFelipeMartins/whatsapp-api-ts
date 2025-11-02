import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEnvironmentalReport(data: {
    total_denuncias: number;
    ia_approved: number;
    bairros_criticos: string[];
    locais_reincidentes: string[];
    engajamento_colaborativo: number;
    alunos_engajados: number;
    parcerias_ativas: number;
}) {
    const prompt = `
Você é uma assistente especializada em meio ambiente e políticas públicas.
Com base nos dados a seguir, gere um relatório técnico para um gestor público municipal responsável por limpeza urbana e sustentabilidade.

Os dados da operação são:
- Total de denúncias: ${data.total_denuncias}
- Imagens validadas por IA: ${data.ia_approved}
- Bairros críticos: ${data.bairros_criticos.join(", ") || "Nenhum"}
- Locais reincidentes: ${data.locais_reincidentes.join(", ") || "Nenhum"}
- Escolas engajadas: ${data.engajamento_colaborativo}
- Alunos participantes: ${data.alunos_engajados}
- Parcerias ativas: ${data.parcerias_ativas}

Gere:
1. Um **resumo descritivo da situação ambiental** (campo "description");
2. Uma **lista de ações recomendadas** (campo "acoes_recomendadas"), voltadas à gestão pública (educação, infraestrutura, campanhas, etc.);
3. Use linguagem clara e formal, direcionada a um gestor público.
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "Você é uma analista ambiental especialista em sustentabilidade urbana." },
            { role: "user", content: prompt },
        ],
    });

    const text = response.choices[0]?.message?.content || "";

    // tenta separar description e ações
    const [description, acoes_recomendadas] = text.split(/Ações recomendadas:/i);
    return {
        description: description?.trim() || text,
        acoes_recomendadas: acoes_recomendadas?.trim() || "",
    };
}
