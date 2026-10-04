<?php
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
function out($d,$c=200){http_response_code($c);echo json_encode($d,JSON_UNESCAPED_UNICODE);exit;}
set_error_handler(function($n,$s,$f,$l){throw new ErrorException($s,0,$n,$f,$l);});
set_exception_handler(function($e){out(['error'=>'Server: '.$e->getMessage()],500);});
