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

    "rank" : 'showRank'
    "rank/:main" : 'showRank'
    "rank/:main/*sub" : 'showRank' #Splat to take care of sub categories like ERM / CRM


    "*path":"showHome"
  initialize: (options)->

  showHome: ()->
    $("#main").html($("#home").html())
    showing="home"
    updateTopLinks()
    route.navigate("/home")

  showAbout: ()->
    $("#main").html($("#about").html())
    showing="about"
    updateTopLinks()

  showCompare: (countries)->
    if countries
      selectedCountries = _.map(countries.split("/"), (c)-> if c.length is 0 then null else decodeURI(c))
    else
      selectedCountries = ["United States"]
    while selectedCountries.length isnt 60 #compare.rainbow.length
      selectedCountries.push(null)

    if showing isnt "compare"
      $("#main").html($("#compare").html())
      showing="compare"
      updateTopLinks()
      createCompareChart()
    updateCompareChart()

  showWatch: (hour)->
    if showing isnt "watch"
      $("#main").html($("#watch").html())
      showing="watch"
      updateTopLinks()
      createWatchChart()
    if hour
      updateWatchChart(hour)
    else
      updateWatchChart()

  showBubble: (givenCountry)->
    if showing isnt "bubble"
      $("#main").html($("#bubble").html())
      showing="bubble"
      updateTopLinks()
      createBubbleChart()
    updateBubbleChart(givenCountry)

  showRank: (main,sub)->
    if showing isnt "rank"
      $("#main").html($("#rank").html())
      showing="rank"
      updateTopLinks()
      createRankChart()
    m = if main then decodeURI(main) else null
    s = if sub then decodeURI(sub) else null
    updateRankChart(m,s)

updateTopLinks = ()->
   $("ul.nav > li").removeClass("active")
   $("#link-#{showing}").addClass("active")

$(".hidden").toggleClass("hidden").hide()



#Start everything up
start = ()->
  route = new HashBangs()
  Backbone.history.start()
  if Backbone.history.fragment is "" then route.navigate("home",{trigger: true})

  reset = ()->
    showing = ""
    route.navigate("#/#{Backbone.history.fragment}",
      {trigger: true})

  $(window).resize(reset)
