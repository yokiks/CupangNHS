export async function up(knex) {
    await knex.schema.createTable("enrollment_validation_history", (t) => {
        t.increments("id").primary();
        t.integer("student_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("CASCADE");
        t.integer("school_year_id").unsigned().nullable()
            .references("id").inTable("school_years").onDelete("SET NULL");
        t.string("school_year_label", 20).nullable();
        t.string("grade_level", 20).notNullable();
        t.string("section", 50).notNullable();
        t.string("school_id_proof_original_name", 255).notNullable();
        t.string("school_id_proof_stored_name", 255).notNullable();
        t.string("school_id_proof_mime", 150).notNullable();
        t.integer("school_id_proof_size").notNullable();
        t.timestamp("validated_at").notNullable().defaultTo(knex.fn.now());
        t.integer("approved_by_id").unsigned().notNullable()
            .references("id").inTable("users").onDelete("RESTRICT");
        t.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("enrollment_validation_history");
}
