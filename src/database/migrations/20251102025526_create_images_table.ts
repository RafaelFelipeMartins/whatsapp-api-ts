import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // garante a função gen_random_uuid()
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await knex.schema.createTable("images", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        //table.uuid("user_id").notNullable()
        //    .references("id").inTable("users").onDelete("CASCADE");
        table.string("phone").notNullable();
        table.text("image_base64").notNullable();
        table.string("endereco");
        table.decimal("latitude", 10, 7);
        table.decimal("longitude", 10, 7);
        /* table.enum("status", ["pending", "validated", "discarded"], {
            useNative: true,
            enumName: "image_status",
        }).defaultTo("pending"); */
        table.string("classification");
        //table.decimal("confidence", 5, 2);
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("images");
    await knex.raw('DROP TYPE IF EXISTS "image_status";');
}
