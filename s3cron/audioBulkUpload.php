<?php
/**
 * Created by PhpStorm.
 * User: sujata.patne
 * Date: 18-02-2016
 * Time: 14:20
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('error_reporting', 32767);
ini_set('max_execution_time', 0); 
ini_set("memory_limit", "-1");

//phpinfo(); exit;
header("access-control-allow-origin: *");

require_once "Hashids/Hashids.php";
require '/var/www/utility/PHPExcelClasses/PHPExcel/IOFactory.php';

//require_once 'Classes/PHPExcel/IOFactory.php';
define('filePath', '/MetadataFiles/Audio/');
require 'cronHelper/cron.helper.php';

//define('iconLogsPath', '/var/www/icon/content_ingestion/logs/s3BucketLogs/'); 

//define('iconTempPath', '/var/www/icon/content_ingestion/public/temp/');
//define('metaDataPath', '/var/www/icon/content_ingestion/public/MetadataFiles/Audio/');
 
//define('vendorPath', '/var/www/icon/content_ingestion/public/Vendors/'); //Fire in the belly\Audio_Hindi.xlsx';
//define('ICON_HOST', "http://114.143.181.228/v3/"); // icon api
//define('ICON_HOST', "http://103.43.2.5/v3/"); // icon api

//*define('ICON_HOST', "http://10.64.12.132/v3/"); // icon api
define('SITE_MODE', 1); // icon api

if( SITE_MODE == 1){
	define('BUCKET',"stagingd2c");
	define('s3BucketUrl','stagingd2c.s3.amazonaws.com');
	define('iconLogsPath', '/var/www/var/www/ContentIngestion/logs/s3BucketLogs/');
	define('iconTempPath', '/var/www/var/www/ContentIngestion/public/temp/');
	define('metaDataPath', '/var/www/var/www/ContentIngestion/public/MetadataFiles/Audio/');
	define('vendorPath', '/var/www/var/www/ContentIngestion/public/Vendors/'); //Fire in the belly\Audio_Hindi.xlsx';
	//define('ICON_HOST', "http://114.143.181.228/v3/"); // icon api
    define('ICON_HOST', "http://192.168.1.174:9875/v3/"); // icon api

    require '/var/www/utility/aws/aws-autoloader.php';
	

}else{
	define('BUCKET',"direct2consumer");
	define('s3BucketUrl','direct2consumer.s3.amazonaws.com');
	define('iconLogsPath', '/var/www/icon/content_ingestion/logs/s3BucketLogs/');
	define('iconTempPath', '/var/www/icon/content_ingestion/public/temp/');
	define('metaDataPath', '/var/www/icon/content_ingestion/public/MetadataFiles/Audio/');
	define('vendorPath', '/var/www/icon/content_ingestion/public/Vendors/'); //Fire in the belly\Audio_Hindi.xlsx';
	define('ICON_HOST', "http://10.64.12.132/v3/"); // icon api
	require '/var/www/utility/aws/aws-autoloader.php';
	
}

ini_set("error_log", iconLogsPath."php_error.log");

define('S3USER', 'AKIAIEM5IQET5GYV6JZA'); // icon api
define('S3PWD', 'Bkf8oDJS9+MUyDAX5d/+ppCdT79flTHzES23AfaQ'); // icon api
define('CDN_DOWNLOAD', 'http://d12m6hc8l1otei.cloudfront.net/');
//$credentials = new Credentials('AKIAIEM5IQET5GYV6JZA', 'Bkf8oDJS9+MUyDAX5d/+ppCdT79flTHzES23AfaQ');
define('FILE', 'audiobulk'); // icon api

/* if( SITE_MODE == 1){
	require '/var/www/utility/aws/aws-autoloader.php';
}else{
	require '/var/www/utility/aws/aws-autoloader.php';
} */

use Aws\Common\Aws;
use Aws\S3\S3Client;
use Aws\Common\Credentials\Credentials;
use Aws\S3\Exception\S3Exception;
use Guzzle\Http\EntityBody;
use Guzzle\Plugin\Log\LogPlugin;

function is_dir_empty($dir) {
    if (!is_readable($dir)) return NULL;
    return (count(scandir($dir)) == 2);
}

if(($pid = cronHelper::lock(FILE)) !== FALSE) {
    if (is_dir_empty(iconTempPath)) {
        echo "Fail";
    } else {
        $obj = new UploadFromExcel();
        $obj->uploadBulkAudio();
        //$obj->uploadS3Bucket();
    }
    cronHelper::unlock(FILE);
} else {
    echo "Cron already in progress...";
}
class UploadFromExcel {
    public $dbConnection;
    public $vendors;
    public $hashids;
    public $cm_id;
    public $zip_cm_id;
    public $credentials;
    public $templateIDs;

