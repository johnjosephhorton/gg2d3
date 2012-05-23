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
        rainbow: d3.scale.category20().domain(["Web Development", "Software Development", "Networking & Information Systems", "Writing & Translation", "Administrative Support", "Design & Multimedia", "Customer Service", "Sales & Marketing", "Business Services"])

    ob.bubble=
      r: Math.min(height,width)
      flatten: (root)->
        classes = []
        recurse = (name,node)->
          if node.children
            node.children.forEach((child)-> recurse(node.name,child))
          else
              classes.push({packageName: name, className: node.name, value: node.size})
        recurse(null,root)
        {children: classes, className: "Total"}

    ob.map=
      width: width-ob.bubble.r
      height: height*2/3
      padding: 10;

    ob.map.projection =  d3.geo.mercator()
        .scale(ob.map.width*.9)
        .translate([ob.map.width/2,ob.map.height*.6])

    ob.map.path = d3.geo.path().projection(ob.map.projection)
    ob.map.fisheye = d3.fisheye().radius(50).power(10)

    ob.chart =
      width: ob.map.width
      height: $(document).height()-ob.map.height-ob.map.padding-20
      padding: 20

    ob.stats=
      width: $(document).width()/4
      height: $(document).height()/4
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

  createAlert: (ob)=>
    week = $("#week")
    weekOffset = week.offset()
    $("#alert").offset(
      left: weekOffset.left
      top: weekOffset.top-20
    ).width(week.width())

  createBubble : (ob)=>

    d3.select("#bubble").append("svg")
      .attr("width",ob.parameters.bubble.r)
      .attr("height",ob.parameters.bubble.r)
      .attr("class","pack")
    .append("g")
      .attr("transform","translate(2,2)")


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
     @updateStats(ob)
     @updateAlert(ob)
     @updateBubble(ob)

   updateAlert: (ob)=>
     hours = ob.data.workingData[@selectedCountry].hours
     if _.any(_.flatten(hours),(n)-> n<10)
       $("#alert").show()
       $("span#country").text(@selectedCountry)
     else
       $("#alert").hide()

   updateChart: (ob)=>
     instance = @data.workingData[@selectedCountry].hours
     flat  = _.flatten(instance)

     x = d3.scale.linear().domain([0, flat.length]).range([35, ob.parameters.chart.width])
     y = d3.scale.linear().domain([0, _.max(flat)]).range([ob.parameters.chart.height-30,5])

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
     .attr("y",20)

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

  updateStats : ()->
    d3.select("#statsG text#country")
      .text(@selectedCountry)

  updateBubble: (ob)->
    #Gather and format data
    d= @data.workingData[@selectedCountry].job_types

    f = name: "jobs"

    children = []
    sums = {}
    for big_name, big_ob of d
      grandchildren = []
      sum = 0
      for small_name, small_size of big_ob
        grandchildren.push({"name": small_name, "size": small_size})
        sum+= small_size

      children.push({"name": big_name, "children": grandchildren.sort((a,b)-> a.size < b.size)})
      sums[big_name]=sum

    f.children = children.sort((a,b)-> sums[a.name] < sums[b.name])

    #Start firing up the formating objects
    r = ob.parameters.bubble.r
    format = d3.format(",d")

    bubble = d3.layout.pack()
      .sort(null)
      .size([r,r]).value((d)-> d.value)

    vis = d3.select("#bubble >svg > g")
    console.log(vis)

    timing = 100
    node = vis.selectAll("g.node").data(bubble.nodes(ob.parameters.bubble.flatten(f)), (d)-> d.className)

    g = node.enter().append("g")
      .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

    g.append("circle")


    g.append("title")

    g.filter((d)-> not d.children).append("text")

    node.transition().delay(timing)
      .attr("class",(d)-> if d.children? then "node" else "leaf node")
      .attr("transform", (d)->  "translate(#{d.x},#{d.y})")

    node.select("circle").transition().delay(timing)
      .attr("r",(d)-> d.r)
      .attr("fill",(d)->
        if d.packageName then ob.parameters.colors.rainbow(d.packageName) else "none")

    node.select("title").transition().delay(timing)
      .text((d)-> "#{d.className}: #{d.value} projects completed")

    node.filter((d)->not d.children).select("text")
      .transition().delay(timing)
      .attr("text-anchor","middle")
      .attr("dy",".3em")
      .text((d)-> d.className.substring(0,d.r/3))


    node.exit().remove()
  ########
  #
  # Let there be light
  #
  ########

  begin: (c)->
    @createMap(c)
    @createChart(c)
    @createAlert(c)
    @createBubble(c)
    @createStats(c)

    @updateStats(c)
    @updateChart(c)
    @updateAlert(c)
    @updateBubble(c)


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