exports = module.exports = function() {
  return {
    authorization: "zugubq6vy8-qf4yfghlfc-fpikpbumpb-f2npktpnzx", // Lowercase
    expressHost: "127.0.0.1",
    expressPort: 3000,
    database: "database/translations",
    key: "", // Get an API key here: https://languagecloud.sdl.com/translation-toolkit/login?origin=xing&product=onlineeditor
    cdn: {
      use: false,
      email: "<email>",
      apiKey: "<api_key>",
      domain: "<domain>",
      folder: "<folder>"
    }
  }
};