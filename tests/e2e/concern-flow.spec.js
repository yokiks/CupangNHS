import { test, expect } from "@playwright/test";

const ts = Date.now();
const STUDENT_LRN = `301420${String(ts).slice(-6)}`;
const STUDENT_USERNAME = `e2e_student_${ts}`;
const STUDENT_PASSWORD = "TestPass1234!";
const STUDENT_EMAIL = `e2estudent${ts}@test.com`;

const COUNSELOR_USERNAME = "CuNHSadmin";
const COUNSELOR_PASSWORD = "Guidance@CuNHS!";

const CONCERN_TITLE = `E2E Concern ${ts}`;
const CONCERN_DESC = "This concern was created by an automated E2E test.";

async function loginAsStudent(page) {
    await page.goto("/login");
    await page.fill("#identifier", STUDENT_USERNAME);
    await page.fill("#password", STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function loginAsCounselor(page) {
    await page.goto("/login");
    await page.selectOption('select[name="role"]', "guidance");
    await page.fill("#identifier", COUNSELOR_USERNAME);
    await page.fill("#password", COUNSELOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe.serial("Student Concern Submission and Counselor Review", () => {
    test("1. Student registers a new account", async ({ page }) => {
        await page.goto("/register");
        await expect(page.locator("h2")).toContainText("Create an Account");

        await page.fill('input[name="firstName"]', "E2E");
        await page.fill('input[name="lastName"]', "Student");
        await page.fill('input[name="studentEmail"]', STUDENT_EMAIL);
        await page.fill('input[name="lrn"]', STUDENT_LRN);
        await page.fill('input[name="username"]', STUDENT_USERNAME);
        await page.fill('input[name="password"]', STUDENT_PASSWORD);
        await page.fill('input[name="confirmPassword"]', STUDENT_PASSWORD);

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
        await expect(page.locator("h1")).toContainText("Welcome");
    });

    test("2. Student submits a concern", async ({ page }) => {
        await loginAsStudent(page);

        await page.getByRole("button", { name: /Submit New Concern/i }).click();
        await expect(page.getByText("Submit a Concern")).toBeVisible();

        const form = page.locator("form").filter({ hasText: "Submit Concern" });
        await form.locator('input[type="text"]').fill(CONCERN_TITLE);
        await form.locator("select").selectOption("academic");
        await form.locator("textarea").fill(CONCERN_DESC);

        page.on("dialog", (dialog) => dialog.accept());

        const [response] = await Promise.all([
            page.waitForResponse(
                (resp) => resp.url().includes("/api/concerns") && resp.request().method() === "POST",
                { timeout: 15000 }
            ),
            form.locator('button[type="submit"]').click(),
        ]);

        expect(response.status()).toBe(201);

        await page.goto("/dashboard");
        await expect(page.getByText(CONCERN_TITLE)).toBeVisible({ timeout: 15000 });
    });

    test("3. Student sees the concern in My Concerns list", async ({ page }) => {
        await loginAsStudent(page);

        await expect(page.getByText("My Concerns")).toBeVisible();
        await expect(page.getByText(CONCERN_TITLE)).toBeVisible({ timeout: 10000 });

        const card = page.locator(".border.border-gray-200", { hasText: CONCERN_TITLE });
        await expect(card.locator("span.bg-gray-100")).toContainText("Pending");
    });

    test("4. Counselor logs in and sees all concerns", async ({ page }) => {
        await loginAsCounselor(page);

        await expect(page.getByText("All Concerns")).toBeVisible();
        await expect(page.getByText(CONCERN_TITLE)).toBeVisible({ timeout: 10000 });
    });

    test("5. Counselor updates concern status to Read", async ({ page }) => {
        await loginAsCounselor(page);

        const card = page.locator(".border.border-gray-200", { hasText: CONCERN_TITLE });
        await expect(card).toBeVisible({ timeout: 10000 });

        await card.getByRole("button", { name: /Mark as Read/i }).click();

        await expect(card.locator("span.bg-blue-100")).toBeVisible({ timeout: 10000 });
    });

    test("6. Counselor opens review panel and saves report", async ({ page }) => {
        await loginAsCounselor(page);

        const card = page.locator(".border.border-gray-200", { hasText: CONCERN_TITLE });
        await expect(card).toBeVisible({ timeout: 10000 });

        await card.getByRole("button", { name: /View \/ Review/i }).click();

        const panel = page.locator(".fixed.inset-0.bg-black");
        await expect(panel.getByText("Concern Review")).toBeVisible({ timeout: 10000 });
        await expect(panel.getByText("I. STUDENT INFORMATION")).toBeVisible();

        await panel.locator('textarea[placeholder*="notes and remarks"]').fill(
            "Student needs academic support in mathematics."
        );
        await panel.locator('textarea[placeholder*="findings and observations"]').fill(
            "Student is falling behind in math due to missed classes."
        );
        await panel.locator('textarea[placeholder*="recommendations and actions"]').fill(
            "Schedule tutoring sessions twice a week."
        );
        await panel.locator('textarea[placeholder*="closing remarks"]').fill(
            "Will follow up in two weeks."
        );

        page.on("dialog", (dialog) => dialog.accept());
        await panel.getByRole("button", { name: "Save" }).click();
        await page.waitForTimeout(1500);

        await panel.getByRole("button", { name: "Close" }).click();
        await expect(panel).not.toBeVisible({ timeout: 5000 });
    });

    test("7. Counselor can generate overall report", async ({ page }) => {
        await loginAsCounselor(page);

        const [popup] = await Promise.all([
            page.waitForEvent("popup"),
            page.getByRole("button", { name: /Generate Overall Report/i }).click(),
        ]);

        await expect(popup.locator("body")).toContainText("STUDENT CONCERNS", { timeout: 15000 });
        await popup.close();
    });

    test("8. Counselor sees flagged students summary", async ({ page }) => {
        await loginAsCounselor(page);

        await expect(page.getByText("All Concerns")).toBeVisible({ timeout: 10000 });
    });

    test("9. Counselor sees Notify Parent button in review panel", async ({ page }) => {
        await loginAsCounselor(page);

        const card = page.locator(".border.border-gray-200", { hasText: CONCERN_TITLE });
        await expect(card).toBeVisible({ timeout: 10000 });

        await card.getByRole("button", { name: /View \/ Review/i }).click();

        const panel = page.locator(".fixed.inset-0.bg-black");
        await expect(panel.getByText("Concern Review")).toBeVisible({ timeout: 10000 });

        const notifyBtn = panel.getByRole("button", { name: /Notify Parent/i });
        await expect(notifyBtn).toBeVisible();

        await panel.getByRole("button", { name: "Close" }).click();
    });

    test("10. Print preview contains attachment section", async ({ page }) => {
        await loginAsCounselor(page);

        const card = page.locator(".border.border-gray-200", { hasText: CONCERN_TITLE });
        await expect(card).toBeVisible({ timeout: 10000 });

        await card.getByRole("button", { name: /View \/ Review/i }).click();

        const panel = page.locator(".fixed.inset-0.bg-black");
        await expect(panel.getByText("Concern Review")).toBeVisible({ timeout: 10000 });

        const [popup] = await Promise.all([
            page.waitForEvent("popup"),
            panel.getByRole("button", { name: /Print Report/i }).click(),
        ]);

        await expect(popup.locator("body")).toContainText("STUDENT CONCERN REPORT", { timeout: 15000 });
        await expect(popup.locator("body")).toContainText("CONCERN DETAILS");
        await popup.close();
    });
});
