var UserLiveFeedobj_loadErrorCallback;

var UserLiveFeedobj_UserLivePos = 0;
var UserLiveFeedobj_LivePos = -1;


function UserLiveFeedobj_StartDefault(pos) {
    if (UserLiveFeed_status[pos]) {
        if (UserLiveFeed_ThumbNull(pos + '_' + UserLiveFeed_FeedPosY[pos], UserLiveFeed_ids[0]))
            UserLiveFeed_LastPos[pos] = JSON.parse(document.getElementById(UserLiveFeed_ids[8] + pos + '_' + UserLiveFeed_FeedPosY[pos]).getAttribute(Main_DataAttribute))[6];
    } else {
        UserSidePannel_LastPos[pos] = null;
        UserLiveFeed_LastPos[pos] = null;
    }

    UserLiveFeed_itemsCount[pos] = 0;
    Main_empty(UserLiveFeed_obj[pos].div);
    if (UserLiveFeed_isFeedShow()) Main_RemoveClass(UserLiveFeed_obj[pos].div, 'opacity_zero');
    UserLiveFeed_status[pos] = false;
    document.getElementById(UserLiveFeed_obj[pos].div).style.left = "0.125em";
    UserLiveFeed_FeedPosY[pos] = 0;
    UserLiveFeed_idObject[pos] = {};

    Main_updateclock();
    Main_ShowElement('dialog_loading_side_feed');
}

function UserLiveFeedobj_CheckToken() {
    if (UserLiveFeed_status[UserLiveFeed_FeedPosX]) {
        if (UserLiveFeed_ThumbNull(Sidepannel_PosFeed, UserLiveFeed_side_ids[0]))
            UserSidePannel_LastPos[UserLiveFeedobj_UserLivePos] = JSON.parse(document.getElementById(UserLiveFeed_side_ids[8] + Sidepannel_PosFeed).getAttribute(Main_DataAttribute))[6];
    }
    UserLiveFeed_PreloadImgs = [];
    Sidepannel_PosFeed = 0;
    Main_empty('side_panel_holder');
    document.getElementById('side_panel_warn').style.display = 'none';
    Main_HideElement('side_panel_feed_thumb');
    UserLiveFeed_loadChannelOffsset = 0;
    UserLiveFeed_followerChannels = '';

    UserLiveFeedobj_StartDefault(UserLiveFeedobj_UserLivePos);

    UserLiveFeed_token = AddUser_UsernameArray[0].access_token;
    if (UserLiveFeed_token) {
        UserLiveFeed_token = Main_OAuth + UserLiveFeed_token;
        UserLiveFeedobj_loadChannelUserLive();
    } else {
        UserLiveFeedobj_loadDataPrepare();
        UserLiveFeed_token = null;
        UserLiveFeedobj_loadChannels();
    }
}

function UserLiveFeedobj_loadDataPrepare() {
    UserLiveFeed_loadingData = true;
    UserLiveFeed_loadingDataTry = 0;
    UserLiveFeed_loadingDataTimeout = 3500;
}

function UserLiveFeedobj_loadChannels() {
    var theUrl = Main_kraken_api + 'users/' + encodeURIComponent(AddUser_UsernameArray[0].id) +
        '/follows/channels?limit=100&offset=' + UserLiveFeed_loadChannelOffsset + '&sortby=created_at' + Main_TwithcV5Flag;
    UserLiveFeedobj_loadErrorCallback = UserLiveFeedobj_loadChannels;
    BasexmlHttpGet(theUrl, UserLiveFeed_loadingDataTimeout, 2, null, UserLiveFeedobj_loadChannelLive, UserLiveFeedobj_loadDataError, false);
}

function UserLiveFeedobj_loadDataError() {
    UserLiveFeed_loadingDataTry++;
    if (UserLiveFeed_loadingDataTry < UserLiveFeed_loadingDataTryMax) {
        UserLiveFeed_loadingDataTimeout += 500;
        UserLiveFeedobj_loadErrorCallback();
    } else {
        UserLiveFeed_loadingData = false;
        if (!UserLiveFeed_GetSize(UserLiveFeedobj_UserLivePos)) {
            Main_HideElement('dialog_loading_feed');
            Main_HideElement('dialog_loading_side_feed');
            if (UserLiveFeed_isFeedShow()) {
                Play_showWarningDialog(STR_REFRESH_PROBLEM);
                window.setTimeout(function() {
                    Play_HideWarningDialog();
                }, 2000);
            }
        } else {
            UserLiveFeed_dataEnded = true;
            UserLiveFeed_loadDataSuccessFinish(false, UserLiveFeedobj_UserLivePos);
        }
    }
}