    public function __construct() {
        $this->hashids = new Hashids\Hashids('content ingestion', 8);
        $this->templateIDs = (array)$this->getTemplateIdForBitrate();
        $this->vendors = $this->getVendors();
        //$this->credentials = $this->setS3Connection(S3USER,S3PWD);
        $this->credentials = $this->setS3Connection();
        $this->key_pair_id = 'APKAI6KQIZYCKQ2ZFREA';
        $this->private_key_filename = 'lib/pk-APKAI6KQIZYCKQ2ZFREA.pem';
        $this->expires = time() + (300); // (5 minutes from now in UNIX timestamp);

    }

    public function executePostCurl($url, $data, $isJSON = 1){
		$generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';
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
		
		if(!empty($curlError)){
			$paramString = date('d-m-Y H:i:s') . ",  Audio Bulk upload, ".$curlError."<br />";
			file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
		}
        return array(
            'Content' => $content,
            'Info' => $getCurlInfo,
            'Error' => $curlError
        );
    }

    public function executeCurl($url){
	$generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $content = curl_exec ($ch);
        $getCurlInfo = curl_getinfo($ch);
        $curlError = curl_error($ch);
        curl_close ($ch); // close curl handle
		if(!empty($curlError)){
			$paramString = date('d-m-Y H:i:s') . ",  Audio Bulk upload, ".$curlError."<br />";
			file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
		}
		
        return array(
            'Content' => $content,
            'Info' => $getCurlInfo,
            'Error' => $curlError
        );
    }
   
    public function extractZipFileOld($vendorName){
        foreach (glob(vendorPath . $vendorName . "/Audio/*.zip") as $filename) {
            $this->openZipArchive($vendorName,$filename);
        }
    }
    
	public function extractZipFile($vendorName){
		$generalLog = vendorPath . $vendorName . '/bulkLogs/general_log_file_'.date('Y-m-d').'.log';
		$files = glob(vendorPath . $vendorName . "/Audio/*.zip");
		if (count($files) > 0){
			foreach ($files as $filename) {
				$extractCmdId = pathinfo($filename);
				//echo "<pre>"; print_r($extractCmdId); 
				$cmdId = $extractCmdId['filename'];
				$cm_ids = $this->hashids->decode($cmdId);
				echo $this->zip_cm_id = $cm_ids[0];

				$checkIsBulkUploadAllowed = $this->checkIsBulkUploadAllowed(array("cm_id" => $this->zip_cm_id));
				if(isset($checkIsBulkUploadAllowed) && $checkIsBulkUploadAllowed > 0 ){
					shell_exec('/usr/bin/unzip '.addcslashes  ($filename,' ') .' -d '. vendorPath . addcslashes  ($vendorName,' '). '/Audio/Files/');
					$path = vendorPath . addcslashes  ($vendorName,' '). '/Audio/Files/';
					shell_exec("chmod -R 0777 ".$path);
					shell_exec("chown -R iconadmin:".$path);
					//shell_exec("mv ".addcslashes ($filename,' ')." ".vendorPath . addcslashes  ($vendorName,' '). '/Audio/processedFiles/'.$extractCmdId['basename']);
					echo "processing zip file.";

					$paramString = date('d-m-Y H:i:s') . ",  Zip file MetadataID (".$this->zip_cm_id.") for ".$cmdId." is extracted successfully."."<br />";
					file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
					break;
				}else{
					//echo "Zip file MetadataID (".$this->zip_cm_id.") is not valid or not allowed for bulk upload."."<br />";
					$paramString = date('d-m-Y H:i:s') . ",  Zip file MetadataID (".$this->zip_cm_id.") for ".$cmdId." is not valid or not allowed for bulk upload."."<br />";
					file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
				}
			}
		}else{
			if(file_exists (vendorPath . $vendorName . '/bulkLogs')){
				$paramString = date('d-m-Y H:i:s') . ",  Zip file MetadataID (".$this->zip_cm_id.") not exist with extension .zip for vendor : ".$vendorName.".<br />";
				file_put_contents($generalLog, "\n" . $paramString. PHP_EOL, FILE_APPEND);
			}			
		}	
    }

