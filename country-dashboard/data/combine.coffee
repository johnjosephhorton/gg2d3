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
    zeros = (0 for i in [0...24])
    zerozeros = (zeros[0..] for i in [0..6])


    #Do we have an object
    if not data[country]?
      data[country] = new Object()
      data[country]["hours"] = zerozeros[0..]
      data[country]["zones"]= timezones[country]

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
  changed = data
  for country of data
    hours = data[country].hours
    zeros = (0 for i in [0...24])
    zerozeros = (zeros[0..] for i in [0..6])
    normal_array = zerozeros[0..]
    sum = _.reduce(_.flatten(data[country].hours),(a,b)-> a+b)

    for i in [0..6]
      for j in [0..23]
        normal_array[i][j]=hours[i][j]/sum

    changed[country].normal_hours = normal_array
  fs.writeFileSync("working_data.json",JSON.stringify(changed))