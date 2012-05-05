class Chart
  constructor: ()->
  ########
  #
  # Constant parameters
  #
  ########
  parameters: (()->
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
      r: $(document).height()/4-40
      padding: 20
      arcWidth: 30
    ob.stats=
      width: $(document).width()-ob.clock.width
      height: $(document).height()-ob.chart.height
      padding: 20
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
        .scale($(document).width()/3)
        .translate([$(document).width()/6,$(document).width()/4])
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
     .attr("width", ob.parameters.map.width)
     .attr("height",ob.parameters.map.height)

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
      .on('mouseover', ob.onCountryClick)

    feature.append("title").text((d)-> d.properties.name)

    fishPolygon = (polygon)->
      _.map(polygon, (list)->
        _.map(list,(tuple)->
          p = ob.map.projection(tuple)
          c =  ob.map.fisheye({x : p[0], y : p[1]})
          ob.map.projection.invert([c.x, c.y])))

    refish = (e)->
      #Not sure why you have to get rid of 20
      #Padding maybe?
      x = e.offsetX
      y = e.offsetY
      #TODO: Still a little off on firefox
      x ?= e.screenX - $("#map svg").offset().left
      y ?= e.screenY - $("#map svg").offset().top
      console.log(x,y)
      ob.map.fisheye.center([x,y])
      svg.selectAll("path")
      .attr "d",(d)->
        clone = $.extend({},d)
        type = clone.geometry.type
        processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
        clone.geometry.coordinates = processed
        ob.map.path(clone)

    $("#map").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

  createChart: (ob)->
    weekChart = d3.select("#week")
      .append("svg")
      .attr("width", ob.parameters.chart.width)
      .attr("height", ob.parameters.chart.height)
      .append('g')
      .attr("id","weekChart")

    _.map _.range(7), (n)->
      str = "abcdefghi"
      weekChart.append("path").attr("class","area#{str[n]}l")
      weekChart.append("path").attr("class","area#{str[n]}r")


    weekChart.append("text").attr("class","yaxislabels") for i in [0..5]
    weekChart.append("text").attr("class","yaxistoplabel").text("# of workers")

    weekChart.selectAll("g.day")
      .data(["Monday", "Tuesday",
         "Wednesday", "Thursday", "Friday", "Saturday","Sunday"])
      .enter().append("text")
      .attr("x",(d,i)->(ob.parameters.chart.width-35)/7*(i+0.5)+35)
      .attr("dy",ob.parameters.chart.height-3)
      .attr("text-anchor","middle")
      .text((d)->d)

  createClock: (ob)->

    w=ob.parameters.clock.width
    h=ob.parameters.clock.height
    r= ob.parameters.clock.r
    arcWidth= ob.parameters.clock.arcWidth

    clock = d3.select("#clock")
      .append("svg")
        .attr("width", w)
        .attr("height",h )
      .append('g')
      .attr("id","clockG")
      .attr("transform","translate(#{h/2},#{w/2})")

    clock.append("g")
      .data([_.range(370)])
      .append("path").attr("class","outerCircle")
      .attr("d", d3.svg.area.radial()
        .innerRadius(r-arcWidth)
        .outerRadius(r)
        .angle((d,i) -> i/180 * Math.PI))

    clock.append("g")
      .append("path").attr("class","outerArc")
      .attr("id","outerArc")
      .attr("d", d3.svg.arc()
        .startAngle(0)
        .endAngle(2*Math.PI/3)
        .innerRadius(r-arcWidth)
        .outerRadius(r))

    clock.append("path").attr("class","area")
    clock.append("path").attr("class","line")
    clock.append("text").attr("class","rlabel") for i in [0..10]

    clock.append("text")
      .attr("x", -(ob.parameters.clock.r+5))
      .attr("y", -ob.parameters.clock.height/4-20)
      .attr("text-anchor", "middle")
      .text("# of workers")

  createStats : (ob)=>
    stats = d3.select("#stats")
      .append("svg")
      .attr("width", ob.parameters.stats.width)
      .attr("height", ob.parameters.stats.height)
      .append('g')
      .attr("id","statsG")

    actual = (key for key, obj of c.data.workingData when not obj.zones)
    len =  _.max(_.pluck(actual,"length"))
    t = Math.round(ob.parameters.stats.width/len*2)
    stats.append("text")
      .attr("y",t)
      .style("font-size","#{t}px")
      .attr("id","country")

   ########
   #
   # Mouse events
   #
   ########

   onCountryClick: (d,i)=>
     clicked= d.properties.name
     if not (clicked of @data.workingData) then return
     @changeCountry(clicked,this)
   ########
   #
   # Change that which needs to be changed
   #
   ########

   changeCountry: (name,ob)=>
     @selectedCountry = name
     @updateMap(ob)
     @updateChart(ob)
     @updateClock(ob)
     @updateStats(ob)

   updateChart: (ob)=>
     instance = @data.workingData[@selectedCountry].hours
     flat  = _.flatten(instance)

     x = d3.scale.linear().domain([0, flat.length]).range([35, ob.parameters.chart.width])
     y = d3.scale.linear().domain([0, _.max(flat)]).range([ob.parameters.chart.height-15,5])

     weekChart = d3.select("#weekChart")

     #TODO: This looks wrong
     tickers= y.ticks(10)

     labels= weekChart.selectAll(".yaxislabels").data(tickers)
     labels.transition().delay(20)
       .attr("x", 30)
       .attr("y", y)
       .attr("text-anchor", "end")
       .text((d)-> d)
     labels.exit().remove()

     weekChart.select(".yaxistoplabel").transition().delay(20)
     .attr("y",25)

     extended = (flat[i..i+24] for i in [1..flat.length] by 24)

     mode = "basis"

     _.map _.range(7),(n)->
       str = "abcdefghi"

       weekChart.selectAll("path.area#{str[n]}l")
       .data([instance[n]]).transition().delay(20)
       .attr("fill", if n%2 is 0 then "#061F32" else "#168CE5")
       .attr("d",d3.svg.area()
         .x((d,i)-> x(i+24*n))
         .y0(y(0))
         .y1((d,i)-> y(d))
         .interpolate(mode,1000))

       weekChart.selectAll("path.area#{str[n]}r")
       .data([extended[n]]).transition().delay(20)
       .attr("fill", if n%2 is 0 then "#061F32" else "#168CE5")
       .attr("d",d3.svg.area()
         .x((d,i)-> x(i+1+24*n))
         .y0(y(0))
         .y1((d,i)-> y(d))
         .interpolate(mode))

     chartLine = weekChart.selectAll("path.thickline")
      .data([flat]).transition().delay(20)
      .attr("d",d3.svg.line()
        .x((d,i)-> x(i))
        .y((d,i)-> y(d))
        .interpolate(mode))

   updateClock: (ob)=>
     instance = @data.workingData[@selectedCountry]["hours"]

     transposed = _.zip.apply(this,instance)

     sum = (row)-> _.reduce(row,(a,b)-> a+b)

     summed = (sum(row) for row in transposed)
     total=sum(summed)
     summed.push(summed[0])
     max = _.max(summed)

     smallR = ob.parameters.clock.r-ob.parameters.clock.arcWidth-1

     scale = d3.scale.linear().domain([0,max]).range([0,-smallR])

     labels = d3.selectAll("text.rlabel").data(scale.ticks(5))

     labels.transition().delay(20)
       .attr("x", -(ob.parameters.clock.r+5))
       .attr("y", scale)
       .attr("text-anchor", "end")
       .text((d)-> d)
     labels.exit().remove()

     angle = (d,i) -> i/12 * Math.PI

     d3.select("path.area").data([summed]).transition().delay(20)
         .attr("d", d3.svg.area.radial()
         .innerRadius(0)
         .outerRadius((d)-> smallR * d/max)
         .interpolate("cardinal")
         .angle(angle))

     # d3.select("path.line").data([summed]).transition().delay(20)
     #   .attr("d", d3.svg.line.radial()
     #     .radius((d)-> smallR * d/max)
     #     .interpolate("cardinal")
     #     .angle(angle))

     zone = @data.workingData[@selectedCountry]["zones"]

     #Lots of hand wavy math to get everything to line up the correct way
     average=sum(zone)/zone.length+7.5+9
     angle = Math.PI*2*(average/24)
     degree = (angle)*180/(Math.PI)
     d3.select("#outerArc").transition().delay(40)
      .attr("transform","rotate(#{degree}),translate(0,0)")

  updateStats : ()->
    d3.select("#statsG text#country")
      .text(@selectedCountry)

  updateMap: (ob)->
    d3.selectAll("#map svg path")
      .transition().delay(10)
      .attr("class",(d) ->
        if d.properties.name of ob.data.workingData
          if d.properties.name is ob.selectedCountry
            "selected"
          else
            'unselected'
        else
          "feature"
    )

  ########
  #
  # Let there be light
  #
  ########

  begin: (c)->
    @createMap(c)
    @createChart(c)
    @createClock(c)
    @createStats(c)

    @updateChart(c)
    @updateClock(c)
    @updateStats(c)


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