function UserLiveFeedobj_loadChannelLive(responseText) {
    var response = JSON.parse(responseText).follows,
        response_items = response.length;

    if (response_items) { // response_items here is not always 99 because banned channels, so check until it is 0
        var ChannelTemp = '',
            x = 0;

        for (x; x < response_items; x++) {
            ChannelTemp = response[x].channel._id + ',';
            if (UserLiveFeed_followerChannels.indexOf(ChannelTemp) === -1) UserLiveFeed_followerChannels += ChannelTemp;
        }

        UserLiveFeed_loadChannelOffsset += response_items;
        UserLiveFeedobj_loadDataPrepare();
        UserLiveFeedobj_loadChannels();
    } else { // end
        UserLiveFeed_followerChannels = UserLiveFeed_followerChannels.slice(0, -1);
        UserLiveFeedobj_loadDataPrepare();
        UserLiveFeedobj_loadChannelUserLive();
    }
}

function UserLiveFeedobj_loadChannelUserLive() {
    var theUrl = Main_kraken_api + 'streams/';

    if (UserLiveFeed_token) {
        theUrl += 'followed?';
    } else {
        theUrl += '?channel=' + encodeURIComponent(UserLiveFeed_followerChannels) + '&';
    }
    theUrl += 'limit=100&offset=0&stream_type=all' + Main_TwithcV5Flag;

    UserLiveFeedobj_loadErrorCallback = UserLiveFeedobj_loadChannelUserLive;
    UserLiveFeedobj_loadChannelUserLiveGet(theUrl);
}

function UserLiveFeedobj_loadChannelUserLiveGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.timeout = UserLiveFeed_loadingDataTimeout;

    xmlHttp.setRequestHeader(Main_clientIdHeader, Main_clientId);
    xmlHttp.setRequestHeader(Main_AcceptHeader, Main_TwithcV5Json);
    if (UserLiveFeed_token) xmlHttp.setRequestHeader(Main_Authorization, UserLiveFeed_token);

    xmlHttp.ontimeout = function() {};

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) {
                UserLiveFeedobj_loadDataSuccess(xmlHttp.responseText);
            } else if (UserLiveFeed_token && (xmlHttp.status === 401 || xmlHttp.status === 403)) { //token expired
                //Token has change or because is new or because it is invalid because user delete in twitch settings
                // so callbackFuncOK and callbackFuncNOK must be the same to recheck the token
                AddCode_refreshTokens(0, 0, UserLiveFeedobj_CheckToken, UserLiveFeedobj_loadDataRefreshTokenError);
            } else {
                UserLiveFeedobj_loadDataError();
            }
        }
    };

    xmlHttp.send(null);
}

function UserLiveFeedobj_loadDataRefreshTokenError() {
    if (!AddUser_UsernameArray[0].access_token) UserLiveFeedobj_CheckToken();
    else UserLiveFeedobj_loadDataError();
}

