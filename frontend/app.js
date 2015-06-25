var $ = require('jquery');
var async = require('async');

var order = {
  "city" : "Dublin",
  "country" : "Ireland",
  "quantity" : 100,
  "accountManager" : "+1 123 456 789"
};

$(function(){
  $('#unified').on('click', iterator('unified', 1, unified));
  $('#unifiedBench').on('click', iterator('unified', 10, unified));
  $('pre').html(JSON.stringify(order));
});

function iterator(name, times, fn){
  return function(){
    var getters = [];
    for (var i=0; i<times; i++){
      getters.push(fn);
    }
    async.parallel(getters, function(err, results){
      var sum = results.reduce(function(a, b){
        return a + b;
      }),
      avg = sum / times;
      $('#results').append('<br /> ' + name + ' took an average of ' + avg);
    });
  };
}


function unified(done){
  var time1 = new Date().getTime();
  $.ajax({
    type: "POST",
    url: location.href + 'orders?ts=' + time1,
    data: JSON.stringify(order),
    dataType : 'json',
    contentType: "application/json",
    success: function(result){
      time1 = new Date().getTime() - time1;
      $('#results').append('<br /> Unified took ' + time1 + ', response: ' + JSON.stringify(result));
      return done(null, time1);
    }
  });
}
