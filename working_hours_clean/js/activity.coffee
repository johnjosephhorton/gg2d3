class Chart
  constructor: ()->
  ########
  #
  # Constant parameters
  #
  ########
  parameters: (()->
    width = $(document).width()
    height = $(document).height()

    ob =
      colors:
        white: "#FFF"
        lightblue: "#168CE5"
        darkblue: "#168CE5"
        rainbow: _.flatten([d3.scale.category20().range(),d3.scale.category20b().range(),d3.scale.category20c().range()])

    ob.map=
      width: width/3
      height: width/3
      padding: 10;

    ob.map.projection =  d3.geo.mercator()
        .scale(ob.map.width*.9)
        .translate([ob.map.width/2,ob.map.height*.6])

    ob.map.path = d3.geo.path().projection(ob.map.projection)
    ob.map.fisheye = d3.fisheye().radius(50).power(10)

    ob.activity =
      width: width/3
      height: width/3
      padding: 10

    ob
  )()
  data: {activityData: []}
  ########
  #
  # Variables
  #
  ########

  selectedCountries: (()->
    arr = ["United States", "Canada", "Russia", "India"]
    arr.push(null) for i in _.range(60-4)
    arr)()

  updateActivityData: (ob)=>
    ob.data.activityData = []

    for c in ob.selectedCountries when not _.isNull(c)
      instance =  _.flatten(ob.data.workingData[c].hours)
      enumerated = ({x: i, y: instance[i]} for i in _.range(instance.length))
      ob.data.activityData.push(
        data: enumerated
        color: ob.parameters.colors.rainbow[ob.selectedCountries.indexOf(c)]
        name: c
      )

    ob.data.activityData


  ########
  #
  # Set up the chart with initial data
  #
  ########

  createMap: (ob)->
    svg = d3.select("#map").append("svg")
     .attr("width", ob.parameters.map.width)
     .attr("height",ob.parameters.map.height)

    feature = svg.selectAll("path")
      .data(@data.worldCountries.features)
      .enter().append("path")
      .attr("class",(d)->
        if d.properties.name of ob.data.workingData
          "selectable"
        else
          "feature"
      )
      .attr("fill","white")
      .attr("d",(d)-> ob.parameters.map.path(d))
      .each((d)-> d.org = d.geometry.coordinates)
      .on('click', ob.onCountryClick)

    feature.append("title").text((d)-> d.properties.name)

    fishPolygon = (polygon)->
      _.map(polygon, (list)->
        _.map(list,(tuple)->
          p = ob.parameters.map.projection(tuple)
          c =  ob.parameters.map.fisheye({x : p[0], y : p[1]})
          ob.parameters.map.projection.invert([c.x, c.y])))

    refish = (e)->
      #Not sure why you have to get rid of 20
      #Padding maybe?
      x = e.offsetX
      y = e.offsetY
      #TODO: Still a little off on firefox
      x ?= e.screenX - $("#map svg").offset().left
      y ?= e.screenY - $("#map svg").offset().top

      ob.parameters.map.fisheye.center([x,y])
      svg.selectAll("path")
      .attr "d",(d)->
        clone = $.extend({},d)
        type = clone.geometry.type
        processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
        clone.geometry.coordinates = processed
        ob.parameters.map.path(clone)

    $("#map").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

  createActivity: (ob)->

    ob.updateActivityData(ob)

    ob.activity = new Rickshaw.Graph({
      renderer: "line"
      element: document.querySelector("#activity")
      height: ob.parameters.activity.width/3
      width: ob.parameters.activity.width-ob.parameters.map.width
      series: ob.data.activityData
    })

    ob.legend = new Rickshaw.Graph.Legend({
      graph: ob.activity
      element: document.getElementById("legend")
    })

    ob.activity.render()

    ticks = "glow"
    xAxis = new Rickshaw.Graph.Axis.Time
        graph: ob.activity
        ticksTreatment: ticks

    xAxis.render()

    yAxis = new Rickshaw.Graph.Axis.Y
    	graph: ob.activity,
    	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    	ticksTreatment: ticks,


    yAxis.render()

  createAlert: (ob)=>
    week = $("#activity")
    weekOffset = week.offset()
    $("#alert").offset(
      left: weekOffset.left
      top: weekOffset.top-20
    ).width(week.width())

   ########
   #
   # Mouse events
   #
   ########

   onCountryClick: (d,i)=>
     clicked= d.properties.name
     if not (clicked of @data.workingData) then return
     @clickedCountry(clicked,this)

   ########
   #
   # Change that which needs to be changed
   #
   ########

   clickedCountry: (name,ob)=>
     i = ob.selectedCountries.indexOf(name)

     if i is -1
       ob.selectedCountries[ob.selectedCountries.indexOf(null)]= name
     else
       ob.selectedCountries[i] = null

     @updateMap(ob)
     @updateActivity(ob)
     @updateAlert(ob)


   updateAlert: (ob)=>
#     hours = ob.data.workingData[@selectedCountry].hours
#     if _.any(_.flatten(hours),(n)-> n<10)
#       $("#alert").show()
#       $("span#country").text(@selectedCountry)
#     else
#      $("#alert").hide()

   updateActivity: (ob)=>
     d = ob.updateActivityData(ob)
     #HACKKKKKKKKK
     m = ob.activity.series.length
     n = d.length
     for i in _.range(d3.max([m,n]))
       console.log(i,m,n)
       if i < n
         ob.activity.series[i]= d[i]
       else
         delete ob.activity.series[i]

     ob.activity.update()
     ob.legend.update()

   updateMap: (ob)->
    d3.selectAll("#map svg path")
      .transition().delay(10)
      .attr("fill",(d)->
        i = ob.selectedCountries.indexOf(d.properties.name)
        if i isnt -1
        then ob.parameters.colors.rainbow[i]
        else "white"
      )


  ########
  #
  # Let there be light
  #
  ########

  begin: (c)->
    @createMap(c)
    @createActivity(c)

    @updateMap(c)
    @updateActivity(c)
#    @updateAlert(c)


c = new Chart()

i = 0
startQ = ()->
  i++
  if i is 2 then c.begin(c)

d3.json("data/working-data.json", (data)->
  c.data.workingData=data
  startQ()
)

d3.json("data/world-countries.json", (data)->
  c.data.worldCountries=data
  startQ()
)

$(window).resize(()->
  d = new Chart()
  $("#map").empty()
  $("#clock").empty()
  $("#week").empty()
  $("#stats").empty()
  d.begin(d)
)

check = ()->
  key for key, ob of c.data.workingData when not ob.zones?