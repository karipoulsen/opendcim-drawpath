/*
 * DrawPath global JS include file
 * see README.html
 */

//console.log('DrawPath extension loaded..');

// change this if installation directory differs from default
var IDIR = 'kvf-extension/';
var _RPC = 'drawpath.php';
var MAP = 'dpeditor.php';
var RPC = IDIR + _RPC;

// captions
var EditCaption = "Edit Path..";
var EditorTitle = "DrawPath - Edit device cable path - ";
var EditorHeader = "Shift-click on image to add point. Ctrl-click on point to delete, first point (green) is device position.";
var EditorOkBtn = "OK";
var EditorCancelBtn = "Cancel";
var EditorSelectDrawing = "Select drawings to use for this device";
var ConfigurationCA="Select custom attribute to store map settings.";

// other stuff
var EditorPointSize = 12;  // how big is the dragging handle for point operations.
var PathMinWidth=2;
var PathMaxWidth=14;
// Main entry point for DrawPath
$(document).ready(function(){
	//console.log('DrawPath init..');
	if(window.location.pathname.indexOf('container_stats')!=-1){
	//	console.log('container view');
		setupContainer();
	}
	if(window.location.pathname.indexOf('dc_stats')!=-1){
	//	console.log('datacenter view');
		setupDataCenter();
	}
	if(window.location.pathname.indexOf('configuration')!=-1){
	//	console.log('configuration view');
		setupConfiguration();
	}
	if(window.location.pathname.indexOf('devices')!=-1){
	//	console.log('device view');
		$.ajax({
			url:RPC,
			type:'post',
			data:{rpc:'devicesetup'},
			dataType:'json',
			success:function(result){
				var x=document.getElementById('customvalue[' + result + ']');
				if(x!=undefined)
					setupDevice($(x));
			}
		});
	}
});

/*
 *********************************************************************************************
                               EDITOR LOGIC
 *********************************************************************************************
*/


function setupDevice(editfield)
{
	$(editfield).parent().append('<button style="margin-left:4px;" type="button" id="c_editbutton">' + EditCaption + '</button>');
	$('body').append('<div id="editdialog" style="display:none"></div>');
	$('#c_editbutton').click(function(){
		//console.log(editfield.val());
		$('#editdialog').load(IDIR + MAP + window.location.search + '&data=' + encodeURI(editfield.val()),function()
		{
			console.log(_mapdata);
			EditorPointOffset=Math.floor(EditorPointSize / 2);
			$('#DPeditorheader').html(EditorHeader);
			var imw=$('#editpane').width();
			var imh=$('#editpane').height();
			$('#editdialog').dialog('option','width',parseInt(imw)+30);
			$('#editdialog').dialog('option','height',parseInt(imh)+100);
			var tit=$('#editdialog').dialog('option','title');
			$('#editdialog').dialog('option','title',tit + _mapdata.label);
			$('.simg input').click(mapEditSelectImage);
			$('#colorselect').val(_mapdata.color);
			$('#colorselect').change(function(){mapEditDraw();});
			mapEditDraw();
			mapEditControls();
			$('#editrect').draggable({drag:mapEditDragRect});
			$('#editrecthandle').draggable({drag:mapEditResizeRect});
			$('#editdialog canvas').click(function(ev){
				var p=getMap();
				mapEditNewPoint(ev,p.offX,p.offY);
			});
			$('#editrect').click(function(ev){
				mapEditNewPoint(ev,0,0);
			});
			$('#mapselect').click(mapEditSelectDrawings);
			if($('.simg').length>0)
				$($('.simg input')[0]).click();
			else{
				$('#slaveedit').hide();
				$('#mapselect').click();
			}
		});
		$('#editdialog').dialog({
			modal:true,
			title:EditorTitle,
			draggable:false,
			width:400,
			buttons:[
			{text:EditorOkBtn,click:function(){
				var nob=$('#colorselect').val() + ';';
				var cc='';
				console.log(_mapdata.coords.toString());
				for(var i=0;i<_mapdata.coords.length;i++)
					cc += ',' + Math.floor(_mapdata.coords[i]);
				nob+=cc.substr(1);
				var m=_mapdata.maps;
				for(var i=0;i<m.length;i++)
					nob += ';' +m[i].id +','+ m[i].master + ','+ m[i].offX +','+ m[i].offY +','+ m[i].scale;
				$(editfield).val(nob);
				$(this).dialog('close');
				}},
			{text:EditorCancelBtn,click:function(){$(this).dialog('close');}}
			]
		});
	});
}

