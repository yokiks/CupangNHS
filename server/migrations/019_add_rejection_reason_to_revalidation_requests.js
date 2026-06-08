export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn("revalidation_requests", "rejection_reason");
    if (hasColumn) {
        return;
    }

    await knex.schema.alterTable("revalidation_requests", (t) => {
        t.text("rejection_reason").nullable();
    });
}

export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn("revalidation_requests", "rejection_reason");
    if (!hasColumn) {
        return;
    }

    await knex.schema.alterTable("revalidation_requests", (t) => {
        t.dropColumn("rejection_reason");
    });
}
