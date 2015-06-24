/* jshint node:true */

"use strict";

module.exports = function(options) {
  var CB = require("circuit-breakerjs").CircuitBreaker,
      circuit = new CB(options),
      run = circuit.run.bind(circuit),
      name = options.name || "foo", //TODO: better default name
      wrap_callback = function(cb, fallback_args) {
        return function(err) {
          var fallback = function() {
            return cb.apply(null, [null].concat(fallback_args));
          };

          run(function(success, failure, timeout) { // TODO: something with timeout?
            try {
              if (err) {
                console.warn("fartgun: action for %s failed: %j", name, err);
                failure();

                return fallback();
              } else {

                return cb.apply(null, arguments);
              }
            } catch (e) {
              console.error("fartgun: callback for %s failed: %j", name, e);

              return failure();
            }

            return success();
          },
              fallback());
        };
      };

  return {name: name,
          run: run,
          wrap_callback: wrap_callback};
};
