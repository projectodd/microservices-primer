/* jshint node:true */

"use strict";

module.exports = function(options) {
  var CB = require("circuit-breakerjs").CircuitBreaker,
      circuit = new CB(options),
      run = circuit.run.bind(circuit),
      name = options.name || "foo", //TODO: better default name
      // this doesn't watch the callback, but the action that triggers
      // the callback
      wrap_callback = function(cb, fallback_args) {
        return function(err) {
          var fallback = function() {
            return cb.apply(null, [null].concat(fallback_args));
          };
          var wrapper = function(success, failure, timeout) { // TODO: something with timeout?
            try {
              if (err) {
                console.warn("fartgun: action for '%s' failed: %j", name, err);
                failure();

                return fallback();
              }
              success();
            } catch (e) {
              console.error("fartgun: callback for '%s' failed: %j", name, e);

              throw e;
            }

            return cb.apply(null, arguments);
          };

          run(wrapper, fallback);
        };
      };

  return {name: name,
          run: run,
          wrap_callback: wrap_callback};
};
