export async function up(knex) {
    await knex.schema.createTable("password_resets", (t) => {
        t.integer("user_id").unsigned().primary()
            .references("id").inTable("users").onDelete("CASCADE");
        t.string("token", 255).notNullable().unique();
        t.datetime("expires_at").notNullable();
        t.boolean("used").defaultTo(false);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("password_resets");
}
