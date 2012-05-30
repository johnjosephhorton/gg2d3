var HashBangs, route, selectedCountries, showing, start;

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
    "bubble/:country": 'showBubble'
  },
  initialize: function(options) {},
  showHome: function() {
    $("#main").html($("#home").html());
    return showing = "home";
  },
  showAbout: function() {
    $("#main").html($("#about").html());
    return showing = "about";
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
      createCompareChart();
    }
    return updateCompareChart();
  },
  showWatch: function(hour) {
    if (showing !== "watch") {
      $("#main").html($("#watch").html());
      showing = "watch";
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
      createBubbleChart();
    }
    return updateBubbleChart(givenCountry);
  }
});

$(".hidden").toggleClass("hidden").hide();

start = function() {
  route = new HashBangs();
  Backbone.history.start();
  if (Backbone.history.fragment === "") {
    return route.navigate("home", {
      trigger: true
    });
  }
};

$(window).resize(function() {
  console.log("yo", Backbone.history.fragment);
  showing = "none";
  return route.navigate(Backbone.history.fragment, {
    trigger: true,
    replace: true
  });
});
