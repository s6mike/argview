rm -rf lib

mkdir -p lib

curl http://mindmup.s3.amazonaws.com/lib/jquery-2.0.2.min.js > lib/jquery-2.0.2.min.js
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore.js > lib/underscore-1.4.4.js
curl http://static.mindmup.com/lib/jquery.mousewheel-3.1.3.js > lib/jquery.mousewheel-3.1.3.js
curl http://mindmup.s3.amazonaws.com/lib/jquery.hotkeys.js > lib/jquery.hotkeys.js
curl http://cloud.github.com/downloads/harthur/color/color-0.4.1.min.js > lib/color-0.4.1.min.js
curl http://mindmup.s3.amazonaws.com/lib/hammer.min-1.1.3.js > lib/jquery.hammer.min.js
curl http://static.mindmup.com.s3.amazonaws.com/lib/hammer-1.1.3.min.js > lib/hammer.min.js
curl http://static.mindmup.com.s3.amazonaws.com/lib/jquery.hammer-1.1.3.min.js > lib/jquery.hammer.min.js
