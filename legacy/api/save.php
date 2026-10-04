<?php
require __DIR__.'/common.php';
session_start();
if(($_SESSION['u']['role']??'')!=='admin')out(['error'=>'Hanya admin yang boleh mengubah data'],403);
$d=json_decode(file_get_contents('php://input'),true);
$o=[];
foreach(['articles','symptoms','tasks','quiz','contact','facts'] as $k){
 if(!is_array($d)||!is_array($d[$k]??null))out(['error'=>'Data tidak valid'],400);
 $o[$k]=$d[$k];
}
file_put_contents(__DIR__.'/../data/content.json',json_encode($o,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT),LOCK_EX);
out(['ok'=>true]);
