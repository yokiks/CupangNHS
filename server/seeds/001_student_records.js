export async function seed(knex) {
    const rows = [
        { lrn: "301420000001", first_name: "Juan", last_name: "Dela Cruz", grade_level: "10", section: "Rizal" },
        { lrn: "301420000002", first_name: "Maria", last_name: "Santos", grade_level: "9", section: "Bonifacio" },
        { lrn: "301420000003", first_name: "Pedro", last_name: "Reyes", grade_level: "8", section: "Jacinto" },
        { lrn: "301420000004", first_name: "Luisa", last_name: "Garcia", grade_level: "7", section: "Mabini" },
        { lrn: "301420000005", first_name: "Angela", last_name: "Rivera", grade_level: "10", section: "Quezon" },
    ];

    for (const row of rows) {
        const exists = await knex("student_records").where("lrn", row.lrn).first();
        if (exists) {
            await knex("student_records").where("lrn", row.lrn).update(row);
        } else {
            await knex("student_records").insert(row);
        }
    }
}
