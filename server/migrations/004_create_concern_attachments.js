export async function up(knex) {
    await knex.schema.createTable("concern_attachments", (t) => {
        t.increments("id").primary();
        t.integer("concern_id").unsigned().notNullable()
            .references("id").inTable("concerns").onDelete("CASCADE");
        t.string("original_name", 255).notNullable();
        t.string("stored_name", 255).notNullable();
        t.string("mime_type", 150).notNullable();
        t.integer("size").notNullable();
        t.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("concern_attachments");
}
