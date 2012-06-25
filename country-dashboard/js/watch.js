var createWatchChart, createWatchMap, createWatchWeek, orderWatchData, playing, updateNameMap, updateWatchChart, watch;

watch = {
  max: {
    absolute: 0,
    relative: 0
  },
  hour: 0,
  abs_q: false
};

playing = false;

watch.navigate = function() {
  return route.navigate("#/watch/" + watch.abs_q + "/" + watch.hour);
};

orderWatchData = function() {
  var abs, country, i, instance, ranges, rel, time;
  data.watch = {
    relative: {},
    absolute: {}
  };
  for (country in data.working) {
    if (!(data.working[country].normal_hours != null)) continue;
    abs = _.flatten(data.working[country].utc_hours);
    rel = _.chain(data.working[country].utc_hours).flatten().map(function(n) {
      return n / data.working[country].total;
    }).value();
    watch.max.relative = Math.max(watch.max.relative, d3.max(rel));
    watch.max.absolute = Math.max(watch.max.absolute, d3.max(abs));
    data.watch.relative[country] = rel;
    data.watch.absolute[country] = abs;
  }
  instance = _.flatten(data.global.reduced);
  time = 60 * 60;
  ranges = _.range(instance.length);
  data.watch.charting = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ranges.length; _i < _len; _i++) {
      i = ranges[_i];
      _results.push({
        x: i * time,
        y: instance[i]
      });
    }
    return _results;
  })();
  return data.watch;
};

createWatchChart = function() {
  var type_update;
  orderWatchData();
  createWatchMap();
  createWatchWeek();
  $("#radio-scale").button();
  type_update = function() {
    updateWatchChart();
    return watch.navigate();
  };
  $("#radio-scale > button:first").click(function() {
    if (watch.abs_q) {
      watch.abs_q = false;
      return type_update();
    }
  });
  return $("#radio-scale > button:last").click(function() {
    if (!watch.abs_q) {
      watch.abs_q = true;
      return type_update();
    }
  });
};

createWatchWeek = function() {
  var a, dragging, ticks, time, timer, week;
  watch.chart = new Rickshaw.Graph({
    renderer: "area",
    element: document.querySelector("#global-weekly"),
    height: $("#comparemap").parent().height() / 2,
    width: $("#global-weekly").parent().width(),
    series: [
      {
        data: data.watch.charting,
        color: "#168CE5",
        name: "Global"
      }
    ]
  });
  watch.chart.render();
  ticks = "glow";
  week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  time = new Rickshaw.Fixtures.Time;
  timer = time.unit("day");
  a = timer.formatter;
  timer.formatter = function(d) {
    return week[a(d) - 1];
  };
  watch.xAxis = new Rickshaw.Graph.Axis.Time({
    graph: watch.chart,
    ticksTreatment: ticks,
    timeUnit: timer,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  });
  watch.yAxis = new Rickshaw.Graph.Axis.Y({
    graph: watch.chart,
    ticksTreatment: ticks,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  });
  watch.xAxis.render();
  watch.yAxis.render();
  dragging = false;
  watch.chart.vis.on("click", function() {
    return updateWatchChart();
  });
  watch.chart.vis.on("mousedown", function() {
    dragging = true;
    return console.log(dragging);
  });
  watch.chart.vis.on("mouseup", function() {
    dragging = false;
    return console.log(dragging);
  });
  return watch.hover = new Rickshaw.Graph.HoverDetail({
    graph: watch.chart,
    xFormatter: (function(x) {
      var day, h, hour;
      watch.hour = x / 3600;
      if (dragging) updateWatchChart();
      h = x / 3600;
      day = week[Math.floor(h / 24)];
      hour = h % 24;
      this.time = "" + day + ", " + hour + ":00-" + ((hour + 1) % 24) + ":00";
      return null;
    }),
    yFormatter: function(y) {
      return "" + (Math.round(y)) + " total workers online <br /> " + this.time;
    }
  });
};

