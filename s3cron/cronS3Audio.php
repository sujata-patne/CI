<?php

header("access-control-allow-origin: *");
define('SITE_MODE', '1');
require $_SERVER['DOCUMENT_ROOT'].'/TestDM/cronHelper/cron.helper.php';
//require $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/aws/aws-autoloader.php';
if( SITE_MODE == 1){
    require '/var/www/Icon/aws/aws-autoloader.php';
}else{
    require '/var/www/clone_icon/Icon/aws/aws-autoloader.php';
}

use Aws\Common\Aws;
use Aws\S3\S3Client;
use Aws\Common\Credentials\Credentials;
use Aws\S3\Exception\S3Exception;
use Guzzle\Http\EntityBody;
use Guzzle\Plugin\Log\LogPlugin;

define('CDN_DOWNLOAD', 'http://d12m6hc8l1otei.cloudfront.net/');
//define('CDN_STREAM', 'http://cdn.wakau.in/vod/smil:');

$server = "http://103.43.2.7:2022/";
$wowzaPath = $server.'WowzaStreamingEngine-4.1.1/content/';
$iconPath = $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/public/temp/';
$downloadTempPath = $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/public/temp/download/';
$MetadataPath = $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/public/MetadataFiles/';
$logSuccess = $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/logs/file_success-' . date('Y-m-d') . '.log';
$logFail = $_SERVER['DOCUMENT_ROOT'].'/Icon-CI/logs/file_fail-' . date('Y-m-d') . '.log';
//define('ICON_HOST', "http://114.143.181.228/v3/"); // icon api
define('ICON_HOST',"http://localhost/apiICON/v3/"); // icon api

$streaming_files_processed = 'false';
$downloading_files_processed = 'false';

function is_dir_empty($dir) {
    if (!is_readable($dir)) return NULL;
    return (count(scandir($dir)) == 2);
}
function executePostCurl($url, $data, $isJSON = 1){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, count($data));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    if($isJSON == 1 ){
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json'
        ));
    }
    $content = curl_exec($ch);
    $getCurlInfo = curl_getinfo($ch);
    $curlError = curl_error($ch);
    curl_close ($ch); // close curl handle
    return array(
        'Content' => $content,
        'Info' => $getCurlInfo,
        'Error' => $curlError
    );
}

function getMimeType( $filename ) {
    $realpath = realpath( $filename );
    if ( $realpath
        && function_exists( 'finfo_file' )
        && function_exists( 'finfo_open' )
        && defined( 'FILEINFO_MIME_TYPE' )
    ) {
        // Use the Fileinfo PECL extension (PHP 5.3+)
        return finfo_file( finfo_open( FILEINFO_MIME_TYPE ), $realpath );
    }
    if ( function_exists( 'mime_content_type' ) ) {
        // Deprecated in PHP 5.3
        return mime_content_type( $realpath );
    }
    return false;
}
if(!function_exists('mime_content_type')) {

    function mime_content_type($filename) {

        $mime_types = array(

            'txt' => 'text/plain',
            'htm' => 'text/html',
            'html' => 'text/html',
            'php' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'swf' => 'application/x-shockwave-flash',
            'flv' => 'video/x-flv',

            // images
            'png' => 'image/png',
            'jpe' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpg' => 'image/jpeg',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'ico' => 'image/vnd.microsoft.icon',
            'tiff' => 'image/tiff',
            'tif' => 'image/tiff',
            'svg' => 'image/svg+xml',
            'svgz' => 'image/svg+xml',

            // archives
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed',
            'exe' => 'application/x-msdownload',
            'msi' => 'application/x-msdownload',
            'cab' => 'application/vnd.ms-cab-compressed',

            // audio/video
            'mp3' => 'audio/mpeg',
            'qt' => 'video/quicktime',
            'mov' => 'video/quicktime',

            // adobe
            'pdf' => 'application/pdf',
            'psd' => 'image/vnd.adobe.photoshop',
            'ai' => 'application/postscript',
            'eps' => 'application/postscript',
            'ps' => 'application/postscript',

            // ms office
            'doc' => 'application/msword',
            'rtf' => 'application/rtf',
            'xls' => 'application/vnd.ms-excel',
            'ppt' => 'application/vnd.ms-powerpoint',

            // open office
            'odt' => 'application/vnd.oasis.opendocument.text',
            'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
        );

        $ext = strtolower(array_pop(explode('.',$filename)));
        if (array_key_exists($ext, $mime_types)) {
            return $mime_types[$ext];
        }
        elseif (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME);
            $mimetype = finfo_file($finfo, $filename);
            finfo_close($finfo);
            return $mimetype;
        }
        else {
            return 'application/octet-stream';
        }
    }
}

