#Routing information
showing = null
route = null
#F coffescript scope
selectedCountries = null

HashBangs = Backbone.Router.extend
  routes:
    "": "showHome"

    "about" : 'showAbout'

    "compare" : "showCompare"
    "compare/*countries": "showCompare"

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
    console.log(selectedCountries)
    if countries
      selectedCountries = _.map(countries.split("/"), (c)-> if c.length is 0 then null else c)
    else
      selectedCountries = ["United States"]
    while selectedCountries.length isnt 60 #compare.rainbow.length
      selectedCountries.push(null)
    console.log(selectedCountries)
    if showing isnt "compare"
      $("#main").html($("#compare").html())
      createCompareChart()
    updateCompareChart()
    showing="compare"


  showBubble: (givenCountry)->
    if givenCountry then country = givenCountry
    if showing isnt "bubble"
      $("#main").html($("#bubble").html())
      createBubbleChart()
    updateBubbleChart()
    showing="bubble"


$(".hidden").toggleClass("hidden").hide()



#Start everything up
start = ()->
  route = new HashBangs()
  Backbone.history.start()
