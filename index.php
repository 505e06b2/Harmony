<?php
//This file is used by Heroku
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization");
header("Cache-Control: no-store");

if($_SERVER["REQUEST_URI"] == "/") {
	header("content-type: application/json");
	die('{"code": 0, "message": "No path given"}');
}

if(empty($_SERVER["HTTP_AUTHORIZATION"])) {
	header("content-type: application/json");
	die('{"code": 0, "message": "No Authorization header given"}');
}

const BASE_URL = "https://discord.com/api/v9";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36";

$headers = [ //needs to be mutable so content-type can be added when needed
	"accept: */*",
	"accept-language: en-US",
	"authorization: " . $_SERVER["HTTP_AUTHORIZATION"],
	"cache-control: no-cache",
	"pragma: no-cache",
	"sec-ch-ua: \" Not A;Brand\";v=\"99\", \"Chromium\";v=\"92\"",
	"sec-ch-ua-mobile: ?0",
	"sec-fetch-dest: empty",
	"sec-fetch-mode: cors",
	"sec-fetch-site: same-origin",
];

$ch = curl_init(BASE_URL . $_SERVER["REQUEST_URI"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
switch($_SERVER["REQUEST_METHOD"]) {
	case "GET":
		break;

	case "POST":
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents("php://input"));
		$headers[] = "content-type: application/json";
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
