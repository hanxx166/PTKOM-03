<?php
require __DIR__.'/common.php';
$f=__DIR__.'/../data/checks.log';
if($_SERVER['REQUEST_METHOD']==='POST'){
 $l=json_decode(file_get_contents('php://input'),true)['level']??'';
 if(!in_array($l,['rendah','sedang','tinggi'],true))out(['error'=>'level tidak valid'],400);
 file_put_contents($f,$l."\n",FILE_APPEND|LOCK_EX);
 out(['ok'=>true]);
}
$c=['rendah'=>0,'sedang'=>0,'tinggi'=>0];
if(file_exists($f))foreach(file($f,FILE_IGNORE_NEW_LINES) as $l)if(isset($c[$l]))$c[$l]++;
out(['total'=>array_sum($c)]+$c);
