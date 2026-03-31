export async function up(knex) {
    await knex.schema.createTable("concern_involved_students", (t) => {
        t.increments("id").primary();
        t.integer("concern_id").unsigned().notNullable()
            .references("id").inTable("concerns").onDelete("CASCADE");
        t.integer("user_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("CASCADE");
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.unique(["concern_id", "user_id"]);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("concern_involved_students");
}
