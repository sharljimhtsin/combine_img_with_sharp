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
	  var rotated = img["rotated"];
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
		background: {r: 0, g: 0, b: 0, alpha: 0}
	  }
	})
	.png()
	.toBuffer(function(err, data, info){
		finalImg = data;
		cb(err);
	});
},
function(cb){
	var i = 0;
	async.eachSeries(imgList,function(img,innerCb){
		console.log(img);
		var path = img["path"];
		var x = img["x"];
		var y = img["y"];
		var width = img["trim"]["width"];
		var height = img["trim"]["height"];
		var rotateWidth = img["rotateWidth"];
		var rotateHeight = img["rotateHeight"];
		var rotated = img["rotated"];
		var imgObjBuffer;
		async.series([function(resizeCb){
			if(rotated){
				var widthPadding = Math.round((rotateWidth - width) / 2);
				var heightPadding = Math.round((rotateHeight - height) / 2);
				console.log(widthPadding);
				console.log(heightPadding);
				var paddingConfig = []; //{top: heightPadding, bottom: heightPadding, left: widthPadding, right: widthPadding}
				if(widthPadding > 0){
					paddingConfig["left"] = widthPadding;
					paddingConfig["right"] = widthPadding;
				}else{
					paddingConfig["left"] = 1;
					paddingConfig["right"] = 1;					
				}
				if(heightPadding > 0){
					paddingConfig["top"] = heightPadding;
					paddingConfig["bottom"] = heightPadding;
				}else{
					paddingConfig["top"] = 1;
					paddingConfig["bottom"] = 1;					
				}
				sharp(path)
				.rotate(90)
				.resize(rotateWidth, rotateHeight)
				.background({r: 0, g: 0, b: 0, alpha: 0})
				// Resize to 140 pixels wide, then add 10 transparent pixels
				// to the top, left and right edges and 20 to the bottom edge
				.extend(paddingConfig)
				.toBuffer(function(err, data, info) {
				imgObjBuffer = data;
				resizeCb(err);
				});
			}else{
				sharp(path)
				.resize(width, height)
				.ignoreAspectRatio()
				.toBuffer(function(err, data, info){
					imgObjBuffer = data;
					resizeCb(err);
				});
			}
		},
		function(debugCb){
			sharp(imgObjBuffer)
			.toFile(i+'_item_output.jpg', function(err) {
				debugCb(err);
			});
		},
		function(processCb){
			sharp(finalImg)
			.overlayWith(imgObjBuffer, {top:img["y"],left:img["x"]})
			.toBuffer(function(err, data, info){
				finalImg = data;
				processCb(err);
			});
		},
		function(debugCb){
			sharp(finalImg)
			.resize(3000, 2000)
			.toFile(i+'_output.jpg', function(err) {
				debugCb(err);
			});
			i++;
		}],innerCb);
	},cb);
},
function(cb){
	sharp(finalImg)
	.resize(3000, 2000)
	.background({r: 0, g: 0, b: 0, alpha: 0})
	.embed()
	.trim()
	.toFile('output.jpg', function(err) {
		// output.jpg is a 3000 pixels wide and 2000 pixels high image
		// containing a scaled and cropped version of input.jpg
		cb(err);
	});
}],function(err){
	console.log("end",err);
});