// brings up a dialog showing all drawings in the system, i.e. for all DataCenters and Containers that have a drawing attached
// User must select one or more drawings, and decide that one drawing is to be the master
function mapEditSelectDrawings()
{
	
	var cn = $('#mapdrawingdialog div');
	for(var i=0;i<_mapdata.maps.length;i++)
	{
		var isMaster=(_mapdata.maps[i].master==1);
		var id=_mapdata.maps[i].id;	
		var row=$('#mapdrawingdialog #' + id);
		$(row[0].cells[0]).children().first().attr('checked','checked');
		if(isMaster)
			$(row[0].cells[2]).children().first().attr('checked','checked');
	}
	$('#mapdrawingdialog').dialog({
		modal:true,
		title:EditorSelectDrawing,
		width:360,
		draggable:false,
		buttons:[
		{text:EditorOkBtn,click:function(){
			var tb=$('#mapdrawingdialog tr');
			var nn=new Array();
			for(var i=1;i<tb.length;i++)
			{
				var did=$(tb[i]).attr('id');
				var isMaster=($(tb[i].cells[2]).children().first()[0].checked);
				if($(tb[i].cells[0]).children().first()[0].checked){
					nn.push({id:did,master:isMaster?1:0});
				}
			}
			// mark all maps for deletion
			for(var i=0;i<_mapdata.maps.length;i++)
				_mapdata.maps[i].remap=false;
			if(nn.length>0){
				// keep those who are in the array, create new if needed
				for(var i=0;i<nn.length;i++){
					var found=-1;
					for(var j=0;j<_mapdata.maps.length;j++){
						if(_mapdata.maps[j].id==nn[i].id){
							found=i;
							_mapdata.maps[j].remap=true;
							_mapdata.maps[j].master=nn[i].master;
						}
					}
					if(found==-1)
						_mapdata.maps.push({id:nn[i].id,master:nn[i].master,offX:0,offY:0,scale:1.0,remap:true});
				}
			}
			// delete from _mapdata.maps if not checked
			var i=0;
			while(i<_mapdata.maps.length){
				if(_mapdata.maps[i].remap) 
					i++;
				else
					_mapdata.maps.splice(i,1);
			}
			// check for master.. if found, move to first position, otherwise just select first to be master
			if(_mapdata.maps.length>1){
				for(var i=1;i<_mapdata.maps.length;i++){
					if(_mapdata.maps[i].master==1){
						var tm=_mapdata.maps[0];
						_mapdata.maps[0]=_mapdata.maps[i];
						_mapdata.maps[i]=tm;
						break;
					}
				}
			}
			_mapdata.maps[0].master=1;
			// rebuild UI part for selecting drawings
			$('.simg').remove();
			for(var i=0;i<_mapdata.maps.length;i++){
				var did=_mapdata.maps[i].id;
				var im='<span class="simg"><input type="radio" name="selimage" id="im' + did +'">';
				im +='<label for="im' + did + '">' + _mapdata.images[did].name + '</label></span>';
				$("#imgcontainer").append(im);
			}
			$('.simg input').click(mapEditSelectImage);
			if($('.simg input').length>0)
				$($('.simg input')[0]).click();  // select master drawing
                        $(this).dialog('close');
			}},
			{text:EditorCancelBtn,click:function(){ $(this).dialog('close');}}
			]
		});
}


var _currentMap=null;
function getMap(){ return _currentMap;}

function mapEditSelectImage()
{
	var idx=$(this).attr('id').substr(2);
	$('#editpane').css('background-image','url(' + _mapdata.images[idx].image + ')');
	$('.simg').removeClass('simgsel');
	$(this).parent().addClass('simgsel');
	_lastImageIdx=idx;
	for(var i=0;i<_mapdata.maps.length;i++){
		if(_mapdata.maps[i].id==idx)
			_currentMap=_mapdata.maps[i];
	}
	var p=getMap();
	if(p.master==1)
	{
		p.scale=1.0;
		$('#editrecthandle').css('cursor','nw-resize');
		$('.editpoint').show();
	}else{
		$('#editrecthandle').css('cursor','e-resize');
		$('.editpoint').hide();
	}
	mapEditDraw();
	mapEditControls();
}

