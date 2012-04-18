var domain, errors, func, funcs, h, l, labels, lines, p, seWidth, vis, w, x, xRules, y, yRules;

w = 482;

h = 482;

p = 0;

seWidth = 2;

vis = null;

x = null;

y = null;

errors = null;

$("#se-slider").slider({
  value: seWidth,
  min: 0.25,
  max: 4,
  step: 0.1,
  slide: function(event, ui) {
    seWidth = ui.value;
    $("#se-value").text("SE Width: " + seWidth);
    return redrawErrorBars();
  }
});

domain = _.range(100);

funcs = [
  function(x) {
    return (1 + 2 * Math.atan(x) / Math.PI) / 2;
  }, function(x) {
    return (1 - Math.pow(Math.atan(x), 2) / Math.PI) / 2;
  }
];

lines = (function() {
  var _i, _len, _results;
  _results = [];
  for (_i = 0, _len = funcs.length; _i < _len; _i++) {
    func = funcs[_i];
    _results.push(_.map(domain, function(x) {
      return {
        x: x,
        y: func(x)
      };
    }));
  }
  return _results;
})();

x = d3.scale.linear().domain([-3, 100]).range([0, w]);

y = d3.scale.linear().domain([-0.1, 1.1]).range([h, 0]);

vis = d3.select('body').append('svg').attr("width", w + p * 2).attr("height", h + p * 2).append('g').attr("transform", "translate(" + p + "," + p + ")");

vis.selectAll("lines").data(lines).enter().append("path").attr("class", "line").attr("d", d3.svg.line().x(function(d) {
  return x(d.x);
}).y(function(d) {
  return y(d.y);
}));

xRules = vis.selectAll("g.xRule").data([0]).enter().append("g").attr("class", "rule").append("line").attr("x1", x(0)).attr("x2", 1).attr("y1", 0).attr("y2", h + 1);

yRules = vis.selectAll("g.xRule").data([0]).enter().append("g").attr("class", "rule").append("line").attr("x1", 1).attr("x2", w + 1).attr("y1", 0).attr("y2", 1);

l = function(x, y, text, rotate) {
  return {
    x: x,
    y: y,
    text: text
  };
};

labels = [l(0.5, 0.5, " job on oDesk"), l(0.5, 0.5, "Average hourly wage earned in that period, as multiple of first period wage"), l(0.5, 0.5, "# of contractors = 90,000")];
