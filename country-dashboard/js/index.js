var HashBangs, route, selectedCountries, showing, start, updateTopLinks, worldCountries;

showing = null;

route = null;

selectedCountries = null;

worldCountries = null;

HashBangs = Backbone.Router.extend({
  routes: {
    "home": "showHome",
    "about": 'showAbout',
    "compare": "showCompare",
    "compare/:log/*countries": "showCompare",
    "watch": 'showWatch',
    "watch/:abs/:hour": 'showWatch',
    "bubble": 'showBubble',
    "bubble/:country": 'showBubble',
    "rank": 'showRank',
    "rank/:main": 'showRank',
    "rank/:main/*sub": 'showRank',
    "*path": "showHome"
  },
  initialize: function(options) {
    return worldCountries = _.map(data.countries.features, function(d) {
      return d.properties.name;
    });
  },
  showHome: function() {
    $("#main").html($("#home").html());
    showing = "home";
    updateTopLinks();
    return route.navigate("/home");
  },
  showAbout: function() {
    $("#main").html($("#about").html());
    showing = "about";
    return updateTopLinks();
  },
  showCompare: function(log_q, countries) {
    if (log_q) compare.log_q = log_q === "true";
    if (countries) {
      selectedCountries = _.map(countries.split("/"), function(c) {
        if (c.length === 0) {
          return null;
        } else {
          return decodeURI(c);
        }
      });
    } else {
      selectedCountries = _.chain(data.working).keys().intersect(worldCountries).intersect().filter(function(d) {
        return data.working[d].normal_hours != null;
      }).shuffle().value().slice(10, 20);
    }
    while (selectedCountries.length !== 60) {
      selectedCountries.push(null);
    }
    if (showing !== "compare") {
      $("#main").html($("#compare").html());
      showing = "compare";
      updateTopLinks();
      createCompareChart();
    }
    return updateCompareChart();
  },
  showWatch: function(abs, hour) {
    if (showing !== "watch") {
      $("#main").html($("#watch").html());
      showing = "watch";
      updateTopLinks();
      createWatchChart();
    }
    return updateWatchChart(abs, hour);
  },
  showBubble: function(givenCountry) {
    if (showing !== "bubble") {
      $("#main").html($("#bubble").html());
      showing = "bubble";
      updateTopLinks();
      createBubbleChart();
    }
    return updateBubbleChart(givenCountry);
  },
  showRank: function(main, sub) {
    var m, s;
    if (showing !== "rank") {
      $("#main").html($("#rank").html());
      showing = "rank";
      updateTopLinks();
      createRankChart();
    }
    m = main ? decodeURI(main) : null;
    s = sub ? decodeURI(sub) : null;
    return updateRankChart(m, s);
  }
});

updateTopLinks = function() {
  $("ul.nav > li").removeClass("active");
  return $("#link-" + showing).addClass("active");
};

$(".hidden").toggleClass("hidden").hide();

start = function() {
  var reset;
  route = new HashBangs();
  Backbone.history.start();
  if (Backbone.history.fragment === "") {
    route.navigate("home", {
      trigger: true
    });
  }
  reset = function() {
    showing = "";
    return route.navigate("#/" + Backbone.history.fragment, {
      trigger: true
    });
  };
  return $(window).resize(reset);
};
