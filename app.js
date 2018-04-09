var sharp = require("sharp");
var fs = require('fs');
var async = require("async");

var imgList;
var finalImg = null;
async.series([function(cb){
	fs.readFile('temp/aa.json', 'utf8', function (err,data) {
	  if (err) {
		  console.log(err);
	  }
	  var obj = JSON.parse(data);
	  imgList = obj;
	  cb(err);
	});
},
function(cb){
	for( i in imgList){
	  var img = imgList[i];
	  var path = img["path"];
	  var x = img["x"];
	  var y = img["y"];
	  var rotateWidth = img["rotateWidth"];
	  var rotateHeight = img["rotateHeight"];
	}
	cb();
},
function(cb){
	// Create a blank 3000x2000 PNG image of semi-transluent red pixels
	sharp({
	  create: {
		width: 3000,
		height: 2000,
		channels: 4,
		background: { r: 255, g: 0, b: 0, alpha: 128 }
	  }
	})
	.png()
	.toBuffer(function(err, data, info){
		finalImg = data;
		cb(err);
	});
},
function(cb){
	async.eachSeries(imgList,function(img,innerCb){
		console.log(img);
		var imgObjBuffer;
		async.series([function(resizeCb){
			sharp(img["path"])
			.resize(img["rotateWidth"], img["rotateHeight"])
			.toBuffer(function(err, data, info){
				imgObjBuffer = data;
				resizeCb(err);
			});
		},
		function(processCb){
			sharp(finalImg)
			.overlayWith(imgObjBuffer, {top:img["x"],left:img["y"]})
			.toBuffer(function(err, data, info){
				finalImg = data;
				processCb(err);
			});
		}],innerCb);
	},cb);
},
function(cb){
	sharp(finalImg)
	.resize(3000, 2000)
	.toFile('output.jpg', function(err) {
		// output.jpg is a 3000 pixels wide and 2000 pixels high image
		// containing a scaled and cropped version of input.jpg
		cb(err);
  });
}],function(err){
	console.log("end");
});