// not exposed to UI at this point.. maybe later
function mapEditSnap()
{
	var id=$(this).attr('id');
	var val = parseInt($('#snapXY').val());
	var v2 = val /2;
	var Horz=(id=='snapX');
	for(var i=0;i<_mapdata.coords.length;i+=2)
        {
		if(Horz){
			var x=_mapdata.coords[i] % val;
			if(x>v2)
				_mapdata.coords[i] +=x;
			else
				_mapdata.coords[i] -=x;
		}else{
			var y=_mapdata.coords[i+1] % val;
			if(y>v2)
				_mapdata.coords[i+1] +=y;
			else
				_mapdata.coords[i+1] -=y;
		}
        }
	mapEditDraw();
	mapEditControls();
}

function mapEditNewPoint(ev,offX,offY)
{
	if(!ev.shiftKey) return;
	var id=_mapdata.coords.length;
	var p=getMap();
	if(p==null) return;
	if(p.master==0) return;
	var x=ev.offsetX-offX;
	var y=ev.offsetY-offY;
	_mapdata.coords.push(x);
	_mapdata.coords.push(y);
	mapEditAddControlPoint(id,x,y);
	mapEditDraw();
	mapEditStopDragPoint();
}

function mapEditAddControlPoint(id,x,y)
{
	var pane='#editpane';
	var p=getMap();
	if(p==null) return;
	var rx=x - EditorPointOffset + p.offX;
	var ry=y - EditorPointOffset + p.offY;
	var dim=EditorPointOffset *2;
	$(pane).append('<div id="ed' + id +'" class="editpoint" style="left:'+rx+'px; top:'+ry+'px;width:'+dim +'px;height:'+dim +'px"></div');
	$('#ed' + id).draggable({drag:mapEditDragPoint});
	$('#ed' + id).on('dragstop',mapEditStopDragPoint);
	$('#ed' + id).click(mapEditClickPoint);
}

function mapEditControls()
{
	var p=getMap();
	if(p==null) return;
	var M=_mapdata.coords;
	if($('.editpoint').length==0){
		for(var i=0;i<M.length;i+=2){
			mapEditAddControlPoint(i,M[i],M[i+1]);
		}
	}else{
		for(var i=0;i<M.length;i+=2){
			$('#ed' + i).css('left',M[i]-EditorPointOffset+p.offX);
			$('#ed' + i).css('top',M[i+1]-EditorPointOffset+p.offY);
		}
	}
}
function mapEditDragPoint()
{
	//console.log($(this));
	var pos=$(this).position();
	var id=parseInt($(this).attr('id').substr(2));
	var p=getMap();
	_mapdata.coords[id]=pos.left+EditorPointOffset - p.offX;
	_mapdata.coords[id+1]=pos.top+EditorPointOffset - p.offY;
	mapEditDraw(true);
	//console.log(pos);
}
function mapEditDragRect(){
	//console.log($(this));
	var pos=$(this).position();
	var p=getMap();
	p.offX=pos.left;
	p.offY=pos.top;
	mapEditDraw();
	mapEditControls();
}

function mapEditResizeRect(){
//	console.log($(this));
	var p=getMap();
	var dim=mapEditGetRect();
	var pos=$(this).position();
	var facw = (pos.left-p.offX) /dim.width
	var fach = (pos.top-p.offY)/dim.height;
	if(p.master==1){
		for(var i=0;i<_mapdata.coords.length;i+=2)
		{
			_mapdata.coords[i]=_mapdata.coords[i] * facw;
			_mapdata.coords[i+1] = _mapdata.coords[i+1] * fach;
		}
	}else
		p.scale=facw;

	mapEditDraw();
	mapEditControls();
}

