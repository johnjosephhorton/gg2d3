var HashBangs, route, selectedCountries, showing, start, updateTopLinks;

showing = null;

route = null;

selectedCountries = null;

HashBangs = Backbone.Router.extend({
  routes: {
    "home": "showHome",
    "about": 'showAbout',
    "compare": "showCompare",
    "compare/*countries": "showCompare",
    "watch": 'showWatch',
    "watch/:hour": 'showWatch',
    "bubble": 'showBubble',
    "bubble/:country": 'showBubble',
    "rank": 'showRank',
    "rank/:main": 'showRank',
    "rank/:main/*sub": 'showRank',
    "*path": "showHome"
  },
  initialize: function(options) {},
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
  showCompare: function(countries) {
    if (countries) {
      selectedCountries = _.map(countries.split("/"), function(c) {
        if (c.length === 0) {
          return null;
        } else {
          return decodeURI(c);
        }
      });
    } else {
      selectedCountries = ["United States"];
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
  showWatch: function(hour) {
    if (showing !== "watch") {
      $("#main").html($("#watch").html());
      showing = "watch";
      updateTopLinks();
      createWatchChart();
    }
    if (hour) {
      return updateWatchChart(hour);
    } else {
      return updateWatchChart();
    }
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
    console.log(Backbone.history.fragment);
    return route.navigate("#/" + Backbone.history.fragment, {
      trigger: true
    });
  };
  return $(window).resize(reset);
};
