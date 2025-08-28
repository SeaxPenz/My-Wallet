(async () => {
  try {
    const payload = {
      user_id: "dev-user-1",
      email: "dev@example.com",
      title: "Test API Create",
      amount: 12.34,
      category: "Other",
      note: "test",
      created_at: new Date().toISOString(),
    };
    const r = await fetch("http://127.0.0.1:5001/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "dev-user-1",
      },
      body: JSON.stringify(payload),
    });
    console.log("status", r.status);
    const t = await r.text();
    console.log(t);
  } catch (e) {
    console.error("error", e.message || e);
    process.exit(1);
  }
})();
