(async () => {
  try {
    const user = "user_31NdscfUDs43JpY1bHEisP46jBf";
    const url = `http://127.0.0.1:5001/api/transactions/${user}`;
    const res = await fetch(url).catch((e) => ({
      ok: false,
      statusText: e.message,
      text: async () => "",
    }));
    const txt = await (res.text ? res.text() : "");
    console.log("URL:", url);
    console.log("STATUS:", res.status || "no-status");
    console.log(txt || "<empty>");
  } catch (e) {
    console.error(e);
  }
})();
