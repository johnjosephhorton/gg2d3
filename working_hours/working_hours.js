var data, drawChart, h, sum, w;

w = 482;

h = 482;

data = new Object;

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

drawChart = function() {
  var a, instance, line, number, percents, row, summed, total, transposed, vis;
  instance = data["Canada"];
  transposed = _.zip.apply(this, instance);
  summed = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = transposed.length; _i < _len; _i++) {
      row = transposed[_i];
      _results.push(sum(row));
    }
    return _results;
  })();
  total = sum(summed);
  percents = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = summed.length; _i < _len; _i++) {
      number = summed[_i];
      _results.push(number / total);
    }
    return _results;
  })();
  percents = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = percents.length; _i < _len; _i++) {
      a = percents[_i];
      _results.push([a, a]);
    }
    return _results;
  })();
  console.log(percents);
  line = d3.svg.line();
  vis = d3.select("#chart").append("svg").attr("width", w).attr("height", h);
  vis.append("rect").attr("width", w).attr("height", h);
  return vis.append("path").data([percents]).attr("class", "line");
};

d3.csv("all_working_hours.csv", function(rawdata) {
  var addToData, item, _i, _len;
  addToData = function(item) {
    var country, day, hour, workers;
    country = item["Country"];
    workers = parseFloat(item["Workers"]);
    day = item["Day"];
    hour = item["Hour"];
    if (data[country]) {
      if (data[country][day]) {
        return data[country][day][hour] = workers;
      } else {
        return data[country][day] = [workers];
      }
    } else {
      return data[country] = [[workers]];
    }
  };
  for (_i = 0, _len = rawdata.length; _i < _len; _i++) {
    item = rawdata[_i];
    addToData(item);
  }
  return drawChart();
});
