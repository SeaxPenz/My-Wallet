(async function () {
  try {
    const urls = [
      "http://127.0.0.1:5001/api/transactions/__debug/users",
      "http://127.0.0.1:5001/api/transactions/me",
      "http://127.0.0.1:5001/api/transactions/summary/me",
    ];
    for (const u of urls) {
      const opts = {};
      if (u.endsWith("/me") || u.endsWith("/summary/me")) {
        opts.headers = { "x-user-id": "dev-user-1" };
      }
      const res = await fetch(u, opts).catch((e) => ({
        ok: false,
        statusText: e.message,
        text: async () => "",
      }));
      const txt = await (res.text ? res.text() : "");
      console.log("URL:", u);
      console.log("STATUS:", res.status || "no-status");
      console.log(txt || "<empty>");
      console.log("---");
    }
  } catch (err) {
    console.error("script error", err);
  }
})();