    public function uploadBulkAudio() {
        if(count($this->vendors) > 0) {

            foreach ($this->vendors as $key => $vendor) {
               // echo "<pre>"; print_r($key);                echo "<pre>"; print_r($vendor);
                $generalLog = vendorPath . $key . '/bulkLogs/general_log_file_' . date('Y-m-d') . '.log';
                $unzip = $this->extractZipFile($key);
                $files = glob(vendorPath . $key . "/Audio/Files/*.{xls,xlsx,csv}", GLOB_BRACE);
                //echo "<pre>"; print_r($files);
                if (count($files) > 0) {
                    foreach ($files as $filename) {
                        $extractCmdId = pathinfo($filename);
                        $cmdId = $extractCmdId['filename'];
                        $cm_ids = $this->hashids->decode($cmdId);
                        $this->cm_id = $cm_ids[0];
                        //if($this->zip_cm_id == $this->cm_id){
                        $checkIsBulkUploadAllowed = $this->checkIsBulkUploadAllowed(array("cm_id" => $this->cm_id));
                        if (isset($checkIsBulkUploadAllowed) && $checkIsBulkUploadAllowed > 0) {
                            if ($this->cm_id != '' && $this->cm_id != null && $this->cm_id != 'undefined') {
                                if ($this->cm_id != '' && $this->isContentMetadataExist(array('cm_id' => $this->cm_id)) > 0) {
                                    $sheetData = $this->readExcelData($filename);
                                    //echo "<pre>"; print_r($sheetData);
                                    if (!empty($sheetData)) {
                                        $this->getSheetData($sheetData, $key);
                                        unlink($filename);
                                    } else {
                                        // echo "Data Not exist in ExcelSheet : ".$filename.". <br />";
                                        $paramString = date('d-m-Y H:i:s') . ",  Data Not exist in ExcelSheet : " . $filename . ".<br />";
                                        file_put_contents($generalLog, "\n" . $paramString . PHP_EOL, FILE_APPEND);
                                    }
                                } else {
                                    //echo $cmdId . " Not exist. <br />";
                                    $paramString = date('d-m-Y H:i:s') . ",  " . $cmdId . " Not exist for : " . $filename . "<br />";
                                    file_put_contents($generalLog, "\n" . $paramString . PHP_EOL, FILE_APPEND);
                                }
                            } else {
                                //echo "Invalid ".$cmdId ." <br />";
                                $paramString = date('d-m-Y H:i:s') . ",  Invalid " . $cmdId . " for file " . $filename . "<br />";
                                file_put_contents($generalLog, "\n" . $paramString . PHP_EOL, FILE_APPEND);
                            }
                        } else {
                            //echo "Bulk upload is not eligible for Content Metadata ID - ".$this->cm_id." for file ".$filename."<br />";
                            $paramString = date('d-m-Y H:i:s') . ",  Bulk upload is not eligible for Content Metadata ID - " . $this->cm_id . " for file " . $filename . "<br />";
                            file_put_contents($generalLog, "\n" . $paramString . PHP_EOL, FILE_APPEND);
                        }
                    }
                    break;
                } else {
                    echo "No Zip file found for vendor : ".$key."<br />";
                    if (file_exists(vendorPath . $key . '/bulkLogs')) {
                        $paramString = date('d-m-Y H:i:s') . ",  Excel file not exist with extension .xlsx in zip file for vendor : " . $key . ".<br />";
                        file_put_contents($generalLog, "\n" . $paramString . PHP_EOL, FILE_APPEND);
                    }
                }
            }
        }else{
            echo "Vendors not found...";
        }
    }

    public function readExcelData($inputFileName) {
        try {
            $sheetData = [];
            if (!file_exists($inputFileName)) {
                throw new Exception("Could not open " . $inputFileName . " for reading! File does not exist.");
            }else{
                $inputFileType = PHPExcel_IOFactory::identify($inputFileName);

                if(!$inputFileType) throw new Exception($inputFileType->load_error(),1);

                $objReader = PHPExcel_IOFactory::createReader($inputFileType);
                if(!$objReader) throw new Exception($objReader->load_error(),1);

                $objPHPExcel = $objReader->load($inputFileName);
                if(!$objPHPExcel) throw new Exception($objPHPExcel->load_error(),1);
                //$worksheetNames = $objReader->listWorksheetNames($inputFileName);
                //foreach ($worksheetNames as $worksheet) {
                    $sheet = $objPHPExcel->getSheet(0);
                    $sheetData = $objPHPExcel->getActiveSheet()->toArray(null, true, true, true);
                    reset($sheetData);             //Remove first/header row from sheet
                    $key = key($sheetData);
                    unset($sheetData[$key]);
                //}
            }
            return $sheetData;
        } catch (Exception $e) {
            //echo ('Error loading file "' . pathinfo($inputFileName, PATHINFO_BASENAME) . '": ' . $e->getMessage());

            die('Error loading file "' . pathinfo($inputFileName, PATHINFO_BASENAME) . '": ' . $e->getMessage());
        }
    }

