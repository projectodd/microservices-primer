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
  $('#onebyone').on('click', iterator('onebyone', 1, oneByOne));
  $('#unifiedBench').on('click', iterator('unified', 10, unified));
  $('#onebyoneBench').on('click', iterator('onebyone', 10, oneByOne));
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
  }
}


function unified(done){
  var time1 = new Date().getTime();
  $.ajax({
    type: "POST",
    url: 'http://localhost:3003/orders?ts=' + time1,
    data: JSON.stringify(order),
    dataType : 'json',
    contentType: "application/json",
    success: function(){
      time1 = new Date().getTime() - time1;
      $('#results').append('<br /> Unified took ' + time1);
      return done(null, time1);
    }
  });
}

function oneByOne(done){
  // reset this before each call
  order.quantity = 100;

  var time2 = new Date().getTime();
  $.ajax({
    type: "GET",
    url: 'http://localhost:3001/rain?city=' + order.city + '&country=' + order.country + '&ts=' + time2,
    dataType : 'json',
    contentType: "application/json",
    success: function(rainfallResult){
      order.quantity = order.quantity * (rainfallResult.rainfall + 1); // + 1 because rainfall could be 0 inches - we don't want 0 orders
      var rainfall = rainfallResult;
      $.ajax({
        type: "POST",
        url: 'http://localhost:3000/orders/umbrellas?ts=' + time2,
        data : JSON.stringify(order),
        dataType : 'json',
        contentType: "application/json",
        success: function(orderCreateResult){
          var sms = { to : order.accountManager, message : "New order created for " + order.quantity + " umbrellas!"};
          $.ajax({
            type: "POST",
            url: 'http://localhost:3002/sms?ts=' + time2,
            data : JSON.stringify(sms),
            dataType : 'json',
            contentType: "application/json",
            success: function(smsSendResult){
              time2 = new Date().getTime() - time2;
              $('#results').append('<br /> OneByOne took ' + time2);
              return done(null, time2);
            }
          });
        }
      });
    }
  });
}
