export async function up(knex) {
    await knex.schema.createTable("student_records", (t) => {
        t.increments("id").primary();
        t.string("lrn", 20).notNullable().unique();
        t.string("first_name", 100).notNullable();
        t.string("last_name", 100).notNullable();
        t.string("grade_level", 20);
        t.string("section", 50);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("student_records");
}
