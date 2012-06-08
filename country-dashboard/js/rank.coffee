main = "Administrative Support"
sub = "Data Entry"
relative = new Object
absolute = new Object

createRankChart = ()->
  createPills()
  createRelative()
  createAbsolute()

createPills = ()->
  main_pills = $("#main-pills > ul").first()
  for cat in categories.sort()
    li = $("<li>").append($("<a>").text(cat)).attr("href","#")
    li.addClass("active") if cat is main
    li.click((e,u)->
      t = e.target.text
      b = $(this)
      b.siblings().removeClass("active")
      b.addClass('active')
      route.navigate("/rank/#{encodeURI(t)}",trigger: true)
    )
    main_pills.append li

createRelative = ()->
  t = $("#winners-relative > #table")
  relative.height = 10
  relative.width = t.width()

  relative.svg = d3.select("#winners-relative > #table")
    .append("svg")
    .attr("height", relative.height)
    .attr("width",relative.width)

  g = relative.svg.append("g")

  g.append("text").text("Rank")
    .attr("dx",0)
    .attr("dy",10)

  g.append("text").text("Country")
        .attr("dx",relative.width*.3)
    .attr("dy",10)

  g.append("text").text("Projects Completed")
    .attr("dx",relative.width)
    .attr("dy",10)
    .attr("text-anchor","end")

  relative.countries = relative.svg.append("g")
    .attr("id","countries")

createAbsolute = ()->
  t = $("#absolute-table")
  absolute.height = 420
  absolute.width = t.width()

  absolute.svg = d3.select("#absolute-table")
    .append("svg")
    .attr("height", absolute.height)
    .attr("width",absolute.width)

  g = absolute.svg.append("g")

  g.append("text").text("Rank")
    .attr("dx",0)
    .attr("dy",10)

  g.append("text").text("Country")
        .attr("dx",absolute.width*.3)
    .attr("dy",10)

  g.append("text").text("Projects Completed")
    .attr("dx",absolute.width)
    .attr("dy",10)
    .attr("text-anchor","end")

  g.selectAll(".rank").data(_.range(20)).enter()
    .append("text").text((d,i)-> i+1)
    .attr("dx",0)
    .attr("dy",(d,i)->
      i*20+30
    )

  absolute.countries = absolute.svg.append("g")
    .attr("id","countries")


updateRankChart = (m,s)->
  if m and m isnt main
    main = m
    sub = _.keys(data.sorted.absolute[main])[0]
    sub = _.keys(data.sorted.absolute[main])
    route.navigate("/rank/#{encodeURI(main)}/#{encodeURI(sub)}")
  if s then sub = s
  updatePills()
  updateRelative()
  updateAbsolute()

updatePills = ()->
  sub_pills = $("#sub-pills > ul").empty()
  for cat in _.keys(data.sorted[main]).sort()
    li = $("<li>").append($("<a>").text(cat)).attr("href","")
    li.addClass("active") if sub is cat
    li.click((e,u)->
      t = e.target.text
      route.navigate("/rank/#{encodeURI(main)}/#{encodeURI(t)}", trigger: true)
    )

    sub_pills.append li

updateRelative = ()->
  top = data.sorted.relative[main][sub][0...20]
  c = relative.countries.selectAll("g").data(top, (d)->d.country)

  groups = c.select("text.country")
    .each((d,i)-> this.now = i)

  moving = groups.filter((d,i)-> this.last isnt this.now)

  unmoving = groups.filter((d,i)-> this.last is this.now)

  end = 0

  if moving[0].length isnt 0
    end = 200+20*50
    #Move the static off to the left side
    unmoving
      .transition()
      .duration(200)
      .delay(000)
      .attr("dx",absolute.width*.3-50)

    #Move the dynamic off to the right side
    moving
      .transition()
      .delay(000)
      .duration(200)
      .attr("dx",absolute.width*.3+50)

    moving
      .transition()
      .duration(200)
      .delay((d,i)-> 200+i*50)
      .attr("dy",(d,i)-> this.now*20+30)
      .attr("dx",absolute.width*.3)

    moving.each((d,i)-> this.last = this.now)

    unmoving
    .transition()
      .delay(end)
      .attr("dx",absolute.width*.3)

  #Make it look like they are coming up from the bottom. Except for the first time. That needs to be a part of the create functions.
  g = c.enter().append("g").attr("class","row")

  country_labels = g.append("text")
    .attr("class","country")
    .attr("dx",absolute.width*0.7)
    .attr("dy",(d,i)-> 1000)
    .each((d,i)-> this.last = i)
    .text((d,i)-> d.country)

  country_labels.transition()
    .delay((d,i)-> end+10*i+10)
    .attr("dy",(d,i)-> i*20+30)
    .delay((d,i)-> end+10*i)
    .attr("dx",absolute.width*0.3)

  g.append("text")
    .attr("class","projects")
    .attr("dx",absolute.width)
    .attr("dy",(d,i)-> i*20+30)
    .attr("text-anchor","end")
    .transition()
    .delay(end)
    .text((d,i)-> d.projects)

  c.select("text.projects")
    .attr("dy",(d,i)-> i*20+30)
    .text((d,i)-> d.projects)

  c.exit().transition()
    .attr("transform","translate(0,400)")
    .remove()

updateAbsolute = ()->
    top = data.sorted.absolute[main][sub][0...20]
    c = absolute.countries.selectAll("g").data(top, (d)->d.country)

    groups = c.select("text.country")
      .each((d,i)-> this.now = i)

    moving = groups.filter((d,i)-> this.last isnt this.now)

    unmoving = groups.filter((d,i)-> this.last is this.now)

    end = 0

    if moving[0].length isnt 0
      end = 200+20*50
      #Move the static off to the left side
      unmoving
        .transition()
        .duration(200)
        .delay(000)
        .attr("dx",absolute.width*.3-50)

      #Move the dynamic off to the right side
      moving
        .transition()
        .delay(000)
        .duration(200)
        .attr("dx",absolute.width*.3+50)

      moving
        .transition()
        .duration(200)
        .delay((d,i)-> 200+i*50)
        .attr("dy",(d,i)-> this.now*20+30)
      .attr("dx",absolute.width*.3)

    moving.each((d,i)-> this.last = this.now)

    unmoving
      .transition()
      .delay(end)
      .attr("dx",absolute.width*.3)

  #Make it look like they are coming up from the bottom. Except for the first time. That needs to be a part of the create functions.
  g = c.enter().append("g").attr("class","row")

  country_labels = g.append("text")
    .attr("class","country")
    .attr("dx",absolute.width*0.7)
    .attr("dy",(d,i)-> 1000)
    .each((d,i)-> this.last = i)
    .text((d,i)-> d.country)

  country_labels.transition()
    .delay((d,i)-> end+10*i+10)
    .attr("dy",(d,i)-> i*20+30)
    .delay((d,i)-> end+10*i)
    .attr("dx",absolute.width*0.3)

  g.append("text")
    .attr("class","projects")
    .attr("dx",absolute.width)
    .attr("dy",(d,i)-> i*20+30)
    .attr("text-anchor","end")
    .transition()
    .delay(end)
    .text((d,i)-> d.projects)

  c.select("text.projects")
    .attr("dy",(d,i)-> i*20+30)
    .text((d,i)-> d.projects)

  c.exit().transition()
    .attr("transform","translate(0,400)")
    .remove()
