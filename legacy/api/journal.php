<?php
require __DIR__.'/common.php';
session_start();
$e=$_SESSION['u']['email']??'';
if($e==='')out(['error'=>'Silakan masuk terlebih dahulu'],401);
$f=__DIR__.'/../data/journal.json';
$all=file_exists($f)?(json_decode(file_get_contents($f),true)?:[]):[];
if($_SERVER['REQUEST_METHOD']==='POST'){
 $in=json_decode(file_get_contents('php://input'),true)['entries']??null;
 if(!is_array($in))out(['error'=>'Data tidak valid'],400);
 $clean=[];
 foreach(array_slice($in,0,200) as $x){
  $t=(float)($x['temp']??0);$d=(string)($x['date']??'');
  if($t<34||$t>43||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$d))continue;
  $clean[]=['id'=>(int)($x['id']??0),'date'=>$d,'temp'=>$t,'note'=>mb_substr((string)($x['note']??''),0,200)];
 }
 $all[$e]=$clean;
 file_put_contents($f,json_encode($all,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT),LOCK_EX);
 out(['ok'=>true]);
}
out(['entries'=>$all[$e]??[]]);
