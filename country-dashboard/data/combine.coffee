fs = require('fs')
csv = require('csv')
_ = require('../js/underscore.min.js')
timezones = JSON.parse fs.readFileSync "timezones.json","utf-8"

rawData = []

csv()
.fromPath(__dirname+'/more_working_hours.csv')
.toPath(__dirname+'/sample.out')
.transform((data)->
    data.unshift(data.pop())
    data
)
.on('data',(data,index)->
  rawData.push(data)
)
.on('end',(count)->
  data = new Object
  addToData = (item)->
    [num, d, hour, country, w,key, mouse] = item
    workers = +w
    day = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(d)
    if country is "Country" then return

    #Init empty arrays to deal with sparse arrays
    zero = ()-> (0 for i in [0...24])
    morezeroes = (zero() for i in [0..6])

    #Do we have an object
    if not data[country]?
      data[country] = new Object()
      data[country]["hours"] = morezeroes
      data[country]["zones"] = timezones[country]

    data[country]["hours"][day][hour]=workers

  _.map(rawData,addToData)

  load_time_zones(data)

)
.on('error',(error)->
    console.log(error.message)
)

load_time_zones =(data)->
  rawData = []

  csv()
  .fromPath(__dirname+'/jobtypes_per_country.csv')
  .toPath(__dirname+'/sample.out')
  .transform((data)->
      data.unshift(data.pop())
      data
  )
  .on('data',(data,index)->
    rawData.push(data)
  )
  .on('end',(count)->
    addToData = (item)->
      [percent,country,num,big_cat,small_cat,projects]=item
      projects = +projects
      if not data[country]? then return
      if not data[country]["job_types"]?
        data[country]["job_types"] = {}

      if not data[country]["job_types"][big_cat]?
        data[country]["job_types"][big_cat]= {}

      data[country]["job_types"][big_cat][small_cat]= projects
    _.map(rawData,addToData)

    load_normalized(data)
  )
  .on('error',(error)->
      console.log(error.message)
  )

load_normalized = (data)->
  rawData = []
  csv()
  .fromPath(__dirname+'/normal_hours.csv')
    .toPath(__dirname+'/sample.out')
  .transform((data)->
      data.unshift(data.pop())
      data
  )
  .on('data',(data,index)->
    rawData.push(data)
  )
  .on('end',(count)->
    addToData = (item)->
      [hour, country, workers, key, mouse, day] = item
      workers = +workers
      day = +day

      if country is "country" or country.length is 0 then return

      #Init empty arrays to deal with sparse arrays
      if not data[country]["normal_hours"]?
        zero = ()-> (0 for i in [0...24])
        morezeroes = (zero() for i in [0..6])
        data[country]["normal_hours"]=morezeroes

      data[country]["normal_hours"][day][hour]=workers

    _.map(rawData,addToData)
    load_utc(data)
  )
  .on('error',(error)->
      console.log(error.message)
  )

load_utc = (data)->
  rawData = []
  csv()
  .fromPath(__dirname+'/contractor_activity_over_time_UTC.csv')
    .toPath(__dirname+'/sample.out')
  .transform((data)->
      data.unshift(data.pop())
      data
  )
  .on('data',(data,index)->
    rawData.push(data)
  )
  .on('end',(count)->
    addToData = (item)->
      [country, absolute, total, relative, day, hour] = item
      relative = +relative
      absolute = +absolute

      if country is "country" or country.length is 0 then return

      data[country].total = total if not data[country].total?

     #Init empty arrays to deal with sparse arrays
      if not data[country]["utc_hours"]?
        zero = ()-> (0 for i in [0...24])
        morezeroes = (zero() for i in [0..6])
        data[country]["utc_hours"]=morezeroes

      data[country]["utc_hours"][day][hour]= absolute

    _.map(rawData,addToData)
    load_local(data)
    load_sorted_by_category(data)
  )
  .on('error',(error)->
      console.log(error.message)
  )

load_local = (data)->
  rawData = []
  csv()
  .fromPath(__dirname+'/contractor_activity_over_time_local.csv')
    .toPath(__dirname+'/sample.out')
  .transform((data)->
      data.unshift(data.pop())
      data
  )
  .on('data',(data,index)->
    rawData.push(data)
  )
  .on('end',(count)->
    addToData = (item)->
      [total, country, day, hour, relative, absolute] = item
      relative = +relative
      absolute = +absolute
#      console.log(item)
      if country is "country" or country.length is 0 then return

      data[country].total = total if not data[country].total?

     #Init empty arrays to deal with sparse arrays
      if not data[country]["local_hours"]?
        zero = ()-> (0 for i in [0...24])
        morezeroes = (zero() for i in [0..6])
        data[country]["local_hours"]=morezeroes

      data[country]["local_hours"][day][hour]= absolute

    _.map(rawData,addToData)
    fs.writeFileSync("working_data.json",JSON.stringify(data))
    load_sorted_by_category(data)
  )
  .on('error',(error)->
      console.log(error.message)
  )

load_sorted_by_category = (data)->
  sorted_by_category = {absolute: {}}

  for category of data["United States"].job_types
    sorted_by_category.absolute[category] ?= {}
    for sub of data["United States"].job_types[category]
      countries = []
      for country of data
        if data[country].job_types[category]? and data[country].job_types[category][sub]
          projects = data[country].job_types[category][sub]
          countries.push(country: country, projects: projects) if projects?
      c = countries.sort (arr1,arr2)-> if arr1.projects <= arr2.projects then 1 else -1
      sorted_by_category.absolute[category][sub] = c

  fs.writeFileSync("sorted.json",JSON.stringify(sorted_by_category))

  calculate_global(data)


calculate_global = (data)->
  global = {}
  all_hours = []
  for country,hour of data
    all_hours.push hour.hours

  sum = _.reduce(_.flatten(all_hours),(a,b)-> a+b)
  tmp  = _.reduce all_hours, (matrix_a,matrix_b)->
    week = _.zip(matrix_a,matrix_b)
    _.map(week, (w)->
      [day_a, day_b] = w
      day = _.zip(day_a,day_b)
      _.map(day, (d)->
        [a,b]=d
        (a+b)
      )
    )
  global.reduced = _.map(tmp, (arr)->
    _.map(arr,(h)-> h/1)#sum)
    )

  console.log(_.reduce(_.flatten(global.reduced),(a,b)-> a+b),sum)
  fs.writeFileSync("global.json",JSON.stringify(global))