#Routing information
showing = null
route = null
#F coffescript scope
selectedCountries = null

HashBangs = Backbone.Router.extend
  routes:
    "home": "showHome"

    "about" : 'showAbout'

    "compare" : "showCompare"
    "compare/*countries": "showCompare"

    "watch" : 'showWatch'
    "watch/:hour" : 'showWatch'

    "bubble" : 'showBubble'
    "bubble/:country" : 'showBubble'


  initialize: (options)->

  showHome: ()->
    $("#main").html($("#home").html())
    showing="home"

  showAbout: ()->
    $("#main").html($("#about").html())
    showing="about"

  showCompare: (countries)->
    if countries
      selectedCountries = _.map(countries.split("/"), (c)-> if c.length is 0 then null else decodeURI(c))
    else
      selectedCountries = ["United States"]
    while selectedCountries.length isnt 60 #compare.rainbow.length
      selectedCountries.push(null)

    if showing isnt "compare"
      $("#main").html($("#compare").html())
      createCompareChart()
    updateCompareChart()
    showing="compare"

  showWatch: ()->
    $("#main").html($("#watch").html())
    showing="watch"


  showBubble: (givenCountry)->
    if showing isnt "bubble"
      $("#main").html($("#bubble").html())
      createBubbleChart()
    updateBubbleChart(givenCountry)
    showing="bubble"


$(".hidden").toggleClass("hidden").hide()



#Start everything up
start = ()->
  route = new HashBangs()
  Backbone.history.start()
  route.navigate("home",{trigger: true})

$(window).resize(()->
  console.log("yo",Backbone.history.fragment)
  showing = "none"
  route.navigate(Backbone.history.fragment, {trigger: true, replace: true}) #Why isn't this working?
  )