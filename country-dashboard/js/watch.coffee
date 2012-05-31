#Watch chart methods and objects
watch = {absolute: {max:0 }, relative: {max: 0}, hour:0}


orderWatchData = ()->
    data.watch = {absolute: {}, relative: {}}

    for country of data.working

      zones = data.working[country].zones
      average_zone = if zones then Math.round(d3.sum(zones)/zones.length)

      abs =  _.flatten(data.working[country].hours)
      norm =  _.flatten(data.working[country].normal_hours)
      watch.absolute.max = d3.max(abs.concat(watch.absolute.max))
      watch.relative.max = d3.max(norm.concat(watch.relative.max))
      #Shift to get everything roughly back to GMT
      if average_zone < 0
        for i in [0..Math.abs(average_zone)]
          abs.unshift(abs.pop())
          norm.unshift(norm.pop())
      else
        for i in [0..Math.abs(average_zone)]
          abs.push(abs.shift())
          norm.push(norm.shift())
      data.watch.absolute[country] = abs
      data.watch.relative[country] = norm

   data.watch

createNameMap = (name)->
  size = $("##{name}map").parent().width()

  watch[name].map = d3.select("##{name}map").append("svg")
    .attr("height",size)
    .attr("width",size)

  watch[name].map.projection =  d3.geo.mercator()
    .scale(size)
    .translate([size/2,size/2])

  watch[name].map.path = d3.geo.path().projection(watch[name].map.projection)
  watch[name].map.fisheye = d3.fisheye().radius(50).power(10)

  feature = watch[name].map.selectAll("path")
    .data(data.countries.features).enter()
      .append("path")
    .attr("d",watch[name].map.path)
    .each((d)-> d.org = d.geometry.coordinates)

  feature.each((d,i)->
    $(this).tooltip(
      title: d.properties.name
    )
  )

  fishPolygon = (polygon)->
    _.map(polygon, (list)->
      _.map(list,(tuple)->
        p = watch[name].map.projection(tuple)
        c = watch[name].map.fisheye({x : p[0], y : p[1]})
        watch[name].map.projection.invert([c.x, c.y])))

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


    watch[name].map.fisheye.center([x,y])
    watch[name].map.selectAll("path")
     .attr("d",(d)->
       clone = $.extend({},d)
       type = clone.geometry.type
       processed = if type is "Polygon" then fishPolygon(d.org) else _.map(d.org,fishPolygon)
       clone.geometry.coordinates = processed
       watch[name].map.path(clone)
    )

  $("##{name}map").on(i,refish) for i in ["mousemove","mousein","mouseout","touch","touchmove"]

updateNameMap = (name)->
  watch[name].map.selectAll("path")
    .transition().delay(10)
    .attr("fill",(d,i)->
      country = d.properties.name
      hours = data.watch[name][country]
      if hours
        watch[name].scale(hours[watch.hour])
      else
        "white"
    )
    .attr("stroke","black")
    .each((d,i)->
      country = d.properties.name
      hours = data.watch[name][country]
      if hours
        $(this).tooltip(
         title: d.properties.name+"hours"
        )
    )

createWatchChart = ()->
  orderWatchData()

  watch.relative.scale = d3.scale.linear()
    .range(["white","blue"])
    .domain([0,0.015])#Hack
  watch.absolute.scale = d3.scale.log()
    .range(["white","red"])
    .domain([0.1,watch.absolute.max])
    .clamp(true)

  _.map(["relative","absolute"], createNameMap)

  playing = false

  $(document).bind(["click","mousedown","touch"].join(" "),
    (e)-> playing = false unless e.isDefaultPrevented(); null
    #If it returns playing, it prevents everything on the document
    #from happening. So it returns null.
  )

  $("#playbutton").click((e)->
    e.preventDefault()
    playing = true
    watch.hour = 0 if watch.hour > 24*7-2
    inc_update = ()->
      if watch.hour > 24*7-2 or not playing
        return
      updateWatchChart(watch.hour+1)
      setTimeout(inc_update,100)
    inc_update()
  )

  $("#slider").slider(
    min: 0
    max: 24*7-2
    slide: (e,u)->
      updateWatchChart(u.value)
      playing=false
  )


updateWatchChart = (h)->
  if h then watch.hour = +h
  route.navigate("watch/#{watch.hour}")
  _.map(["relative","absolute"], updateNameMap)
  week=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  day = week[Math.floor(watch.hour/24)]
  hour = watch.hour%24
  $("#time").text( "#{day}, #{hour}:00-#{(hour+1)%24}:00 GMT")
  $("#slider").slider(value:watch.hour)