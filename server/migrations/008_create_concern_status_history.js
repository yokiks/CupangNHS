export async function up(knex) {
    await knex.schema.createTable("concern_status_history", (t) => {
        t.increments("id").primary();
        t.integer("concern_id").unsigned().notNullable()
            .references("id").inTable("concerns").onDelete("CASCADE");
        t.integer("changed_by").unsigned().notNullable()
            .references("id").inTable("users");
        t.enum("old_status", ["pending", "read", "in_review", "resolved"]);
        t.enum("new_status", ["pending", "read", "in_review", "resolved"]).notNullable();
        t.timestamp("created_at").defaultTo(knex.fn.now());

        t.index("concern_id");
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("concern_status_history");
}
