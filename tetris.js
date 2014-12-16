/*
Author: Simon Laroche
Site: http://simon.lc/
Demo: http://simon.lc/tetr.js

Note: Before looking at this code, it would be wise to do a bit of reading about
the game so you know why some things are done a certain way.
*/
'use strict';

/**
 * Playfield.
 */
var cellSize;
var column;

/**
 * Get html elements. 
 */
var msg = document.getElementById('msg');
var stats = document.getElementById('stats');
var statsTime = document.getElementById('time');
var statsLines = document.getElementById('line');
var statsPiece = document.getElementById('piece');
var h3 = document.getElementsByTagName('h3');
var set = document.getElementById('settings');

// Get canvases and contexts
var holdCanvas = document.getElementById('hold');
var bgStackCanvas = document.getElementById('bgStack');
var stackCanvas = document.getElementById('stack');
var activeCanvas = document.getElementById('active');
var previewCanvas = document.getElementById('preview');
var spriteCanvas = document.getElementById('sprite');

var holdCtx = holdCanvas.getContext('2d');
var bgStackCtx = bgStackCanvas.getContext('2d');
var stackCtx = stackCanvas.getContext('2d');
var activeCtx = activeCanvas.getContext('2d');
var previewCtx = previewCanvas.getContext('2d');
var spriteCtx = spriteCanvas.getContext('2d');


var touchLeft = document.getElementById('touchLeft');
var touchRight = document.getElementById('touchRight');
var touchDown = document.getElementById('touchDown');
var touchDrop = document.getElementById('touchDrop');
var touchHold = document.getElementById('touchHold');
var touchRotLeft = document.getElementById('touchRotLeft');
var touchRotRight = document.getElementById('touchRotRight');
var touchRot180 = document.getElementById('touchRot180');

var touchLayout = document.getElementById('touchLayout');

var touchButtons = [
  touchLeft, touchRight, touchDown, touchDrop,
  touchHold, touchRotRight, touchRotLeft, touchRot180
];
touchLeft.bindsMemberName = "moveLeft";
touchRight.bindsMemberName = "moveRight";
touchDown.bindsMemberName = "moveDown";
touchDrop.bindsMemberName = "hardDrop";
touchHold.bindsMemberName = "holdPiece";
touchRotRight.bindsMemberName = "rotRight";
touchRotLeft.bindsMemberName = "rotLeft";
touchRot180.bindsMemberName = "rot180";

var nLayouts = 4, currLayout = -1 /* auto */;

/**
 * Piece data
 */

// NOTE y values are inverted since our matrix counts from top to bottom.
var kickData = [
  [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]
];
var kickDataI = [
  [[0, 0], [-1, 0], [2, 0], [-1, 0], [2, 0]],
  [[-1, 0], [0, 0], [0, 0], [0, -1], [0, 2]],
  [[-1, -1], [1, -1], [-2, -1], [1, 0], [-2, 0]],
  [[0, -1], [0, -1], [0, -1], [0, 1], [0, -2]]
];
// TODO get rid of this lol.
var kickDataO = [
  [[0, 0]],
  [[0, 0]],
  [[0, 0]],
  [[0, 0]]
];

// Define shapes and spawns.
var PieceI = {
  index: 0,
  x: 2,
  y: -1,
  kickData: kickDataI,
  tetro: [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0]]
};
var PieceJ = {
  index: 1,
  x: 3,
  y: 0,
  kickData: kickData,
  tetro: [
    [2, 2, 0],
    [0, 2, 0],
    [0, 2, 0]]
};
var PieceL = {
  index: 2,
  x: 3,
  y: 0,
  kickData: kickData,
  tetro: [
    [0, 3, 0],
    [0, 3, 0],
    [3, 3, 0]]
};
var PieceO = {
  index: 3,
  x: 4,
  y: 0,
  kickData: kickDataO,
  tetro: [
    [4, 4],
    [4, 4]]
};
var PieceS = {
  index: 4,
  x: 3,
  y: 0,
  kickData: kickData,
  tetro: [
    [0, 5, 0],
    [5, 5, 0],
    [5, 0, 0]]
};
var PieceT = {
  index: 5,
  x: 3,
  y: 0,
  kickData: kickData,
  tetro: [
    [0, 6, 0],
    [6, 6, 0],
    [0, 6, 0]]
};
var PieceZ = {
  index: 6,
  x: 3,
  y: 0,
  kickData: kickData,
  tetro: [
    [7, 0, 0],
    [7, 7, 0],
    [0, 7, 0]]
};
var pieces = [PieceI, PieceJ, PieceL, PieceO, PieceS, PieceT, PieceZ];

// Finesse data
// index x orientatio x column = finesse
// finesse[0][0][4] = 1
// TODO double check these.
var finesse = [
  [
    [1, 2, 1, 0, 1, 2, 1],
    [2, 2, 2, 2, 1, 1, 2, 2, 2, 2],
    [1, 2, 1, 0, 1, 2, 1],
    [2, 2, 2, 2, 1, 1, 2, 2, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1],
    [1, 2, 2, 1, 0, 1, 2, 2, 1]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2],
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2],
    [2, 3, 2, 1, 2, 3, 3, 2, 2]
  ],
  [
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2],
    [1, 2, 1, 0, 1, 2, 2, 1],
    [2, 2, 2, 1, 1, 2, 3, 2, 2]
  ]
];

