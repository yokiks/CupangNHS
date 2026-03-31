export async function up(knex) {
    await knex.schema.createTable("users", (t) => {
        t.increments("id").primary();
        t.string("first_name", 100).notNullable();
        t.string("last_name", 100).notNullable();
        t.string("username", 100).notNullable().unique();
        t.string("lrn", 20).unique();
        t.string("email", 150);
        t.string("password_hash", 255).notNullable();
        t.enum("role", ["student", "guidance_counselor"]).notNullable().defaultTo("student");
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("users");
}
