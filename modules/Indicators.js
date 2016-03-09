
exports.sma = function(len, data, type, print) {
    var count = 0;
    var type = type || 'close';
    if (!len) return 0;

    var i = data.length - 1;
    var max = data.length - len;

    if(data.length < len) {
    	console.log("Not enought data for sma("+len+"): ", data.length);
    	return false;
    }

    for (; i >= max; i--) {
      if(print) console.log(parseFloat(data[i][type]));

        count += parseFloat(data[i][type]);
    }

    if(print)
      console.log(count, len, ' = ', count / len);
    return count / len;
};

// exports.rsiWilders = function(len, data) {

//     if (data.length < len)
//         throw "Not enought data for RSI"

//     var ups = [];
//     var avgups = [];
//     var downs = [];
//     var avgdowns = [];

//     var i = data.length - len+1;
//     for (var j = 1; j < len; i++, j++) {
//         var diff = data[i].close - data[i].open
//         ups[j] = downs[j] = 0;

//         if (diff > 0)
//             ups[j] = diff;
//         else if (diff < 0)
//             downs[j] = Math.abs(diff);
//     }

//     avgups[1] = ups[1];
//     avgdowns[1] = downs[1];

//     for (var i = 2; i < data.length; i++) {
//         avgups[i] = (avgups[i - 1] + ups[i]) / 2;
//         avgdowns[i] = (avgdowns[i - 1] + downs[i]) / 2;
//     }

//     if(!avgdowns[len - 1])
//         return 100;

//     return 100 - (100 / (1 + (avgups[len - 1] / avgdowns[len - 1])));
// };


exports.rsi = function(len, data) {

    if (data.length < len)
        return false;

    var ups = [];
    var avgups = [];
    var downs = [];
    var avgdowns = [];

    var i = data.length - len+1;
    for (var j = 1; j < len; i++, j++) {
        var diff = data[i].close - data[i-1].close;
        ups[j] = downs[j] = 0;

        if (diff > 0)
            ups[j] = diff;
        else if (diff < 0)
            downs[j] = Math.abs(diff);
    }

    avgups[1] = ups[1];
    avgdowns[1] = downs[1];

    for (var i = 2; i < data.length; i++) {
        avgups[i] = (avgups[i - 1] + ups[i]) / 2;
        avgdowns[i] = (avgdowns[i - 1] + downs[i]) / 2;
    }

    if(!avgdowns[len - 1])
        return 100;

    return 100 - (100 / (1 + (avgups[len - 1] / avgdowns[len - 1])));
};

var tAnalysis = require('../vendor/techAnalysis');

exports.rsiwilders = function(len, prices, type) {

    var pList = prices.slice(prices.length - len - 50); // take last count prices from array
    pList = pList.map(function(item){return item[type]});

    var rsi = tAnalysis.rsi(pList, len);
    return (rsi.length) ? rsi[rsi.length-1] : -1;
}


// var Prices2 = [116.85,117.09,117.78,117.54,118.83,118.64,118.38,119.47,120.26,120.87,120.73,122.06,121.48,122.15];
// var Prices = [122.15, 121.48, 122.06, 120.73, 120.87, 120.26, 119.47, 118.38, 118.64, 118.83, 117.54, 117.78, 117.09, 116.85];
// // console.log("RSI2(prices) = ", RSI2(Prices)); //will return 9.43

// console.log("AA: ",exports.rsi2(14, Prices2));
// console.log("AA: ",exports.rsi22(14, Prices));
// console.log("BB: ", exports.rsi2(14, Prices));
// console.log("BB: ", exports.rsi22(14, Prices2));
// process.exit(1);

// // Prices = [1,1,1,1,1,1,1,2,1,1,1,1,1,1,1];


exports.rsi2 = function(prices) {
  var count = 14; // how long to history will we go
  pList = prices.slice(prices.length - count); // take last count prices from array

  if(pList.length < count)
    return false;

  var ups = [];
  var downs = [];
  var avgdown;
  var avgup;
  var upPrev, up, down, downPrev;

  for(var i = 0; i < count-1; i++) {
    
    ups[i] = 0;
    downs[i] = 0;

    // ups
    if(pList[i+1].close > pList[i].close) {
      
      ups[i] = (pList[i+1].close - pList[i].close);
    } else if(pList[i+1].close < pList[i].close) {

      downs[i] = Math.abs(pList[i+1].close - pList[i].close);
    }
  }

  // avg ups podle Wilderse (vyhlazování)
  avgup = ups[0];
  avgdown = downs[0];
  for(var i = 1; i < count - 1; i++) {

    avgup = (avgup + ups[i]) / 2;
    avgdown = (avgdown + downs[i]) / 2;
  }

  if(! avgdown) return false;
  return +(100 - (100 / (1 + (avgup / avgdown)))).toFixed(2);
}

// var Prices = [ 122.15, 121.48, 122.06, 120.73, 120.87, 120.26, 119.47,
//               118.38, 118.64, 118.83, 117.54, 117.78, 117.09, 116.85];
// 
// 
// function RSI2(prices) {
//   var avgDown, avgUp, up, down, downPrev, upPrev;
// 
//   var count = 14; // how long to history will we go
//   pList = prices.slice(prices.length - count); // take last count prices from array
// 
//   if(pList.length < count)
//     return -1;
// 
// 
//   for(var i = 0; i < count; i++) {
//     up = (pList[i+1] > pList[i]) ? (pList[i+1] - pList[i]) : 0
//     down = (pList[i+1] < pList[i]) ? Math.abs(pList[i+1] - pList[i]) : 0;
// 
//     avgUp = i ? (avgUp + up) / 2 : up;
//     avgDown = i ? (avgDown + down) / 2 : down;
//   }
// 
//   if(! avgDown) return -1;
//   return +(100 - (100 / (1 + (avgUp / avgDown)))).toFixed(5);
// }
