<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

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

	case "POST": {
		$in = file_get_contents("php://input");
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $in);

		if(isset($_SERVER["HTTP_X_CONTENT_TYPE"])) {
			if($_SERVER["HTTP_X_CONTENT_TYPE"] == "multipart/form-data") {
				preg_match("/--(.*?)$/m", $in, $matches);
				$headers[] = "content-type: multipart/form-data; boundary=" . trim($matches[1]);
			} else {
				$headers[] = "content-type: " . $_SERVER["HTTP_X_CONTENT_TYPE"];
			}
		} else {
			$headers[] = "content-type: application/json";
		}
	} break;

	default:
		die('{"code": 0, "message": "HTTP method not supported"}');
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER["HTTP_X_USER_AGENT"]);

$data = curl_exec($ch);
curl_close($ch);

echo $data;
?>
