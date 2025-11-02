import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // garante a função gen_random_uuid()
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await knex.schema.createTable("reports", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("school_id").nullable(); // futuro relacionamento com tabela schools
        table.text("description").nullable(); // descrição gerada pela IA
        table.text("acoes_recomendadas").nullable(); // ações sugeridas pela IA
        table.integer("total_denuncias").defaultTo(0);
        table.integer("ia_approved").defaultTo(0);
        table.integer("recorrencia_regiao").defaultTo(0);
        table.jsonb("locais_reincidentes").defaultTo("[]");
        table.jsonb("bairros_criticos").defaultTo("[]");
        table.integer("engajamento_colaborativo").defaultTo(0);
        table.integer("alunos_engajados").defaultTo(0);
        table.integer("parcerias_ativas").defaultTo(0);
        table.string("premio_escola").nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });

    // tabela pivô: images <-> reports (N:N)
    await knex.schema.createTable("report_images", (table) => {
        table.uuid("report_id").references("id").inTable("reports").onDelete("CASCADE");
        table.uuid("image_id").references("id").inTable("images").onDelete("CASCADE");
        table.primary(["report_id", "image_id"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("report_images");
    await knex.schema.dropTableIfExists("reports");
}
