export async function up(knex) {
    await knex.schema.createTable("notifications", (t) => {
        t.increments("id").primary();
        t.integer("user_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("CASCADE");
        t.integer("concern_id").unsigned()
            .references("id").inTable("concerns").onDelete("CASCADE");
        t.string("message", 500).notNullable();
        t.enum("type", ["status_update", "info"]).defaultTo("status_update");
        t.boolean("read_flag").defaultTo(false);
        t.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("notifications");
}
