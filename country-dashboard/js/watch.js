var createWatchChart, createWatchControls, createWatchMap, createWatchWeek, orderWatchData, playing, updateNameMap, updateWatchChart, watch;

watch = {
  max: 0,
  hour: 0
};

playing = false;

orderWatchData = function() {
  var abs, average_zone, country, i, instance, norm, ranges, time, zones, _ref, _ref2;
  data.watch = {
    relative: {}
  };
  for (country in data.working) {
    zones = data.working[country].zones;
    average_zone = zones ? Math.round(d3.sum(zones) / zones.length) : void 0;
    abs = _.flatten(data.working[country].hours);
    norm = _.flatten(data.working[country].normal_hours);
    watch.max = d3.max(norm.concat(watch.max));
    if (average_zone < 0) {
      for (i = 0, _ref = Math.abs(average_zone); 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        abs.unshift(abs.pop());
        norm.unshift(norm.pop());
      }
    } else {
      for (i = 0, _ref2 = Math.abs(average_zone); 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
        abs.push(abs.shift());
        norm.push(norm.shift());
      }
    }
    data.watch.relative[country] = norm;
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
  orderWatchData();
  createWatchMap();
  createWatchControls();
  return createWatchWeek();
};

createWatchWeek = function() {
  var a, ticks, time, timer, week;
  watch.chart = new Rickshaw.Graph({
    renderer: "line",
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
  return watch.hover = new Rickshaw.Graph.HoverDetail({
    graph: watch.chart,
    xFormatter: (function(x) {
      watch.hour = x / 3600;
      playing = false;
      updateWatchChart();
      return "";
    }),
    yFormatter: function(y) {
      return "" + y + " total workers online ";
    }
  });
};

createWatchMap = function() {
  var feature, fishPolygon, i, refish, size, _i, _len, _ref, _results;
  watch.scale = d3.scale.linear().range(["white", "blue"]).domain([0, 0.015]);
  size = $("#watchmap").parent().width();
  watch.map = d3.select("#watchmap").append("svg").attr("height", size).attr("width", size);
  watch.map.projection = d3.geo.mercator().scale(size).translate([size / 2, size / 2]);
  watch.map.path = d3.geo.path().projection(watch.map.projection);
  watch.map.fisheye = d3.fisheye().radius(50).power(10);
  feature = watch.map.selectAll("path").data(data.countries.features).enter().append("path").attr("d", watch.map.path).each(function(d) {
    return d.org = d.geometry.coordinates;
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

createWatchControls = function() {
  playing = false;
  $(document).bind(["click", "mousedown", "touch"].join(" "), function(e) {
    if (!e.isDefaultPrevented()) playing = false;
    return null;
  });
  return $("#playbutton").click(function(e) {
    var inc_update;
    e.preventDefault();
    playing = true;
    if (watch.hour > 24 * 7 - 2) watch.hour = 0;
    inc_update = function() {
      if (watch.hour > 24 * 7 - 2 || !playing) return;
      updateWatchChart(watch.hour + 1);
      return setTimeout(inc_update, 100);
    };
    return inc_update();
  });
};

updateWatchChart = function(h) {
  var day, hour, week;
  if (h) watch.hour = +h;
  route.navigate("watch/" + watch.hour);
  updateNameMap();
  week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  day = week[Math.floor(watch.hour / 24)];
  hour = watch.hour % 24;
  return $("#watch-time").text("" + day + ", " + hour + ":00-" + ((hour + 1) % 24) + ":00 GMT");
};

updateNameMap = function() {
  return watch.map.selectAll("path").transition().delay(10).attr("fill", function(d, i) {
    var country, hours;
    country = d.properties.name;
    hours = data.watch.relative[country];
    if (hours) {
      return watch.scale(hours[watch.hour]);
    } else {
      return "white";
    }
  }).attr("stroke", "black").each(function(d, i) {
    var country, hours;
    country = d.properties.name;
    hours = data.watch[country];
    if (hours) {
      return $(this).tooltip({
        title: d.properties.name + "hours"
      });
    }
  });
};
