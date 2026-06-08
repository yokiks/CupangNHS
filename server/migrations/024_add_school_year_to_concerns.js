export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn("concerns", "school_year_id");
    if (!hasColumn) {
        await knex.schema.alterTable("concerns", (t) => {
            t.integer("school_year_id").unsigned().nullable();
            t.foreign("school_year_id")
                .references("id")
                .inTable("school_years")
                .onDelete("SET NULL");
        });
    }
}

export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn("concerns", "school_year_id");
    if (hasColumn) {
        await knex.schema.alterTable("concerns", (t) => {
            t.dropForeign("school_year_id");
            t.dropColumn("school_year_id");
        });
    }
}
