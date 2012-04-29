class Chart
  constructor: ()->

  ########
  #
  # Constant parameters
  #
  ########
  @parameters: (()->
    #TODO: get the parameters to reset on resize

    #Map parameters
    ob =
      map:
        width: $(document).width()/3
        height: $(document).width()/3
        padding: 20
    ob.chart =
      width: $(document).width()-ob.map.width-50
      height: $(document).height()/3
      padding: 20
    ob.clock=
      width: $(document).height()/2
      height: $(document).height()/2
      r: $(document).height()/4-5
      padding: 20
      arcWidth: 30
    ob
  )()
  data: {}
  ########
  #
  # Variables
  #
  ########

  selectedCountry: "United States"

  ########
  #
  # d3.js charting objects
  #
  ########

  map: ((main)->
    ob =
      projection: d3.geo.mercator()
        .scale(main.parameters.map.width)
        .translate([main.parameters.map.width/2,
          main.parameters.map.height*2/3])

    ob.path = d3.geo.path().projection(ob.projection)
    ob.fisheye = d3.fisheye().radius(50).power(10)
    ob
  )(this)

  ########
  #
  # Set up the chart with initial data
  #
  ########

  createMap: (ob)->

    svg = d3.select("#map").append("svg")
     .attr("width", Chart.parameters.map.width)
     .attr("height",Chart.parameters.map.height)

    feature = svg.selectAll("path")
      .data(@data.worldCountries.features)
      .enter().append("path")
      .attr("class",(d)->
        if d.properties.name of ob.data.workingData
          if d.properties.name is ob.selectedCountry
            'selected'
          else
            'unselected'
        else
          "feature"
      )
      .attr("d",(d)-> ob.map.path(d))
      .each((d)-> d.org = d.geometry.coordinates)