function UserLiveFeedobj_loadDataSuccess(responseText) {

    var response = JSON.parse(responseText).streams,
        response_items = response.length,
        sorting = Settings_Obj_default('live_feed_sort'),
        stream, id, mArray,
        doc = document.getElementById(UserLiveFeed_obj[UserLiveFeedobj_UserLivePos].div),
        docside = document.getElementById("side_panel_holder"),
        i = 0;

    if (response_items < Main_ItemsLimitVideo) UserLiveFeed_dataEnded = true;

    if (!UserLiveFeed_WasLiveidObject[AddUser_UsernameArray[0].name]) {
        UserLiveFeed_WasLiveidObject[AddUser_UsernameArray[0].name] = {};
        UserLiveFeed_CheckNotifycation = false;
    }

    var sorting_type1 = Settings_FeedSort[sorting][0],
        sorting_type2 = Settings_FeedSort[sorting][1],
        sorting_direction = Settings_FeedSort[sorting][2];

    if (sorting_direction) {
        //A-Z
        if (sorting_type1) {
            response.sort(function(a, b) {
                return (a[sorting_type1][sorting_type2] < b[sorting_type1][sorting_type2] ? -1 :
                    (a[sorting_type1][sorting_type2] > b[sorting_type1][sorting_type2] ? 1 : 0));
            });
        } else {
            response.sort(function(a, b) {
                return (a[sorting_type2] < b[sorting_type2] ? -1 :
                    (a[sorting_type2] > b[sorting_type2] ? 1 : 0));
            });
        }
    } else {
        //Z-A
        if (sorting_type1) {
            response.sort(function(a, b) {
                return (a[sorting_type1][sorting_type2] > b[sorting_type1][sorting_type2] ? -1 :
                    (a[sorting_type1][sorting_type2] < b[sorting_type1][sorting_type2] ? 1 : 0));
            });
        } else {
            response.sort(function(a, b) {
                return (a[sorting_type2] > b[sorting_type2] ? -1 :
                    (a[sorting_type2] < b[sorting_type2] ? 1 : 0));
            });
        }
    }

    for (i; i < response_items; i++) {
        stream = response[i];
        id = stream.channel._id;
        if (!UserLiveFeed_idObject[UserLiveFeedobj_UserLivePos][id]) {

            UserLiveFeed_idObject[UserLiveFeedobj_UserLivePos][id] = 1;
            mArray = ScreensObj_LiveCellArray(stream);
            UserLiveFeed_PreloadImgs.push(mArray[0]);

            //Check if was live if not notificate
            if (!UserLiveFeed_WasLiveidObject[AddUser_UsernameArray[0].name][id]) {
                UserLiveFeed_NotifyLiveidObject.push({
                    name: mArray[1],
                    logo: mArray[9],
                    title: Main_ReplaceLargeFont(twemoji.parse(mArray[2])),
                    game: mArray[3],
                    rerun: mArray[8],
                });
            }

            if (UserLiveFeed_LastPos[UserLiveFeedobj_UserLivePos] !== null && UserLiveFeed_LastPos[UserLiveFeedobj_UserLivePos] === stream.channel.name)
                UserLiveFeed_FeedPosY[UserLiveFeedobj_UserLivePos] = i;

            UserLiveFeed_itemsCount[UserLiveFeedobj_UserLivePos]++;
            doc.appendChild(
                UserLiveFeed_CreatFeed(
                    UserLiveFeedobj_UserLivePos + '_' + i, mArray
                )
            );

            if (UserSidePannel_LastPos[UserLiveFeedobj_UserLivePos] !== null && UserSidePannel_LastPos[UserLiveFeedobj_UserLivePos] === stream.channel.name)
                Sidepannel_PosFeed = i;

            docside.appendChild(
                UserLiveFeedobj_CreatSideFeed(
                    i, mArray
                )
            );

        }
    }

    UserLiveFeed_WasLiveidObject[AddUser_UsernameArray[0].name] = JSON.parse(JSON.stringify(UserLiveFeed_idObject[UserLiveFeedobj_UserLivePos]));

    // doc.appendChild(
    //     UserLiveFeed_CreatFeed(i++,
    //         [
    //             IMG_404_VIDEO,
    //             "ashlynn",
    //             "title",
    //             "game",
    //             "for 1000 Viewers",
    //             "720p30 [EN]",
    //             "ashlynn",
    //             10000000000,
    //             true,
    //             IMG_404_LOGO,
    //             true,
    //             "Since 11:04:36&nbsp;",
    //             "2020-01-25T09:49:05Z",
    //             1000,
    //             35618666]
    //     )
    // );

    UserLiveFeed_loadDataSuccessFinish(true, UserLiveFeedobj_UserLivePos);
}

function UserLiveFeedobj_LiveNotification() {
    if (UserLiveFeed_NotifyRunning || !UserLiveFeed_Notify ||
        !UserLiveFeed_NotifyLiveidObject.length) {
        UserLiveFeed_NotifyLiveidObject = [];
        return;
    }

    UserLiveFeed_NotifyRunning = true;
    UserLiveFeedobj_LiveNotificationShow(0);
}

