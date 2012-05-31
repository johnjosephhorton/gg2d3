var createNameMap, createWatchChart, orderWatchData, updateNameMap, updateWatchChart, watch;

watch = {
  absolute: {
    max: 0
  },
  relative: {
    max: 0
  },
  hour: 0
};

orderWatchData = function() {
  var abs, average_zone, country, i, norm, zones, _ref, _ref2, _results;
  data.watch = {
    absolute: {},
    relative: {}
  };
  _results = [];
  for (country in data.working) {
    zones = data.working[country].zones;
    average_zone = zones ? Math.round(d3.sum(zones) / zones.length) : void 0;
    abs = _.flatten(data.working[country].hours);
    norm = _.flatten(data.working[country].normal_hours);
    watch.absolute.max = d3.max(abs.concat(watch.absolute.max));
    watch.relative.max = d3.max(norm.concat(watch.relative.max));
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
    data.watch.absolute[country] = abs;
    _results.push(data.watch.relative[country] = norm);
  }
  return _results;
};

data.watch;

createNameMap = function(name) {
  var feature, fishPolygon, i, refish, size, _i, _len, _ref, _results;
  size = $("#" + name + "map").parent().width();
  watch[name].map = d3.select("#" + name + "map").append("svg").attr("height", size).attr("width", size);
  watch[name].map.projection = d3.geo.mercator().scale(size).translate([size / 2, size / 2]);
  watch[name].map.path = d3.geo.path().projection(watch[name].map.projection);
  watch[name].map.fisheye = d3.fisheye().radius(50).power(10);
  feature = watch[name].map.selectAll("path").data(data.countries.features).enter().append("path").attr("class", function(d) {
    if (d.properties.name in data.working) {
      return "selectable";
    } else {
      return "feature";
    }
  }).attr("d", watch[name].map.path).each(function(d) {
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
        p = watch[name].map.projection(tuple);
        c = watch[name].map.fisheye({
          x: p[0],
          y: p[1]
        });
        return watch[name].map.projection.invert([c.x, c.y]);
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
    watch[name].map.fisheye.center([x, y]);
    return watch[name].map.selectAll("path").attr("d", function(d) {
      var clone, processed, type;
      clone = $.extend({}, d);
      type = clone.geometry.type;
      processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
      clone.geometry.coordinates = processed;
      return watch[name].map.path(clone);
    });
  };
  _ref = ["mousemove", "mousein", "mouseout", "touch", "touchmove"];
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    _results.push($("#" + name + "map").on(i, refish));
  }
  return _results;
};

updateNameMap = function(name) {
  return watch[name].map.selectAll("path").transition().delay(10).attr("fill", function(d, i) {
    var country, hours;
    country = d.properties.name;
    hours = data.watch[name][country];
    if (hours) {
      return watch[name].scale(hours[watch.hour]);
    } else {
      return "white";
    }
  }).attr("stroke", "black").each(function(d, i) {
    var country, hours;
    country = d.properties.name;
    hours = data.watch[name][country];
    if (hours) {
      return $(this).tooltip({
        title: d.properties.name + "hours"
      });
    }
  });
};

createWatchChart = function() {
  var playing;
  orderWatchData();
  watch.relative.scale = d3.scale.linear().range(["white", "blue"]).domain([0, 0.015]);
  watch.absolute.scale = d3.scale.log().range(["white", "red"]).domain([0.1, watch.absolute.max]).clamp(true);
  _.map(["relative", "absolute"], createNameMap);
  playing = false;
  $(document).bind(["click", "mousedown", "touch"].join(" "), function(e) {
    if (!e.isDefaultPrevented()) playing = false;
    return null;
  });
  $("#playbutton").click(function(e) {
    var inc_update;
    e.preventDefault();
    playing = true;
    inc_update = function() {
      if (watch.hour > 24 * 7 - 2 || !playing) return;
      updateWatchChart(watch.hour + 1);
      return setTimeout(inc_update, 100);
    };
    return inc_update();
  });
  return $("#slider").slider({
    min: 0,
    max: 24 * 7 - 2,
    slide: function(e, u) {
      updateWatchChart(u.value);
      return playing = false;
    }
  });
};

updateWatchChart = function(h) {
  var day, hour, week, x;
  if (h) watch.hour = +h;
  route.navigate("watch/" + watch.hour);
  _.map(["relative", "absolute"], updateNameMap);
  x = +h / 3600;
  week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  day = week[Math.floor(h / 24)];
  hour = h % 24;
  $("#time").text("" + day + ", " + hour + ":00-" + ((hour + 1) % 24) + ":00");
  return $("#slider").slider({
    value: watch.hour
  });
};
