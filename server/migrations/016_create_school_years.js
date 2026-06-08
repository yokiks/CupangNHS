export async function up(knex) {
    await knex.schema.createTable("school_years", (t) => {
        t.increments("id").primary();
        t.string("label", 20).notNullable().unique();
        t.enum("status", ["active", "archived"]).notNullable().defaultTo("archived");
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("school_years");
}