function UserLiveFeedobj_LiveNotificationShow(position) {
    var img = document.getElementById('user_feed_notify_img');

    img.onload = function() {
        this.onload = null;
        this.onerror = null;
        UserLiveFeedobj_LiveNotificationOnload(position);
    };

    img.onerror = function() {
        this.onerror = null;
        this.onload = null;
        this.src = IMG_404_LOGO;
        UserLiveFeedobj_LiveNotificationOnload(position);
    };

    img.src = UserLiveFeed_NotifyLiveidObject[position].logo;
}

function UserLiveFeedobj_LiveNotificationOnload(position) {
    Main_innerHTML('user_feed_notify_name', '<i class="icon-' + (!UserLiveFeed_NotifyLiveidObject[position].rerun ? 'circle" style="color: red;' : 'refresh" style="') + ' font-size: 75%; "></i>' + STR_SPACE + UserLiveFeed_NotifyLiveidObject[position].name);

    Main_textContent('user_feed_notify_game', UserLiveFeed_NotifyLiveidObject[position].game);
    Main_innerHTML('user_feed_notify_title', UserLiveFeed_NotifyLiveidObject[position].title);

    Main_ready(function() {
        Main_RemoveClass('user_feed_notify', 'user_feed_notify_hide');

        window.setTimeout(function() {
            UserLiveFeedobj_LiveNotificationHide(position);
        }, UserLiveFeed_NotifyTimeout);
    });
}

function UserLiveFeedobj_LiveNotificationHide(position) {
    Main_AddClass('user_feed_notify', 'user_feed_notify_hide');

    if (position < (UserLiveFeed_NotifyLiveidObject.length - 1)) {
        window.setTimeout(function() {
            UserLiveFeedobj_LiveNotificationShow(position + 1);
        }, 800);
    } else {
        UserLiveFeed_NotifyRunning = false;
        UserLiveFeed_NotifyLiveidObject = [];
    }
}

function UserLiveFeedobj_CreatSideFeed(id, data) {

    var div = document.createElement('div');
    div.setAttribute('id', UserLiveFeed_side_ids[8] + id);
    div.setAttribute(Main_DataAttribute, JSON.stringify(data));
    div.className = 'side_panel_feed';

    div.innerHTML = '<div id="' + UserLiveFeed_side_ids[0] + id +
        '" class="side_panel_div"><div id="' + UserLiveFeed_side_ids[2] + id +
        '" style="width: 100%;"><div id="' + UserLiveFeed_side_ids[3] + id +
        '" style="display: none;">' + data[1] +
        '</div><div class="side_panel_iner_div1"><img id="' + UserLiveFeed_side_ids[1] + id +
        '" class="side_panel_channel_img" src="' + data[9] +
        '" onerror="this.onerror=null;this.src=\'' + IMG_404_LOGO +
        '\';"></div><div class="side_panel_iner_div2"><div id="' + UserLiveFeed_side_ids[4] + id +
        '" class="side_panel_new_title">' + Main_ReplaceLargeFont(data[1]) + '</div><div id="' +
        UserLiveFeed_side_ids[5] + id + '" class="side_panel_new_game">' + data[3] +
        '</div></div><div class="side_panel_iner_div3"><div style="text-align: center;"><i class="icon-' +
        (!data[8] ? 'circle" style="color: red;' : 'refresh" style="') +
        ' font-size: 55%; "></i><div style="font-size: 58%;">' + Main_addCommas(data[13]) + '</div></div></div></div></div></div>';

    return div;
}

function UserLiveFeedobj_ShowFeed(PreventAddfocus) {
    console.log('UserLiveFeedobj_ShowFeed');
    Main_innerHTML('feed_end', 'User Live');
    var hasuser = AddUser_UserIsSet();

    if (hasuser) {
        UserLiveFeedobj_ShowFeedCheck(PreventAddfocus, UserLiveFeedobj_UserLivePos, (Play_FeedOldUserName !== AddUser_UsernameArray[0].name));
        Play_FeedOldUserName = AddUser_UsernameArray[0].name;
    }
}

