#Watch chart methods and objects
watch = {max: 0 , hour:0}
playing = false

orderWatchData = ()->
  data.watch = {relative: {}, absolute:{}}

  for country of data.working when data.working[country].normal_hours?

    zones = data.working[country].zones
    average_zone = if zones then Math.round(d3.sum(zones)/zones.length)

    norm =  _.flatten(data.working[country].normal_hours)
    abs =  _.flatten(data.working[country].hours)
    watch.max = d3.max(norm.concat(watch.max))
    #Shift to get everything roughly back to GMT
    if average_zone < 0
      for i in [0..Math.abs(average_zone)]
        norm.unshift(norm.pop())
        abs.unshift(abs.pop())
    else
      for i in [0..Math.abs(average_zone)]
        norm.push(norm.shift())
        abs.push(abs.shift())
    data.watch.relative[country] = norm
    data.watch.absolute[country] = abs

  instance = _.flatten(data.global.reduced)
  time = 60*60
  ranges =  _.range(instance.length)
  data.watch.charting = ({x: i*time, y: instance[i]} for i in ranges)
  data.watch

createWatchChart = ()->
  orderWatchData()
  createWatchMap()
  createWatchWeek()

createWatchWeek = ()->
  watch.chart = new Rickshaw.Graph({
      renderer: "line"
      element: document.querySelector("#global-weekly")
      height: $("#comparemap").parent().height()/2
      width: $("#global-weekly").parent().width()
      series:[{
        data:data.watch.charting
        color: "#168CE5"
        name: "Global"
        }]})

  watch.chart.render()

  ticks = "glow"
  week=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  time = new Rickshaw.Fixtures.Time
  timer = time.unit("day")
  a = timer.formatter
  timer.formatter = (d)-> week[a(d)-1]

  watch.xAxis = new Rickshaw.Graph.Axis.Time({
    graph: watch.chart
    ticksTreatment: ticks
    timeUnit: timer
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  })

  watch.yAxis = new Rickshaw.Graph.Axis.Y({
    graph: watch.chart
    ticksTreatment: ticks
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  })

  watch.xAxis.render()
  watch.yAxis.render()

  watch.hover = new Rickshaw.Graph.HoverDetail({
    graph: watch.chart,
    xFormatter: ((x)->
      #HACKKKKKKKK
      watch.hour = x/3600
      playing = false
      updateWatchChart()
      h = x/3600
      day = week[Math.floor(h/24)]
      hour = h%24
      "#{day}, #{hour}:00-#{(hour+1)%24}:00"
      ),
    yFormatter: (y)->  "#{y} total workers online "
  })

createWatchMap = ()->
  watch.scale = d3.scale.linear().range(["white","blue","black"]).domain([0,watch.max,1])

  size = $("#watchmap").parent().width()

  watch.map = d3.select("#watchmap").append("svg")
    .attr("height",size*0.7)
    .attr("width",size)

  watch.map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  watch.map.path = d3.geo.path().projection(watch.map.projection)
  watch.map.fisheye = d3.fisheye().radius(50).power(10)

  feature = watch.map.selectAll("path")
    .data(data.countries.features).enter()
      .append("path")
    .attr("d",watch.map.path)
    .each((d)-> d.org = d.geometry.coordinates)

  feature.each((d,i)->
    $(this).tooltip(
      title: "#{d.properties.name}"
      space: 90
    )
  )

  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = watch.map.projection(tuple)
        c = watch.map.fisheye({x : p[0], y : p[1]})
        watch.map.projection.invert([c.x, c.y])))

  refish = (e)->
    #Not sure why you have to get rid of 20
    #Padding maybe?
    x = e.offsetX
    y = e.offsetY
    #TODO: Still a little off on firefox
    m = $("##{name}map > svg").offset()
    if not x?
      totalOffsetX = 0
      totalOffsetY = 0
      currentElement = this
      while true
        totalOffsetX += currentElement.offsetLeft
        totalOffsetY += currentElement.offsetTop
        break if (currentElement = currentElement.offsetParent)

      x = e.pageX - totalOffsetX
      y = e.pageY - totalOffsetY


    watch.map.fisheye.center([x,y])
    watch.map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       watch.map.path(clone)
    )

  $("#watchmap").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

updateWatchChart = (h)->
  if h then watch.hour = +h
  route.navigate("watch/#{watch.hour}")

  week=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  day = week[Math.floor(watch.hour/24)]
  hour = watch.hour%24
  watch.text = "#{day}, #{hour}:00-#{(hour+1)%24}:00 GMT"
  $("#watch-time").text( "Activity Map for #{watch.text}")
  updateNameMap()

last = 0
updateNameMap = ()->
  watch.map.selectAll("path")
    .transition().delay(100)
    .attr("fill",(d,i)->
      country = d.properties.name
      percent = data.watch.relative[country]?[watch.hour]
      number = data.watch.absolute[country]?[watch.hour]
      if percent and number > 10

        if country is "Russia"
          if last isnt percent
            console.log(Math.round(1000*percent)/1000,watch.scale(percent))
        last = percent

        watch.scale(percent)
      else
        "white"
    )
    .attr("stroke","black")
    .each((d,i)->
      country = d.properties.name
      hours = _.flatten(data.working[country]?.hours)[watch.hour]
      percent = _.flatten(data.working[country]?.normal_hours)[watch.hour]
      if hours and percent
        #http://twigstechtips.blogspot.com/2012/04/twitter-bootstrap-change-tooltip-label.html
        t = "#{country} <br />"
        p = Math.round(percent*10000)/100
        t += "#{p}% of registered workers are active <br />"
        t += "#{hours} worker#{if hours isnt 1 then "s" else ""} online now <br />"
        t += "Estimated workers: #{Math.round(hours/percent)} "

        $(this).attr('data-original-title',t)
          .tooltip('fixTitle')
    )
