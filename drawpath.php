<?php
/*
 * DRAWPATH extension for openDCIM
 * see README.html
 */

require_once("dpcore.php");

$CAid = 'DPCustomAttributeId';
$Colp = 'DPColor';

if(isset($_POST['rpc'])){
	switch($_POST['rpc'])
	{
	case 'load':
		$arr=explode('=',$_POST['id']);
		$id=$arr[1];
		$dt=getDevicesForMap($id,$arr[0]=='container'?'c':'d');
		echo json_encode($dt);
		break;
	case 'config':
		// if no DP.. parameter is in the config table, we're starting for the first time
		if(!isset($config->ParameterArray[$CAid])){
			saveConfig($CAid,'-1');
			saveConfig('DPColor01','utp endpoint|lightblue');
			saveConfig('DPColor02','fiber|orange');
			$config->ParameterArray[$CAid]='-1';
			$config->ParameterArray['DPColor01']='utp endpoint|lightblue';
			$config->ParameterArray['DPColor02']='fiber|orange';
		}	
		echo json_encode(getConfig());
		break;
	case 'devicesetup':
		$caid=$config->ParameterArray[$CAid];
		echo json_encode($caid);
		break;
	case 'configwriter':
		$data=$_POST['payload'];
		error_log(print_r($data,true));
		foreach($data as $cmd)
		{
			switch($cmd['operation'])
			{
			case 'new':
				saveConfig($cmd['id'],$cmd['value']);
				break;
			case 'delete':
				deleteConfig($cmd['id']);
				break;
			default:
				error_log('unknown configwriter option: ' . $cmd['operation']);
			}
		}
		echo json_encode($data);
		break;
	}

}