function UserLiveFeedobj_ShowFeedCheck(PreventAddfocus, pos, forceRefressh) {
    if (Main_isElementShowing('scene2') && !UserLiveFeed_isFeedShow()) UserLiveFeed_Show(PreventAddfocus);

    if (!UserLiveFeed_ThumbNull(pos + '_0', UserLiveFeed_ids[0] || forceRefressh) && !UserLiveFeed_loadingData)
        UserLiveFeed_StartLoad(PreventAddfocus);
    else {
        Main_RemoveClass(UserLiveFeed_obj[pos].div, 'opacity_zero');

        if (!PreventAddfocus) UserLiveFeed_FeedAddFocus(true, pos);
        else {
            UserLiveFeed_FeedRemoveFocus(pos);
            UserLiveFeed_FeedSetPos(true, pos);
        }
    }
}

function UserLiveFeedobj_HideFeed() {
    Main_AddClass(UserLiveFeed_obj[UserLiveFeedobj_UserLivePos].div, 'opacity_zero');
}

function UserLiveFeedobj_Live() {
    console.log('UserLiveFeedobj_Live');
    UserLiveFeedobj_StartDefault(UserLiveFeedobj_LivePos);
    UserLiveFeedobj_loadLive();
}

function UserLiveFeedobj_loadLive() {
    var theUrl = Main_kraken_api + 'streams?limit=100' + (Main_ContentLang !== "" ? ('&broadcaster_language=' + Main_ContentLang) : '') +
        Main_TwithcV5Flag;
    UserLiveFeedobj_loadErrorCallback = UserLiveFeedobj_loadLive;
    BasexmlHttpGet(theUrl, UserLiveFeed_loadingDataTimeout, 2, null, UserLiveFeedobj_loadDataLiveSuccess, UserLiveFeedobj_loadDataError, false);
}

function UserLiveFeedobj_loadDataLiveSuccess(responseText) {
    UserLiveFeedobj_loadDataBaseLiveSuccess(responseText, UserLiveFeedobj_LivePos);
}

function UserLiveFeedobj_ShowLive(PreventAddfocus) {
    console.log('UserLiveFeedobj_ShowLive');
    Main_innerHTML('feed_end', 'Live');
    UserLiveFeedobj_ShowFeedCheck(PreventAddfocus, UserLiveFeedobj_LivePos);
}

function UserLiveFeedobj_HideLive() {
    Main_AddClass(UserLiveFeed_obj[UserLiveFeedobj_LivePos].div, 'opacity_zero');
}

function UserLiveFeedobj_loadDataBaseLiveSuccess(responseText, pos) {

    var response = JSON.parse(responseText).streams,
        response_items = response.length,
        stream, id, mArray,
        doc = document.getElementById(UserLiveFeed_obj[pos].div),
        i = 0;

    if (response_items < Main_ItemsLimitVideo) UserLiveFeed_dataEnded = true;

    for (i; i < response_items; i++) {
        stream = response[i];
        id = stream.channel._id;
        if (!UserLiveFeed_idObject[pos][id]) {

            UserLiveFeed_idObject[pos][id] = 1;
            mArray = ScreensObj_LiveCellArray(stream);
            UserLiveFeed_PreloadImgs.push(mArray[0]);

            if (UserLiveFeed_LastPos[pos] !== null && UserLiveFeed_LastPos[pos] === stream.channel.name)
                UserLiveFeed_FeedPosY[pos] = i;

            UserLiveFeed_itemsCount[pos]++;
            doc.appendChild(
                UserLiveFeed_CreatFeed(
                    pos + '_' + i, mArray
                )
            );

        }
    }

    // doc.appendChild(
    //     UserLiveFeed_CreatFeed(pos + '_' + (i + 1),
    //         [
    //             IMG_404_VIDEO,
    //             "ashlynn",
    //             "title",
    //             "game",
    //             "for 1000 Viewers",
    //             "720p30 [EN]",
    //             "ashlynn",
    //             10000000000,
    //             true,
    //             IMG_404_LOGO,
    //             true,
    //             "Since 11:04:36&nbsp;",
    //             "2020-01-25T09:49:05Z",
    //             1000,
    //             35618666]
    //     )
    // );

    UserLiveFeed_loadDataSuccessFinish(true, UserLiveFeedobj_LivePos);
}