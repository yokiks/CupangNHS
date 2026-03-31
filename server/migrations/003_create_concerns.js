export async function up(knex) {
    await knex.schema.createTable("concerns", (t) => {
        t.increments("id").primary();
        t.integer("user_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("CASCADE");
        t.string("title", 255).notNullable();
        t.text("description").notNullable();
        t.enum("category", ["academic", "behavioral", "general", "safety", "other"]).defaultTo("general");
        t.enum("status", ["pending", "read", "in_review", "resolved"]).defaultTo("pending");
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("concerns");
}
