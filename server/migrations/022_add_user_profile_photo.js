export async function up(knex) {
    await knex.schema.alterTable("users", (t) => {
        t.string("profile_photo_original_name", 255).nullable();
        t.string("profile_photo_stored_name", 255).nullable();
        t.string("profile_photo_mime", 100).nullable();
        t.integer("profile_photo_size").nullable();
    });
}

export async function down(knex) {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn("profile_photo_original_name");
        t.dropColumn("profile_photo_stored_name");
        t.dropColumn("profile_photo_mime");
        t.dropColumn("profile_photo_size");
    });
}
