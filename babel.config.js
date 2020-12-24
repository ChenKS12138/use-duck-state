const config =
  process.env.NODE_ENV === "test"
    ? {
        presets: ["@babel/preset-env", "@babel/preset-typescript"],
        plugins: [
          "@babel/plugin-proposal-class-properties",
          "@babel/plugin-transform-runtime",
        ],
      }
    : {
        presets: ["@babel/preset-env", "@babel/preset-typescript"],
      };

module.exports = config;
