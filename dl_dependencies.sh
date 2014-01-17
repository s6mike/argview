rm -rf lib

mkdir -p lib

curl http://mindmup.s3.amazonaws.com/lib/jquery-2.0.2.min.js > lib/jquery-2.0.2.min.js
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore.js > lib/underscore-1.4.4.js
curl http://d3lp1msu2r81bx.cloudfront.net/kjs/js/lib/kinetic-v4.5.4.js > lib/kinetic-v4.5.4.js
#curl https://raw.github.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js > lib/jquery.mousewheel.js
#version=`grep Version  lib/jquery.mousewheel.js | tr -d -C "0-9."`
#mv lib/jquery.mousewheel.js lib/jquery.mousewheel-$version.js
curl http://static.mindmup.com/lib/jquery.mousewheel-3.1.3.js > lib/jquery.mousewheel-3.1.3.js
curl http://mindmup.s3.amazonaws.com/lib/jquery.hotkeys.js > lib/jquery.hotkeys.js
curl http://cloud.github.com/downloads/harthur/color/color-0.4.1.min.js > lib/color-0.4.1.min.js
curl http://mindmup.s3.amazonaws.com/lib/jquery.hammer.min.js > lib/jquery.hammer.min.js
