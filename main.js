exports = module.exports = function(userConfig) {
  var nodeFileConfig = require("node-file-config");
  var nodeConfig = new nodeFileConfig("sdl-translate-server");
  var config = nodeConfig.get(userConfig);
  var expressApp = require("express");
  var express = new expressApp();
  var formParser = require("express-formidable");
  express.use(formParser());
  var sdl = require("sdl-translate")({key: config.key});
  var dbpouch = require("dbpouch");
  var db = new dbpouch({
    database: config.database,
    cdn: config.cdn
  });
  var app = {
    wrapper: require("node-promise-wrapper"),
    status: require("./status.js")(),
    capital: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    start: function() {
      var empty = function(name) {
        return function(request, response, next) {
          var field;
          if (typeof request.fields[name] !== "undefined") field = String(request.fields[name]).trim();
          if (typeof field === "undefined" || field === "") {
            response.send(JSON.stringify({status: app.status.textError, error: app.capital(name) + " error."}));
            return false;
          }
          next();
        };
      };
      var authorization = function(request, response, next) {
        var authorization;
        if (typeof request.headers.authorization !== "undefined") authorization = request.headers.authorization.trim().toLowerCase();
        if (authorization !== config.authorization) {
          response.send(JSON.stringify({status: app.status.authorizationError, error: "Authorization error."}));
          return false;
        }
        next();
      };
      express.get("/languages", [authorization], async function(request, response) {
        var {languages} = await app.wrapper("languages", sdl.languages());
        if (typeof languages !== "undefined") {
          response.send(JSON.stringify({status: app.status.success, message: languages}));
        } else {
          response.send(JSON.stringify({status: app.status.languagesError, error: "Languages error."}));
        }
      });
      express.post("/translate", [authorization, empty("text"), empty("from"), empty("to")], async function(request, response) {
        var text = request.fields.text.trim();
        var from = request.fields.from.trim().toLowerCase();
        var to = request.fields.to.trim().toLowerCase();
        var _db = config.cdn.use !== true ? app.db : db;
        console.log(text, from , to);
        var {result} = await app.wrapper("result", _db.record({text: text, from: from, to: to}, config.database));
        if (typeof result !== "undefined") {
          response.send(JSON.stringify({status: app.status.success, message: result.translation}));
        } else {
          var {translation} = await app.wrapper("translation", sdl.translate(text, from, to));
          if (typeof translation !== "undefined") {
            var {error, result} = await app.wrapper("result", _db.save({text: text, from: from, to: to, translation: translation, time: new Date().getTime()}, config.database));
            if (typeof result !== "undefined") {
              response.send(JSON.stringify({status: app.status.success, message: translation}));
            } else {
              response.send(JSON.stringify({status: app.status.translationError, error: "Translation error."}));
            }
          } else {
            response.send(JSON.stringify({status: app.status.translationError, error: "Translation error."}));
          }
        }
      });
      express.listen(config.expressPort, config.expressHost, function() {
        console.log("Your app is listening on: " + config.expressHost + ": " + config.expressPort);
      });
    }
  };
  app.db = require("./db.js")(app, config);
  app.start();
  return app;
};
new exports();