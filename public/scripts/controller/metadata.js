
myApp.controller('metadataCtrl', function ($scope, $state, $http,$window, $stateParams, ngProgress,  Metadatas, _, Icon) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#addcontentmetadata').addClass('active');
    $scope.CurrentPage = $state.current.name;
    $scope.CurrentPage.indexOf("wallpaper") > -1 ? $('#wallpaper').addClass('active') : '';
    $scope.CurrentPage.indexOf("video") > -1 ? $('#video').addClass('active') : '';
    $scope.CurrentPage.indexOf("audio") > -1 ? $('#audio').addClass('active') : '';
    $scope.CurrentPage.indexOf("game") > -1 ? $('#appsgames').addClass('active') : '';
    $scope.CurrentPage.indexOf("text") > -1 ? $('#text').addClass('active') : '';

    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.Checked = true;

    $scope.PageTitle = $scope.CurrentPage.indexOf("add") > -1 ? "Add" : "Edit";
    $scope.OldMetadataRights = [];
    $scope.OldSingers = [];
    $scope.OldDirectors = [];
    $scope.OldCelebrities = [];
    $scope.OldKeywords = [];
    $scope.OldLanguages = [];
    $scope.OldPlatforms = [];
    $scope.open1 = false;
    $scope.open2 = false;
    $scope.SelectedBGSongType = '';
    $scope.BGDisplayTitle = '';
    //ngProgress.start();
    $scope.uploading = true;
    $scope.openDatepicker = function (evt) {
        $scope.open2 = false;
        evt.preventDefault();
        evt.stopPropagation();
        $scope.open1 = !$scope.open1;
    }
    $scope.openEndDatepicker = function (evt1) {
        $scope.open1 = false;
        evt1.preventDefault();
        evt1.stopPropagation();
        $scope.open2 = !$scope.open2;
    }
    $scope.openReleaseDatepicker = function (evt) {
        $scope.open1 = false;
        $scope.open2 = false;
        evt.preventDefault();
        evt.stopPropagation();
        $scope.open = !$scope.open;
    }

    function ReadPermission(Role) {
        if (Role == "Super Admin") {
            $scope.IsReadPermission = true;
            $scope.IsDisable = true;
        }
        $scope.VendorDisable = true;
        $scope.PropertyDisable = true;
        $scope.ContentTypeDisable = true;
        $scope.ResetVisible = true;
    }
    $scope.MetaId;
    try {
        if ($stateParams.id) {
            $scope.MetaId = Icon.GetDecode($stateParams.id);
        }
    }
    catch (err) {
        $window.location.href = err.message
    }
    //
    //Icon.GetEncode(
    ngProgress.start();
    Metadatas.getMetadata({ Id: $scope.MetaId, state: $scope.CurrentPage }, function (metadata) {
        // ngProgress.complete();
        $scope.uploading = false;
        $scope.UserRole = metadata.UserRole;
        $scope.VendorRights = metadata.VendorRights;
        $scope.PropertyRights = metadata.PropertyRights;

        $scope.CountryGroups = _.where(metadata.IconCountry, { group_status: "group" });
        $scope.IconOnlyCountry = _.where(metadata.IconCountry, { group_status: null })
        $scope.IconGroupCountry = metadata.IconGroupCountry;

        $scope.AllCountryDistributionRights = metadata.IconCountry;
        $scope.AllAllowedContentType = _.where(metadata.MasterList, { cm_name: "Content Type" });
        $scope.AllChannelDistributionRights = _.where(metadata.MasterList, { cm_name: "Channel Distribution" });
        $scope.Vendor = metadata.Vendors;
        $scope.AllProperty = metadata.Propertys;
        $scope.BGSongType = metadata.BGSongType;


        $scope.SubContentTypes = metadata.MetadataTypes;
        $scope.ParentContentType = metadata.MetadataTypes[0].parentname;

        $scope.Celebrity = _.where(metadata.filteredMasterList, { cm_name: "Celebrity" });
        $scope.Genres = _.where(metadata.filteredMasterList, { cm_name: "Genres" });
        $scope.SubGenres = _.where(metadata.filteredMasterList, { cm_name: "Sub Genres" });
        $scope.Mood = _.where(metadata.filteredMasterList, { cm_name: "Mood" });
        $scope.Nudity = _.where(metadata.MasterList, { cm_name: "Nudity" });
        $scope.Festival = _.where(metadata.filteredMasterList, { cm_name: "Festival" });
        $scope.Religion = _.where(metadata.filteredMasterList, { cm_name: "Religion" });
        $scope.Languages = _.where(metadata.filteredMasterList, { cm_name: "Languages" });
        $scope.SelfRanking = _.where(metadata.MasterList, { cm_name: "Self Ranking" });
        $scope.VideoQuality = _.where(metadata.MasterList, { cm_name: "Video Quality" });
        $scope.MusicDirectors = _.where(metadata.MasterList, { cm_name: "Music Directors" });
        $scope.Singers = _.where(metadata.MasterList, { cm_name: "Singers" });
        $scope.ReSingers = _.where(metadata.MasterList, { cm_name: "Singers" });
        $scope.SongTypes = _.where(metadata.MasterList, { cm_name: "Song Type" });
        $scope.Lyricists = _.where(metadata.MasterList, { cm_name: "Lyricist" });
        $scope.RaagTaal = _.where(metadata.filteredMasterList, { cm_name: "Raag Taal" });
        $scope.Instruments = _.where(metadata.filteredMasterList, { cm_name: "Instruments" });
        $scope.SupportAppPurchase = _.where(metadata.MasterList, { cm_name: "InAppPurchase" });
        $scope.Mode = _.where(metadata.MasterList, { cm_name: "Mode" });
        $scope.Platforms = _.where(metadata.MasterList, { cm_name: "Platform Supports" });
        $scope.loading = true;
        _.each(metadata.CatalogueMaster, function (item) {
            if (item.cm_name == "Photographer") {
                $scope.photographer_master = item.cm_id;
            }
            else if (item.cm_name == "Location") {
                $scope.location_master = item.cm_id;
            }
            else if (item.cm_name == "Search Keywords") {
                $scope.keyword_master = item.cm_id;
            }
        });

        if ($scope.CurrentPage.indexOf("edit") > -1) {
            metadata.ContentMetadata.length > 0 ? "" : location.href = "/";
            $scope.OldMetadataRights = metadata.MetadataRights;

            metadata.ContentMetadata.forEach(function (item) {
                $scope.ReleaseYear = item.cm_release_date;
                $scope.SelectedVendor = item.cm_vendor;
                $scope.VendorChange();
                $scope.OldProperty = item.cm_property_id;
                $scope.SelectedProperty = item.cm_property_id;
                $scope.PropertyChange();
                $scope.isPersonalized = item.cm_ispersonalized;
                $scope.cm_r_group_id = item.cm_r_group_id;
                $scope.ContentType = item.cm_content_type;

                $scope.SelectedBGSongType = parseInt (item.bg_sound_type);
                $scope.BGDisplayTitle = item.bg_song_title;

                $scope.celeb_group_id = item.cm_celebrity;
                $scope.DisplayTitle = item.cm_title;
                $scope.Description = item.cm_short_desc;
                $scope.SelectedGenres = item.cm_genre;
                $scope.photographer_id = item.cm_protographer;
                $scope.PhotoGrapher = item.p_name;
                $scope.SelectedMood = item.cm_mood;
                $scope.SelectedNudity = item.cm_nudity;
                $scope.SelectedSongType = item.cm_song_type;
                $scope.SelectedLyricist = item.cm_lyricist;
                $scope.location_id = item.cm_location;
                $scope.Location = item.l_name;
                $scope.Duration = toMinites(item.cm_content_duration);
                $scope.SelectedFestival = item.cm_festival_occasion;
                $scope.SelectedVideoQuality = item.cm_content_quality;
                $scope.SelectedReligion = item.cm_religion;
                $scope.SelectedSelfRanking = item.cm_rank;
                $scope.director_group_id = item.cm_music_director;
                $scope.singer_group_id = item.cm_singer;
                $scope.re_singer_group_id = item.cm_re_singer;
                $scope.lyrics_languages_group_id = item.cm_lyrics_languages;
                $scope.SelectedRaagTaal = item.cm_raag_tal;
                $scope.SelectedInstruments = item.cm_instruments;
                $scope.language_group_id = item.cm_language;
                $scope.cm_sub_genre_group_id = item.cm_sub_genre;
                //$scope.SelectedLanguages = item.cm_language;
                $scope.keyword_group_id = item.cm_key_words;
                $scope.platform_group_id = item.cm_platform_support;
                $scope.LongDescription = item.cm_long_description;
                $scope.SelectedSupportAppPurchase = item.cm_is_app_store_purchase;
                $scope.SelectedMode = item.cm_mode;
                $scope.ContentId = item.cm_cp_content_id;
                $scope.Startdate = new Date(item.cm_starts_from);
                $scope.Expirydate = new Date(item.cm_expires_on);
            })
            
            $scope.OldSingers = metadata.Singers;
            $scope.OldDirectors = metadata.Directors;
            $scope.OldReSingers = metadata.ReSingers;
            $scope.OldLyricsLanguages = metadata.LyricsLanguages;
            $scope.OldCelebrities = metadata.Celebrity;
            $scope.OldLanguages = metadata.Languages;
            $scope.OldSubGenres = metadata.SubGenres;
            $scope.OldPlatforms = metadata.Platforms;

            $scope.SelectedSubGenres = _.unique(_.pluck($scope.OldSubGenres, "cmd_entity_detail"));

            if ($scope.OldLanguages.length > 0) {
                if ($scope.CurrentPage.indexOf("game") > -1 || $scope.CurrentPage.indexOf("text") > -1) {
                    $scope.SelectedLanguages = _.unique(_.pluck($scope.OldLanguages, "cmd_entity_detail"));
                }
                else {
                    $scope.SelectedLanguages = $scope.OldLanguages[0].cmd_entity_detail;
                }
            }
            $scope.SelectedPlatforms = _.unique(_.pluck(metadata.Platforms, "cmd_entity_detail"));
            $scope.SelectedReSingers = _.unique(_.pluck(metadata.ReSingers, "cmd_entity_detail"));
            $scope.SelectedLyricsLanguages = _.unique(_.pluck(metadata.LyricsLanguages, "cmd_entity_detail"));
            $scope.SelectedSingers = _.unique(_.pluck(metadata.Singers, "cmd_entity_detail"));
            $scope.SelectedMusicDirectors = _.unique(_.pluck(metadata.Directors, "cmd_entity_detail"));
            $scope.SearchKeywords = _.pluck(metadata.Keywords, "cd_name").toString();
            $scope.OldKeywords = _.pluck(metadata.Keywords, "cd_id");
            $scope.SelectedCelebrity = _.unique(_.pluck(metadata.Celebrity, "cmd_entity_detail"));
            ReadPermission(metadata.UserRole);
        }
        else if ($scope.CurrentPage.indexOf("add") > -1 && metadata.UserRole == "Content Manager") {
            $scope.PropertyDisable = true;
            $scope.ContentTypeDisable = true;
            $scope.IsDisable = true;
            $scope.SelectedSubGenres = [];
        }
        else {
            $window.location.href = "/";
        }
        ngProgress.complete();
    }, function (error) {
        toastr.error(error);
        ngProgress.complete();
    })

    $scope.VendorChange = function () {
        $scope.PropertyDisable = $scope.SelectedVendor ? false : true;
        $scope.SelectedProperty = "";
        $scope.ContentTypeDisable = true;
        $scope.IsDisable = true;
        $scope.Property = _.where($scope.AllProperty, { cm_vendor: $scope.SelectedVendor });
        $scope.RightSettingShow = false;
        $scope.Startdate = "";
        $scope.Expirydate = "";
    }


    $scope.BackToContentCatalog = function () {
        $window.location.href = "#/content-catalog";
    }

    $scope.PropertyChange = function () {
        $scope.IsDisable = $scope.SelectedProperty ? false : true;
        $scope.ContentTypeDisable = $scope.SelectedProperty ? false : true;
        PropertyRights();
        var Prop = _.find($scope.AllProperty, function (prop) { return prop.cm_id == $scope.SelectedProperty; });
        if (Prop) {
            $scope.PropertyStartDate = Prop.cm_starts_from;
            $scope.PropertyEndDate = Prop.cm_expires_on;
            $scope.Startdate = new Date(Prop.cm_starts_from);
            $scope.Expirydate = new Date(Prop.cm_expires_on);
            $scope.PropertyReleaseDate = new Date(Prop.cm_release_date);
             if($scope.ReleaseYear == '' || $scope.ReleaseYear == undefined || $scope.ReleaseYear == null){
                $scope.ReleaseYear = $scope.PropertyReleaseDate;
            }
        }
        $scope.SelectedCountryRights = [];
        $scope.SelectedChannelRights = [];
        if ($scope.OldProperty == $scope.SelectedProperty) {
            var country = CheckGroupSelection(_.unique(_.pluck($scope.OldMetadataRights, "r_country_distribution_rights")));
            $scope.SelectedCountryRights = country;
            //  $scope.SelectedCountryRights = _.unique(_.pluck($scope.OldMetadataRights, "r_country_distribution_rights"));
            $scope.SelectedChannelRights = _.unique(_.pluck($scope.OldMetadataRights, "r_channel_distribution_rights"));
        }
    }
    function CheckGroupSelection(selectedcountry) {
        var country = [];
        var tempcountry1 = [];
        _.each($scope.CountryGroups, function (item) {
            var groupcountry = _.where($scope.IconGroupCountry, { cm_name: item.cd_name });
            var flag = false;
            var tempcountry2 = [];
            _.each(groupcountry, function (item1) {
                var match = _.find(selectedcountry, function (country) { return country == item1.cd_id });
                if (!match) {
                    flag = true;
                }
                else {
                    tempcountry2.push(match);
                }
            });
            if (!flag) {
                country.push(item.cd_id);
                _.each(tempcountry2, function (item1) {
                    tempcountry1.push(item1);
                });
            }
        });
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                if (!_.contains(tempcountry1, item)) {
                    country.push(item);
                }
            }
        });
        country = _.unique(country);

        return country;
    }

    function GetSelectedCountry(selectedcountry) {
        var country = [];
        var group = [];
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                country.push(item);
            }
            else {
                group.push(item);
            }
        });
        _.each(group, function (item) {
            var match = _.find($scope.CountryGroups, function (country) { return country.cd_id == item });
            if (match) {
                var groupcountry = _.where($scope.IconGroupCountry, { cm_name: match.cd_name });
                _.each(groupcountry, function (item) {
                    country.push(item.cd_id);
                });
            }
        });
        country = _.unique(country);
        return country;
    }

    function GetPropertyCountry(selectedcountry) {
        var country = [];
        var tempcountry1 = [];
        _.each($scope.CountryGroups, function (item) {
            var groupcountry = _.where($scope.IconGroupCountry, { cm_name: item.cd_name });
            var flag = false;
            var tempcountry2 = [];
            _.each(groupcountry, function (item1) {
                var match = _.find(selectedcountry, function (country) { return country == item1.cd_id });
                if (!match) {
                    flag = true;
                }
                else {
                    tempcountry2.push(match);
                }
            });
            if (!flag) {
                country.push(item);
                _.each(tempcountry2, function (item1) {
                    tempcountry1.push(item1);
                });
            }
        });
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                if (!_.contains(tempcountry1, item)) {
                    country.push(match);
                }
            }
        });
        country = _.unique(country);
        return country;
    }

    function PropertyRights() {
        $scope.CountryRights = [];
        $scope.ChannelRights = [];
        var PropertyRights = _.where($scope.PropertyRights, { cm_id: $scope.SelectedProperty });

        if (PropertyRights.length > 0) {
            if (PropertyRights[0].r_rights_at_content_level == 1) {
                $scope.RightSettingShow = true;
                var Countrys = _.unique(_.pluck(PropertyRights, "r_country_distribution_rights"));
                var Channels = _.unique(_.pluck(PropertyRights, "r_channel_distribution_rights"));

                //$scope.AllCountryDistributionRights.forEach(function (countrytype) {
                //    var right = _.find(Countrys, function (cnt) { return countrytype.cd_id == cnt; });
                //    if (right) {
                //        $scope.CountryRights.push(countrytype);
                //    }
                //});
                $scope.CountryRights = GetPropertyCountry(Countrys);
                $scope.AllChannelDistributionRights.forEach(function (channeltype) {
                    var right = _.find(Channels, function (cnt) { return channeltype.cd_id == cnt; });
                    if (right) {
                        $scope.ChannelRights.push(channeltype);
                    }
                });
            }
            else {
                $scope.SelectedCountryRights = [];
                $scope.SelectedChannelRights = [];
                $scope.RightSettingShow = false;
            }
        }
        else {
            $scope.SelectedCountryRights = [];
            $scope.SelectedChannelRights = [];
            $scope.RightSettingShow = false;
        }
    }

    $scope.resetform = function () {
        $scope.SelectedVendor = "";
        $scope.PropertyDisable = true;
        $scope.ContentTypeDisable = true;
        $scope.IsDisable = true;
        $scope.metaform.$setPristine();

    }

    function GetAddMasterlist(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return selected == old.cd_id });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    function GetDeleteMasterList(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return selected == old.cd_id });
            if (!data) {
                DeleteArray.push(old);
            }
        });
        return DeleteArray;
    }

    function GetAddRights(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return selected.r_allowed_content_type == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.r_channel_distribution_rights && old.r_country_distribution_rights == selected.r_country_distribution_rights });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    function GetDeleteRights(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return selected.r_allowed_content_type == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.r_channel_distribution_rights && old.r_country_distribution_rights == selected.r_country_distribution_rights });
            if (!data) {
                DeleteArray.push({ r_id: old.r_id, cmd_id: old.cmd_id });
            }
        });
        return DeleteArray;
    }

    function DurationCheck(duration) {
        if (duration) {
            var pieces = duration.split(":");
            if (pieces[0] && pieces[1]) {
                if ((!isNaN(pieces[0])) && (!isNaN(pieces[0]))) {
                    return "";
                }
                else {
                    return "Invalid Duration format. Duration format must be MI:SS";
                }
            }
            else {
                return "Invalid Duration format. Duration format must be MI:SS";
            }
        }
        else {
            return "";
        }
    }
    $scope.submitForm = function (isValid) {
        if (isValid) {
            var year = new Date().getFullYear();
            var ReleaseYear = new Date($scope.ReleaseYear).getFullYear();
            if($scope.ParentContentType == 'Audio' && $scope.ReleaseYear){
                var flag = (Datewithouttime($scope.ReleaseYear) >= Datewithouttime($scope.PropertyReleaseDate))?
                    (ReleaseYear > 1949 && ReleaseYear < (year + 2)) ?
                    Datewithouttime($scope.Startdate) <= Datewithouttime($scope.Expirydate) ?
                    Datewithouttime($scope.PropertyStartDate) <= Datewithouttime($scope.Startdate) && Datewithouttime($scope.PropertyEndDate) >= Datewithouttime($scope.Expirydate) ?
                    $scope.RightSettingShow ?
                    $scope.SelectedCountryRights.length > 0 ?
                    $scope.SelectedChannelRights.length > 0 ?
                    $scope.Duration ?
                    DurationCheck($scope.Duration) : ""
                    : "Please Select Channel Distribution rights." : "Please Select Country Distribution rights."
                    : "" : "Start & Expiry date should be within limit of Property limits."
                    : "Expire date must be equal or greater than start date." : "Release Year must be between 1950 to current year + 1.":"Metadata Release Date must be greater than or equal to Property Release date ";

             }else {
                var flag = Datewithouttime($scope.Startdate) <= Datewithouttime($scope.Expirydate) ? Datewithouttime($scope.PropertyStartDate) <= Datewithouttime($scope.Startdate) && Datewithouttime($scope.PropertyEndDate) >= Datewithouttime($scope.Expirydate) ? $scope.RightSettingShow ? $scope.SelectedCountryRights.length > 0 ? $scope.SelectedChannelRights.length > 0 ? $scope.Duration ? DurationCheck($scope.Duration) : "" : "Please Select Channel Distribution rights." : "Please Select Country Distribution rights." : "" : "Start & Expiry date should be within limit of Property limits." : "Expire date must be equal or greater than start date.";
            }

           /* if (flag != ''){
                toastr.error(flag);
            }*/
            if (flag == "") {
                var Rights = [];
                if ($scope.RightSettingShow) {
                    var selectedcountry = GetSelectedCountry($scope.SelectedCountryRights);
                    _.each(selectedcountry, function (country) {
                        _.each($scope.SelectedChannelRights, function (channel) {
                            Rights.push({ property_id: $scope.SelectedProperty, vendor_id: $scope.SelectedVendor, r_allowed_content_type: $scope.ContentType, r_country_distribution_rights: country, r_channel_distribution_rights: channel });
                        })
                    })
                }
                var addedrights = GetAddRights($scope.OldMetadataRights, Rights)
                if ($scope.CurrentPage.indexOf("edit") > -1 && $scope.UserRole == "Moderator" && addedrights.length > 0) {
                    toastr.error("you don't have permission to add new Metadata rights");
                }
                else {
                    var lang = [];
                    var subGenres = $scope.SelectedSubGenres;
                     if (!($scope.CurrentPage.indexOf("game") > -1 || $scope.CurrentPage.indexOf("text") > -1)) {
                        if ($scope.SelectedLanguages) {
                            lang.push($scope.SelectedLanguages);
                        }
                    }
                    else {
                        lang = $scope.SelectedLanguages;
                    }
                     var deletedrights = GetDeleteRights($scope.OldMetadataRights, Rights);
                    try {
                        var rel_date = null;
                        if($scope.ReleaseYear != ''){
                            rel_date = getDate($scope.ReleaseYear);
                        }
                        var meta = {
                            state: $scope.CurrentPage,
                            url: $scope.CurrentPage.indexOf("edit") > -1 ? '/editmetadata' : '/addmetadata',
                            cm_ispersonalized : $scope.isPersonalized,
                            photographer_master: $scope.photographer_master,
                            location_master: $scope.location_master,
                            keyword_master: $scope.keyword_master,
                            cm_id: $scope.MetaId,
                            cm_vendor: $scope.SelectedVendor,
                            cm_property_id: $scope.SelectedProperty,
                            cm_content_type: $scope.ContentType,
                            cm_r_group_id: $scope.cm_r_group_id,
                            cm_genre: $scope.SelectedGenres,
                            cm_sub_genre: $scope.cm_sub_genre_group_id,
                            cm_title: $scope.DisplayTitle,
                            cm_short_desc: $scope.Description,
                            cm_starts_from: getDate($scope.Startdate),
                            cm_expires_on: getDate($scope.Expirydate),
                            cm_display_title: $scope.DisplayTitle,
                            cm_mood: $scope.SelectedMood,

                            cm_release_date: rel_date,

                            bg_sound_type: $scope.SelectedBGSongType,
                            bg_song_title: $scope.BGDisplayTitle,
                            // cm_language: $scope.SelectedLanguages,
                            cm_nudity: $scope.SelectedNudity,
                            cm_festival_occasion: $scope.SelectedFestival,
                            cm_religion: $scope.SelectedReligion,
                            cm_cp_content_id: $scope.ContentId,
                            cm_content_duration: toSeconds($scope.Duration),
                            cm_content_quality: $scope.SelectedVideoQuality,
                            cm_raag_tal: $scope.SelectedRaagTaal,
                            cm_instruments: $scope.SelectedInstruments,
                            cm_long_description: $scope.LongDescription,
                            cm_mode: $scope.SelectedMode,
                            cm_is_app_store_purchase: $scope.SelectedSupportAppPurchase,
                            cm_rank: $scope.SelectedSelfRanking,
                            cm_song_type: $scope.SelectedSongType,
                            cm_lyricist: $scope.SelectedLyricist,
                            //single 
                            cm_protographer: $scope.photographer_id,
                            photographer: $scope.PhotoGrapher,

                            cm_location: $scope.location_id,
                            location: $scope.Location,
                            //multiselect
                            // $scope.SelectedReSingers = _.unique(_.pluck(metadata.ReSingers, "cmd_entity_detail"));
                            //  $scope.SelectedLyricsLanguages
                            //  $scope.re_singer_group_id = item.cm_re_singer;
                            //    $scope.lyrics_languages_group_id = item.cm_lyrics_languages;

                            cm_celebrity: $scope.celeb_group_id,
                            selectedCeleb: $scope.SelectedCelebrity,
                            celebrities: GetAddMasterlist($scope.OldCelebrities, $scope.SelectedCelebrity),
                            deletecelebrities: GetDeleteMasterList($scope.OldCelebrities, $scope.SelectedCelebrity),

                            selectedlyricslanguage: $scope.SelectedLyricsLanguages,
                            cm_lyrics_languages: $scope.lyrics_languages_group_id,
                            lyricslanguage: GetAddMasterlist($scope.OldLyricsLanguages, $scope.SelectedLyricsLanguages),
                            deletelyricslanguage: GetDeleteMasterList($scope.OldLyricsLanguages, $scope.SelectedLyricsLanguages),

                            cm_re_singer: $scope.re_singer_group_id,
                            selectedresinger: $scope.SelectedReSingers,
                            resingers: GetAddMasterlist($scope.OldReSingers, $scope.SelectedReSingers),
                            deleteresinger: GetDeleteMasterList($scope.OldReSingers, $scope.SelectedReSingers),

                            cm_singer: $scope.singer_group_id,
                            selectedsinger: $scope.SelectedSingers,
                            singers: GetAddMasterlist($scope.OldSingers, $scope.SelectedSingers),
                            deletesinger: GetDeleteMasterList($scope.OldSingers, $scope.SelectedSingers),

                            cm_music_director: $scope.director_group_id,
                            selecteddirector: $scope.SelectedMusicDirectors,
                            musicdirectors: GetAddMasterlist($scope.OldDirectors, $scope.SelectedMusicDirectors),
                            deletemusicdirectors: GetDeleteMasterList($scope.OldDirectors, $scope.SelectedMusicDirectors),

                            cm_key_words: $scope.keyword_group_id,
                            keywords: $scope.SearchKeywords.split(','),
                            deletekeywords: $scope.OldKeywords,

                            selectedplatform: $scope.SelectedPlatforms,
                            cm_platform_support: $scope.platform_group_id,
                            platform: GetAddMasterlist($scope.OldPlatforms, $scope.SelectedPlatforms),
                            deleteplatform: GetDeleteMasterList($scope.OldPlatforms, $scope.SelectedPlatforms),

                            selectedlanguage: lang,
                            selectedsubGenres: subGenres,
                            subGenres: GetAddMasterlist($scope.OldSubGenres, subGenres),
                            deletesubGenres: GetDeleteMasterList($scope.OldSubGenres, subGenres),

                            cm_language: $scope.language_group_id,
                            language: GetAddMasterlist($scope.OldLanguages, lang),
                            deletelanguage: GetDeleteMasterList($scope.OldLanguages, lang),

                            countryrights: $scope.SelectedCountryRights.length,
                            channelrights: $scope.SelectedCountryRights.length,
                            cm_parental_advisory: null,
                            cm_signature: null,
                            cm_state: 1,
                            cm_is_active: 1,
                            cm_thumb_url: null,
                            cm_comment: null,
                            cm_live_on: getDate($scope.Startdate),
                            addrights: addedrights,
                            deleterights: deletedrights
                        }
                        console.log(meta);
                        ngProgress.start();
                        Metadatas.AddEditMetaData(meta, function (data) {
                            if (data.success) {
                                $window.location.href = "#/submitmeta" + ($scope.CurrentPage.indexOf("edit") > -1 ? '/edit/' : '/add/') + data.contenttype + "/" + Icon.GetEncode(data.cm_id) + ($scope.CurrentPage.indexOf("edit") > -1 ? '/e' : '/a');
                                toastr.success(data.message);
                            }
                            else {
                                toastr.error(data.message);
                            }
                            ngProgress.complete();
                        }, function (err) {
                            toastr.error(err);
                            ngProgress.complete();
                        });
                    }
                    catch (err) {
                        toastr.error(err.message);
                    }
                }
            }
            else {
                toastr.error(flag);
            }
        }
    };
});

