<?php
/**
 * Created by Sujata.Halwai on 02-06-2016.
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('error_reporting', 32767);
ini_set("error_log", $_SERVER['DOCUMENT_ROOT']."log/php_error.log");
ini_set('max_execution_time', 0);
ini_set("memory_limit", "-1");
set_time_limit(0);


header("access-control-allow-origin: *");

define('SITE_MODE', '1');

require 'cronHelper/cron.helper.php';
if( SITE_MODE == 1) {
    require '/var/www/utility/aws/aws-autoloader.php';
	//require '/var/www/ContentIngestion/aws/aws-autoloader.php';

}else if( SITE_MODE == 2) {
	require '/var/www/utility/aws/aws-autoloader.php';
	// require '/var/www/ContentIngestion/aws/aws-autoloader.php';
} else {
	require '/var/www/utility/aws/aws-autoloader.php';
//	require '/var/www/icon/content_ingestion/aws/aws-autoloader.php';
}

use Aws\Common\Aws;
use Aws\S3\S3Client;
use Aws\Common\Credentials\Credentials;
use Aws\S3\Exception\S3Exception;
use Guzzle\Http\EntityBody;
use Guzzle\Plugin\Log\LogPlugin;
define('S3USER', 'AKIAJX5SCIJNRYQVU3AQ'); // icon api
define('S3PWD', '1HtIiJpRsun/Bx2Huz13FwsZZCjwXWhS1Cp6f463'); // icon api
define('FILE', 's3cron'); // icon api

define('CDN_DOWNLOAD', 'http://d12m6hc8l1otei.cloudfront.net/');
if( SITE_MODE == 1) {
	define("bucket", "stagingd2c");
	// define("DBHOST", "192.168.1.160");
	define('CDN_STREAM', 'http://192.168.1.159:1935/vod/smil:');
	define('wowzaPath', '/usr/local/WowzaStreamingEngine-4.1.1/content/');
	define('iconPath', '/var/www/ContentIngestion/public/temp/');
	define('downloadTempPath', '/var/www/ContentIngestion/public/temp/download/');
	define('iconLogsPath', '/var/www/ContentIngestion/logs/s3BucketLogs/');
	define('MetadataPath', '/var/www/ContentIngestion/public/MetadataFiles/');
	define('logSuccess','/var/www/ContentIngestion/logs/s3_cron_file_success-'.date('Y-m-d').'.log');
	define('logFail', '/var/www/ContentIngestion/logs/s3_cron_file_fail-'.date('Y-m-d').'.log');
	define('bucketPath','http://stagingd2c.s3.amazonaws.com');
	define('ICON_HOST', "http://192.168.1.174:9875/v3/"); // icon api
}
else if( SITE_MODE == 2) {
	define("bucket", "stagingd2c");
   // define("DBHOST", "192.168.1.160");
    define('CDN_STREAM', 'http://192.168.1.159:1935/vod/smil:');
	define('wowzaPath', '/usr/local/WowzaStreamingEngine-4.1.1/content/');
	define('iconPath', '/var/www/ContentIngestion/public/temp/');
	define('downloadTempPath', '/var/www/ContentIngestion/public/temp/download/');
	define('iconLogsPath', '/var/www/ContentIngestion/logs/s3BucketLogs/');
	define('MetadataPath', '/var/www/ContentIngestion/public/MetadataFiles/');
	define('logSuccess','/var/www/ContentIngestion/logs/s3_cron_file_success-'.date('Y-m-d').'.log');
	define('logFail', '/var/www/ContentIngestion/logs/s3_cron_file_fail-'.date('Y-m-d').'.log');
	define('bucketPath','http://stagingd2c.s3.amazonaws.com');
    define('ICON_HOST', "http://114.143.181.228/v3/"); // icon api
}
else{
	define("bucket","direct2consumer");
    define("DBHOST", "10.64.12.136");
    //define("DBHOST", "192.168.1.160");
    define('CDN_STREAM', 'http://cdn.wakau.in/vod/smil:');
	define('wowzaPath', '/usr/local/WowzaStreamingEngine-4.1.1/content/');
	define('iconPath', '/var/www/icon/content_ingestion/public/temp/');
	define('downloadTempPath', '/var/www/icon/content_ingestion/public/temp/download/');
	define('iconLogsPath', '/var/www/icon/content_ingestion/logs/s3BucketLogs/');
	define('MetadataPath', '/var/www/icon/content_ingestion/public/MetadataFiles/');
	define('logSuccess', '/var/www/icon/content_ingestion/logs/file_success-'.date('Y-m-d').'.log');
    define('logFail', '/var/www/icon/content_ingestion/logs/file_fail-'.date('Y-m-d').'.log');
	define('bucketPath', 'http://direct2consumer.s3.amazonaws.com');
    define('ICON_HOST', "http://10.64.12.132/v3/"); // icon api
}

function is_dir_empty($dir) {
    if (!is_readable($dir)) return NULL;
    return (count(scandir($dir)) == 2);
}

if(($pid = cronHelper::lock(FILE)) !== FALSE) {
    if (is_dir_empty(iconPath)) {
        echo "Fail";
    } else {
    	$uploadTempData = new UploadTempData();
        $uploadTempData->uploadContentFilesToS3BucketWowza();
    }
	cronHelper::unlock(FILE);
} else {
	echo "Cron already in progress...";
}

class UploadTempData {
	public $credentials;
	public $currentBitRate = null;

	public function __construct() {
        $this->templateIDs = (array)$this->getTemplateIdForBitrate();
        $this->allTemplateIDs = (array)$this->getAllTemplates();
 		$this->credentials = $this->setS3Connection();
		$this->key_pair_id = 'APKAI6KQIZYCKQ2ZFREA';
		$this->private_key_filename = 'lib/pk-APKAI6KQIZYCKQ2ZFREA.pem';
		$this->expires = time() + (300); // (5 minutes from now in UNIX timestamp);
		$this->isType = null;
		$this->s3 = S3Client::factory(array(
			'credentials' => $this->credentials,
			'scheme' => 'http'
		));
	}
	public function formatVideoOnWowza() {
        $filename = $this->filename;
		$fileprop = pathinfo($filename);
		copy($filename, wowzaPath.basename($filename));

		$output = shell_exec('java -jar smilGenerator.jar '.basename($filename).' 2>&1');
		$media3gp = "ffmpeg -y -i ".$filename."  -strict -2 -s qcif -vcodec h263 -acodec aac -ac 1 -ar 8000 -r 25 -ab 32k ".wowzaPath.$fileprop['filename'].".3gp &";
		shell_exec($media3gp);
		echo "Processing video file : ".basename($filename);
		$paramString = date('d-m-Y H:i:s') . ',  Processing video file : '.basename($filename);
		file_put_contents(logSuccess, "Video ".$paramString . PHP_EOL, FILE_APPEND);
	}
	public function __toString()
	{
		// TODO: Implement __toString() method.
		return $this->mime.", ".$this->isType;
	}

	public function uploadContentFilesToS3BucketWowza() {
		//$generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';
 		if (is_dir_empty(iconPath)) {
			echo "Fail";
		} else {
			shell_exec("chmod -R 0777 ".downloadTempPath);
			shell_exec("chown -R iconadmin:".downloadTempPath);
			foreach (glob(iconPath."*.*") as $filename) {
				error_log(" Processing file : ".$filename);
				$this->pathName = '';
				$this->fileParts = explode("_",basename($filename));
				$this->mime = mime_content_type($filename);
				$extractCmdId = explode('_',basename($filename));
                $this->cmdId = $extractCmdId[0];
				$this->extension = pathinfo($filename, PATHINFO_EXTENSION);
				$this->filename = $filename;
				//echo "<pre>"; print_r($this->fileParts);
				echo "fileCategoryId :";
				if( $this->fileParts[2] == 'preview' ) {
					$this->fileCategoryId = 3;
				}else if( $this->fileParts[2] == 'supporting' ) {
					$this->fileCategoryId = 2;
				}else {
					$this->fileCategoryId = 1;
				}
				echo $this->fileCategoryId; // = in_array($this->fileParts[2], array('supporting','preview'))? ($this->fileParts[2] == 'preview')? 3:2:1;
				echo " <br />";

				$cm_data = array('cm_id' => $this->cmdId );
				error_log("File CategoryId : ".$this->fileCategoryId);

				if( $this->fileCategoryId == 3  ) {
					$this->folderName = MetadataPath.'/preview_files/';
				}else if( $this->fileCategoryId == 2 ) {
					$this->folderName = MetadataPath.'/supporting_files/';
				}else {
					$this->folderName = MetadataPath;
				}

				if( $this->fileCategoryId == 3  ) {
					$this->pathName = '/MetadataFiles/preview_files/';
				}else if( $this->fileCategoryId == 2 ) {
					$this->pathName = '/MetadataFiles/supporting_files/';
				}else {
					$this->pathName = '/MetadataFiles/';
				}

				$contentDeliveryType = $this->getContentDeliveryTypesById($cm_data);
				echo "count : ".$contentDeliveryTypeCount = count($contentDeliveryType);
				echo "<br />";
                if( $contentDeliveryTypeCount == 2 || $contentDeliveryTypeCount == 0) {
					if( $this->fileCategoryId == 2  ) {
						$this->isType = 'downloading';
					}elseif( $this->fileCategoryId == 3 || $this->fileCategoryId == 1  ) {
						$this->isType = 'both';
					}
				}elseif( $contentDeliveryTypeCount == 1 and $this->fileCategoryId == 3  ) {
					$this->isType = 'both';}
				elseif( $contentDeliveryTypeCount > 0 ) {
					$row = $contentDeliveryType[0];
					if( stripos(strtolower($row->cd_name), 'download') !== false ) {
						$this->isType = 'downloading';
					} else {
						$this->isType = 'streaming';
                    }
				}
				error_log(" object : ".$this);

			//	echo "##".$this->pathName."<br />";
				echo "##".$this->mime."<br />";
				if($contentDeliveryTypeCount == 0 ) {
					file_put_contents(logFail, "\nMetadata Id: ".$this->cmdId." doesn't have content type as it might be Property." . PHP_EOL, FILE_APPEND);
				}
				if(strstr($this->mime, "video/")) {
					// check for content type: downloading, streaming or both // if downloading only push to s3,	// if streaming only push to wowza,	// if both push to s3 and wowza
					//$this->folderName = ($this->fileCategoryId == 1)? MetadataPath.'Video/': ($this->fileCategoryId == 2)? MetadataPath.'supporting_files/video_files/':MetadataPath.'preview_files/video_files/';
					//$this->folderName = ($this->fileCategoryId == 3)? MetadataPath.'preview_files/video_files/' : ($this->fileCategoryId == 2)?  MetadataPath.'supporting_files/video_files/' : MetadataPath.'Video/';
					if( $this->fileCategoryId == 3 || $this->fileCategoryId == 2  ) {
						$this->folderName .= 'video_files/';
						$this->pathName .= 'video_files/';
					}else {
						$this->folderName .= 'Video/';
						$this->pathName .= 'Video/';
					}
					$this->formatVideoOnWowza(); //create/format vidoes directly on wowza
                    if($this->isType == 'both' || $this->isType == 'downloading') {
 						// Amazon S3 and Wowza both				// Process file for streaming
						$this->insertVideoDownloadStreamingUrl();
					} else {
						$this->insertVideoStreamingUrl();
					}
				}
				else if(strstr($this->mime, "image/")) {   // For images push to amazon s3 d2c bucket
					//$this->folderName = ($this->fileCategoryId == 3)? MetadataPath.'preview_files/image_files/' : ($this->fileCategoryId == 2)?  MetadataPath.'supporting_files/image_files/' : MetadataPath.'Wallpaper/';
					if( $this->fileCategoryId == 3 || $this->fileCategoryId == 2  ) {
						$this->folderName .= 'image_files/';
						$this->pathName .= 'image_files/';
					}else {
						$this->folderName .= 'Wallpaper/';
						$this->pathName .= 'Wallpaper/';
					}
					/*if( $this->fileCategoryId == 3  ) {
						$this->pathName = '/MetadataFiles/preview_files/image_files/';
					}else if( $this->fileCategoryId == 2 ) {
						$this->pathName = '/MetadataFiles/supporting_files/image_files/';
					}else {
						$this->pathName = '/MetadataFiles/Wallpaper/';
					}*/
					$this->insertImageryUrls();
                }else if(strstr($this->mime, "audio/")) {
 					//$this->folderName = ($this->fileCategoryId == 3)? MetadataPath.'preview_files/audio_files/' : ($this->fileCategoryId == 2)?  MetadataPath.'supporting_files/audio_files/' : MetadataPath.'Audio/';
					if( $this->fileCategoryId == 3 || $this->fileCategoryId == 2  ) {
						$this->folderName .= 'audio_files/';
						$this->pathName .= 'audio_files/';
					}else {
						$this->folderName .= 'Audio/';
						$this->pathName .= 'Audio/';
					}

					/*if( $this->fileCategoryId == 3  ) {
						$this->pathName = '/MetadataFiles/preview_files/audio_files/';
					}else if( $this->fileCategoryId == 2 ) {
						$this->pathName = '/MetadataFiles/supporting_files/audio_files/';
					}else {
						$this->pathName = '/MetadataFiles/Audio/';
					}*/
					$this->insertAudioUrl();
                }else if(strstr($this->mime, "text/plain") || strstr($this->mime, "application/octet-stream") || strstr($this->mime, "inode/x-empty")) {
					//$this->folderName = ($this->fileCategoryId == 3)? MetadataPath.'preview_files/text_files/' : ($this->fileCategoryId == 2)?  MetadataPath.'supporting_files/text_files/' : MetadataPath.'Text/';

					if( $this->fileCategoryId == 3 || $this->fileCategoryId == 2  ) {
						$this->folderName .= 'text_files/';
						$this->pathName .= 'text_files/';
					}else {
						$this->folderName .= 'Text/';
						$this->pathName .= 'Text/';
					}
					/*if( $this->fileCategoryId == 3  ) {
						$this->pathName = '/MetadataFiles/preview_files/text_files/';
					}else if( $this->fileCategoryId == 2 ) {
						$this->pathName = '/MetadataFiles/supporting_files/text_files/';
					}else {
						$this->pathName = '/MetadataFiles/Text/';
					}*/
					$this->insertTextUrl();
				}else if(strstr($this->mime, "application/vnd.android.package-archive") !== false or strstr($this->mime, "application/java-archive") !== false or
                    strstr($this->mime, "application/jar") !== false or strstr($this->mime, "application/apk") !== false or $this->extension == 'apk') {
                    // For android apk file push to amazon s3 d2c bucket
					$this->insertGamesUrl();
                }
            }
		}
	}
	public function insertVideoDownloadStreamingUrl() {
        $streaming_files_processed = array(
            'mp4' => 'false',
            '3gp' => 'false',
            '720p' => 'false',
            '480p' => 'false',
            '360p' => 'false',
            '240p' => 'false',
            '160p' => 'false',
        );
        $downloading_files_processed = array(
            'mp4' => 'false',
            '3gp' => 'false',
            '720p' => 'false',
            '480p' => 'false',
            '360p' => 'false',
            '240p' => 'false',
            '160p' => 'false',
        );
        $filename = $this->filename;
		$fileprop = pathinfo($filename);
		if( strtolower($this->fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'supporting_files/video_files/';
		}else if( strtolower($this->fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'preview_files/video_files/';
		}else {
			$folderName = 'Video/';
		}
 		$Video3gp = wowzaPath.$fileprop['filename'].'.3gp';
		$Video720p = wowzaPath.$fileprop['filename'].'_720p.mp4';
		$Video480p = wowzaPath.$fileprop['filename'].'_480p.mp4';
		$Video360p = wowzaPath.$fileprop['filename'].'_360p.mp4';
		$Video240p = wowzaPath.$fileprop['filename'].'_240p.mp4';
		$Video160p = wowzaPath.$fileprop['filename'].'_160p.mp4';

		$FileName3gp = $fileprop['filename'].'.3gp';
		$FileName720p = $fileprop['filename'].'_720p.mp4';
		$FileName480p = $fileprop['filename'].'_480p.mp4';
		$FileName360p = $fileprop['filename'].'_360p.mp4';
		$FileName240p = $fileprop['filename'].'_240p.mp4';
		$FileName160p = $fileprop['filename'].'_160p.mp4';

		$S3Video = downloadTempPath.basename($filename);
		$S3Video3gp = downloadTempPath.$fileprop['filename'].'.3gp';
		$S3Video720p = downloadTempPath.$fileprop['filename'].'_720p.mp4';
		$S3Video480p = downloadTempPath.$fileprop['filename'].'_480p.mp4';
		$S3Video360p = downloadTempPath.$fileprop['filename'].'_360p.mp4';
		$S3Video240p = downloadTempPath.$fileprop['filename'].'_240p.mp4';
		$S3Video160p = downloadTempPath.$fileprop['filename'].'_160p.mp4';

		$streaming_url = ($this->isType == 'downloading')? "-":CDN_STREAM.$fileprop['filename'].'.smil';

		if(copy($Video3gp, $this->folderName.$FileName3gp)) {
			$fileprop1 = pathinfo($this->folderName.$FileName3gp);
			$downloading_files_processed['3gp'] = 'true';
			$streaming_files_processed['3gp'] = $this->copyFileToDownloadfolder($Video3gp,$S3Video3gp);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop['filename'].'.3gp';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop1['filename'].'.3gp';
			$width = 176;
			$height = 144;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video3gp,$downloading_files_processed['3gp'],$streaming_files_processed['3gp']);
		}

		if(copy($Video720p, $this->folderName.$FileName720p)) {
			$fileprop2 = pathinfo($this->folderName.$FileName720p);
			$downloading_files_processed['720p'] = 'true';
			$streaming_files_processed['720p'] = $this->copyFileToDownloadfolder($Video720p,$S3Video720p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop2['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop2['filename'].'.mp4';
			$width = 640;
			$height = 320;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video720p,$downloading_files_processed['720p'],$streaming_files_processed['720p']);
		}

		if(copy($Video480p, $this->folderName.$FileName480p)) {
			$fileprop3 = pathinfo($this->folderName.$FileName480p);
			$downloading_files_processed['480p'] = 'true';
			$streaming_files_processed['480p'] = $this->copyFileToDownloadfolder($Video480p,$S3Video480p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop3['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop3['filename'].'.mp4';
			$width = 640;
			$height = 320;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video480p,$downloading_files_processed['480p'],$streaming_files_processed['480p']);
		}

		if(copy($Video360p, $this->folderName.$FileName360p)) {
			$fileprop4 = pathinfo($this->folderName.$FileName360p);
			$downloading_files_processed['360p'] = 'true';
			$streaming_files_processed['360p'] = $this->copyFileToDownloadfolder($Video360p,$S3Video360p);

			$original_processed = 0;
            $cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop4['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop4['filename'].'.mp4';
			$width = 640;
			$height = 320;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video360p,$downloading_files_processed['360p'],$streaming_files_processed['360p']);
		}

		if(copy($Video240p, $this->folderName.$FileName240p)) {
			$fileprop5 = pathinfo($this->folderName.$FileName240p);
			$downloading_files_processed['240p'] = 'true';
			$streaming_files_processed['240p'] = $this->copyFileToDownloadfolder($Video240p,$S3Video240p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop5['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop5['filename'].'.mp4';
			$width = 480;
			$height = 240;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video240p,$downloading_files_processed['240p'],$streaming_files_processed['240p']);
		}

		if(copy($Video160p, $this->folderName.$FileName160p)) {
			$fileprop6 = pathinfo($this->folderName.$FileName160p);
			$downloading_files_processed['160p'] = 'true';
			$streaming_files_processed['160p'] = $this->copyFileToDownloadfolder($Video160p,$S3Video160p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop6['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop6['filename'].'.mp4';
			$width = 240;
			$height = 160;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video160p,$downloading_files_processed['160p'],$streaming_files_processed['160p']);
		}

		if (file_exists($filename)) {
			$downloading_files_processed['mp4'] = 'true';
			$streaming_files_processed['mp4'] = $this->copyFileToDownloadfolder($filename,$S3Video);
			$original_processed = 1;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.basename($filename);
			if($this->fileCategoryId == 1){
				$width = 640;
				$height = 320;
				$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			}else{
				$templateID = $this->allTemplateIDs['othervideo'];
			}
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video,$downloading_files_processed['mp4'],$streaming_files_processed['mp4']);
		}

		// If file exists and all files processed, delete main file from temp
		if( file_exists($filename) and
			$streaming_files_processed['mp4'] == 'true' and $streaming_files_processed['3gp'] == 'true' and
			$streaming_files_processed['720p'] == 'true' and $streaming_files_processed['480p'] == 'true' and
			$streaming_files_processed['360p'] == 'true' and $streaming_files_processed['240p'] == 'true' and
			$streaming_files_processed['160p'] == 'true' and
			$downloading_files_processed['3gp'] == 'true' and $downloading_files_processed['3gp'] == 'true' and
			$downloading_files_processed['720p'] == 'true' and $downloading_files_processed['480p'] == 'true' and
			$downloading_files_processed['360p'] == 'true' and $downloading_files_processed['240p'] == 'true' and
			$downloading_files_processed['160p'] == 'true' ) {
			unlink($filename);
		}
	}
	public function insertVideoStreamingUrl() {
        $streaming_files_processed = array(
            'mp4' => 'false',
            '3gp' => 'false',
            '720p' => 'false',
            '480p' => 'false',
            '360p' => 'false',
            '240p' => 'false',
            '160p' => 'false',
        );
	    $filename = $this->filename;
	    $fileprop = pathinfo($filename);
		if( strtolower($this->fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'supporting_files/video_files/';
		}else if( strtolower($this->fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'preview_files/video_files/';
		}else {
			$folderName = 'Video/';
		}
		$orgVideo = $filename;
		$Video3gp = wowzaPath.$fileprop['filename'].'.3gp';
		$Video720p = wowzaPath.$fileprop['filename'].'_720p.mp4';
		$Video480p = wowzaPath.$fileprop['filename'].'_480p.mp4';
		$Video360p = wowzaPath.$fileprop['filename'].'_360p.mp4';
		$Video240p = wowzaPath.$fileprop['filename'].'_240p.mp4';
		$Video160p = wowzaPath.$fileprop['filename'].'_160p.mp4';

		$S3Video = $this->folderName.basename($filename);
		$S3Video3gp = $this->folderName.$fileprop['filename'].'.3gp';
		$S3Video720p = $this->folderName.$fileprop['filename'].'_720p.mp4';
		$S3Video480p = $this->folderName.$fileprop['filename'].'_480p.mp4';
		$S3Video360p = $this->folderName.$fileprop['filename'].'_360p.mp4';
		$S3Video240p = $this->folderName.$fileprop['filename'].'_240p.mp4';
		$S3Video160p = $this->folderName.$fileprop['filename'].'_160p.mp4';

		$streaming_url = CDN_STREAM.$fileprop['filename'].'.smil';
            // copy mp4/3gp/720p/360p/240p/160p to temp download folder
		if(copy($filename, $S3Video)) {
			$streaming_files_processed['mp4'] = 'true';
 			$original_processed = 1;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
 			$downloading_url = '-';
			if($this->fileCategoryId == 1){
				$width = 640;
				$height = 320;
				$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			}else{
				$templateID = $this->allTemplateIDs['othervideo'];
			}
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url,'video');
		} else {
			$streaming_files_processed['mp4'] = 'false';
		}

		if(copy($Video3gp, $S3Video3gp)) {
			$streaming_files_processed['3gp'] = 'true';
			$fileprop2 = pathinfo($S3Video3gp);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop2['filename'].'.3gp';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 176;
			$height = 144;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));

			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['3gp'] = 'false';
		}
		if(copy($Video720p, $S3Video720p)) {
			$streaming_files_processed['720p'] = 'true';
			$fileprop3 = pathinfo($S3Video720p);
 			$original_processed = 0;
            $cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop3['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 640;
			$height = 320;
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));

			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['720p'] = 'false';
		}

		if(copy($Video480p, $S3Video480p)) {
			$streaming_files_processed['480p'] = 'true';
			$fileprop4 = pathinfo($S3Video480p);
 			$original_processed = 0;
            $cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop4['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 640;
			$height = 320;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));

			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['480p'] = 'false';
		}
		if(copy($Video360p, $S3Video360p)) {
			$streaming_files_processed['360p'] = 'true';
			$fileprop5 = pathinfo($S3Video360p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop5['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 640;
			$height = 320;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));

			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['360p'] = 'false';
		}
		if(copy($Video240p, $S3Video240p)) {
			$streaming_files_processed['240p'] = 'true';
			$fileprop6 = pathinfo($S3Video240p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop6['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 480;
			$height = 240;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['240p'] = 'false';
		}

		if(copy($Video160p, $S3Video160p)) {
			$streaming_files_processed['160p'] = 'true';
			$fileprop7 = pathinfo($S3Video160p);
			$original_processed = 0;
			$cf_url_base = $this->pathName.basename($filename);
			$cf_url = $this->pathName.$fileprop7['filename'].'.mp4';
			$cf_absolute_url = $this->pathName.basename($filename);
			$downloading_url = '-';
			$width = 240;
			$height = 160;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
		} else {
			$streaming_files_processed['160p'] = 'false';
		}

		// If file exists and all files processed
		if( file_exists($filename) and $streaming_files_processed['mp4'] == 'true' and $streaming_files_processed['3gp'] == 'true' and $streaming_files_processed['720p'] == 'true' and $streaming_files_processed['480p'] == 'true' and $streaming_files_processed['360p'] == 'true' and $streaming_files_processed['240p'] == 'true' and $streaming_files_processed['160p'] == 'true' ) {
			unlink($filename);
		}
	}
	public function copyFileToDownloadfolder($wowzaFilePath,$tempFilePath) {
		// copy mp4/3gp/720p/360p/240p/160p to temp download folder

		if(copy($wowzaFilePath, $tempFilePath)) {
			$streaming_files_processed = 'true';
		} else {
			$streaming_files_processed = 'false';
		}
		return $streaming_files_processed;
		/*if(copy($filename, $tempFilePath)) {
			$streaming_files_processed['mp4'] = 'true';
		} else {
			$streaming_files_processed['mp4'] = 'false';
		}
		if(copy($Video3gp, $S3Video3gp)) {
			$streaming_files_processed['3gp'] = 'true';
		} else {
			$streaming_files_processed['3gp'] = 'false';
		}
		if(copy($Video720p, $S3Video720p)) {
			$streaming_files_processed['720p'] = 'true';
		} else {
			$streaming_files_processed['720p'] = 'false';
		}
		if(copy($Video480p, $S3Video480p)) {
			$streaming_files_processed['480p'] = 'true';
		} else {
			$streaming_files_processed['480p'] = 'false';
		}
		if(copy($Video360p, $S3Video360p)) {
			$streaming_files_processed['360p'] = 'true';
		} else {
			$streaming_files_processed['360p'] = 'false';
		}
		if(copy($Video240p, $S3Video240p)) {
			$streaming_files_processed['240p'] = 'true';
		} else {
			$streaming_files_processed['240p'] = 'false';
		}
		if(copy($Video160p, $S3Video160p)) {
			$streaming_files_processed['160p'] = 'true';
		} else {
			$streaming_files_processed['160p'] = 'false';
		}*/
	}
	public function uploads3Video($s3file,$downloading_files_processed,$streaming_files_processed = 'true') {
 		if (!is_dir_empty(downloadTempPath) && file_exists($s3file)) {
			//echo "##"; print_r( EntityBody::factory(fopen($s3file, 'r+')));
			$finalimgname = basename($s3file);
			$fileParts = explode("_",basename($s3file));
			if( strtolower($fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
				$folderName = 'supporting_files/video_files/';
			}else if( strtolower($fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
				$folderName = 'preview_files/video_files/';
			}else {
				$folderName = 'video/';
			}
			$CoverImage = array(
				'Bucket' => bucket,
				'Key'    => $folderName.$finalimgname,
				'Body'   => EntityBody::factory(fopen($s3file, 'r+')),
				'ContentDisposition' => 'attachment; filename="'.$finalimgname.'"'
			);

			$result = $this->s3->putObject($CoverImage);

 			if(stripos($result['ObjectURL'], bucketPath.'/'.$folderName) !== false ) {
 				$paramString = date('d-m-Y H:i:s').',Video,'.$finalimgname;
				file_put_contents(logSuccess, "\n".$paramString . PHP_EOL, FILE_APPEND);
				if( file_exists($s3file) && $downloading_files_processed && $streaming_files_processed){
					 unlink($s3file);
				}
			} else {
				$paramString = date('d-m-Y H:i:s').',Video,'.$finalimgname;
				file_put_contents(logFail, "\n".$paramString.PHP_EOL, FILE_APPEND);
			}
		}
	}
	public function insertImageryUrls() {
        $filename = $this->filename;
        $finalimgname = basename($filename);
        if( strtolower($this->fileParts[1]) == 'thumb'  ) { //or strtolower($this->fileParts[1]) == 'image'
            $folderName = 'Thumbnails/';
        }else if( strtolower($this->fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
            $folderName = 'supporting_files/image_files/';
            $templateID = $this->allTemplateIDs['otherimage'];
        }else if( strtolower($this->fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
            $folderName = 'preview_files/image_files/';
			$templateID = $this->allTemplateIDs['otherimage'];
        } else {
            $folderName = 'wallpapers/';
            $width = $this->fileParts[1];
            $height = $this->fileParts[2];
            $templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
        }
		if($folderName != 'wallpapers/') {
			$CoverImage = array(
				'Bucket' => bucket,
				'Key' => $folderName . $finalimgname,
				'Body' => EntityBody::factory(fopen($filename, 'r+')),
				'ACL' => 'public-read',
				'ContentType' => 'text/plain'
			);
		}else{
			$CoverImage = array(
				'Bucket' => bucket,
				'Key'    => $folderName.$finalimgname,
				'Body'   => EntityBody::factory(fopen($filename, 'r+')),
				'ContentDisposition' => 'attachment; filename="'.$finalimgname.'"'
			);
		}
        $result = $this->s3->putObject($CoverImage);

        if(stripos($result['ObjectURL'], bucketPath.'/'.$folderName) !== false ) {
            //$paramString = date('d-m-Y H:i:s').',Imagery,'.$finalimgname.','.implode(',',$CoverImage);;
            $paramString = date('d-m-Y H:i:s').',Imagery,'.$finalimgname;
            file_put_contents(logSuccess, "\n".$paramString.PHP_EOL, FILE_APPEND);
            if($folderName != 'Thumbnails/') {

                $streaming_url = '-';
                $downloading_url = CDN_DOWNLOAD.$folderName.$finalimgname;
                $original_processed = 0;

                $cf_url_base = $this->pathName.basename($filename);
                $cf_url = $this->pathName.basename($filename);
                $cf_absolute_url = $this->pathName.basename($filename);
                $this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url,'wallpapers');
                if( file_exists($filename) ) {
                    unlink($filename);
                }
            } else {
                if( file_exists($filename) ) {
                    unlink($filename);
                }
            }
        } else {
            //$paramString = date('d-m-Y H:i:s').',Imagery,'.$finalimgname.','.implode(',',$CoverImage);;
            $paramString = date('d-m-Y H:i:s').',Imagery,'.$finalimgname;
            file_put_contents(logFail, "\n".$paramString. PHP_EOL, FILE_APPEND);
        }
	}
    public function insertAudioUrl() {
        $filename = $this->filename;
        $finalimgname = basename($filename);
		$bitRateData = shell_exec('ffprobe -v error -show_entries stream=bit_rate -of default=noprint_wrappers=1 ' . $filename);
		$bitRate = explode('=',$bitRateData);
		$this->currentBitRate = (string)intval($bitRate[1] / 1000);

        if( strtolower($this->fileParts[2]) == 'supporting'  ) {
			$templateID = $this->allTemplateIDs['otheraudio'];
            $folderName = 'supporting_files/audio_files/';
        }
        else if( strtolower($this->fileParts[2]) == 'preview'  ) {
			$templateID = $this->allTemplateIDs['otheraudio'];
            $folderName = 'preview_files/audio_files/';
        }
        else{
			$templateIDBitrate = $this->getClosestTemplateIdBitrate($this->currentBitRate,$this->templateIDs);
			$templateID = $templateIDBitrate['templateId'];
            $folderName = 'audio/';
		}
		if($folderName == 'supporting_files/audio_files/' ) {
			$CoverImage = array(
				'Bucket' => bucket,
				'Key' => $folderName . $finalimgname,
				'Body' => EntityBody::factory(fopen($filename, 'r+')),
				'ContentDisposition' => 'attachment; filename="' . $finalimgname . '"'
			);
		}else{
			$CoverImage = array(
				'Bucket' => bucket,
				'Key' => $folderName . $finalimgname,
				'Body' => EntityBody::factory(fopen($filename, 'r+'))
 			);
		}
        $result = $this->s3->putObject($CoverImage);

        if(stripos($result['ObjectURL'], bucketPath.'/'.$folderName) !== false ) {
            $paramString = date('d-m-Y H:i:s').',Audio,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logSuccess, "\n".$paramString. PHP_EOL, FILE_APPEND);

			if($folderName == 'supporting_files/audio_files/' || $folderName == 'preview_files/audio_files/' || $folderName == 'audio/') {
				$fileprop = pathinfo($finalimgname);
				$downloading_url = CDN_DOWNLOAD . $folderName . $finalimgname;
				$streaming_url = ($this->isType == 'downloading')? "-":CDN_STREAM.$fileprop['filename'].'.smil';
				//$streaming_url = CDN_DOWNLOAD . $folderName . $finalimgname;
				$original_processed = 1; //if($folderName == 'audio/') {
				$cf_url_base = "/MetadataFiles/".$folderName . basename($filename);
				$cf_url = "/MetadataFiles/".$folderName . basename($filename);
				$cf_absolute_url = "/MetadataFiles/".$folderName . basename($filename);
				$this->addContentFile($templateID, $original_processed, $cf_url_base, $cf_url, $cf_absolute_url, $streaming_url, $downloading_url, 'audio');
				if (file_exists($filename)) {
					unlink($filename);
				}
			}else {
				if (file_exists($filename)) {
					unlink($filename);
				}
			}
        } else {
            $paramString = date('d-m-Y H:i:s').',Audio,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logFail, "\n".$paramString. PHP_EOL, FILE_APPEND);
        }
    }
    public function insertGamesUrl() {
        $filename = $this->filename;
        $extractCmdId = explode('_',basename($filename));
        $finalimgname = basename($filename);
        $folderName = 'games/';
        $CoverImage = array(
            'Bucket' => bucket,
            'Key'    => $folderName.$finalimgname,
            'Body'   => EntityBody::factory(fopen($filename, 'r+')),
            'ContentDisposition' => 'attachment; filename="'.$finalimgname.'"'
        );
        $result = $this->s3->putObject($CoverImage);

        if(stripos($result['ObjectURL'], bucketPath.'/'.$folderName) !== false ) {
            $paramString = date('d-m-Y H:i:s').',Game,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logSuccess, "\n".$paramString. PHP_EOL, FILE_APPEND);
            if($folderName == 'games/') {
                $streaming_url = '-';
				$downloading_url = CDN_DOWNLOAD.'games/'.$finalimgname;
				$templateID = $this->allTemplateIDs['app'];
				$original_processed = 1;
                $cf_url_base = '/MetadataFiles/AppsGames/'.basename($filename);
                $cf_url = '/MetadataFiles/AppsGames/'.basename($filename);
                $cf_absolute_url = '/MetadataFiles/AppsGames/'.basename($filename);
                $this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url,'games');
                if( file_exists($filename) ) {
                    unlink($filename);
                }
            } else {
                if( file_exists($filename) ) {
                    unlink($filename);
                }
            }
        } else {
            $paramString = date('d-m-Y H:i:s').',Game,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logFail, "\n".$paramString. PHP_EOL, FILE_APPEND);
        }
    }
	public function insertTextUrl() {
        $filename = $this->filename;
        $finalimgname = basename($filename);
		if( strtolower($this->fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'supporting_files/text_files/';
		}else if( strtolower($this->fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'preview_files/text_files/';
		} else {
			$folderName = 'text/';
		}
		//echo "Text file Upload : ". $folderName;
        $CoverImage = array(
            'Bucket' => bucket,
            'Key'    => $folderName.$finalimgname,
            'Body'   => EntityBody::factory(fopen($filename, 'r+')),
            'ContentDisposition' => 'attachment; filename="'.$finalimgname.'"'
        );
		$result = $this->s3->putObject($CoverImage);
				echo "<pre>"; print_r($result);

		$languageTemplateIDs = $this->getTemplateIdForLanguage();
		//echo "<pre>"; print_r($languageTemplateIDs);
		foreach ($languageTemplateIDs as $key => $item) {
			if(strtolower($this->fileParts[1]) == strtolower($key)) {
				$templateID = $item;
			}
		}
		$streaming_url = '-';
		$downloading_url = CDN_DOWNLOAD.$folderName.$finalimgname;
		$original_processed = 1;
		$cf_url_base = $this->pathName.basename($filename);
		$cf_url = $this->pathName.basename($filename);
		$cf_absolute_url = $this->pathName.basename($filename);

        if(stripos($result['ObjectURL'], bucketPath.'/'.$folderName) !== false ) {
            $paramString = date('d-m-Y H:i:s').',Text,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logSuccess, "\n".$paramString. PHP_EOL, FILE_APPEND);

			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url,'text');

			if( file_exists($filename) ) {
				unlink($filename);
			}
        } else {
            $paramString = date('d-m-Y H:i:s').',Text,'.$finalimgname.','.implode(',',$CoverImage);;
            file_put_contents(logFail, "\n".$paramString. PHP_EOL, FILE_APPEND);
        }
	}
	 
	public function addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url,$contentType='video') {
		$cfId = $this->getMaxCFId();
		$cfId = intval($cfId + 1);
		$params = array('cf_cm_id' => $this->cmdId,'cf_url' => $cf_url,'cf_template_id' => $templateID ); //'cf_url_base' => $cf_url_base,'cf_absolute_url' => $cf_absolute_url,
		//echo "<pre>"; print_r($params);
		$contentFileExist = $this->checkContentFileExistForMetadata($params);
		echo "Record Exist : ".$contentFileExist."<br />";
		if($contentFileExist == 0 ) {
			$data = array(
				'cf_id'                 => $cfId,
				'cf_cm_id'              => $this->cmdId,
				'cf_original_processed' => $original_processed,
				'cf_url_base'           => $cf_url_base,
				'cf_url'                => $cf_url,
				'cf_absolute_url'       => $cf_absolute_url,
				'cf_template_id'        => $templateID,
				'file_category_id'      => $this->fileCategoryId,
				'cf_bitrate'      		=> $this->currentBitRate,
				'cf_streaming_url'      => $streaming_url,
				'cf_downloading_url'    => $downloading_url,
				'cf_created_on'			=> date("Y-m-d H:i:s"),
				'cf_modified_on'			=> date("Y-m-d H:i:s")
			);
			//echo "<pre>";print_r($data); exit;
			$this->insertContentFile($data);
		} else {
			$data = array(
					'cf_id'                 => $contentFileExist,
					'cf_streaming_url'      => $streaming_url,
					'cf_downloading_url'    => $downloading_url,
					'cf_modified_on'			=> date("Y-m-d H:i:s")
			);
	        $this->updateContentFiles($data);
		}

        $metadataStatus = $this->getMetadataStatus(array("cm_id" => $this->cmdId));
		if($contentType == 'games') {
			$extractCmdId = explode('_', basename($this->filename));
			$random = explode('.', $extractCmdId[2]);
			$downloading_url1 = CDN_DOWNLOAD . 'games/' . $this->cmdId . '/' . $extractCmdId[1] . '/' . $random[0] . '/' . $this->extension;
		} else {
			$downloading_url1 = CDN_DOWNLOAD.$contentType.'/'.$this->cmdId.'/'.$this->extension;
		}
        $data1 = array(
            'cm_id' =>  $this->cmdId,
            'cm_streaming_url'  =>  $streaming_url,
            'cm_downloading_url'    =>  $downloading_url1,
			//'cm_state'		=> 3
        );
        if($metadataStatus <= 3) {
            $data1['cm_state']  =  3;
        } else {
			$data1['cm_state']  =  $metadataStatus;
		}
        $this->updateContentMetadata($data1);
	}

	public function getMetadataStatus($data) {
		$url = ICON_HOST."contents/getMetadataStatus";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data); //$data
		$data = json_decode($result['Content'])->message;

		$metadataStatus = $data->metadataStatus;
		return $metadataStatus;
	}
	public function updateContentMetadata($data) {
		$url = ICON_HOST."contents/updateContentMetadata";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;
		$updateContentMetadata = $data->contents;
		return $updateContentMetadata;
	}
    public function checkContentFileExistForMetadata($data) {
		$url = ICON_HOST."contentFile/checkContentFileExistForMetadata";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;
		$isContentFileExist = $data->isContentFileExist;
		return $isContentFileExist;
	}
	public function getContentMetadataBycmId($data) {
		$url = ICON_HOST."contents/getContentMetadataBycmId";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;

		$getContentMetadata = $data->contentMetadata;
		return $getContentMetadata;
	}
	public function getContentDeliveryTypesById($data) {
		$url = ICON_HOST."contents/getContentDeliveryTypesById";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;

		$contentDeliveryType = $data->contentDeliveryType;
		return $contentDeliveryType;
	}
	public function getTemplateIdForHeightWidth($data) {
		$url = ICON_HOST."contentFile/getTemplateIdForHeightWidth";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;
		$templates = $data->templates;
		return $templates;
	}

	public function getTemplateIdForLanguage() {
		$url = ICON_HOST."contentFile/getTemplateIdForLanguage";
		$data = array(
			"cf_cm_id" => $this->cmdId
		);
		$data = json_encode($data);
		$result = $this->executePostCurl($url,$data);
		$data = json_decode($result['Content'])->message;
		$templateID = $data->templates;
		return $templateID;
	}
	public function getTemplateIdForBitrate() {
		$url = ICON_HOST."contentFile/getTemplateIdForBitrate";

		$result = $this->executeCurl($url);
		$data = json_decode($result['Content'])->message;

		$templateID = $data->templates;

		return $templateID;
	}
	public function getAllTemplates() {
		$url = ICON_HOST."contentFile/getAllTemplates";

		$result = $this->executeCurl($url);
		$data = json_decode($result['Content'])->message;

		$templateID = $data->templates;

		return $templateID;
	}
	public function insertContentFile($cm_data) {
	    $data = array(
			'cf_id'                 => $cm_data['cf_id'],
			'cf_cm_id'              => $cm_data['cf_cm_id'],
			'cf_original_processed' => $cm_data['cf_original_processed'],
			'cf_url_base'           => $cm_data['cf_url_base'],
			'cf_url'                => $cm_data['cf_url'],
			'cf_absolute_url'       => $cm_data['cf_absolute_url'],
			'cf_template_id'        => $cm_data['cf_template_id'],
			'cf_name'               => '-',
			'cf_name_alias'         => '0',
			'file_category_id'      => $cm_data['file_category_id'],
			'cf_bitrate'            => '',
			'cf_streaming_url'      => $cm_data['cf_streaming_url'],
			'cf_downloading_url'    => $cm_data['cf_downloading_url'],
			'cf_created_on'         => date('Y-m-d h:i:s'),
			'cf_modified_on'        => date('Y-m-d h:i:s')
		);

		$url = ICON_HOST."contentFile/insertContentFiles";
		$cf_data = json_encode($data);

		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;
		$insertContentFile = $data->contentFiles;
		return $insertContentFile;
	}
	public function updateContentFiles($data) {
		$url = ICON_HOST."contentFile/updateContentFiles";
		$cf_data = json_encode($data);
		$result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;

		$updateContentFiles = $data->contentFiles;
		return $updateContentFiles;
	}
	public function printData($obj) {
		echo "<pre>";
		print_r($obj);
		echo "</pre>";
	}
	public function getMaxCFId() {
		$url = ICON_HOST."contentFile/getMaxCFId";
		$result = $this->executeCurl($url);
		$data = json_decode($result['Content'])->message;

		$cfId = $data->maxCFID;
		return $cfId;
	}
	public function executePostCurl($url, $data, $isJSON = 1) {
		$generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_POST, count($data));
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		if($isJSON == 1 ) {
			curl_setopt($ch, CURLOPT_HTTPHEADER, array(
				'Content-Type: application/json'
			));
		}
		$content = curl_exec($ch);
		$getCurlInfo = curl_getinfo($ch);
		$curlError = curl_error($ch);
		curl_close ($ch); // close curl handle

		if(!empty($curlError)) {
			$paramString = date('d-m-Y H:i:s') . ",  Audio Bulk upload, ".$curlError."<br />";
			file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
		}
		return array(
			'Content' => $content,
			'Info' => $getCurlInfo,
			'Error' => $curlError
		);
	}
	public function executeCurl($url) {
		$generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$content = curl_exec ($ch);
		$getCurlInfo = curl_getinfo($ch);
		$curlError = curl_error($ch);
		curl_close ($ch); // close curl handle
		if(!empty($curlError)) {
			$paramString = date('d-m-Y H:i:s') . ",  Audio Bulk upload, ".$curlError."<br />";
			file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
		}

		return array(
			'Content' => $content,
			'Info' => $getCurlInfo,
			'Error' => $curlError
		);
	}
	public function setS3Connection() {
		//return new Credentials('AKIAIEM5IQET5GYV6JZA', 'Bkf8oDJS9+MUyDAX5d/+ppCdT79flTHzES23AfaQ');
		return new Credentials(S3USER,S3PWD);
	}
	public function create_signed_url($asset_path, $private_key_filename, $key_pair_id, $expires) {
		// Build the policy.
		$canned_policy = '{"Statement":[{"Resource":"' . $asset_path . '","Condition":{"DateLessThan":{"AWS:EpochTime":'. $expires . '}}}]}';
		// Sign the policy.
		$signature = $this->rsa_sha1_sign($canned_policy, $private_key_filename);
		// Make the signature contains only characters that // can be included in a URL.
		$encoded_signature = $this->url_safe_base64_encode($signature);
		// Combine the above into a properly formed URL name
		return $asset_path . '?Expires=' . $expires . '&Signature=' . $encoded_signature . '&Key-Pair-Id=' . $key_pair_id;
	}
	public function rsa_sha1_sign($policy, $private_key_filename) {
		$signature = '';
		// Load the private key.
		$fp = fopen($private_key_filename, 'r');
		$private_key = fread($fp, 8192);
		fclose($fp);
		$private_key_id = openssl_get_privatekey($private_key);
		// Compute the signature.
		openssl_sign($policy, $signature, $private_key_id);
		// Free the key from memory.
		openssl_free_key($private_key_id);
		return $signature;
	}
	public function url_safe_base64_encode($value) {
		$encoded = base64_encode($value);
		// Replace characters that cannot be included in a URL.
		return str_replace(array('+', '=', '/'), array('-', '_', '~'), $encoded);
	}
    public function getClosestTemplateIdBitrate($search, $arr) {
        $closest = null;
        $data = [];
        foreach ($arr as $key => $item) {
            if($key == $search) {
                $data['templateId'] = $item;
                $data['bitrate'] = $key;
                break;
            }else if ($closest === null || abs($search - $closest) > abs($key - $search)) {
                $closest = $item;
                $data['templateId'] = $item;
                $data['bitrate'] = $key;
            }
        }
        return $data;
    }
	public function insertVideoDownloadUrl123() {
		$streaming_files_processed = array(
			'mp4' => 'false',
			'3gp' => 'false',
			'720p' => 'false',
			'480p' => 'false',
			'360p' => 'false',
			'240p' => 'false',
			'160p' => 'false',
		);
		$downloading_files_processed = array(
			'mp4' => 'false',
			'3gp' => 'false',
			'720p' => 'false',
			'480p' => 'false',
			'360p' => 'false',
			'240p' => 'false',
			'160p' => 'false',
		);
		$filename = $this->filename;
		$fileprop = pathinfo($filename);
		if( strtolower($this->fileParts[2]) == 'supporting'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'supporting_files/video_files/';
		}else if( strtolower($this->fileParts[2]) == 'preview'  ) { //or strtolower($this->fileParts[1]) == 'image'
			$folderName = 'preview_files/video_files/';
		}else {
			$folderName = 'video/';
		}
		$Video3gp = wowzaPath.$fileprop['filename'].'.3gp';
		$Video720p = wowzaPath.$fileprop['filename'].'_720p.mp4';
		$Video480p = wowzaPath.$fileprop['filename'].'_480p.mp4';
		$Video360p = wowzaPath.$fileprop['filename'].'_360p.mp4';
		$Video240p = wowzaPath.$fileprop['filename'].'_240p.mp4';
		$Video160p = wowzaPath.$fileprop['filename'].'_160p.mp4';

		$S3Video = downloadTempPath.basename($filename);
		$S3Video3gp = downloadTempPath.$fileprop['filename'].'.3gp';
		$S3Video720p = downloadTempPath.$fileprop['filename'].'_720p.mp4';
		$S3Video480p = downloadTempPath.$fileprop['filename'].'_480p.mp4';
		$S3Video360p = downloadTempPath.$fileprop['filename'].'_360p.mp4';
		$S3Video240p = downloadTempPath.$fileprop['filename'].'_240p.mp4';
		$S3Video160p = downloadTempPath.$fileprop['filename'].'_160p.mp4';

		$FileName3gp = $fileprop['filename'].'.3gp';
		$FileName720p = $fileprop['filename'].'_720p.mp4';
		$FileName480p = $fileprop['filename'].'_480p.mp4';
		$FileName360p = $fileprop['filename'].'_360p.mp4';
		$FileName240p = $fileprop['filename'].'_240p.mp4';
		$FileName160p = $fileprop['filename'].'_160p.mp4';

		$streaming_url = '-';

		if(copy($Video3gp, $this->folderName.$FileName3gp)) {
			$fileprop1 = pathinfo($this->folderName.$FileName3gp);
			$downloading_files_processed['3gp'] = 'true';
			$streaming_files_processed['3gp'] = $this->copyFileToDownloadfolder($Video3gp,$S3Video3gp);
			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop['filename'].'.3gp';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop1['filename'].'.3gp';
			$width = 176;
			$height = 144;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video3gp,$downloading_files_processed['3gp'],$streaming_files_processed['3gp']);
		}

		if(copy($Video720p, $this->folderName.$FileName720p)) {
			$fileprop2 = pathinfo($this->folderName.$FileName720p);
			$downloading_files_processed['720p'] = 'true';
			$streaming_files_processed['720p'] = $this->copyFileToDownloadfolder($Video720p,$S3Video720p);
			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop2['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop2['filename'].'.mp4';
			$width = 640;
			$height = 320;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video720p,$downloading_files_processed['720p'],$streaming_files_processed['720p']);
		}

		if(copy($Video480p, $this->folderName.$FileName480p)) {
			$fileprop3 = pathinfo($this->folderName.$FileName480p);
			$downloading_files_processed['480p'] = 'true';
			$streaming_files_processed['480p'] = $this->copyFileToDownloadfolder($Video480p,$S3Video480p);

			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop3['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop3['filename'].'.mp4';
			$width = 640;
			$height = 320;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video480p,$downloading_files_processed['480p'],$streaming_files_processed['480p']);
		}

		if(copy($Video360p, $this->folderName.$FileName360p)) {
			$fileprop4 = pathinfo($this->folderName.$FileName360p);
			$downloading_files_processed['360p'] = 'true';
			$streaming_files_processed['360p'] = $this->copyFileToDownloadfolder($Video360p,$S3Video360p);
			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop4['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop4['filename'].'.mp4';
			$width = 640;
			$height = 320;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video360p,$downloading_files_processed['360p'],$streaming_files_processed['360p']);
		}

		if(copy($Video240p, $this->folderName.$FileName240p)) {
			$fileprop5 = pathinfo($this->folderName.$FileName240p);
			$downloading_files_processed['240p'] = 'true';
			$streaming_files_processed['240p'] = $this->copyFileToDownloadfolder($Video240p,$S3Video240p);
			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop5['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop5['filename'].'.mp4';
			$width = 480;
			$height = 240;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video240p,$downloading_files_processed['240p'],$streaming_files_processed['240p']);
		}

		if(copy($Video160p, $this->folderName.$FileName160p)) {
			$fileprop6 = pathinfo($this->folderName.$FileName160p);
			$downloading_files_processed['160p'] = 'true';
			$streaming_files_processed['160p'] = $this->copyFileToDownloadfolder($Video160p,$S3Video160p);
			$original_processed = 0;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop6['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.$fileprop6['filename'].'.mp4';
			$width = 240;
			$height = 160;
			$templateID = $this->getTemplateIdForHeightWidth(array('width' => $width,'height' => $height));
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video160p,$downloading_files_processed['160p'],$streaming_files_processed['160p']);
		}

		if (file_exists($filename)) { // no need to copy to metadata folder, it already exist
			$downloading_files_processed['mp4'] = 'true';
			$streaming_files_processed['mp4'] = $this->copyFileToDownloadfolder($filename,$S3Video);

			$original_processed = 1;
			$cf_url_base = $this->folderName.basename($filename);
			$cf_url = $this->folderName.$fileprop['filename'].'.mp4';
			$cf_absolute_url = $this->folderName.basename($filename);
			$downloading_url = CDN_DOWNLOAD.$folderName.basename($filename);
			$templateID = $this->allTemplateIDs['othervideo'];
			$this->addContentFile($templateID,$original_processed,$cf_url_base,$cf_url,$cf_absolute_url,$streaming_url,$downloading_url);
			$this->uploads3Video($S3Video,$downloading_files_processed['mp4'],$streaming_files_processed['mp4']);
		}
		// If file exists and all files processed
		if( file_exists($filename) and
			$streaming_files_processed['mp4'] == 'true' and $streaming_files_processed['3gp'] == 'true' and
			$streaming_files_processed['720p'] == 'true' and $streaming_files_processed['480p'] == 'true' and
			$streaming_files_processed['360p'] == 'true' and $streaming_files_processed['240p'] == 'true' and
			$streaming_files_processed['160p'] == 'true' and
			$downloading_files_processed['3gp'] == 'true' and $downloading_files_processed['3gp'] == 'true' and
			$downloading_files_processed['720p'] == 'true' and $downloading_files_processed['480p'] == 'true' and
			$downloading_files_processed['360p'] == 'true' and $downloading_files_processed['240p'] == 'true' and
			$downloading_files_processed['160p'] == 'true' ) {
			unlink($filename);
		}
	}

}
?>
