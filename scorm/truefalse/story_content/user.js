window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
window.Script1 = function()
{
  var x = document.getElementsByClassName("scrollarea-area");
x[0].scrollTop = 0;
var height = x[0].scrollHeight - x[0].offsetHeight;

x[0].onscroll = function(){
 var player = GetPlayer();
 player.SetVar("num",x[0].scrollTop);
};

var half1 = height/2;
var quarter1 = height/4;
var ended1 = height-15;
var player1 = GetPlayer();
player1.SetVar("half",half1);
player1.SetVar("quarter",quarter1);
player1.SetVar("ended",ended1);
player1.SetVar("height",height);
}

window.Script2 = function()
{
  var x = document.getElementsByClassName("scrollarea-area");
x[0].scrollTop = 0;
var height = x[0].scrollHeight - x[0].offsetHeight;

x[0].onscroll = function(){
 var player = GetPlayer();
 player.SetVar("num",x[0].scrollTop);
};

var half1 = height/2;
var quarter1 = height/4;
var ended1 = height-15;
var player1 = GetPlayer();
player1.SetVar("half",half1);
player1.SetVar("quarter",quarter1);
player1.SetVar("ended",ended1);
player1.SetVar("height",height);
}

window.Script3 = function()
{
  var x = document.getElementsByClassName("scrollarea-area");
x[0].scrollTop = 0;
var height = x[0].scrollHeight - x[0].offsetHeight;

x[0].onscroll = function(){
 var player = GetPlayer();
 player.SetVar("num",x[0].scrollTop);
};

var half1 = height/2;
var quarter1 = height/4;
var ended1 = height-15;
var player1 = GetPlayer();
player1.SetVar("half",half1);
player1.SetVar("quarter",quarter1);
player1.SetVar("ended",ended1);
player1.SetVar("height",height);
}

};