    public function getSheetData($object, $vendorName) {
        $logPath = vendorPath.$vendorName.'/bulkLogs/';

        $logSuccess = $logPath.$vendorName.'_'.$this->cm_id.'_file_success-'.date('Y-m-d').'.log';
        $logFail = $logPath.$vendorName.'_'.$this->cm_id.'_file_fail-'.date('Y-m-d').'.log';
         
        $allFileProcessed = true;
        $metadataStatus = $this->getMetadataStatus(array("cm_id" => $this->cm_id));
        foreach ($object as $key => $obj) {
            if ( $obj['A'] != "" && $obj['A'] && $obj['B'] != "" && $obj['B']) {
                $file_ext = explode(".", $obj['B'])[1];
                $cfId = $this->getMaxCFId();
                $childId = $this->getMaxMetaContentId();
                $uploadAudioFile = vendorPath . $vendorName . "/Audio/Files/" . $obj['B'];
                if (file_exists($uploadAudioFile) && $file_ext == 'mp3' ) {
                    $cfId = intval($cfId + 1);
                    $childId = intval($childId + 1);
                    $data = [];
                    $unlinkPath = metaDataPath.$this->cm_id . '_' . $childId . '.' . $file_ext;

                    if( copy($uploadAudioFile, $unlinkPath) ){
                        $bitRateData = shell_exec('ffprobe -v error -show_entries stream=bit_rate -of default=noprint_wrappers=1 ' . $unlinkPath);
                        $bitRate = explode('=',$bitRateData);
                        $currentBitRate = (string)intval($bitRate[1] / 1000);
                        //echo "currentBitRate for ".$obj['B']." : ".$currentBitRate."<br />";
                        unlink($unlinkPath);
                        //echo "unlinked file : ". $obj['B']."<br />";;
                        $templateIDBitrate = $this->getClosestTemplateIdBitrate($currentBitRate,$this->templateIDs);
                        //echo "<pre>"; print_r($templateIDBitrate);
                        //$templateID = $this->getClosestTemplateId($currentBitRate,$this->templateIDs);
                        $templateID = $templateIDBitrate['templateId'];
                        $closestBitRate = $templateIDBitrate['bitrate'];
                        //echo "closestBitRate : ".$closestBitRate . "<br />";
                        $filename = $this->cm_id . '_' . $childId .'_' . $closestBitRate . '.' . $file_ext;
                        //echo "filename : ".$filename. "<br />";
                        $tempPath = iconTempPath . $filename;
                        $newPath = metaDataPath . $filename;
                        $filePath = filePath . $filename;
			$downloading_url = CDN_DOWNLOAD . 'audio/'.$filename;
            		$streaming_url = CDN_DOWNLOAD . 'audio/'.$filename;
                        $data = array(
                            'cf_id' => $cfId,
                            'cf_cm_id' => $this->cm_id,
                            'cf_original_processed' => 1,
                            'cf_url_base' => $filePath,
                            'cf_url' => $filePath,
                            'cf_absolute_url' => $filePath,
                            'cf_template_id' => $templateID,
                            'cf_name' => $obj['A'],
                            'cf_name_alias' => $childId,
			    'file_category_id' => 1,
			    'cf_bitrate' => $closestBitRate,
				'cf_streaming_url'  =>  $streaming_url,
                    	'cf_downloading_url'    =>  $downloading_url,
                            'cf_created_on' => date('Y-m-d h:i:s'),
                            'cf_modified_on' => date('Y-m-d h:i:s')
                        );  
                        if(copy($uploadAudioFile, $newPath) && copy($newPath, $tempPath) ){
							shell_exec("chmod -R 0777 ".$tempPath);
							shell_exec("chmod -R 0777 ".$newPath);

							$paramString = date('d-m-Y H:i:s') . ", Audio, file " . basename($uploadAudioFile) ." having bitrate ".$currentBitRate." copied to MetadataFiles successfully.";
                            file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
							$fileExist = $this->isContentFileExist($data);		
                            if ($this->insertContentFile($data) && $fileExist == 0) {
			
$data1 = array(
                    		'cf_id' =>  $cfId,
                    		'cf_streaming_url'  =>  $streaming_url,
                    		'cf_downloading_url'    =>  $downloading_url
                    );
 echo "<pre>"; print_r($data1);
                   // $this->updateContentFiles($data); 

								if($closestBitRate > 32){
									$this->fileConversion($closestBitRate, $vendorName, $childId, $obj['A'],$newPath,$uploadAudioFile);
								}else{
									unlink($uploadAudioFile);
								}								
                                //echo "Audio file " .basename($uploadAudioFile) ." having bitrate ".$currentBitRate." uploaded successfully."."<br />";
                                $paramString = date('d-m-Y H:i:s') . ", Audio, file " . basename($uploadAudioFile) ." having bitrate ".$currentBitRate." uploaded successfully.";
                                file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                                
                            } else {
                                $allFileProcessed = false;
                                echo "Audio file already exist - " .basename($uploadAudioFile)."<br />";
                                $paramString = date( 'd-m-Y H:i:s') . ", Audio file " .basename($uploadAudioFile) . "already exist so replaced successfully";
                                file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                            }
                        }else{
                            $allFileProcessed = false;
                           // echo "Audio file already exist - " .basename($uploadAudioFile)."<br />";
                            $paramString = date('d-m-Y H:i:s') . ', Audio file already exist - ' .basename($uploadAudioFile)."<br />";
                            file_put_contents($logFail, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                        }
                    }
                }
                else {
                    $allFileProcessed = false;
                    //echo "Audio file not found - " .basename($uploadAudioFile)."<br />";
                    $paramString = date('d-m-Y H:i:s') . ', Audio file not found - ' . basename($uploadAudioFile)."<br />";
                    file_put_contents($logFail, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                }
            }else{
                $allFileProcessed = false;
                //echo "Name not found against file - " .$obj['B']."<br />";
                $paramString = date('d-m-Y H:i:s') . ', Name not found against file - ' . $obj['B'];
                file_put_contents($logFail, "\n" . $paramString . PHP_EOL, FILE_APPEND);
            }
        }
        if($metadataStatus < 2){ // && $allFileProcessed == true
            $data1 = array(
                'cm_id' =>  $this->cm_id,
                'cm_state'  =>  2,
                'cm_modified_on' => date('Y-m-d h:i:s')
            );
            $this->updateContentMetadata($data1);
           // echo "Changed status of MetadataId  - " .$this->cm_id." to Ready To Moderate.<br />";
            $paramString = date('d-m-Y H:i:s') . ', Changed status of MetadataId  - ' .$this->cm_id.' to Ready To Moderate.';
            file_put_contents($logSuccess, "\n" . $paramString . PHP_EOL, FILE_APPEND);
        }

        //$this->uploadS3Bucket();

    }

    public function getClosestTemplateIdBitrate($search, $arr) {
        $closest = null;
        $data = [];
        foreach ($arr as $key => $item) {
           // echo "$$$".$key. "<br />";            echo "%%%".$search."<br />";

            if($key == $search){
                $data['templateId'] = $item;
                $data['bitrate'] = $key;
                break;
            }else if ($closest === null || abs($search - $closest) > abs($key - $search)) {
                $closest = $item;
                $data['templateId'] = $item;
                $data['bitrate'] = $key;
            }/*else{
					echo "!3"; echo "<br />";
					$data['templateId'] = $item;
					$data['bitrate'] = $key;
					break;
				}*/
        }

        return $data;
    }

    public function fileConversion($currentBitRate, $vendorName, $childId, $userName,$newPath,$uploadAudioFile){
        $logPath = vendorPath.$vendorName.'/bulkLogs/';
        $logSuccess = $logPath.$vendorName.'_'.$this->cm_id.'_file_success-'.date('Y-m-d').'.log';
        $logFail = $logPath.$vendorName.'_'.$this->cm_id.'_file_fail-'.date('Y-m-d').'.log';

        $file_ext = explode(".", $uploadAudioFile)[1];
       
        foreach ($this->templateIDs as $key => $item) {
            //echo "file name : ". $uploadAudioFile. "current : ".$currentBitRate ." loop : ". $key. "<br />";
            if($currentBitRate > $key){
                $filename = $this->cm_id . '_' . $childId .'_' . $key . '.' . $file_ext;
                $tempPath = iconTempPath . $filename;
					
                $convertedFilePath = metaDataPath.$filename;
                //echo "convertedFilePath : ".$convertedFilePath."<br />";
                shell_exec('ffmpeg -i '.$newPath.' -vn -ar 44100 -ac 2 -ab '.$key.'k -f mp3 '.$convertedFilePath);
				shell_exec("chmod -R 0777 ".$convertedFilePath);
				
				$paramString = date('d-m-Y H:i:s') . ', Audio file ' .basename($uploadAudioFile) .' converted to '.$key.' bitrate successfully.';
                file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
				
				if($key == 32){
					unlink($uploadAudioFile);
				}
                $filePath = filePath . $filename;
                $templateID = $item;
				
                if (file_exists($convertedFilePath) && $file_ext == 'mp3' ) {
                    $cfId = $this->getMaxCFId();
                    //echo "cfId : " . $cfId . "<br />";
                    $cfId = intval($cfId + 1);
                    $downloading_url = CDN_DOWNLOAD . 'audio/'.$filename;		 
            	    $streaming_url = CDN_DOWNLOAD . 'audio/'.$filename;		 
                    $data = array(
                        'cf_id' => $cfId,
                        'cf_cm_id' => $this->cm_id,
                        'cf_original_processed' => 0,
                        'cf_url_base' => $filePath,
                        'cf_url' => $filePath,
                        'cf_absolute_url' => $filePath,
                        'cf_template_id' => $templateID,
                        'cf_name' => $userName,
                        'cf_name_alias' => $childId,
						'file_category_id' => 1,
						'cf_bitrate' => $key,	
                    	'cf_streaming_url'  =>  $streaming_url,
                    	'cf_downloading_url'    =>  $downloading_url,
                        'cf_created_on' => date('Y-m-d h:i:s'),
                        'cf_modified_on' => date('Y-m-d h:i:s')
                    );
                    //echo "Processing <br />";                    //echo "<pre>"; print_r($data);
                    if(copy($convertedFilePath, $tempPath) ){
						shell_exec("chmod -R 0777 ".$tempPath);
						$fileExist = $this->isContentFileExist($data);
						
                        if ($this->insertContentFile($data) && $fileExist == 0 ) {
				 		
$data1 = array(
                    		'cf_id' =>  $cfId,
                    		'cf_streaming_url'  =>  $streaming_url,
                    		'cf_downloading_url'    =>  $downloading_url
                    );
 echo "<pre>"; print_r($data1);
                    //$this->updateContentFiles($data); 

                          //  echo "Audio file " .basename($uploadAudioFile) ." inserted successfully."."<br />";
                            $paramString = date('d-m-Y H:i:s') . ', Audio file ' .basename($uploadAudioFile) .' inserted successfully.';
                            file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                        } else {
			    			echo 'Audio file ' .basename($uploadAudioFile) .' already exist so replaced successfully.';
                            $paramString = date('d-m-Y H:i:s') . ', Audio file ' .basename($uploadAudioFile) .' already exist so replaced successfully.';
                            file_put_contents($logSuccess, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                        }
                    }
                }else {
                    //echo "Audio file " .basename($uploadAudioFile) ." to ".$key." bitrate not converted successfully."."<br />";
                    $paramString = date('d-m-Y H:i:s') . ', Unsuccessful Audio Conversion '.$key.' bitrate -' . basename($uploadAudioFile);
                    file_put_contents($logFail, "\n" . $paramString. PHP_EOL, FILE_APPEND);
                }
            }
        }
    }

    public function addOperatorNameTune($data) {
        if ( $obj['C'] != "" && $obj['C']){
            $voId = $this->getMaxVOId();
            $countryOperatorId = $this->getCountryOperatorId(array("display_name" => $obj['C']));
            $voId = intval($voId + 1);
            $data1 = array(
                'id' => $voId,
                'content_file_cf_id' => intval($cfId),
                'operator_country_id' => $countryOperatorId,
                'created_on' => date('Y-m-d h:i:s'),
                'modified_on' => date('Y-m-d h:i:s')
            );
            if($this->isOperatorVcodeExist($data1) == 0 && $this->insertVcode($data1)){
                echo "Operator NameTune inserted successfully for user ".$obj['A']."<br />";
            }else{
                echo "Operator NameTune already exist for user".$obj['A']."<br />";
            }
        }
    }
    
	public function getVendors() {
        $url = ICON_HOST."store/getVendorsList";
        $result = $this->executeCurl($url); //$data
       // echo "<pre>"; print_r($result );

        $data = json_decode($result['Content'])->message;
        $vendors = $data->storeVendorDetails;
	//	echo "<pre>"; print_r($vendors);
         return $vendors;
    }
	
    public function checkIsBulkUploadAllowed($data) {

        $url = ICON_HOST."contents/checkIsBulkUploadAllowed";
//echo "<pre>"; print_r($data);
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data); //$data
	//	echo "<pre>"; print_r($result);

        $data = json_decode($result['Content'])->message;

        $checkIsBulkUploadAllowed = $data->checkIsBulkUploadAllowed;
//echo "<pre>"; print_r($checkIsBulkUploadAllowed );
        return $checkIsBulkUploadAllowed;
    }
    
	public function getCountryOperatorId($data) {

        $url = ICON_HOST."operators/getCountryOperatorId";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data); //$data
		$data = json_decode($result['Content'])->message;

        $operatorCountryId = $data->operatorCountryId;
        return $operatorCountryId;
    }

    public function isOperatorVcodeExist($data) {

        $url = ICON_HOST."operators/isOperatorVcodeExist";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data); //$data
		$data = json_decode($result['Content'])->message;
        $isOperatorVcodeExist = $data->isOperatorVcodeExist;
        return $isOperatorVcodeExist;
    }

