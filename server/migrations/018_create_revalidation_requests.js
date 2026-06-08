export async function up(knex) {
    await knex.schema.createTable("revalidation_requests", (t) => {
        t.increments("id").primary();
        t.integer("user_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("CASCADE");
        t.integer("school_year_id").unsigned().nullable()
            .references("id").inTable("school_years").onDelete("SET NULL");
        t.string("grade_level", 20).notNullable();
        t.string("section", 50).notNullable();
        t.string("school_id_proof_original_name", 255).notNullable();
        t.string("school_id_proof_stored_name", 255).notNullable();
        t.string("school_id_proof_mime", 150).notNullable();
        t.integer("school_id_proof_size").notNullable();
        t.enum("status", ["pending_review", "approved", "rejected"]).notNullable().defaultTo("pending_review");
        t.timestamp("submitted_at").defaultTo(knex.fn.now());
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("revalidation_requests");
}
