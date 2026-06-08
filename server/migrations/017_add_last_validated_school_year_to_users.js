export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn("users", "last_validated_school_year_id");
    if (hasColumn) {
        return;
    }

    await knex.schema.alterTable("users", (t) => {
        t.integer("last_validated_school_year_id").unsigned().nullable();
        t.foreign("last_validated_school_year_id")
            .references("id")
            .inTable("school_years")
            .onDelete("SET NULL");
    });
}

export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn("users", "last_validated_school_year_id");
    if (!hasColumn) {
        return;
    }

    await knex.schema.alterTable("users", (t) => {
        t.dropForeign("last_validated_school_year_id");
        t.dropColumn("last_validated_school_year_id");
    });
}
