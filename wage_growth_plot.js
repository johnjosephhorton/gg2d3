var h, p, w;

w = 482;

h = 482;

p = 40;

d3.csv("by_month_data.csv", function(data) {
  var d, errors, format, formatted, l, labels, means, months, paddingX, paddingY, vis, x, xRules, y, yRules;
  format = function(d) {
    return {
      month: parseInt(d['start_month']),
      mean: parseFloat(d['mean_normed']),
      se: parseFloat(d['se'])
    };
  };
  formatted = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      _results.push(format(d));
    }
    return _results;
  })();
  months = _.pluck(formatted, 'month');
  means = _.pluck(formatted, 'mean');
  paddingX = 1;
  paddingY = 0.1;
  x = d3.scale.linear().domain([_.min(months) - paddingX, _.max(months) + paddingX]).range([0, w]);
  y = d3.scale.linear().domain([_.min(means) - paddingY, _.max(means) + paddingY]).range([h, 0]);
  vis = d3.select('body').data([formatted]).append('svg').attr("width", w + p * 2).attr("height", h + p * 2).append('g').attr("transform", "translate(" + p + "," + p + ")");
  xRules = vis.selectAll("g.xRule").data(x.ticks(10)).enter().append("g").attr("class", "rule");
  xRules.append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", h - 1);
  xRules.append("text").attr("x", x).attr("y", h + 3).attr("dy", ".71em").attr("text-anchor", "middle").text(x.tickFormat(10));
  yRules = vis.selectAll("g.yRule").data(y.ticks(10)).enter().append("g").attr("class", "rule");
  yRules.append("line").attr("class", function(d) {
    if (d) {
      return null;
    } else {
      return "axis";
    }
  }).attr("x1", 0).attr("x2", w + 1).attr("y1", y).attr("y2", y);
  yRules.append("text").attr("y", y).attr("x", -3).attr("dy", ".35em").attr("text-anchor", "end").text(y.tickFormat(10));
  vis.append("path").attr("class", "line").attr("d", d3.svg.line().x(function(d) {
    return x(d.month);
  }).y(function(d) {
    return y(d.mean);
  }));
  errors = vis.selectAll("g.error").data(formatted).enter().append("g").attr("class", "errors");
  errors.append("circle").attr("cx", function(d) {
    return x(d.month);
  }).attr("cy", function(d) {
    return y(d.mean);
  }).attr("r", 2);
  errors.append("line").attr("x1", function(d) {
    return x(d.month - 0.3);
  }).attr("x2", function(d) {
    return x(d.month + 0.3);
  }).attr("y1", function(d) {
    return y(d.mean + 2 * d.se);
  }).attr("y2", function(d) {
    return y(d.mean + 2 * d.se);
  });
  errors.append("line").attr("x1", function(d) {
    return x(d.month - 0.3);
  }).attr("x2", function(d) {
    return x(d.month + 0.3);
  }).attr("y1", function(d) {
    return y(d.mean - 2 * d.se);
  }).attr("y2", function(d) {
    return y(d.mean - 2 * d.se);
  });
  errors.append("line").attr("x1", function(d) {
    return x(d.month);
  }).attr("x2", function(d) {
    return x(d.month);
  }).attr("y1", function(d) {
    return y(d.mean - 2 * d.se);
  }).attr("y2", function(d) {
    return y(d.mean + 2 * d.se);
  });
  l = function(x, y, text, rotate) {
    return {
      x: x,
      y: y,
      text: text,
      rotate: rotate
    };
  };
  labels = [l(10, 0.85, "Months since first job on oDesk", false), l(10, 1.1, "Average hourly wage earned in that period,\nas multiple of first period wage", true), l(3, 1.9, "# of contractors = 90,000", false)];
  return vis.selectAll("g.text").data(labels).enter().append("text").attr("x", function(d) {
    return x(d.x);
  }).attr("y", function(d) {
    return y(d.y);
  }).attr("transform", function(d) {
    if (d.rotate) {
      return "rotate(-90)translate(-550,-420)";
    } else {
      return "rotate(0)";
    }
  }).text(function(d) {
    return d.text;
  });
});
