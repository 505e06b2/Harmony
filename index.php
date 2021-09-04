<?php
//This file is used by Heroku
const BASE_URL = "https://discord.com/api/v9/";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Cache-Control: no-store");

if(empty($_SERVER["QUERY_STRING"])) {
	header("content-type: application/json");
	die('{"code": 0, "message": "No path given"}');
}

if(empty($_SERVER["HTTP_X_AUTHORIZATION"])) {
	header("content-type: application/json");
	die('{"code": 0, "message": "No Authorization header given"}');
}

if(empty($_SERVER["HTTP_X_USER_AGENT"])) {
	header("content-type: application/json");
	die('{"code": 0, "message": "No User-Agent header given"}');
}

$headers = [ //needs to be mutable so content-type can be added when needed
	"accept: */*",
	"accept-language: en-US",
	"authorization: " . $_SERVER["HTTP_X_AUTHORIZATION"],
	"user-agent: " . $_SERVER["HTTP_X_USER_AGENT"],
	"cache-control: no-cache",
	"pragma: no-cache",
	"sec-ch-ua: \" Not A;Brand\";v=\"99\", \"Chromium\";v=\"92\"",
	"sec-ch-ua-mobile: ?0",
	"sec-fetch-dest: empty",
	"sec-fetch-mode: cors",
	"sec-fetch-site: same-origin",
];

$ch = curl_init(BASE_URL . $_SERVER["QUERY_STRING"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
switch($_SERVER["REQUEST_METHOD"]) {
	case "GET":
		break;

	case "POST":
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents("php://input")); //get this streamable?, at least for POST
		$headers[] = "content-type: " . empty($_SERVER["HTTP_X_CONTENT_TYPE"]) ? "application/json" : $_SERVER["HTTP_X_CONTENT_TYPE"]; //bypass CORS with x-*
		break;

	default:
		die('{"code": 0, "message": "HTTP method not supported"}');
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_USERAGENT, USER_AGENT);

$data = curl_exec($ch);
curl_close($ch);

echo $data;
?>