/**
 * Gameplay specific vars.
 */
var gravityUnit = 0.00390625;
var gravity;
var gravityArr = (function() {
  var array = [];
  array.push(0);
  for (var i = 1; i < 64; i*=2)
    array.push(i / 64);
  for (var i = 1; i <= 20; i+=19)
    array.push(i);
  return array;
})();

var settings = {
  DAS: 9,
  ARR: 1,
  Gravity: 0,
  'Soft Drop': 6,
  'Lock Delay': 30,
  Size: 0,
  Sound: 0,
  Volume: 100,
  Block: 0,
  Ghost: 1,
  Grid: 0,
  Outline: 0
};

var settingName = {
  DAS: "DAS 加速延迟",
  ARR: "ARR 重复延迟",
  Gravity: "Gravity<br>下落速度",
  'Soft Drop': "Soft Drop<br>软降速度",
  'Lock Delay': "Lock Delay<br>锁定延迟",
  Size: "Size 大小",
  Sound: "Sound 声音",
  Volume: "Volume 音量",
  Block: "Block 样式",
  Ghost: "Ghost 影子",
  Grid: "Grid 网格",
  Outline: "Outline<br>方块边缘"
};
var setting = {
  DAS: range(0,31),
  ARR: range(0,11),
  Gravity: (function() {
    var array = [];
    array.push('Auto');
    array.push('0G');
    for (var i = 1; i < 64; i*=2)
      array.push(i + '/64G');
    for (var i = 1; i <= 20; i+=19)
      array.push(i + 'G');
    return array;
  })(),
  'Soft Drop': (function() {
    var array = [];
    for (var i = 1; i < 64; i*=2)
      array.push(i + '/64G');
    for (var i = 1; i <= 20; i+=19)
      array.push(i + 'G');
    return array;
  })(),
  'Lock Delay': range(0,101),
  Size: ['Auto', 'Small', 'Medium', 'Large'],
  Sound: ['Off', 'On'],
  Volume: range(0, 101),
  Block: ['Shaded', 'Solid', 'Glossy', 'Arika', 'World'],
  Ghost: ['Normal', 'Colored', 'Off'],
  Grid: ['Off', 'On'],
  Outline: ['Off', 'On']
};
var arrRowGen = {
      'simple':
      function(arr,offset,range,width) {
        var holex = ~~(rng.next()*range)+offset;
        for(var x = 0; x < width; x++){
          arr[holex + x] = 0;
        }
      },
      'simplemessy':
      function(arr,ratio) {
        var hashole = false;
        for(var x = 0; x < 10; x++){
          if(rng.next()>=ratio) {
            hashole=true;
            arr[x] = 0;
          }
        }
        if(hashole===false){
          arr[~~(rng.next()*10)] = 0;
        }
      },
};

