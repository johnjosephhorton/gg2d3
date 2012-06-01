main = "Administrative Support"
sub = "Data Entry"

createRankChart = ()->
  createPills()

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

updateRankChart = (m,s)->
  console.log(m,s)
  if m and m isnt main
    main = m
    sub = _.keys(data.sorted[main]).sort()[0]
    route.navigate("/rank/#{encodeURI(main)}/#{encodeURI(sub)}")
  if s then sub = s
  updatePills()
  updateTop()
  updateField()

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

updateTop= ()->
  field = $("#winners > #table").empty()
  table = $("<table>").addClass("table table-condensed")

  th = $("<thead>")
  tr = $("<tr>")
  country = $("<th>").append("Country")
  projects = $("<th>").append("Projects Completed").css("text-align","right")

  tr.append(country,projects)
  th.append(tr)
  table.append(th)

  medals = ["#C98910","#A8A8A8","#965A38"]

  for pair,i in data.sorted[main][sub][0...3]
    tr = $("<tr>")
    country = $("<td>").append(pair.country)
    projects = $("<td>").append(pair.projects).css(
      "text-align":"right"
      "color": medals[i]
    )
    tr.append(country,projects)
    table.append(tr)

  field.append(table)

updateField= ()->
  field = $("#field > #table").empty()
  table = $("<table>").addClass("table table-condensed table-striped")
  th = $("<thead>")
  tr = $("<tr>")
  rank = $("<th>").append("Rank")
  country = $("<th>").append("Country")
  projects = $("<th>").append("Projects Completed")

  tr.append(rank,country,projects)
  th.append(tr)
  table.append(th)

  for pair,i in data.sorted[main][sub][3..]
    tr = $("<tr>")
    rank = $("<td>").append(i+4)
    country = $("<td>").append(pair.country)
    projects = $("<td>").append(pair.projects).css("text-align","right")
    tr.append(rank,country,projects)
    table.append(tr)

  field.append(table)