#      .on('mouseover', onCountryClick)

    feature.append("title").text((d)-> d.properties.name)



    fishPolygon = (polygon)->
      _.map(polygon, (list)->
        _.map(list,(tuple)->
          p = ob.map.projection(tuple)
          c =  ob.map.fisheye({x : p[0], y : p[1]})
          ob.map.projection.invert([c.x, c.y])))

    refish = ()->
      #Not sure why you have to get rid of 20
      ob.map.fisheye.center([d3.event.x-20,d3.event.y-20])
      svg.selectAll("path")
      .attr "d",(d)->
        clone = $.extend({},d)
        type = clone.geometry.type
        processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
        clone.geometry.coordinates = processed
        ob.map.path(clone)

    d3.select("svg").on "mousemove", refish
    d3.select("svg").on "mousein", refish
    d3.select("svg").on "mouseout", refish
    d3.select("svg").on "touch", refish
    d3.select("svg").on "touchmove", refish

  createChart: (ob)->
    weekChart = d3.select("#week")
      .append("svg")
      .attr("width", Chart.parameters.chart.width)
      .attr("height", Chart.parameters.chart.height)
      .append('g')
      .attr("id","weekChart")

  updateChart: (ob)->
    instance = ob.data.workingData[ob.selectedCountry].hours
    flat  = _.flatten(instance)

    x = d3.scale.linear().domain([0, flat.length]).range([0, Chart.parameters.chart.width])
    y = d3.scale.linear().domain([0, _.max(flat)]).range([Chart.parameters.chart.height-15, 10])

    weekChart = d3.select("#weekChart")

    weekChart.select("path.line").remove()
    weekChart.select("path").remove()

    extended = (flat[i..i+24] for i in [1..flat.length] by 24)
    #TODO: Fix the overlapping thing
    _.map _.range(7),(n)->
      weekChart.selectAll("path.area")
      .append("g")
      .data([instance[n]]).enter()
      .append("path")
      .attr("fill",(if n%2 is 0 then "steelblue" else "lightsteelblue"))
      .attr("d",d3.svg.area()
        .x((d,i)-> x(i+24*n))
        .y0(y(0))
        .y1((d,i)-> y(d))
        .interpolate("cardinal"))

    _.map _.range(7),(n)->
      weekChart.selectAll("path.area")
      .append("g")
      .data([extended[n]]).enter()
      .append("path")
      .attr("fill",(if n%2 is 0 then "steelblue" else "lightsteelblue"))
      .attr("d",d3.svg.area()
        .x((d,i)-> x(i+1+24*n))
        .y0(y(0))
        .y1((d,i)-> y(d))
        .interpolate("cardinal"))

    chartLine = weekChart.selectAll("g.thickline")
     .data([flat]).enter()
     .append("path")
     .attr("class","thickline")
     .attr("d",d3.svg.line()
       .x((d,i)-> x(i))
       .y((d,i)-> y(d))
       .interpolate("cardinal"))

    weekChart.selectAll("g.day")
      .data(["Sunday","Monday", "Tuesday",
         "Wednesday", "Thursday", "Friday", "Saturday"])
      .enter().append("text")
      .attr("x",(d,i)->Chart.parameters.chart.width/7*(i+0.5))
      .attr("dy",Chart.parameters.chart.height-3)
      .attr("text-anchor","middle")
      .text((d)->d)

  createClock: (ob)->
    w=Chart.parameters.clock.width
    h=Chart.parameters.clock.height
    r= Chart.parameters.clock.r
    arcWidth= Chart.parameters.clock.arcWidth

    clock = d3.select("#clock")
      .append("svg")
        .attr("width", w)
        .attr("height",h )
      .append('g')
      .attr("id","clockG")
      .attr("transform","translate(#{h/2},#{w/2})")

    clock.selectAll("g.rule")
      .data(d3.range(3)).enter()
      .append("g")
      .attr("class","rule")
      .append("line")
      .attr("x1",0)
      .attr("y1",0)
      .attr("x2",(d)-> Math.cos(2*Math.PI*d/3-Math.PI)*r)
      .attr("y2",(d)-> Math.sin(2*Math.PI*d/3)*r)

    outerCircle = clock.append("g")
      .data([_.range(361)])
      .append("path").attr("class","outerCircle")
      .attr("d", d3.svg.area.radial()
          .innerRadius(r-arcWidth)
        .outerRadius(r)
        .angle((d,i) -> i/180 * Math.PI))

    outerArc = clock.append("g")
      .append("path").attr("class","outerArc")
      .attr("id","outerArc")
      .attr("d", d3.svg.arc()
        .startAngle(0)
        .endAngle(0)
        .innerRadius(r-arcWidth)
        .outerRadius(r))

  updateClock: (ob)->
    r= Chart.parameters.clock.r
    arcWidth= Chart.parameters.clock.arcWidth

    instance = ob.data.workingData[ob.selectedCountry]["hours"]
    transposed = _.zip.apply(this,instance)

    sum = (row)-> _.reduce(row,(a,b)-> a+b)
    summed = (sum(row) for row in transposed)
    total=sum(summed)
    summed.push(summed[0])
    max = _.max(summed)

    clock = d3.select("#clockG")
    clock.select("g.time").remove()

    mainClock = clock.selectAll("g.time")
     .data([summed]).enter()
       .append("g").attr("class","time")

    smallR = r-arcWidth-1

    angle = (d,i) -> i/12 * Math.PI

    mainClock.append("path")
      .attr("class", "area")
      .attr("d", d3.svg.area.radial()
        .innerRadius(0)
        .outerRadius((d)-> smallR * d/max)
        .interpolate("cardinal")
        .angle(angle))

    mainClock.append("path")
      .attr("class", "line")
      .attr("d", d3.svg.line.radial()
        .radius((d)-> smallR * d/max)
        .interpolate("cardinal")
        .angle(angle))

    zone = ob.data.workingData[ob.selectedCountry]["zones"]

  #Lots of hand wavy math to get everything to line up the correct way.
    average=sum(zone)/zone.length+7.5+9
    angle = Math.PI*2*(average/24)
    d3.select("#outerArc").attr("d", d3.svg.arc()
      .startAngle(angle)
      .endAngle(2*Math.PI/3+angle)
      .innerRadius(r-arcWidth)
      .outerRadius(r))

  begin: (c)->
    @createMap(c)
    @createChart(c)
    @createClock(c)

    @updateChart(c)
    @updateClock(c)

  ########
  #
  # Redraw that which needs to change
  #
  ########

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
  c = new Chart()
  console.log("yo")
  $("#map").empty()
  $("#clock").empty()
  $("#week").empty()
  $("#stats").empty()
  c.begin(c)
)