//if(($pid = cronHelper::lock()) !== FALSE) {
    $credentials = new Credentials('AKIAIEM5IQET5GYV6JZA', 'Bkf8oDJS9+MUyDAX5d/+ppCdT79flTHzES23AfaQ');

    $s3 = S3Client::factory(array(
        'credentials' => $credentials,
        'scheme' => 'http'
    ));

    if( SITE_MODE == 1){
        $bucket = "stagingd2c";
    }else{
        $bucket = "direct2consumer";
    }

    if (is_dir_empty($iconPath)) {
        echo "Fail";
    }else {
        foreach (glob($iconPath . "*.*") as $filename) {
            $mime = getMimeType($filename);

            $extractCmdId = explode('_', basename($filename));
            $cmdId = $extractCmdId[0];

            /*$deliveryTypes = getContentDeliveryTypesById($cmdId);
            $isType = null;
            if(count($deliveryTypes) == 2){
                $isType = "both";
            } else if (stripos(strtolower($deliveryTypes[0]->cd_name), 'Download') !== false) {
                $isType = 'downloading';
            } else {
                $isType = 'streaming';
            }*/
             // Get File Information
            $fileprop = pathinfo($filename);
            $extension = pathinfo($filename, PATHINFO_EXTENSION);

            if (strstr($mime, "audio/")) {
                //if ($isType == 'both') {
                    $S3Audio = $downloadTempPath.basename($filename);
                    $FileNamemp3 = CDN_DOWNLOAD.'audio/'.basename($filename);
                    $downloading_url = CDN_DOWNLOAD.'audio/'.$fileprop['filename'];
                    $VideoMetaPath = $MetadataPath.'Audio/';
                    // copy mp3 to temp download folder
                    if(copy($filename, $S3Audio)){
                        $streaming_files_processed = 'true';
                    }else{
                        $streaming_files_processed = 'false';
                    }
                    $streaming_url = CDN_STREAM.$fileprop['filename'].'.smil';
                    //Content exist in download folder
                    if (!is_dir_empty($downloadTempPath)) {
                        foreach (glob($downloadTempPath."*.*") as $s3file) {
                            $finalimgname = basename($s3file);
                            $CoverImage = array(
                                'Bucket' => $bucket,
                                'Key'    => 'audio/'.$finalimgname,
                                'Body'   => EntityBody::factory(fopen($s3file, 'r+')),
                                'ContentDisposition' => 'attachment; filename="'.$finalimgname.'"'
                            );

                            $result = $s3->putObject($CoverImage);

                            if(stripos($result['ObjectURL'], 'http://direct2consumer.s3.amazonaws.com/audio') !== false ){
                                $paramString = date('d-m-Y H:i:s').',Audio,'.$finalimgname;
                                file_put_contents($logSuccess, "\n".$paramString, FILE_APPEND);

                                if( file_exists($s3file) ){
                                    unlink($s3file);
                                }
                            }else{
                                $paramString = date('d-m-Y H:i:s').',Audio,'.$finalimgname;
                                file_put_contents($logFail, "\n".$paramString, FILE_APPEND);
                            }
                        }
                        if (is_dir_empty($downloadTempPath)) {
                            $downloading_files_processed = 'true';
                        }else{
                            $downloading_files_processed = 'false';
                        }

                        // If file exists and all files processed
                        if( file_exists($filename) and $streaming_files_processed == 'true' and $downloading_files_processed == 'true' ){
                            unlink($filename);
                        }
                    }
                }
           // }
        }
    }
//}