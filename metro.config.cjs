const http = require("http");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.blockList = [/[/\\]server[/\\].*/];

const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const inner = previousEnhance
      ? previousEnhance(middleware, metroServer)
      : middleware;

    return (req, res, next) => {
      const url = req.url ?? "";
      if (!url.startsWith("/api") && !url.startsWith("/health")) {
        return inner(req, res, next);
      }

      const proxyReq = http.request(
        {
          hostname: "127.0.0.1",
          port: 3000,
          path: url,
          method: req.method,
          headers: {
            ...req.headers,
            host: "127.0.0.1:3000",
          },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on("error", () => {
        res.statusCode = 502;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error:
              "Could not reach the API. In a second terminal run: npm run server",
          }),
        );
      });

      req.pipe(proxyReq);
    };
  },
};

module.exports = config;