function mapEditClickPoint(ev)
{
	if(!ev.ctrlKey) return;
	var id=$(ev.currentTarget).attr('id');
	$(ev.currentTarget).remove();
	id = parseInt(id.substr(2));
	_mapdata.coords.splice(id,2);
	mapEditDraw();
	mapEditStopDragPoint();
}
function mapEditGetRect()
{
	var mx=9000;
	var my=9000;
	var mw=0;
	var mh=0;
	for(var i=0;i<_mapdata.coords.length;i+=2)
	{
		mx = Math.min(mx,_mapdata.coords[i]);
		my = Math.min(my,_mapdata.coords[i+1]);
		mw = Math.max(mw,_mapdata.coords[i]);
		mh = Math.max(mh,_mapdata.coords[i+1]);
	}
	return {left:mx,top:my,width:mw,height:mh}
}

function mapEditStopDragPoint()
{
	var p=getMap();
	var dim=mapEditGetRect();
	p.offX+=dim.left;
	p.offY+=dim.top;
	for(var i=0*2;i<_mapdata.coords.length;i+=2){
		_mapdata.coords[i]-=dim.left;
		_mapdata.coords[i+1]-=dim.top;
	}
	mapEditDraw();
	mapEditControls();
}
function mapEditMakeRect()
{
	var dim=mapEditGetRect();
	var p=getMap();
	var me='#editrect';
	$(me).css('left',p.offX+'px');
	$(me).css('top',p.offY +'px');
	$(me).css('width',dim.width*p.scale +'px');
	$(me).css('height',dim.height*p.scale +'px');
	$('#editrecthandle').css('left',(p.offX + dim.width*p.scale ) +'px');
	$('#editrecthandle').css('top', (p.offY + dim.height*p.scale) + 'px');
}

function mapEditDraw()
{
	var p=getMap();
	if(p==null) return;
	var mcan=$('#DPCanvas')[0];
	var can=mcan.getContext('2d');
	can.save();
	can.clearRect(0,0, mcan.width, mcan.height);
	var port = Math.max(_mapdata.ports,PathMinWidth);
	can.lineWidth=Math.min(port,PathMaxWidth);
	can.strokeStyle=$('#colorselect').val();
	can.lineJoin='round';
	can.beginPath();
	var M=_mapdata.coords;
	can.moveTo( M[0]*p.scale +p.offX,M[1]*p.scale + p.offY);
	for(var i=2;i<M.length;i+=2)
		can.lineTo(M[i]*p.scale+p.offX,M[i+1]*p.scale + p.offY);
	can.stroke();
	can.restore();
	mapEditMakeRect();
}


/*
  **************************************************************************************
				CONFIGURATION bits
  **************************************************************************************
*/

