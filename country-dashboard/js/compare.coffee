#Compare chart methods and objects
compare =
  rainbow:  _.flatten([d3.scale.category20().range(),
    d3.scale.category20b().range(),
    d3.scale.category20c().range()])

selectedCountries = (()->
    arr = ["United States", "Canada", "Russia", "India"]
    arr.push(null) for i in _.range(compare.rainbow.length-arr.length)
    arr)()

updateActivityData = ()->
    data.activityData = []

    for c in selectedCountries when not _.isNull(c)
      instance =  _.flatten(data.working[c].hours)
      enumerated = ({x: i, y: instance[i]} for i in _.range(instance.length))
      data.activityData.push(
        data: enumerated
        color: compare.rainbow[selectedCountries.indexOf(c)]
        name: c
      )

    data.activityData

createCompareChart = ()->
  createCompareMap()
  createCompareLines()
  createCompareLegend()

updateCompareChart = ()->
  updateCompareMap()
  updateCompareLines()
  updateCompareLegend()
createCompareMap =  ()->
  size = $("#comparemap").parent().width()

  compare.map = d3.select("#comparemap").append("svg")
    .attr("height",size)
    .attr("width",size)

  compare.map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  compare.map.path = d3.geo.path().projection(compare.map.projection)
  compare.map.fisheye = d3.fisheye().radius(50).power(10)


  feature = compare.map.selectAll("path")
    .data(data.countries.features).enter()
      .append("path")
    .attr("class",(d)->
      if d.properties.name of data.working
        "selectable"
      else
        "feature"
    )
    .attr("d",compare.map.path)
    .each((d)-> d.org = d.geometry.coordinates)
    .on('click', (d,i)->
      clicked= d.properties.name
      if not (clicked of data.working) then return
      i = selectedCountries.indexOf(clicked)
      if i is -1
        selectedCountries[selectedCountries.indexOf(null)]= clicked
      else
          selectedCountries[i] = null
      str = selectedCountries.join('/')
      while str.indexOf("//") isnt -1
        str = str.replace("//","/")
      route.navigate("#compare/#{str}")
      updateCompareChart()
    )

  feature.each((d,i)->
    $(this).tooltip(
      title: d.properties.name
    )
  )

  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = compare.map.projection(tuple)
        c =  compare.map.fisheye({x : p[0], y : p[1]})
        compare.map.projection.invert([c.x, c.y])))

  refish = (e)->
    #Not sure why you have to get rid of 20
    #Padding maybe?
    x = e.offsetX
    y = e.offsetY
    #TODO: Still a little off on firefox
    x ?= e.screenX - map.offset().left
    y ?= e.screenY - map.offset().top

    compare.map.fisheye.center([x,y])
    compare.map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       compare.map.path(clone)
    )

  $("#comparemap").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

updateCompareMap = ()->
  compare.map.selectAll("path")
    .transition().delay(10)
    .attr("fill",(d)->
      i = selectedCountries.indexOf(d.properties.name)
      if i isnt -1
      then compare.rainbow[i]
      else "white"
    )
    .attr("stroke","black")

createCompareLines = ()->
  updateActivityData()

  compare.activity = new Rickshaw.Graph({
      renderer: "line"
      element: document.querySelector("#compareline")
      height: $("#comparemap").parent().height()
      width: $("#compareline").parent().width()
      series: data.activityData
    })

  compare.activity.render()

  ticks = "glow"

  xAxis = new Rickshaw.Graph.Axis.Time
      graph: compare.activity
      ticksTreatment: ticks

  xAxis.render()

  yAxis = new Rickshaw.Graph.Axis.Y
  	graph: compare.activity,
  	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
   	ticksTreatment: ticks,


  yAxis.render()

updateCompareLines = ()->
  d = updateActivityData()
  m = compare.activity.series.length
  n = d.length
  for i in _.range(d3.max([m,n]))
    if i < n
      compare.activity.series[i]= d[i]
    else
      delete compare.activity.series[i]
  compare.activity.update()

createCompareLegend = ()->
 $("#comparelegend").css(
  height: $("#comparemap").parent().height()
  'overflow-y': 'scroll'
 )

updateCompareLegend = ()->
  legend = $("#comparelegend")
  #hack
  legend.empty()
  for i in _.range(selectedCountries.length)
    cq = selectedCountries[i]
    if cq
      c = $("<div>")
      box = $("<div>").css(
        height: 10
        width: 10
        display: "inline-block"
        "background-color":compare.rainbow[i])
      c.append(box,$("<p>").text(cq))
      legend.append(c)
