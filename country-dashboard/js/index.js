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
      createCompareChart();
    }
    updateCompareChart();
    return showing = "compare";
  },
  showWatch: function() {
    $("#main").html($("#watch").html());
    return showing = "watch";
  },
  showBubble: function(givenCountry) {
    if (showing !== "bubble") {
      $("#main").html($("#bubble").html());
      createBubbleChart();
    }
    updateBubbleChart(givenCountry);
    return showing = "bubble";
  }
});

$(".hidden").toggleClass("hidden").hide();

start = function() {
  route = new HashBangs();
  Backbone.history.start();
  return route.navigate("home", {
    trigger: true
  });
};

$(window).resize(function() {
  console.log("yo", Backbone.history.fragment);
  showing = "none";
  return route.navigate(Backbone.history.fragment, {
    trigger: true,
    replace: true
  });
});
