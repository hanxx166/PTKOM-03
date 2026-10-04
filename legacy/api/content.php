<?php
require __DIR__.'/common.php';
out(json_decode(file_get_contents(__DIR__.'/../data/content.json'),true));
