export async function up(knex) {
    await knex.schema.alterTable("users", (t) => {
        t.string("parent_name", 200).nullable();
        t.string("parent_email", 150).nullable();
        t.string("parent_contact", 20).nullable();
    });
}

export async function down(knex) {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn("parent_name");
        t.dropColumn("parent_email");
        t.dropColumn("parent_contact");
    });
}