createWatchMap = function() {
  var feature, fishPolygon, i, refish, size, _i, _len, _ref, _results;
  watch.rscale = d3.scale.linear().range(["white", "blue"]).domain([0, watch.max.relative]);
  watch.ascale = d3.scale.log().range(["white", "red"]).domain([0.01, watch.max.absolute]);
  size = $("#watchmap").parent().width();
  watch.map = d3.select("#watchmap").append("svg").attr("height", size * 0.7).attr("width", size);
  watch.map.projection = d3.geo.mercator().scale(size).translate([size / 2, size / 2]);
  watch.map.path = d3.geo.path().projection(watch.map.projection);
  watch.map.fisheye = d3.fisheye().radius(50).power(10);
  feature = watch.map.selectAll("path").data(data.countries.features).enter().append("path").attr("d", watch.map.path).each(function(d) {
    return d.org = d.geometry.coordinates;
  });
  feature.each(function(d, i) {
    return $(this).tooltip({
      title: "" + d.properties.name,
      space: 90
    });
  });
  fishPolygon = function(polygon) {
    return _.map(polygon, function(list) {
      return _.map(list, function(tuple) {
        var c, p;
        p = watch.map.projection(tuple);
        c = watch.map.fisheye({
          x: p[0],
          y: p[1]
        });
        return watch.map.projection.invert([c.x, c.y]);
      });
    });
  };
  refish = function(e) {
    var currentElement, m, totalOffsetX, totalOffsetY, x, y;
    x = e.offsetX;
    y = e.offsetY;
    m = $("#" + name + "map > svg").offset();
    if (!(x != null)) {
      totalOffsetX = 0;
      totalOffsetY = 0;
      currentElement = this;
      while (true) {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
        if ((currentElement = currentElement.offsetParent)) break;
      }
      x = e.pageX - totalOffsetX;
      y = e.pageY - totalOffsetY;
    }
    watch.map.fisheye.center([x, y]);
    return watch.map.selectAll("path").attr("d", function(d) {
      var clone, processed, type;
      clone = $.extend({}, d);
      type = clone.geometry.type;
      processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
      clone.geometry.coordinates = processed;
      return watch.map.path(clone);
    });
  };
  _ref = ["mousemove", "mousein", "mouseout", "touch", "touchmove"];
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    _results.push($("#watchmap").on(i, refish));
  }
  return _results;
};

updateWatchChart = function(abs, h) {
  var day, hour, week;
  if (h) watch.hour = +h;
  if (abs) watch.abs_q = abs === "true";
  watch.navigate();
  week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  day = week[Math.floor(watch.hour / 24)];
  hour = watch.hour % 24;
  watch.text = "" + day + ", " + hour + ":00-" + ((hour + 1) % 24) + ":00 GMT";
  $("#watch-time").text("Activity Map for " + watch.text);
  if (watch.abs_q) {
    $("#radio-scale > button:last").button('toggle');
  } else {
    $("#radio-scale > button:first").button('toggle');
  }
  return updateNameMap();
};

updateNameMap = function() {
  return watch.map.selectAll("path").transition().delay(100).attr("fill", function(d, i) {
    var country, number, percent, _ref, _ref2;
    country = d.properties.name;
    percent = (_ref = data.watch.relative[country]) != null ? _ref[watch.hour] : void 0;
    number = (_ref2 = data.watch.absolute[country]) != null ? _ref2[watch.hour] : void 0;
    if (country === "Russia") console.log(percent, number);
    if (percent && number > 10) {
      if (!watch.abs_q) {
        return watch.rscale(percent);
      } else {
        return watch.ascale(number);
      }
    } else {
      return "white";
    }
  }).attr("stroke", "black").each(function(d, i) {
    var country, hours, p, percent, t, _ref, _ref2;
    country = d.properties.name;
    hours = Math.round((_ref = data.watch.absolute[country]) != null ? _ref[watch.hour] : void 0);
    percent = (_ref2 = data.watch.relative[country]) != null ? _ref2[watch.hour] : void 0;
    if (hours && percent) {
      t = "" + country + " <br />";
      p = Math.round(percent * 10000) / 100;
      t += "" + p + "% of registered workers are active <br />";
      t += "" + hours + " worker" + (hours !== 1 ? "s" : "") + " online now <br />";
      return $(this).attr('data-original-title', t).tooltip('fixTitle');
    }
  });
};
