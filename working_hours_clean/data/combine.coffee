fs = require('fs')
csv = require('csv')
_ = require('../js/underscore.min.js')
timezones = JSON.parse fs.readFileSync "timezones.json","utf-8"

rawData = []

csv()
.fromPath(__dirname+'/all_working_hours.csv')
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

    country = item[1]
    if country is "Country" then return
    workers = parseFloat(item[0])
    day = item[2]
    hour = item[3]

    #Do we have an object
    if data[country]
      #Do we have a day in that object?
      if data[country]["hours"][day]
        #Add in the workers
        data[country]["hours"][day][hour]=workers
      else
        #Make an array
        data[country]["hours"][day]=[workers]
    else
      data[country] = new Object
      data[country]["hours"] = [[workers]]
      data[country]["zones"]= timezones[country]

  _.map(rawData,addToData)
  fs.writeFileSync("working-data.json",JSON.stringify(data))
)
.on('error',(error)->
    console.log(error.message)
)
