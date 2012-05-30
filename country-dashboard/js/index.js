var HashBangs, route, selectedCountries, showing, start;

showing = null;

route = null;

selectedCountries = null;

HashBangs = Backbone.Router.extend({
  routes: {
    "": "showHome",
    "about": 'showAbout',
    "compare": "showCompare",
    "compare/*countries": "showCompare",
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
    console.log(selectedCountries);
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
  showBubble: function(givenCountry) {
    var country;
    if (givenCountry) country = decodeURI(givenCountry);
    if (showing !== "bubble") {
      $("#main").html($("#bubble").html());
      createBubbleChart();
    }
    updateBubbleChart();
    return showing = "bubble";
  }
});

$(".hidden").toggleClass("hidden").hide();

start = function() {
  route = new HashBangs();
  return Backbone.history.start();
};
