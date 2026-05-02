// Login journey that lands on a project detail page for exploration
export default async function journey(ctx) {
  const { page, resolveUrl } = ctx;

  // 1. Navigate to login
  await page.goto(resolveUrl("/login"));
  await page.waitForTimeout(500);

  // 2. Fill credentials
  await page.fill("input[type='text']", "admin");
  await page.fill("input[type='password']", "111");

  // 3. Submit
  await page.click("button[type='submit']");
  await page.waitForTimeout(2000);

  // 4. Fetch projects
  const projects = await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem("dashboard-storage") || "{}")?.state?.token;
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  });

  // 5. Return all URLs for auditing
  const urls = ["/"];
  for (const p of projects) {
    if (p.status === "active") {
      urls.push("/projects/" + p.id);
    }
  }
  return urls;
}
