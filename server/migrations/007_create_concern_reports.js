export async function up(knex) {
    await knex.schema.createTable("concern_reports", (t) => {
        t.increments("id").primary();
        t.integer("concern_id").unsigned().notNullable().unique()
            .references("id").inTable("concerns").onDelete("CASCADE");
        t.integer("counselor_id").unsigned().notNullable()
            .references("id").inTable("users");
        t.text("admin_notes");
        t.text("findings");
        t.text("recommendations");
        t.text("closing_remarks");
        t.boolean("follow_up_required").defaultTo(false);
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("concern_reports");
}