var newdelete=new Array();
function setupConfiguration()
{

	// If we have pending updates, we must wait for the regular Update function to finish
	// ..we are using the system's database handle, so we risk errors if we don't wait
	$(document).ajaxComplete(function(event,xhr,settings){
		if(settings.url.indexOf('configuration.php')>0 && settings.data.indexOf('Version')==0){
			//console.log('intercept ajax Update response');
			if(newdelete.length>0){
				$.ajax({
					url:RPC,
					type:'post',
					data:{rpc:'configwriter',payload:newdelete},
					dataType:'json',
					success:function(result){
				        	console.log(result);
						for(var i=0;i<result.length;i++)
						{
							if(result[i].operation=='new'){
								var img=$('#' + result[i].id).parent().prev().children().first();
								console.log(img);
								$(img).attr('src','images/del.gif');
								$(img).attr('title','Delete row');
								$(img).click(deleteColorRow);
								addColorRow();
							}
						}
					}
				});
			}
		}
	});

	//console.log($('#configtabs > ul'));
	var menu = $('#configtabs > ul');
	// clone a tab element, modify attributes
	var tx=$($(menu).children()[1]).clone();
	$(tx).children().text('DrawPath');
	$(tx).children().attr('href','#drawpath');
	// insert into tab, after Custom Device Attributes
	$('a[href="#dca"]').parent().after(tx);
	// clone a tab div, and modify contents
	var frm= $('#dca').clone();
	$(frm).html('<h3>DrawPath Settings</h3>');
	$(frm).attr('id','drawpath');
	$('#configtabs').tabs('refresh');
	$('#configtabs').append(frm);
	var dca=$('#customattrs > div');
	var sel='<div>' + ConfigurationCA + '</div><div><select id="DPCustomAttributeId" name="DPCustomAttributeId">';
	for(var i=1;i<dca.length-1;i++)
	{
		var n=$(dca[i]).children()[1];
		var cap=$(n).children().val();
		var id=$(n).children().attr('data');
		sel +='<option value="' + id + '">' + cap + '</option>';
	}
	sel +='</select></div>';
	$(frm).append('<div class="table" id="DPdca">' + sel + '</div><h3>Colors</h3>');

	$.ajax({
		url:RPC,
		type:'post',
		data:{rpc:'config'},
		dataType:'json',
                success:function(result){
			//console.log(result);
			$('#DPCustomAttributeId option[value=' + result.DBCustomAttributeId).attr('selected','selected');
			var tab='<div><div></div><div>Caption</div><div>Color</div></div>';
			
			for(var prop in result)
			{
				if(prop.indexOf('DPColor')==0)
				{
					var id=prop.substr(7);
					var p=result[prop].split('|');
					var col=(p.length>1)?p[1]:'';
					tab +='<div><div><img src="images/del.gif" title=\"Delete row\" /></div>';
					tab +='<div><input type="hidden" id="' + prop + '" name="' + prop + '" value="' + result[prop] + '" />';
					tab +='<input type="text" id="w1' + prop + '" value="' + p[0] + '" data-s="u" /></div>';
					tab +='<div><input type="text" id="w2' + prop + '" value="' + col + '" /></div>';
					tab +='</div>';
				}
			}
			$('#drawpath').append('<div class="table" id="DPColors">' + tab + '</div>');
			$('#DPColors img').click(deleteColorRow);
			addColorRow();
		}
	});
	$('button[value="Update"]').click(function(){
		newdelete=new Array();
		$('input[id^="DPColor"]').each(function(){
			console.log(this);
			var ch1=$('#w1'+$(this).attr('id'));
			var ch2=$('#w2'+$(this).attr('id'));
			var dt = $(ch1).attr('data-s');
			var v1=$(ch1).val().trim();
 			var v2=$(ch2).val().trim();
			if(dt=='u'){
				if(v1!='' && v2!='')
					$(this).val($(ch1).val() +'|' + $(ch2).val());
				else
					$(this).val('');
			}
			// current openDCIM config object does not support insert & delete operations, have to make our own
			// the ajaxComplete listener dispatches the operations after the regular update.
			if(dt=='n'){
				if(v1!='' && v2!=''){
					newdelete.push({operation:'new',id:$(this).attr('id'),value:v1 + '|' + v2});
					console.log('push');
				}
			}
			if(dt=='d')
				newdelete.push({operation:'delete',id:$(this).attr('id'),value:$(this).val()});
		});
	});

}

function deleteColorRow()
{
	console.log($(this));
	$(this).parent().parent().css('display','none');
	$(this).parent().next().children().first().next().attr('data-s','d');
}

function addColorRow()
{
	//console.log($('#DPColors > div'));
	var cols=$('#DPColors > div');
	if(cols.length==0)
		var nid='DPColor01';
	else{
		var row=$(cols[cols.length-1]);
		var id=$(row).children().first().next().children().first().attr('id').substr(7);
		var iid=parseInt(id) + 1;
		var nid='DPColor' + ('0' + iid.toString()).substr(-2,2);
	}
	var tab='<div><div><img src="images/add.gif\" title=\"Add row\" /></div>';
	tab +='<div><input type="hidden" id="' + nid + '" value="" />';
	tab +='<input type="text" id="w1' + nid + '" value="" data-s="n"/></div>';
	tab +='<div><input type="text" id="w2' + nid + '" value="" /></div>';
	tab +='</div>';
	$('#DPColors').append(tab);
	$('#' + nid).parent().prev().children().first().click(function(){addColorRow();});
}

/*
  *********************************************************************************************
				CONTAINER AND DATACENTER CANVAS DRAWING
  *********************************************************************************************
*/

var _data=null;