    public function insertContentFile($data) {
        $url = ICON_HOST."contentFile/insertContentFiles";
        $cf_data = json_encode($data);
		//echo "<pre>"; print_r($cf_data);

        $result = $this->executePostCurl($url,$cf_data);
		//echo "<pre>"; print_r($result);
		$data = json_decode($result['Content'])->message;
		
        $insertContentFile = $data->contentFiles;
        return $insertContentFile;
    }
	
    public function updateContentMetadata($data) {
        $url = ICON_HOST."contents/updateContentMetadata";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data);
		//echo "<pre>"; print_r($result);
		$data = json_decode($result['Content'])->message;

        $updateContentMetadata = $data->contents;
        return $updateContentMetadata;
    }
    
    public function updateContentFiles($data) {
    	$url = ICON_HOST."contentFile/updateContentFiles";
    	$cf_data = json_encode($data);
		echo "<pre>"; print_r($cf_data);
    	$result = $this->executePostCurl($url,$cf_data);
    	echo "<pre>"; print_r($result);
    	$data = json_decode($result['Content'])->message;
    
    	$updateContentFiles = $data->contents;
		echo '$updateContentFiles';
		echo "<pre>"; print_r($updateContentFiles);
    	return updateContentFiles;
    }

    public function getMaxMetaContentId() { //$templateId
        $data = array(
            "cf_cm_id" => $this->cm_id
        );
        $data = json_encode($data);
        $url = ICON_HOST."contentFile/getMaxMetaContentId";
        $result = $this->executePostCurl($url,$data);
		$data = json_decode($result['Content'])->message;
        $maxChildId = $data->maxMCFID;
        return $maxChildId;
    }

    public function getMaxCFId() {
        $url = ICON_HOST."contentFile/getMaxCFId";
        $result = $this->executeCurl($url);
		$data = json_decode($result['Content'])->message;

        $cfId = $data->maxCFID;
        return $cfId;
    }

    public function getTemplateIdForLanguage() {
        $url = ICON_HOST."contentFile/getTemplateIdForLanguage";
        $data = array(
            "cf_cm_id" => $this->cm_id
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

    public function isContentFileExist($data) {
        $url = ICON_HOST."contentFile/isContentFileExist";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data);
	//echo "<pre>"; print_r($result);
	$data = json_decode($result['Content'])->message;
        $isContentFileExist = $data->isContentFileExist;
        return $isContentFileExist;
    }    

    public function isContentMetadataExist($data) {
        $url = ICON_HOST."contents/isContentMetadataExist";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;
        $isContentMetadataExist = $data->isContentMetadataExist;
        return $isContentMetadataExist;
    }
    
    public function getMaxVOId() {
        $url = ICON_HOST."operators/getMaxVOId";
        $result = $this->executeCurl($url);
		$data = json_decode($result['Content'])->message;
        $voId = $data->maxVOID;
        return $voId;
    }

    public function getMetadataStatus($data) {
        $url = ICON_HOST."contents/getMetadataStatus";
        $cf_data = json_encode($data);
        $result = $this->executePostCurl($url,$cf_data); //$data
		$data = json_decode($result['Content'])->message;

        //echo "<pre>"; print_r($result['Content']);
        $metadataStatus = $data->metadataStatus;
        return $metadataStatus;
    }

    public function insertVcode($data) {
        $url = ICON_HOST."operators/insertVcode";
        $cf_data = json_encode($data);
        // echo "<pre>"; print_r($cf_data);
        $result = $this->executePostCurl($url,$cf_data);
		$data = json_decode($result['Content'])->message;

        $insertVcode = $data->vcodes;
        return $insertVcode;
    }

    public function uploadS3Bucket(){

        $generalLog = iconLogsPath . 'general_log_file_'.date('Y-m-d').'.log';

        $metadataStatus = $this->getMetadataStatus(array("cm_id" => $this->cm_id));

        foreach (glob(iconTempPath."*.mp3") as $s3file) {

            $fileprop = pathinfo($s3file);
            $extension = pathinfo($s3file, PATHINFO_EXTENSION);
      //      $cfData = explode($s3file,'_');
            
 $downloading_url = CDN_DOWNLOAD . 'audio/'.$this->cm_id.'/'.$extension;		//. $fileprop['filename'];
            $streaming_url = CDN_DOWNLOAD . 'audio/'.$this->cm_id.'/'.$extension;		//. $fileprop['filename'];
            $finalimgname = basename($s3file);
            try {
                $s3 = S3Client::factory(array(
                    'credentials' => $this->credentials,
                    'scheme' => 'http'
                ));
                $CoverImage = array(
                    'Bucket' => BUCKET,
                    'Key' => 'audio/' . $finalimgname,
                    'Body' => EntityBody::factory(fopen($s3file, 'r+'))
                    //'ContentDisposition' => 'attachment; filename="' . $finalimgname . '"'
                );

                $result = $s3->putObject($CoverImage);
                echo $this->getS3FileUrl(CDN_DOWNLOAD . 'audio/'.$finalimgname);
				//echo $result['ObjectURL']; echo "<br />";
				//echo 'http://'.s3BucketUrl.'/audio'; echo "<br />";
                //if (stripos($result['ObjectURL'], 'http://direct2consumer.s3.amazonaws.com/audio') !== false) {
                if (stripos($result['ObjectURL'], 'http://'.s3BucketUrl.'/audio') !== false) {
                    echo "Audio File ".$finalimgname." uploaded on S3 bucket successfully. <br /> ";
                    $paramString = date('d-m-Y H:i:s') . ',Audio File '.$finalimgname.' uploaded on S3 bucket successfully.';
                    file_put_contents($generalLog, "\n" . $paramString, FILE_APPEND);

                    if (file_exists($s3file)) {
                        unlink($s3file);
                    }
                    $data = array(
                        'cm_id' =>  $this->cm_id,
                        'cm_streaming_url'  =>  $streaming_url,
                        'cm_downloading_url'    =>  $downloading_url
                    );
//echo "<pre>"; print_r($data);
                    if($metadataStatus <= 3){
                        $data['cm_state']  =  3;
                    }
                   // echo "<pre>"; print_r($data);
                    $this->updateContentMetadata($data);   

                   /* 
                    $data1 = array(
                    		'cf_id' =>  $cfData[0],
                    		'cf_streaming_url'  =>  $streaming_url,
                    		'cf_downloading_url'    =>  $downloading_url
                    );
 echo "<pre>"; print_r($data1);
                    $this->updateContentFiles($data); */
                } else {
                    echo "Audio File ".$finalimgname." not uploaded on S3 bucket. <br /> ";
                    $paramString = date('d-m-Y H:i:s') . ',Audio File '.$finalimgname.' not uploaded on S3 bucket.';
                    file_put_contents($generalLog, "\n" . $paramString, FILE_APPEND);
                }
            } catch (Exception $e) {
                echo ('Error connecting S3 Bucket : ' . $e->getMessage());
                //$paramString = date('d-m-Y H:i:s') . ',Error connecting S3 Bucket : ' . $e->getMessage();
                //file_put_contents($, "\n" . $paramString, FILE_APPEND);
                die('Error connecting S3 Bucket : ' . $e->getMessage());
            }
        }
    }
	
    public function getS3FileUrl($finalimgname){
        return $signed_url = $this->create_signed_url($finalimgname, $this->private_key_filename, $this->key_pair_id, $this->expires);
    }
    public function setS3Connection(){
        //return new Credentials('AKIAIEM5IQET5GYV6JZA', 'Bkf8oDJS9+MUyDAX5d/+ppCdT79flTHzES23AfaQ');
        return new Credentials(S3USER,S3PWD);
    }
    //Create the cloudfront signed URL
    public function create_signed_url($asset_path, $private_key_filename, $key_pair_id, $expires){
        // Build the policy.
        $canned_policy = '{"Statement":[{"Resource":"' . $asset_path . '","Condition":{"DateLessThan":{"AWS:EpochTime":'. $expires . '}}}]}';
        // Sign the policy.
        $signature = $this->rsa_sha1_sign($canned_policy, $private_key_filename);
        // Make the signature contains only characters that // can be included in a URL.
        $encoded_signature = $this->url_safe_base64_encode($signature);
        // Combine the above into a properly formed URL name
        //echo  $asset_path . '?Expires=' . $expires . '&Signature=' . $encoded_signature . '&Key-Pair-Id=' . $key_pair_id; exit;
        return $asset_path . '?Expires=' . $expires . '&Signature=' . $encoded_signature . '&Key-Pair-Id=' . $key_pair_id;
    }

    public function rsa_sha1_sign($policy, $private_key_filename){
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

    public function url_safe_base64_encode($value){
        $encoded = base64_encode($value);
        // Replace characters that cannot be included in a URL.
        return str_replace(array('+', '=', '/'), array('-', '_', '~'), $encoded);
    }

    public function openZipArchive($vendorName,$filename){
        echo $filename;
        $zip = new ZipArchive;
        echo $res = $zip->open($filename,ZipArchive::CREATE);
        if ($res === TRUE) {
            $zip->extractTo(vendorPath . $vendorName. '/Audio/Files/');
            //unlink($filename);
        } else {
            switch($res){
                case ZipArchive::ER_EXISTS:
                    $ErrMsg = "File already exists.";
                    break;

                case ZipArchive::ER_INCONS:
                    $ErrMsg = "Zip archive inconsistent.";
                    break;

                case ZipArchive::ER_MEMORY:
                    $ErrMsg = "Malloc failure.";
                    break;

                case ZipArchive::ER_NOENT:
                    $ErrMsg = "No such file.";
                    break;

                case ZipArchive::ER_NOZIP:
                    $ErrMsg = "Not a zip archive.";
                    break;

                case ZipArchive::ER_OPEN:
                    $ErrMsg = "Can't open file.";
                    break;

                case ZipArchive::ER_READ:
                    $ErrMsg = "Read error.";
                    break;

                case ZipArchive::ER_SEEK:
                    $ErrMsg = "Seek error.";
                    break;

                default:
                    $ErrMsg = "Unknow (Code $res)";
                    break;
            }
            echo ( 'ZipArchive Error:' . $ErrMsg);
        }
        $zip->close();
    }

}