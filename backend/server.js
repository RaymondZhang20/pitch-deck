const http = require("http");
const { matches } = require("./matches");

const PORT = Number(process.env.PORT || 3000);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/api/match/list") {
    sendJson(response, 200, {
      matches,
    });
    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/api/match/")) {
    const matchId = decodeURIComponent(request.url.slice("/api/match/".length));
    const match = matches.find((item) => item.matchId === matchId);
    if (!match) {
      sendJson(response, 404, {
        message: "Match Not Found",
      });
      return;
    }

    sendJson(response, 200, {
      match,
    });
    return;
  }

  sendJson(response, 404, {
    message: "Not Found",
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-api] listening on http://127.0.0.1:${PORT}`);
});
