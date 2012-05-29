var compare, createCompareChart, createCompareLegend, createCompareLines, createCompareMap, selectedCountries, updateActivityData, updateCompareChart, updateCompareLegend, updateCompareLines, updateCompareMap;

compare = {
  rainbow: _.flatten([d3.scale.category20().range(), d3.scale.category20b().range(), d3.scale.category20c().range()])
};

selectedCountries = (function() {
  var arr, i, _i, _len, _ref;
  arr = ["United States", "Canada", "Russia", "India"];
  _ref = _.range(compare.rainbow.length - arr.length);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    arr.push(null);
  }
  return arr;
})();

updateActivityData = function() {
  var c, enumerated, i, instance, _i, _len;
  data.activityData = [];
  for (_i = 0, _len = selectedCountries.length; _i < _len; _i++) {
    c = selectedCountries[_i];
    if (!(!_.isNull(c))) continue;
    instance = _.flatten(data.working[c].hours);
    enumerated = (function() {
      var _j, _len2, _ref, _results;
      _ref = _.range(instance.length);
      _results = [];
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        i = _ref[_j];
        _results.push({
          x: i,
          y: instance[i]
        });
      }
      return _results;
    })();
    data.activityData.push({
      data: enumerated,
      color: compare.rainbow[selectedCountries.indexOf(c)],
      name: c
    });
  }
  return data.activityData;
};

createCompareChart = function() {
  createCompareMap();
  createCompareLines();
  return createCompareLegend();
};

updateCompareChart = function() {
  updateCompareMap();
  updateCompareLines();
  return updateCompareLegend();
};

createCompareMap = function() {
  var feature, fishPolygon, i, refish, size, _i, _len, _ref, _results;
  size = $("#comparemap").parent().width();
  compare.map = d3.select("#comparemap").append("svg").attr("height", size).attr("width", size);
  compare.map.projection = d3.geo.mercator().scale(size).translate([size / 2, size / 2]);
  compare.map.path = d3.geo.path().projection(compare.map.projection);
  compare.map.fisheye = d3.fisheye().radius(50).power(10);
  feature = compare.map.selectAll("path").data(data.countries.features).enter().append("path").attr("class", function(d) {
    if (d.properties.name in data.working) {
      return "selectable";
    } else {
      return "feature";
    }
  }).attr("d", compare.map.path).each(function(d) {
    return d.org = d.geometry.coordinates;
  }).on('click', function(d, i) {
    var clicked, str;
    clicked = d.properties.name;
    if (!(clicked in data.working)) return;
    i = selectedCountries.indexOf(clicked);
    if (i === -1) {
      selectedCountries[selectedCountries.indexOf(null)] = clicked;
    } else {
      selectedCountries[i] = null;
    }
    str = selectedCountries.join('/');
    while (str.indexOf("//") !== -1) {
      str = str.replace("//", "/");
    }
    route.navigate("#compare/" + str);
    return updateCompareChart();
  });
  feature.each(function(d, i) {
    return $(this).tooltip({
      title: d.properties.name
    });
  });
  fishPolygon = function(polygon) {
    return _.map(polygon, function(list) {
      return _.map(list, function(tuple) {
        var c, p;
        p = compare.map.projection(tuple);
        c = compare.map.fisheye({
          x: p[0],
          y: p[1]
        });
        return compare.map.projection.invert([c.x, c.y]);
      });
    });
  };
  refish = function(e) {
    var x, y;
    x = e.offsetX;
    y = e.offsetY;
    if (x == null) x = e.screenX - map.offset().left;
    if (y == null) y = e.screenY - map.offset().top;
    compare.map.fisheye.center([x, y]);
    return compare.map.selectAll("path").attr("d", function(d) {
      var clone, processed, type;
      clone = $.extend({}, d);
      type = clone.geometry.type;
      processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
      clone.geometry.coordinates = processed;
      return compare.map.path(clone);
    });
  };
  _ref = ["mousemove", "mousein", "mouseout", "touch", "touchmove"];
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    _results.push($("#comparemap").on(i, refish));
  }
  return _results;
};

updateCompareMap = function() {
  return compare.map.selectAll("path").transition().delay(10).attr("fill", function(d) {
    var i;
    i = selectedCountries.indexOf(d.properties.name);
    if (i !== -1) {
      return compare.rainbow[i];
    } else {
      return "white";
    }
  }).attr("stroke", "black");
};

createCompareLines = function() {
  var ticks, xAxis, yAxis;
  updateActivityData();
  compare.activity = new Rickshaw.Graph({
    renderer: "line",
    element: document.querySelector("#compareline"),
    height: $("#comparemap").parent().height(),
    width: $("#compareline").parent().width(),
    series: data.activityData
  });
  compare.activity.render();
  ticks = "glow";
  xAxis = new Rickshaw.Graph.Axis.Time({
    graph: compare.activity,
    ticksTreatment: ticks
  });
  xAxis.render();
  yAxis = new Rickshaw.Graph.Axis.Y({
    graph: compare.activity,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  }, {
    ticksTreatment: ticks
  });
  return yAxis.render();
};

updateCompareLines = function() {
  var d, i, m, n, _i, _len, _ref;
  d = updateActivityData();
  m = compare.activity.series.length;
  n = d.length;
  _ref = _.range(d3.max([m, n]));
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    if (i < n) {
      compare.activity.series[i] = d[i];
    } else {
      delete compare.activity.series[i];
    }
  }
  return compare.activity.update();
};

createCompareLegend = function() {
  return $("#comparelegend").css({
    height: $("#comparemap").parent().height(),
    'overflow-y': 'scroll'
  });
};

updateCompareLegend = function() {
  var box, c, cq, i, legend, _i, _len, _ref, _results;
  legend = $("#comparelegend");
  legend.empty();
  _ref = _.range(selectedCountries.length);
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    cq = selectedCountries[i];
    if (cq) {
      c = $("<div>");
      box = $("<div>").css({
        height: 10,
        width: 10,
        display: "inline-block",
        "background-color": compare.rainbow[i]
      });
      c.append(box, $("<p>").text(cq));
      _results.push(legend.append(c));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};