function setupContainer()
{
	var im=$('.JMGA img');
	var wi=$(im[0]).width();
	var he=$(im[0]).height();
	$(im[0]).css('display','none');
	var p=$(im[0]).parent();
	$(p).css('width',wi + 'px');
	$(p).css('height',he +'px');
	$(p).css('background-image',"url('" + $(im[0]).attr('src') + "')"); 
	$(p).children().css('z-index','1');
	$(p).append('<map id="dpmap" style="z-index:1">');
	$(p).append('<canvas id="DPCanvas" width="'+wi+'" height="' + he + '" style="position:absolute;z-index:0"/>');
	
	loadData($('.JMGA > div'),';z-index:1');
}

function loadData(containerImage,zindex)
{
	if(_data!=null) return;
	_data=1;
	var style='<style> .dpanchor{position:absolute;width:14px;height:14px;border-radius:4px;border: 1px solid grey}</style>';
	$('body').append(style);
	$.ajax({
		url:RPC,
		type:'post',
		data:{rpc:'load',id:window.location.search.substr(1)},
		dataType:'json',
		success:function(result){
			//console.log(result);
			_data=result;
			for(var i=0;i<_data.length;i++)
			{
				var cx = _data[i].coords[0]*_data[i].scale + _data[i].offX -7;
				var cy = _data[i].coords[1]*_data[i].scale + _data[i].offY -7;
				var map = cx + ',' + cy + ',' + (cx +16) + ',' + (cy+16);
				var dev = _data[i].device;
				var lab = _data[i].label;
				var cid = 'dpa' + i;
				var nstr ='<div style="left:' +cx +'px;top:'+cy+'px;background-color:' + _data[i].color + zindex + '" class="dpanchor">';
				nstr +='<a href="devices.php?DeviceID=' + dev + '" title="' + lab + '" id="' + cid + '" style="width:100%;height:100%;display:block"></a></div>';
				$(containerImage).append(nstr);
				$('.dpanchor').hover(hoverIn,hoverOut);
				drawCoords();
			}
		}
	});
}

function drawCoords()
{
	if(_data==null) return;
	if(_data==1) return;
	var mcan=$('#DPCanvas')[0];
        var can=mcan.getContext('2d');
	can.clearRect(0,0, mcan.width, mcan.height);
	for(var i=0;i<_data.length;i++)
	{
		drawOne(can,_data[i],false);
	}
}


function drawOne(can,data,selected)
{
	var port=Math.max(data.ports,PathMinWidth);
	port = Math.min(port,PathMaxWidth);
	can.save;
	if(selected){
		can.lineWidth= port+3;
		can.strokeStyle = data.color
		can.shadowOffsetX=5;
		can.shadowOffsetY=5;
		can.shadowBlur=12;
		can.shadowColor='rgba(0,0,0,0.6';
	}else{
		can.shadowColor='rgba(0,0,0,0)';
		can.lineWidth=port;
		can.strokeStyle= data.color;
	}
	can.lineJoin='round';
	can.beginPath();
	can.moveTo(data.coords[0]*data.scale+data.offX ,data.coords[1]*data.scale + data.offY);
	for(var j=2;j<data.coords.length;j+=2)
		can.lineTo(data.coords[j]*data.scale + data.offX,data.coords[j+1]*data.scale + data.offY);

	can.stroke();
	var cx = data.coords[0]*data.scale + data.offX -6;
	var cy = data.coords[1]*data.scale + data.offY -6;
	can.restore();
}

function hoverIn(){
	var id=$(this).children().first().attr('id').substr(3);
	var mcan=$('#DPCanvas')[0];
        var can=mcan.getContext('2d');
	drawCoords();
	drawOne(can,_data[parseInt(id)],true);
}
function hoverOut(){
	drawCoords();
}

function setupDataCenter(){
	var ocan=$('.canvas')[0];
	var w=$(ocan).width();
	var h=$(ocan).height();
	var newc ='<canvas id="DPCanvas" width="' + w + '" height="' +h + '" ';
	newc +='style="width:' + w + 'px;height:'+h+'px;position:absolute;top:0px"></canvas>';
	$('.canvas').append(newc);
	loadData('.canvas',';z-index:10');
}
