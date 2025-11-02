import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // garante a função gen_random_uuid()
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await knex.schema.createTable("users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("nome").notNullable();
        table.string("email").notNullable().unique();
        table.string("phone").unique().nullable(); // pode ser obrigatório depois, se quiser
        table.enu("role", ["user", "gestor", "primary"], {
            useNative: true,
            enumName: "user_role",
        }).notNullable().defaultTo("user");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("users");
    // opcional: remover o tipo enum nativo
    await knex.raw('DROP TYPE IF EXISTS "user_role";');
}
