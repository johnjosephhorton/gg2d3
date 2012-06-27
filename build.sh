#! /bin/bash
cd country-dashboard/js

cat jquery-1.7.2.min.js bootstrap.min.js custom-tooltip.js underscore.min.js backbone.min.js d3.v2.min.js fisheye.js rickshaw.min.js start.js bubble.js watch.js compare.js index.js > together.js

uglifyjs -nm together.js > ../../prod-country-dashboard/js/index.js

cd ../css/

cat swatchmaker/swatch/bootstrap.css index.css rickshaw.min.css jquery-ui-1.8.20.custom.css > together.css

uglifycss together.css > ../../prod-country-dashboard/css/index.css

cd ../..
