<?php
require __DIR__.'/common.php';
session_start();
$cfg=[];$cf=__DIR__.'/../config.php';
if(file_exists($cf)){$t=include $cf;if(is_array($t))$cfg=$t;}
$acode=(string)($cfg['ADMIN_CODE']??'');
$local=in_array($_SERVER['SERVER_NAME']??'',['localhost','127.0.0.1','::1'],true);
$uf=__DIR__.'/../data/users.json';
$rf=__DIR__.'/../data/resets.json';
function rjson($f){return file_exists($f)?(json_decode(file_get_contents($f),true)?:[]):[];}
function wjson($f,$d){file_put_contents($f,json_encode($d,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX);}
function ufind($U,$e){foreach($U as $i=>$u)if($u['email']===$e)return $i;return -1;}
function upub($u){return ['name'=>$u['name'],'email'=>$u['email'],'role'=>$u['role']];}
$U=rjson($uf);
$in=json_decode(file_get_contents('php://input'),true)?:[];
$act=$in['action']??($_GET['action']??'me');
$email=strtolower(trim((string)($in['email']??'')));
$pw=(string)($in['password']??'');
switch($act){
 case 'me': out(['user'=>$_SESSION['u']??null]);
 case 'logout': session_destroy(); out(['ok'=>true]);
 case 'signup':
  $name=trim((string)($in['name']??''));
  if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($pw)<6)out(['error'=>'Lengkapi data dengan benar (password minimal 6 karakter)'],400);
  if(ufind($U,$email)>=0)out(['error'=>'Email sudah terdaftar'],409);
  $ac=(string)($in['admin_code']??'');
  if($ac!==''){
   if($acode===''||!hash_equals($acode,$ac)){usleep(700000);out(['error'=>'Kode admin salah'],403);}
   $role='admin';
  }else $role=($acode===''&&$local&&!$U)?'admin':'user';
  $u=['name'=>mb_substr($name,0,60),'email'=>$email,'hash'=>password_hash($pw,PASSWORD_DEFAULT),'role'=>$role];
  $U[]=$u;wjson($uf,array_values($U));$_SESSION['u']=upub($u);out(['user'=>$_SESSION['u']]);
 case 'login':
  $i=ufind($U,$email);
  if($i<0||!password_verify($pw,$U[$i]['hash']))out(['error'=>'Email atau password salah'],401);
  $_SESSION['u']=upub($U[$i]);out(['user'=>$_SESSION['u']]);
 case 'sendcode':
  $mailed=false;
  if(ufind($U,$email)>=0){
   $code=(string)random_int(100000,999999);
   $R=rjson($rf);
   $R[$email]=['hash'=>password_hash($code,PASSWORD_DEFAULT),'exp'=>time()+600,'try'=>0];
   wjson($rf,$R);
   try{$mailed=mail($email,'Kode reset password Poliklinik ITERA',"Kode reset password Anda: $code\nBerlaku 10 menit.",'From: no-reply@poliklinik-itera.local');}
   catch(Throwable $t){$mailed=false;}
   if(!$mailed)file_put_contents(__DIR__.'/../data/kode-reset.txt',date('c')." $email $code\n",FILE_APPEND|LOCK_EX);
  }
  out(['ok'=>true,'mailed'=>$mailed]);
 case 'reset':
  $R=rjson($rf);$r=$R[$email]??null;
  if(!$r||$r['exp']<time()||$r['try']>=5)out(['error'=>'Kode tidak valid atau sudah kedaluwarsa. Kirim kode baru.'],400);
  if(!password_verify((string)($in['code']??''),$r['hash'])){$R[$email]['try']++;wjson($rf,$R);out(['error'=>'Kode salah'],400);}
  $i=ufind($U,$email);
  if($i<0||strlen($pw)<6)out(['error'=>'Password baru minimal 6 karakter'],400);
  $U[$i]['hash']=password_hash($pw,PASSWORD_DEFAULT);wjson($uf,$U);
  unset($R[$email]);wjson($rf,$R);out(['ok'=>true]);
 default: out(['error'=>'Aksi tidak dikenal'],400);
}