var arrStages = [
      {begin:   0, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
      {begin:   5, delay: 60*7, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
      {begin:  20, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
      {begin:  40, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,2,3,4)}},
      {begin:  50, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
      {begin:  70, delay: 60*5, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:  80, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:  90, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      
      {begin: 100, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin: 110, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin: 150, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
      {begin: 170, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,7,4)}},
      
      {begin: 200, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin: 220, delay: 60*2.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin: 250, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      
      {begin: 300, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
      {begin: 320, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
      {begin: 350, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
      {begin: 390, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
      {begin: 400, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
      {begin: 430, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
      {begin: 450, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.1)}},
      
      {begin: 470, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
      {begin: 500, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
      {begin: 550, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.8)}},
      {begin: 600, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
      {begin: 650, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.6)}},
      {begin: 700, delay: 60*3.5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
      {begin: 750, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
      {begin: 780, delay: 60*2.5, gen:function(arr){arrRowGen.simplemessy(arr,0.4)}},
      {begin: 800, delay: 60*2, gen:function(arr){arrRowGen.simplemessy(arr,0.9)}},
      {begin: 900, delay: 60*1.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin: 950, delay: 60*1.2, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      
      {begin:1000, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
      {begin:1050, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
      {begin:1100, delay: 60*4, gen:function(arr){arrRowGen.simple(arr,1,1,8)}},
      {begin:1150, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,2,1,6)}},
      {begin:1180, delay: 60*3, gen:function(arr){arrRowGen.simple(arr,3,1,4)}},
      {begin:1200, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
      {begin:1210, delay: 60*1, gen:function(arr){arrRowGen.simple(arr,4,1,2)}},
      {begin:1250, delay: 60*2, gen:function(arr){arrRowGen.simple(arr,9,1,1)}},
      {begin:1260, delay: 60*0.5, gen:function(arr){arrRowGen.simple(arr,9,1,1)}},
      {begin:1300, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.0)}},
      {begin:1350, delay: 60*3, gen:function(arr){arrRowGen.simplemessy(arr,0.1)}},
      {begin:1400, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.15)}},
      {begin:1450, delay: 60*4, gen:function(arr){arrRowGen.simplemessy(arr,0.2)}},
      {begin:1480, delay: 60*5, gen:function(arr){arrRowGen.simplemessy(arr,0.2)}},

      {begin:1500, delay: 60*1.5, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:1550, delay: 60*1.4, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:1600, delay: 60*1.3, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:1650, delay: 60*1.2, gen:function(arr){arrRowGen.simple(arr,0,9,2)}},
      {begin:1700, delay: 60*1.3, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:1800, delay: 60*1.2, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:1850, delay: 60*1.15, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:1900, delay: 60*1.1, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:1950, delay: 60*1.05, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      
      {begin:2000, delay: 60*1.0, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2050, delay: 60*0.95, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2100, delay: 60*0.9, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2150, delay: 60*0.85, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2180, delay: 60*0.8, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2190, delay: 60*1.0, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2200, delay: 60*0.8, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2300, delay: 60*0.75, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2400, delay: 60*0.7, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2450, delay: 60*0.6, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      {begin:2500, delay: 60*0.5, gen:function(arr){arrRowGen.simple(arr,0,10,1)}},
      
      
];
var frame;
var frameLastRise;

/**
*Pausing variables
*/

var startPauseTime;
var pauseTime;

/**
 * 0 = Normal
 * 1 = win
 * 2 = countdown
 * 3 = game not played
 * 9 = loss
 */
var gameState = 3;

var paused = false;
var lineLimit;

var replayKeys;
var watchingReplay = false;
var toGreyRow;
var gametype;
var gameparams;
//TODO Make dirty flags for each canvas, draw them all at once during frame call.
// var dirtyHold, dirtyActive, dirtyStack, dirtyPreview;
var lastX, lastY, lastPos, lastLockDelay, landed;

// Stats
var lines;
var statsFinesse;
var piecesSet;
var startTime;
var digLines;

// Keys
var keysDown;
var lastKeys;
var released;

var binds = {
  pause: 27,
  moveLeft: 37,
  moveRight: 39,
  moveDown: 40,
  hardDrop: 32,
  holdPiece: 67,
  rotRight: 88,
  rotLeft: 90,
  rot180: 16,
  retry: 82
};
var flags = {
  hardDrop: 1,
  moveRight: 2,
  moveLeft: 4,
  moveDown: 8,
  holdPiece: 16,
  rotRight: 32,
  rotLeft: 64,
  rot180: 128,
};

function resize() {
  var a = document.getElementById('a');
  var b = document.getElementById('b');
  var c = document.getElementById('c');
  var content = document.getElementById('content');

  // TODO Finalize this.
  // Aspect ratio: 1.024
  var screenHeight = window.innerHeight - 34;
  var screenWidth = ~~(screenHeight * 1.024);
  if (screenWidth > window.innerWidth)
    screenHeight = ~~(window.innerWidth / 1.024);
  
  //console.log("w"+screenWidth+"h"+screenHeight);

  if (settings.Size === 1 && screenHeight > 602) cellSize = 15;
  else if (settings.Size === 2 && screenHeight > 602) cellSize = 30;
  else if (settings.Size === 3 && screenHeight > 902) cellSize = 45;
  else cellSize = Math.max(~~(screenHeight / 20), 10);

  var pad = (window.innerHeight - (cellSize * 20 + 2)) / 2 + 'px';
  content.style.padding = pad + ' 0';
  stats.style.bottom = pad;

  // Size elements
  a.style.padding = '0 0.5rem ' + ~~(cellSize / 2) + 'px';

  stackCanvas.width = activeCanvas.width = bgStackCanvas.width = cellSize * 10;
  stackCanvas.height = activeCanvas.height = bgStackCanvas.height = cellSize * 20;
  b.style.width = stackCanvas.width + 'px';
  b.style.height = stackCanvas.height + 'px';

  holdCanvas.width = cellSize * 4;
  holdCanvas.height = cellSize * 2;
  a.style.width = holdCanvas.width + 'px';
  a.style.height = holdCanvas.height + 'px';

  previewCanvas.width = cellSize * 4;
  previewCanvas.height = stackCanvas.height;
  c.style.width = previewCanvas.width + 'px';
  c.style.height = b.style.height;
  
  // Scale the text so it fits in the thing.
  // TODO get rid of extra font sizes here.
  msg.style.lineHeight = b.style.height;
  msg.style.fontSize = ~~(stackCanvas.width / 6) + 'px';
  stats.style.fontSize = ~~(stackCanvas.width / 11) + 'px';
  document.documentElement.style.fontSize = ~~(stackCanvas.width / 16) + 'px';

  stats.style.width = a.style.width;
  for (var i = 0, len = h3.length; i < len; i++) {
    h3[i].style.lineHeight = a.style.height;
    h3[i].style.fontSize = stats.style.fontSize;
  }
  
  // position of touch buttons
  {
    /*
    var tmpNode = document.createElement("div");
    tmpNode.style.cssText = 
      "width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:-100;visibility:hidden";
    document.body.appendChild(tmpNode);
    var dpiX = parseInt(tmpNode.clientWidth);
    var dpiY = parseInt(tmpNode.clientHeight);
    tmpNode.parentNode.removeChild(tmpNode);
    */
    var dpiX = 96;
    var dpiY = 96;
    var winW = window.innerWidth / dpiX;
    var winH = window.innerHeight / dpiY;
    var buttonH = 0.7, buttonW = 1, fontSize=0.55, unit="in";
    
    var setPos = function(elem, posX, posY, sizeW, sizeH,
      alignX, alignY, offsetX, offsetY, clientW, clientH)
    {
      elem.style.width = "" + sizeW + unit;
      elem.style.height = "" + sizeH + unit;
      // border ignored, for now
      elem.style.left = "" + (offsetX + alignX * 0.5 * (clientW - sizeW) + posX - ( (alignX-1) * 0.05)) + unit;
      elem.style.top = "" + (offsetY + alignY * 0.5 * (clientH - sizeH) + posY - ( (alignY-1) * 0.05)) + unit;
      elem.style.display = "block";
      elem.style.fontSize = "" + fontSize + unit;
    }
    
    var layouts = { //function array
      "NONE":
      function() {
        for (var i = 0, len = touchButtons.length; i < len; i++)
          touchButtons[i].style.display = "none";
      },
      "KBD_R":
      function() {
        setPos(touchRotLeft,  0, -buttonH, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchRot180,   buttonW*0.5, -buttonH*2, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchRotRight, buttonW, -buttonH, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchHold,     1.5*buttonW, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchRight,    0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchLeft,     -buttonW*2, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchDown,     -buttonW, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchDrop,     -buttonW, -buttonH, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
      },
      "KBD_L":
      function() {
        setPos(touchRotLeft,  -buttonW, -buttonH, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchRot180,   -buttonW*0.4, -buttonH*2, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchRotRight, 0, -buttonH, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchHold,     -buttonW*1.5, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchRight,    buttonW*2, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchLeft,     0, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchDown,     buttonW, 0, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
        setPos(touchDrop,     buttonW, -buttonH, buttonW, buttonH, 0, 2, 0, 0, winW, winH);
      },
      "JOY":
      function() {
        setPos(touchRotLeft,  -buttonW*0.5, buttonH, buttonW, buttonH, 2, 1, 0, 0, winW, winH);
        setPos(touchRot180,   -buttonW*0.5, -buttonH, buttonW, buttonH, 2, 1, 0, 0, winW, winH);
        setPos(touchRotRight, 0, 0, buttonW, buttonH, 2, 1, 0, 0, winW, winH);
        setPos(touchHold,     -buttonW, 0, buttonW, buttonH, 2, 1, 0, 0, winW, winH);
        setPos(touchRight,    buttonW, 0, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchLeft,     0, 0, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchDown,     buttonW*0.5, buttonH, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchDrop,     buttonW*0.5, -buttonH, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      },
      "NARROW":
      function() {
        setPos(touchLeft,     -buttonW*2, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        setPos(touchRight,    0, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        if (winH-winW>buttonH*3) {
          setPos(touchDown,     -buttonW, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
          setPos(touchDrop,     -buttonW, -buttonH, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        }
        else {
          setPos(touchDown,     0, -buttonH, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
          setPos(touchDrop,     -buttonW, 0, buttonW, buttonH, 2, 2, 0, 0, winW, winH);
        }
        setPos(touchRotLeft,  0, -buttonH*1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchRotRight, 0, 0, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchHold,     0, buttonH*1.2, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
        setPos(touchRot180,   0, -buttonH*2.4, buttonW, buttonH, 0, 1, 0, 0, winW, winH);
      },
    };
    if(currLayout === -1) { // auto detection
      if(winW<buttonW*3) {
        layouts["NONE"]();
      }
      else if((winW-(winH*0.5)>buttonW*4.5) ||
        (winH-winW>4*buttonH && winW>buttonW*5.5)) {
        layouts["KBD_R"]();
      }
      else if(winW-(winH*0.5)>buttonW*3) {
        layouts["JOY"]();
      }
      else if(winH-winW>0) {
        layouts["NARROW"]();
      }
      else {
        layouts["NONE"]();
      }
    }
    else {
      layouts[["KBD_R","KBD_L","JOY","NARROW","NONE"][currLayout]]();
    }
    setPos(touchLayout, 0, 0, buttonW, buttonH, 2, 0, 0, 0, winW, winH);
  }

  // Redraw graphics
  makeSprite();

  if (settings.Grid === 1)
    bg(bgStackCtx);

  //if (gameState === 0) {
  try {
    piece.drawGhost();
    piece.draw();
    stack.draw();
    preview.draw();
    if (hold.piece) {
      hold.draw();
    }
  } catch(e) {
  }
  //}
}
addEventListener('resize', resize, false);

/**
 * ========================== Model ===========================================
 */

/**
 * Resets all the settings and starts the game.
 */
function init(gt, params) {
  if (gt === 'replay') {
    watchingReplay = true;
  } else {
    watchingReplay = false;
    replayKeys = {};
    // TODO Make new seed and rng method.
    replayKeys.seed = ~~(Math.random() * 2147483645) + 1;
    gametype = gt;
    gameparams = params || {};
  }

  if(gametype === 0)
    lineLimit = 40;

  //Reset
  column = 0;
  keysDown = 0;
  lastKeys = 0;
  released = 255;
  //TODO Check if needed.
  piece.shiftDir = 0;
  piece.shiftReleased = true;

  startPauseTime = 0;
  pauseTime = 0;
  paused = false;

  rng.seed = replayKeys.seed;
  toGreyRow = 21;
  frame = 0;
  lastPos = 'reset';
  stack.new(10, 22);
  hold.piece = void 0;
  if (settings.Gravity === 0) gravity = gravityUnit * 4;
  startTime = Date.now();

  preview.init()
  //preview.draw();

  statsFinesse = 0;
  lines = 0;
  piecesSet = 0;

  clear(stackCtx);
  clear(activeCtx);
  clear(holdCtx);

  if (gametype === 3) {
    // Dig Race
    // make ten random numbers, make sure next isn't the same as last? t=rnd()*(size-1);t>=arr[i-1]?t++:; /* farter */
    //TODO make into function or own file.

    digLines = [];
    frameLastRise = 0;

    statsLines.innerHTML = "0";
    
    stack.draw();
  }

  menu();

  // Only start a loop if one is not running already.
  if (gameState === 3) {
    gameState = 2;
    gameLoop();
  } else {
    gameState = 2;
  }
  
  statistics();
  statisticsStack();
}

function range(start, end, inc) {
  inc = inc || 1;
  var array = [];
  for (var i = start; i < end; i += inc) {
    array.push(i);
  }
  return array;
}

/**
 * Add divisor method so we can do clock arithmetics. This is later used to
 *  determine tetromino orientation.
 */
Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

/**
 * Shim.
 */
window.requestAnimFrame = (function () {
  return window.requestAnimationFrame       ||
         window.mozRequestAnimationFrame    ||
         window.webkitRequestAnimationFrame ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

function pause() {
  if (gameState === 0) {
    paused = true;
    startPauseTime = Date.now();
    msg.innerHTML = "Paused";
    menu(4);    
  }
}

function unpause() {
  paused = false;
  pauseTime += (Date.now() - startPauseTime);
  msg.innerHTML = '';
  menu();
  requestAnimFrame(gameLoop);
}

/**
 * Park Miller "Minimal Standard" PRNG.
 */
//TODO put random seed method in here.
var rng = new (function() {
  this.seed = 1;
  this.next = function() {
    // Returns a float between 0.0, and 1.0
    return (this.gen() / 2147483647);
  }
  this.gen = function() {
    return this.seed = (this.seed * 16807) % 2147483647;
  }
})();

/**
 * Draws the stats next to the tetrion.
 */
function statistics() {
  var time = Date.now() - startTime - pauseTime;
  var seconds = (time / 1000 % 60).toFixed(2);
  var minutes = ~~(time / 60000);
  statsTime.innerHTML = (minutes < 10 ? '0' : '') + minutes +
                        (seconds < 10 ? ':0' : ':') + seconds;
}

/**
 * Draws the stats about the stack next to the tetrion.
 */
function statisticsStack() {
  statsPiece.innerHTML = piecesSet;

  if(gametype === 0)
    statsLines.innerHTML = lineLimit - lines;
  else if(gametype === 1)
    statsLines.innerHTML = lines;
  else if (gametype === 3){
    if (gameparams["digOffset"] || gameparams["digOffset"] !== 0)
      statsLines.innerHTML = '<span style="font-size: 0.5em">' + gameparams["digOffset"]
        + "+</span><br />" + lines;
        // /* farter */
    else
      statsLines.innerHTML = lines;
  }
}
// ========================== View ============================================

/**
 * Draws grid in background.
 */
function bg(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#1c1c1c';
  for (var x = -1; x < ctx.canvas.width + 1; x += cellSize) {
    ctx.fillRect(x, 0, 2, ctx.canvas.height);
  }
  for (var y = -1; y < ctx.canvas.height + 1; y += cellSize) {
    ctx.fillRect(0, y, ctx.canvas.width, 2);
  }
}

/**
 * Draws a pre-rendered mino.
 */
function drawCell(x, y, color, ctx, darkness) {
  x = x * cellSize;
  x = ~~x;
  y = ~~y * cellSize - 2 * cellSize;
  ctx.drawImage(spriteCanvas, color * cellSize, 0, cellSize, cellSize, x, y, cellSize, cellSize);
  if (darkness !== void 0) {
    //ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0,0,0,' + darkness + ')';
    ctx.fillRect(x, y, cellSize, cellSize);
    //ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Pre-renders all mino types in all colors.
 */
function makeSprite() {
  var shaded = [
    // 0         +10        -10        -20
    ['#c1c1c1', '#dddddd', '#a6a6a6', '#8b8b8b'],
    ['#25bb9b', '#4cd7b6', '#009f81', '#008568'],
    ['#3397d9', '#57b1f6', '#007dbd', '#0064a2'],
    ['#e67e23', '#ff993f', '#c86400', '#a94b00'],
    ['#efc30f', '#ffdf3a', '#d1a800', '#b38e00'],
    ['#9ccd38', '#b9e955', '#81b214', '#659700'],
    ['#9c5ab8', '#b873d4', '#81409d', '#672782'],
    ['#e64b3c', '#ff6853', '#c62c25', '#a70010'],
    ['#898989', '#a3a3a3', '#6f6f6f', '#575757']
  ];
  var glossy = [
    //25         37         52         -21        -45
    ['#ffffff', '#ffffff', '#ffffff', '#888888', '#4d4d4d'],
    ['#7bffdf', '#9fffff', '#ccffff', '#008165', '#00442e'],
    ['#6cdcff', '#93feff', '#c2ffff', '#00629f', '#002c60'],
    ['#ffc166', '#ffe386', '#ffffb0', '#aa4800', '#650500'],
    ['#ffff6a', '#ffff8c', '#ffffb8', '#b68a00', '#714f00'],
    ['#efff81', '#ffffa2', '#ffffcd', '#6b9200', '#2c5600'],
    ['#dc9dfe', '#ffbeff', '#ffe9ff', '#5d287e', '#210043'],
    ['#ff9277', '#ffb497', '#ffe0bf', '#a7000a', '#600000'],
    ['#cbcbcb', '#ededed', '#ffffff', '#545454', '#1f1f1f']
  ];
  var tgm = [
    ['#7b7b7b', '#303030', '#6b6b6b', '#363636'],
    ['#f08000', '#a00000', '#e86008', '#b00000'],
    ['#00a8f8', '#0000b0', '#0090e8', '#0020c0'],
    ['#f8a800', '#b84000', '#e89800', '#c85800'],
    ['#e8e000', '#886800', '#d8c800', '#907800'],
    ['#f828f8', '#780078', '#e020e0', '#880088'],
    ['#00e8f0', '#0070a0', '#00d0e0', '#0080a8'],
    ['#78f800', '#007800', '#58e000', '#008800'],
    ['#7b7b7b', '#303030', '#6b6b6b', '#363636'],
  ];
  var world = [];
  world[0] = tgm[0];
  world[1] = tgm[6];
  world[2] = tgm[2];
  world[3] = tgm[3];
  world[4] = tgm[4];
  world[5] = tgm[7];
  world[6] = tgm[5];
  world[7] = tgm[1];
  world[8] = tgm[8];

  spriteCanvas.width = cellSize * 9;
  spriteCanvas.height = cellSize;
  for (var i = 0; i < 9; i++) {
    var x = i * cellSize;
    if (settings.Block === 0) {
      // Shaded
      spriteCtx.fillStyle = shaded[i][1];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);

      spriteCtx.fillStyle = shaded[i][3];
      spriteCtx.fillRect(x, cellSize / 2, cellSize, cellSize / 2);

      spriteCtx.fillStyle = shaded[i][0];
      spriteCtx.beginPath();
      spriteCtx.moveTo(x, 0);
      spriteCtx.lineTo(x + cellSize / 2, cellSize / 2);
      spriteCtx.lineTo(x, cellSize);
      spriteCtx.fill();

      spriteCtx.fillStyle = shaded[i][2];
      spriteCtx.beginPath();
      spriteCtx.moveTo(x + cellSize, 0);
      spriteCtx.lineTo(x + cellSize / 2, cellSize / 2);
      spriteCtx.lineTo(x + cellSize, cellSize);
      spriteCtx.fill();
    } else if (settings.Block === 1) {
      // Flat
      spriteCtx.fillStyle = shaded[i][0];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);
    } else if (settings.Block === 2) {
      // Glossy
      var k = Math.max(~~(cellSize * 0.083), 1);

      var grad = spriteCtx.createLinearGradient(x, 0, x + cellSize, cellSize);
      grad.addColorStop(0.5, glossy[i][3]);
      grad.addColorStop(1, glossy[i][4]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x, 0, cellSize, cellSize);

      var grad = spriteCtx.createLinearGradient(x, 0, x + cellSize, cellSize);
      grad.addColorStop(0, glossy[i][2]);
      grad.addColorStop(0.5, glossy[i][1]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x, 0, cellSize - k, cellSize - k);

      var grad = spriteCtx.createLinearGradient(x + k, k, x + cellSize - k, cellSize - k);
      grad.addColorStop(0, shaded[i][0]);
      grad.addColorStop(0.5, glossy[i][0]);
      grad.addColorStop(0.5, shaded[i][0]);
      grad.addColorStop(1, glossy[i][0]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x + k, k, cellSize - k * 2, cellSize - k * 2);

    } else if (settings.Block === 3 || settings.Block === 4) {
      // Arika
      if (settings.Block === 4) tgm = world;
      var k = Math.max(~~(cellSize * 0.125), 1);

      spriteCtx.fillStyle = tgm[i][1];
      spriteCtx.fillRect(x, 0, cellSize, cellSize);
      spriteCtx.fillStyle = tgm[i][0];
      spriteCtx.fillRect(x, 0, cellSize, ~~(cellSize / 2));

      var grad = spriteCtx.createLinearGradient(x, k, x, cellSize - k);
      grad.addColorStop(0, tgm[i][2]);
      grad.addColorStop(1, tgm[i][3]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x + k, k, cellSize - k*2, cellSize - k*2);

      var grad = spriteCtx.createLinearGradient(x, k, x, cellSize);
      grad.addColorStop(0, tgm[i][0]);
      grad.addColorStop(1, tgm[i][3]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x, k, k, cellSize - k);

      var grad = spriteCtx.createLinearGradient(x, 0, x, cellSize - k);
      grad.addColorStop(0, tgm[i][2]);
      grad.addColorStop(1, tgm[i][1]);
      spriteCtx.fillStyle = grad;
      spriteCtx.fillRect(x + cellSize - k, 0, k, cellSize - k);
    }
  }
}

/**
 * Clear canvas.
 */
function clear(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws a 2d array of minos.
 */
function draw(tetro, cx, cy, ctx, color, darkness) {
  for (var x = 0, len = tetro.length; x < len; x++) {
    for (var y = 0, wid = tetro[x].length; y < wid; y++) {
      if (tetro[x][y]) {
        drawCell(x + cx, y + cy, color !== void 0 ? color : tetro[x][y], ctx, darkness);
      }
    }
  }
}

// ========================== Controller ======================================

function keyUpDown(e) {
  // TODO send to menu or game depending on context.
  if ([32,37,38,39,40].indexOf(e.keyCode) !== -1)
    e.preventDefault();
  //TODO if active, prevent default for binded keys
  //if (bindsArr.indexOf(e.keyCode) !== -1)
  //  e.preventDefault();
  if (e.type === "keydown" && e.keyCode === binds.pause) {
    if (paused) {
      unpause();
    } else {
      pause();
    }
  }
  if (e.type === "keydown" && e.keyCode === binds.retry) {
    init(gametype,gameparams);
  }
  if (!watchingReplay) {
    if (e.type === "keydown") {
      if (e.keyCode === binds.moveLeft) {
        keysDown |= flags.moveLeft;
        //piece.finesse++
      } else if (e.keyCode === binds.moveRight) {
        keysDown |= flags.moveRight;
      } else if (e.keyCode === binds.moveDown) {
        keysDown |= flags.moveDown;
      } else if (e.keyCode === binds.hardDrop) {
        keysDown |= flags.hardDrop;
      } else if (e.keyCode === binds.rotRight) {
        keysDown |= flags.rotRight;
      } else if (e.keyCode === binds.rotLeft) {
        keysDown |= flags.rotLeft;
      } else if (e.keyCode === binds.rot180) {
        keysDown |= flags.rot180;
      } else if (e.keyCode === binds.holdPiece) {
        keysDown |= flags.holdPiece;
      }
    }
    else if (e.type === "keyup")
    {
      if (e.keyCode === binds.moveLeft && keysDown & flags.moveLeft) {
        keysDown ^= flags.moveLeft;
      } else if (e.keyCode === binds.moveRight && keysDown & flags.moveRight) {
        keysDown ^= flags.moveRight;
      } else if (e.keyCode === binds.moveDown && keysDown & flags.moveDown) {
        keysDown ^= flags.moveDown;
      } else if (e.keyCode === binds.hardDrop && keysDown & flags.hardDrop) {
        keysDown ^= flags.hardDrop;
      } else if (e.keyCode === binds.rotRight && keysDown & flags.rotRight) {
        keysDown ^= flags.rotRight;
      } else if (e.keyCode === binds.rotLeft && keysDown & flags.rotLeft) {
        keysDown ^= flags.rotLeft;
      } else if (e.keyCode === binds.rot180 && keysDown & flags.rot180) {
        keysDown ^= flags.rot180;
      } else if (e.keyCode === binds.holdPiece && keysDown & flags.holdPiece) {
        keysDown ^= flags.holdPiece;
      }
    }
  }
}
addEventListener('keydown', keyUpDown, false);
addEventListener('keyup', keyUpDown, false);

function touch(e)
{
  var winH = window.innerHeight, winW = window.innerWidth;
  //if (e.type==="touchmove")
    //e.preventDefault();
  if (e.type === "touchstart" || e.type === "touchmove" || e.type === "touchend") {
    for (var i in binds)
      keyUpDown({
        type: "keyup",
        keyCode: binds[i],
        preventDefault: function(){}
      });
    for (var i = 0, l = e.touches.length; i < l; i++) {
  /*
    //fails when dragged
      if (e.touches[i].target) {
        if (e.touches[i].target.hasOwnProperty("bindsMemberName")) {
          keyUpDown({
            type: "keydown",
            keyCode: binds[e.touches[i].target.bindsMemberName],
            preventDefault: function(){}
          });
          e.preventDefault();
        }
      }
  */
      var tX = e.touches[i].pageX, tY = e.touches[i].pageY;
      for (var j in touchButtons) {
        var oRef = touchButtons[j];
        if (tX>=oRef.offsetLeft && tX<oRef.offsetLeft+oRef.offsetWidth &&
          tY>=oRef.offsetTop && tY<oRef.offsetTop+oRef.offsetHeight) {
          keyUpDown({
            type: "keydown",
            keyCode: binds[oRef.bindsMemberName],
            preventDefault: function(){}
          });
          e.preventDefault();
        }
      }
    }
  }
  if ((e.type === "touchstart" || e.type === "click") && e.target === touchLayout) {
    if (currLayout === -1) {
      currLayout = 0;
    }
    else {
      currLayout++;
      if (currLayout === nLayouts) {
        currLayout = -1;
      }
    }
    resize();
  }
}

function preventDefault(e) {
  e.preventDefault();
}
document.addEventListener('touchstart',touch, false);
document.addEventListener('touchmove',touch, false);
document.addEventListener('touchend',touch, false);
document.addEventListener('click',touch, false);

document.addEventListener('gesturestart',preventDefault,false);
document.addEventListener('gestureend',preventDefault,false);
document.addEventListener('gesturechange',preventDefault,false);
    
// ========================== Loop ============================================

//TODO Cleanup gameloop and update.
/**
 * Runs every frame.
 */
function update() {
  //TODO Das preservation broken.
  if (lastKeys !== keysDown && !watchingReplay) {
    replayKeys[frame] = keysDown;
  } else if (frame in replayKeys) {
    keysDown = replayKeys[frame];
  }
/*
  if (piece.dead) {
    piece.new(preview.next());
  }
*/
    
  if (!(lastKeys & flags.holdPiece) && flags.holdPiece & keysDown) {
    piece.hold();
  }

  if (flags.rotLeft & keysDown && !(lastKeys & flags.rotLeft)) {
    piece.rotate(-1);
    piece.finesse++;
  } else if (flags.rotRight & keysDown && !(lastKeys & flags.rotRight)) {
    piece.rotate(1);
    piece.finesse++;
  } else if (flags.rot180 & keysDown && !(lastKeys & flags.rot180)) {
    piece.rotate(1);
    piece.rotate(1);
    piece.finesse++;
  }

  piece.checkShift();

  if (flags.moveDown & keysDown) {
    piece.shiftDown();
    //piece.finesse++;
  }
  if (!(lastKeys & flags.hardDrop) && flags.hardDrop & keysDown) {
    piece.hardDrop();
  }

  piece.update();

  if(gametype === 1) { //Marathon
    var level = ~~(lines/10);
    if(level > 20)
      level = 20;
    gravity = [
      1/60, 1/30, 1/25, 1/20, 1/15, 1/12, 1/10, 1/8,  1/6,  1/6,
       1/4,  1/4,  1/3,  1/3,  1/3,  1/2,    1,   1,    2,    3,
      20
      ]
      [level];
  }
  
  if(gametype === 3) { //Dig
    var fromLastRise = frame-frameLastRise;
    var arrRow = [8,8,8,8,8,8,8,8,8,8];
    {
      var curStage = 0, objCurStage;
      while(curStage<arrStages.length && arrStages[curStage].begin <= lines + (gameparams["digOffset"] || 0)) {
        curStage++;
      }
      curStage--;
      objCurStage = arrStages[curStage];
      if(fromLastRise >= objCurStage.delay) {
        //IJLOSTZ
        var arrRainbow=[
          2,-1,1,5,4,3,7,6,-1,8,
          8,8,8,6,6,2,1,5,8,-1,
          7,7,-1,8,8];
        var idxRainbow,flagAll,colorUsed;
        idxRainbow = ~~(objCurStage.begin/100);
        flagAll = (~~(objCurStage.begin/50))%2;
        if(idxRainbow >= arrRainbow.length) {
          idxRainbow = arrRainbow.length - 1;
        }
        colorUsed = arrRainbow[idxRainbow];
        for(var x=0; x<10; x+=(flagAll===1?1:9)) {
          if(colorUsed===-1) {
            arrRow[x]=~~(rng.next()*8+1);
          } else {
            arrRow[x]=colorUsed;
          }
        }
        
        objCurStage.gen(arrRow);
        stack.rowRise(arrRow, piece);
        frameLastRise=frame;
      }
    }
  }
	
  // Win
  // TODO
  if (gametype === 0) { // 40L
    if (lines >= lineLimit) {
      gameState = 1;
      msg.innerHTML = 'GREAT!';
      menu(3);
    }
  } else if (gametype === 1) { // Marathon
    if (settings.Gravity !== 0 && lines>=200) { // not Auto, limit to 200 Lines
      gameState = 1;
      msg.innerHTML = 'GREAT!';
      menu(3);
    }
  }
  
  /* else {
    if (digLines.length === 0) {
      gameState = 1;
      msg.innerHTML = 'GREAT!';
      menu(3);
    }
  } */
  /* farter */

  statistics();

  if (lastKeys !== keysDown) {
    lastKeys = keysDown;
  }
}

function gameLoop() {

  if (!paused) {
    requestAnimFrame(gameLoop);
  }
  //setTimeout(gameLoop, 33);
  
  //TODO check to see how pause works in replays.
  frame++;

  if (gameState === 0) {
    // Playing
    
    if (!paused) {
      update();
    }

    // TODO improve this with 'dirty' flags.
    /* farter */ // as you draw for lock delay brightness gradient... give this up..
/*
    if (piece.x !== lastX ||
    Math.floor(piece.y) !== lastY ||
    piece.pos !== lastPos ||
    piece.lockDelay !== lastLockDelay ||
    piece.dirty) {
*/
      clear(activeCtx);
      piece.drawGhost();
      piece.draw();
/*
    }
    lastX = piece.x;
    lastY = Math.floor(piece.y);
    lastPos = piece.pos;
    lastLockDelay = piece.lockDelay;
    piece.dirty = false;
*/
  } else if (gameState === 2) {
    // Count Down
    if (frame < 50) {
      if (msg.innerHTML !== 'READY') msg.innerHTML = 'READY';
    } else if (frame < 100) {
      if (msg.innerHTML !== 'GO!') msg.innerHTML = 'GO!';
    } else {
      msg.innerHTML = '';
      gameState = 0;
      startTime = Date.now();
      piece.new(preview.next());
    }
    // DAS Preload
    if (lastKeys !== keysDown && !watchingReplay) {
      replayKeys[frame] = keysDown;
    } else if (frame in replayKeys) {
      keysDown = replayKeys[frame];
    }
    if (keysDown & flags.moveLeft) {
      lastKeys = keysDown;
      piece.shiftDelay = settings.DAS;
      piece.shiftReleased = false;
      piece.shiftDir = -1;
    } else if (keysDown & flags.moveRight) {
      lastKeys = keysDown;
      piece.shiftDelay = settings.DAS;
      piece.shiftReleased = false;
      piece.shiftDir = 1;
    }
  } else if (toGreyRow >= 2){
    /**
     * Fade to grey animation played when player loses.
     */
    if (toGreyRow === 21)
      clear(activeCtx);
    if (frame % 2) {
      for (var x = 0; x < 10; x++) {
         /* farter */ //WTF gamestate-1
        if (stack.grid[x][toGreyRow])
          stack.grid[x][toGreyRow] =
            (gameState === 9 ? 8 : 0);
      }
      stack.draw();
      toGreyRow--;
    }
  }
}