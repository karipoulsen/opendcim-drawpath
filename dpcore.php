<?php
/*
 * DRAWPATH config & base DB access
 *
 */

require_once('../db.inc.php');

function query($sql)
{
	global $dbh;
	$hh = $dbh->query($sql);
	if($hh===false){
		error_log($sql);
		error_log(print_r($dbh->errorInfo(),true));
		return null;
	}
	$data = $hh->fetchAll();
	$hh->closeCursor();
	return $data;
}

function getDevicesForMap($key,$prefix)
{
	$con=getConfig();
	$allDevs = query("select DeviceId,Value from fac_DeviceCustomValue where AttributeID=" . $con['DPCustomAttributeId']);
	$res=array();
	$searchIds='';
	$nkey = $prefix . $key;
	foreach($allDevs as $dev)
	{
		//error_log(print_r($dev,true));
		$data=mapDeviceData($dev[1]);
		//print_r($devarr);
		foreach($data['maps'] as $map)
		{
			if($map['id']==$nkey)
			{
				$mp2=$map;
				$mp2['device']=$dev[0];
				$mp2['coords']=$data['coords'];
				$mp2['color'] = $data['color'];
				$res[]=$mp2;
				$searchIds .= ',' . $dev[0];
			}
		}
	}
	$searchIds=substr($searchIds,1);
	$sql=sprintf("select DeviceId,Label,Ports from fac_Device where DeviceId in (%s);",$searchIds);
	$devs = query($sql);

	foreach($devs as $dev)
	{
		for($i=0;$i<count($res);$i++){
			if($res[$i]['device']==$dev[0]){
				$res[$i]['label']=$dev[1];
				$res[$i]['ports']=intval($dev[2]);
			}
		}
	}
	return $res;
}

function mapDeviceData($data)
{
	// $data is a semicolon separated list, some of these elements are again lists, comma separated
	// first is path color
	// next is the coordinate set itself - an array of X and Y numbers, evens are X, odds are Y
	// last, there are a number of device mappings that describe what drawing this device appears on, 
	// together with coordinate offsets and scaling
	// (all of this could just be stored as JSON, but custom attribute values are restricted..)
	$res=array();
	$res['maps']=array();
	$res['coords']=array();
	if($data!=''){
		$list=explode(';',$data);
		$res['color']=$list[0];
		$coor=explode(',',$list[1]);
		foreach($coor as $p)
			$res['coords'][]=intval($p);
		for($i=2;$i<count($list);$i++)
		{
			$dev=explode(',',$list[$i]);
			$res['maps'][]=array('id'=>$dev[0],'master'=>intval($dev[1]),'offX'=>intval($dev[2]),'offY'=>intval($dev[3]),'scale'=>floatval($dev[4]));
		}
		// swap master to first element
		for($i=1;$i<count($res['maps']);$i++)
		{
			if($res['maps'][$i]['master']==1){
				$tmp=$res['maps'][0];
				$res['maps'][0]=$res[$i][$mid];
				$res['maps'][$i]=$tmp;
				break;
			}
		}

	}else{
		$res['color']='red';
	}
	return $res;
}

function getMapsForDevice($dev,$data)
{
	$res=mapDeviceData($data);
	$r=getInfoForDevice($dev);
	$res['label']=$r['label'];
	$res['ports']=intval($r['ports']);
	$d=getAllImages();
	$res['maxw']=$d['dimension']['maxw'];
	$res['maxh']=$d['dimension']['maxh'];
	unset($d['dimension']);
	$res['images']=$d;
	return $res;
}
function getInfoForDevice($dev)
{
	$r=query(sprintf("select Label,Ports from fac_Device where DeviceId=%s",$dev));
	$res=array();
	$res['label']=$r[0][0];
	$res['ports']=$r[0][1];
	return $res;
}
function getAllImages()
{
	$res=array();
	$mxw=0;
	$mxh=0;
	$filepath = substr(__DIR__,0,strrpos(__DIR__,'/'));
	foreach(query("select DataCenterId,Name,DrawingFileName from fac_DataCenter where DrawingFilename<>'' ") as $row)
	{
		$res['d'.$row[0]]=array('name'=>$row[1],'image'=>'/drawings/'.$row[2]);
		$dims = getimagesize($filepath . '/drawings/'.$row[2]);
		$mxw=max($mxw,$dims[0]);
		$mxh=max($mxh,$dims[1]);
	}
	foreach(query("select ContainerID,Name,DrawingFileName from fac_Container where DrawingFileName<>''") as $row)
	{
		$res['c'.$row[0]]=array('name'=>$row[1],'image'=>'/drawings/'.$row[2]);
		$dims = getimagesize($filepath . '/drawings/'.$row[2]);
		$mxw=max($mxw,$dims[0]);
		$mxh=max($mxh,$dims[1]);
	}
	$res['dimension']=array('maxw'=>$mxw,'maxh'=>$mxh);
	return $res;
}

function getConfig()
{
	global $config;
	$res=array();
	foreach($config->ParameterArray as $key=>$val)
	{
		if(substr($key,0,2)=='DP')
			$res[$key]=$val;
	}
	return $res;
}

function saveConfig($param,$val)
{
	global $dbh;
	$t=query(sprintf("select Parameter,Value from fac_Config where Parameter = '%s'",$param));
	error_log(print_r($t,true));
	if(count($t)==0){
		$sql=sprintf("insert into fac_Config (Parameter,`Value`,UnitOfMeasure,ValType,DefaultVal) values('%s','%s','','string','');",$param,$val);
		query($sql);
	}
	else{
		error_log('updating.. we should never get here!');
		$dbh->exec(sprintf("update fac_Config set `value`='%s' where Parameter='%s';",$val,$param));
		$dbh->commit();
	}
}
function deleteConfig($param)
{
	global $dbh;
	$dbh->exec(sprintf("delete from fac_Config where Parameter='%s';",$param));
}

