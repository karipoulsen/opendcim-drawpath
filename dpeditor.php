<?php
require_once("dpcore.php");


$data=getMapsForDevice($_GET['DeviceID'],$_GET['data']);
$conf=getConfig();
$colors=array();
foreach($conf as $key=>$val)
{	
	if(substr($key,0,7)=='DPColor')
		$colors[]=$val;
}

print '<div style="background-color:#dddddd;width:100%;padding:5px"><span id="DPeditorheader"></span>';
print '<div style="padding:3px"><span id="imgcontainer">';
foreach($data['maps'] as $dev){
	$imid=sprintf("im%s",$dev['id']);
	$name=$data['images'][$dev['id']]['name'];
	printf("<span class=\"simg\"><input type=\"radio\" name=\"selimage\" id=\"%s\"/><label for=\"%s\">%s</label></span>",$imid,$imid,$name);
}
print '</span>';
$sel='<select id="colorselect" style="margin-left:20px">';
foreach($colors as $c){
	$cc=explode('|',$c);
	$sel .= sprintf("<option value=\"%s\">%s</option>",$cc[1],$cc[0]);
}
print $sel . '</select>';
print '<button id="mapselect" style="height:22px;margin-left:20px;padding-top:0px;padding-bottom:0px;line-height:8px">Drawings..</button>';
print '</div></div>';
$img='';
if(count($data['maps'])>0)
	$img = sprintf("background-image: url('%s');",$data['images'][$data['maps'][0]['id']]['image']);
printf("<div id=\"editpane\" style=\"%s background-repeat:no-repeat; width:%spx;height:%spx;position:relative\" >",
	$img,$data['maxw'],$data['maxh']);

printf("<canvas id=\"DPCanvas\" style=\"width:%spx;height:%spx;position:relative\" width=\"%s\" height=\"%s\"></canvas>",
	$data['maxw'],$data['maxh'],$data['maxw'],$data['maxh']);
print '<div id="editrect"></div><div id="editrecthandle"></div>';
printf("<script>var _mapdata=%s;\n</script>\n",json_encode($data));
print '</div>';
print '<div id="mapdrawingdialog" style="display:none;">';
print '<table style="margin-left:auto;margin-right:auto"><tr><td>Active</td><td>Name</td><td>Master</td></tr>';
foreach($data['images'] as $key=>$img)
{
	printf("<tr id=\"%s\"><td><input type=\"checkbox\"/></td><td>%s</td><td><input type=\"radio\" name=\"mst\" /></td></tr>",
		$key,$img['name']);
}
print '</table></div>';
?>
<!--  toolbox thingie disabled for now.. 
<div id="toolbox"><div class="header" >Toolbox</div>
<div id="masteredit">
<div><label for="shiftX">Shift horz.</label>
<button id="shiftLeft" class="btn-ud"><img src="/css/minus.gif" /></button>
<input type="number" id="shiftX" min="1" max="20" value="5" />
<button id="shiftRight" class="btn-ud"><img src="/css/plus.gif" /></button></div>
<div><label for="shiftY">Shift vert.</label>
<button id="shiftUp" class="btn-ud"><img src="/css/minus.gif" /></button>
<input type="number" id="shiftY" min="1" max="20" value="5" />
<button id="shiftDown" class="btn-ud"><img src="/css/plus.gif" /></button></div>

<div><label for="shiftX">Snap</label>
<input type="number" id="snapXY" min="4" max="40" step="4" value="12" />
<button id="snapX" class="btn-ud">X</button>
<button id="snapY" class="btn-ud">Y</button></div>
<button id="test">test</button>
	</div>
<div id="slaveedit">
<div><label for="offsetX">Offset X:</label>
<input type="number" id="offsetX" value="0"/></div>
<div><label for="offsetY">Offset Y:</label>
<input type="number" id="offsetY" value="0"/></div>

<div><label for="scale">Scale: </label>
<input type="number" id="scale" step="0.1" value="1.0" max="2.0" min="0.1" /></div>

</div></div>
-->
<style>
.editpoint{
 	position:absolute;
	width:12px;
	height:12px;
	border:1px solid black;
	border-radius:3px;
	background-color:rgba(255,216,0,0.7);
}
.editpoint:nth-child(5)
{
	background-color:rgba(0,160,0,0.7);
}
.simg{
	border:1px inset gray;
	margin:2px;
	padding:3px;
	
}
.simgsel
{
	background-color:gray;
}
/*
#toolbox{
	width:211px;
	height:93px;
	border:1px solid black;
	background-color: rgba(200,200,200,0.8);
	position:absolute;
	top:150px;
	left:100px;
	padding:4px;
	display:none;
}
#masteredit input {
	width:33px;
}

#slaveedit input{
	width:70px;
}

#toolbox label{
	width:100px;
	display:inline-block;
}
#toolbox .header{
	font-weight:bold;
	background-color: rgba(100,100,100,0.5);
	padding:4px;
}
.btn-ud{
	height:22px;
	width:25px;
	padding:0px;
}*/
#mapdrawingdialog td:nth-child(1){
	width:70px;
	text-align:center;
}
#mapdrawingdialog td:nth-child(3){
	width:70px;
	text-align:center;
}
#editrect{
	background-color:rgba(0,0,250,0.07);
	border: 1px dashed gray;	
	position:absolute;
	cursor:all-scroll;
	position:absolute;
}
#editrecthandle{
	background-color:red;
	border: 1px solid black;
	position:absolute;
	width:14px;
	height:14px;
	border-radius:6px;
	cursor:nw-resize;
}

</style> 
