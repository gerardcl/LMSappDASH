$(document).ready( function() {
    ////////////////////////////////////////////
    // APP. CONFIG. PARAMETERS
    //////////////////////////////////////////// 
    var apiURI = null;
	var lmsInstance = null, 
        lmsState = null,
		lmsInput = null,
		lmsDash = null,
        lmsVideos = [];
        lmsAudios = [];
        lmsPaths = [];
    var receiverId = 1000
    var dashId = 1001;
    var vDecoderId = 2000;
    var aDecoderId = 2001;
    var vId = 3000;
    var vCount = 0;
    var aId = 4000;
    var aCount = 0;
    var vMasterPathId = 10000;
    var aMasterPathId = 11000;
    var vDstReaderId = 12000;
    var aDstReaderId = 13000;

    ////////////////////////////////////////////
    // EVENTS MANAGEMENT
    ////////////////////////////////////////////    
    $("#view").load("./app/views/instance.html");

    $( document ).on( "submit", "form", function(event) {
        event.preventDefault(); // To prevent following the link (optional)
        var form = $(this);
        switch (form.context.id){
            case 'connectForm':
                connectForm(form);
                break;
            case 'setRTMPForm':
                setRTMPForm(form);
                break;
            case 'setRTSPForm':
                setRTSPForm(form);
                break;
            case 'setRTPaudioForm':
                setRTPForm(form);
                break;
            case 'setRTPvideoForm':
                setRTPForm(form);
                break;
            case 'setRTPavForm':
                setRTPForm(form);
                break;
            case 'addVideoDASHForm':
                addVideoDASH(form);
                break;
            case 'addAudioDASHForm':
                addAudioDASH(form);
                break;
            case 'dasherForm':
                startDASHER(form);
                break;
            default:
                addAlertError('ERROR: no form available');
        }
        console.log(lmsInstance);
        console.log(lmsInput);
        console.log(lmsVideos);
        console.log(lmsAudios);
        console.log(lmsDash);
        console.log(lmsPaths);
    });

    $('#disconnectButton').on('click', function(event) {
        bootbox.confirm("Are you sure to disconnect? This implies restarting the app...", function(result) {
            if(result){
                var uri = apiURI + '/disconnect';
                $.ajax({
                    type: 'GET',
                    url: uri,
                    dataType: 'json',
                    success : function(msg) {
                        if(!msg.error){
                            lmsInstance = null;
                            addAlertSuccess(msg.message);
                            apiURI = null;
                            $("#disconnectButton").addClass("hidden");
                            $("#state").html('');
                            $("#player").addClass("hidden");
                            $("#view").load("./app/views/instance.html");
                        } else {
                            addAlertError(msg.error);
                        }
                    },
                    error : function(xhr, msg) {
                        addAlertError('ERROR: ' + msg + ' - ' + xhr.responseText+ ' - No API available');
                    }
                })
            }
        });
    });

    ////////////////////////////////////////////
    // FORMS METHODS
    ////////////////////////////////////////////
    function connectForm(form) {
        var message = { 
            'host' : form.find( "input[id='lms-host']" ).val(),
            'port' : form.find( "input[id='lms-port']" ).val()
        };
        var apiHost = form.find( "input[id='api-host']" ).val();
        var apiPort = form.find( "input[id='api-port']" ).val();

        var uri = 'http://'+apiHost+':'+apiPort+'/api/connect';
        $.ajax({
            type: 'POST',
            url: uri,
            data: message,
            dataType: 'json',
            success : function(msg) {
                if(!msg.error){
                    lmsInstance = message;
                    addAlertSuccess(msg.message);
                    apiURI = 'http://'+apiHost+':'+apiPort+'/api';
                    $("#disconnectButton").removeClass("hidden");
                    $("#view").load("./app/views/input.html");
                } else {
                    lmsInstance = null;
                    addAlertError(msg.error);
                }
            },
            error : function(xhr, msg) {
                lmsInstance = null;
                addAlertError('ERROR: \
                ' + msg + ' - ' + xhr.responseText+ ' - No API available');
            }
        })
    };

    function setRTMPForm(form) {
        var uri = form.find( "input[id='uri']" ).val();
        if(/^(rtmp):\/\/[^ "]+$/.test(uri)){
            lmsInput = {
                'type' : 'rtmp',
                'uri' : uri
            };
            addAlertSuccess('Success setting network input params');
            $("#view").load("./app/views/dasher.html");
        } else {
            lmsInput = null;
            addAlertError('ERROR: no valid inputs... please check.');
        }
    };

    function setRTSPForm(form) {
        var uri = form.find( "input[id='uri']" ).val();
        if(/^(rtsp):\/\/[^ "]+$/.test(uri)){
            lmsInput = {
                'type'      : 'rtsp',
                'progName'  : 'lms',
                'id'        : 1985,
                'uri'       : uri
            };
            addAlertSuccess('Success setting network input params');
            $("#view").load("./app/views/dasher.html");
        } else {
            lmsInput = null;
            addAlertError('ERROR: no valid inputs... please check.');
        }

    };

    function setRTPForm(form) {
        switch(form.find( "input[name='rtpInput']" ).val()){
            case 'v':
                var vport = form.find( "input[name='port']" ).val();
                if(form.find( "select[name='codec']" ).val() === "none" || isNaN(vport)){
                    lmsInput = null;
                    addAlertError('ERROR: no valid inputs... please check.');
                } else {
                    lmsInput = {
                        'type'      : 'rtp',
                        'medium'    : 'video',
                        'params'    : {
                            "subsessions":[
                                {
                                    "medium":"video",
                                    "codec":form.find( "select[name='codec']" ).val(),
                                    "bandwidth":1200,
                                    "timeStampFrequency":90000,
                                    "channels":null,
                                    "port":parseInt(vport),
                                }   
                            ]
                        }
                    };
                    addAlertSuccess('Success setting network input params');
                    $("#view").load("./app/views/dasher.html");
                }
                break;
            case 'a':
                var aport = form.find( "input[name='port']" ).val();
                if(form.find( "select[name='codec']" ).val() === "none" 
                    || form.find( "select[name='sampleRate']" ).val() === "none" 
                    || form.find( "select[name='channels']" ).val() === "none"
                    || isNaN(aport)){
                        lmsInput = null;
                        addAlertError('ERROR: no valid inputs... please check.');
                } else {
                    lmsInput = {
                        'type'      : 'rtp',
                        'medium'    : 'audio',
                        'params'    : {
                            "subsessions":[
                                {
                                    "medium":"audio",
                                    "codec":form.find( "select[name='codec']" ).val(),
                                    "bandwidth":128,
                                    "timeStampFrequency":parseInt(form.find( "select[name='sampleRate']" ).val()),
                                    "channels":parseInt(form.find( "select[name='channels']" ).val()),
                                    "port":parseInt(aport),
                                }   
                            ]
                        }
                    };
                    addAlertSuccess('Success setting network input params');
                    $("#view").load("./app/views/dasher.html");
                }
                break;
            case 'av':
                var aport = form.find( "input[name='audio-port']" ).val();
                var vport = form.find( "input[name='video-port']" ).val();
                if(form.find( "select[name='audio-codec']" ).val() === "none" 
                    || form.find( "select[name='video-codec']" ).val() === "none"
                    || form.find( "select[name='sampleRate']" ).val() === "none" 
                    || form.find( "select[name='channels']" ).val() === "none"
                    || isNaN(aport)
                    || isNaN(vport)){
                        lmsInput = null;
                        addAlertError('ERROR: no valid inputs... please check.');
                } else {
                    lmsInput = {
                        'type'      : 'rtp',
                        'medium'    : 'both',
                        'audioParams'    : {
                            "subsessions":[
                                {
                                    "medium":"audio",
                                    "codec":form.find( "select[name='audio-codec']" ).val(),
                                    "bandwidth":128,
                                    "timeStampFrequency":parseInt(form.find( "select[name='sampleRate']" ).val()),
                                    "channels":parseInt(form.find( "select[name='channels']" ).val()),
                                    "port":parseInt(aport),
                                }   
                            ]
                        },
                        'videoParams'    : {
                            "subsessions":[
                                {
                                    "medium":"video",
                                    "codec":form.find( "select[name='video-codec']" ).val(),
                                    "bandwidth":1200,
                                    "timeStampFrequency":90000,
                                    "channels":null,
                                    "port":parseInt(vport),
                                }   
                            ]
                        }
                    };
                    addAlertSuccess('Success setting network input params');
                    $("#view").load("./app/views/dasher.html");
                }
                break;
            default:
                lmsInput = null;
                addAlertError('ERROR: no valid inputs... please check.');
                break;
        }
    };

    function addVideoDASH(form) {
        var width = form.find( "input[name='width']" ).val();
        var height = form.find( "input[name='height']" ).val();
        var bitRate = form.find( "input[name='bitRate']" ).val();
        if(!isNaN(width) || !isNaN(height) || !isNaN(bitRate)){
            lmsVideos.push(
                {
                    "id": parseInt(vId),  
                    "width": parseInt(width),
                    "height": parseInt(height),
                    "bitRate": parseInt(bitRate) 
                }
            );
            $( "#videoDashRepresentations" ).append( 
              "<div class=\"row specialRow\"> "+
                "<div class=\"col-sm-3\"><strong>Video representation "+(++vCount)+"</strong></div>" +
                "<div class=\"col-sm-3\">Width: "+width+" px</div>"+
                "<div class=\"col-sm-3\">Height: "+height+" px</div>"+
                "<div class=\"col-sm-3\">Bit rate: "+bitRate+" bps</div>"+
              "</div>" 
            );
            vId += 2;
            addAlertSuccess('Success setting new video representation');
        } else {
            addAlertError('ERROR: no valid video params... please check.');
        }
        $('.modal.in').modal('hide');
    };
 
    function addAudioDASH(form) {
        var sampleRate = form.find( "input[name='sampleRate']" ).val();
        var channels = form.find( "input[name='channels']" ).val();
        var bitRate = form.find( "input[name='bitRate']" ).val();
        if(!isNaN(sampleRate) || !isNaN(channels) || !isNaN(bitRate)){
            lmsAudios.push(
                {
                    "id": parseInt(aId),  
                    "sampleRate": parseInt(sampleRate),
                    "channels": parseInt(channels),
                    "bitRate": parseInt(bitRate) 
                }
            );
            $( "#audioDashRepresentations" ).append( 
              "<div class=\"row specialRow\">"+
                "<div class=\"col-sm-3\"><strong>Audio representation  "+(++aCount)+"</strong></div>"+
                "<div class=\"col-sm-3\">Sample rate: "+sampleRate+" Hz </div>"+
                "<div class=\"col-sm-3\">Channels: "+channels+" </div>"+
                "<div class=\"col-sm-3\">Bit rate: "+bitRate+" bps </div>"+
              "</div>" 
            );
            aId += 2;
            addAlertSuccess('Success setting new audio representation');
        } else {
            addAlertError('ERROR: no valid audio params... please check.');        
        }                 
        $('.modal.in').modal('hide');
    };  

    function startDASHER(form) {
        var dashFolder = form.find( "input[id='dashFolder']" ).val();
        var baseName = form.find( "input[id='baseName']" ).val();
        var segDurInSec = form.find( "input[id='segDurInSec']" ).val();
        //TODO to check inputs (e.g.: 8 >= int(segDurInSec) >= 0)
        lmsDash = {
            "folder":dashFolder,
            "baseName":baseName,
            "segDurInSec":parseInt(segDurInSec)
        };
        $("#view").load("./app/views/state.html");

        setReceiverAndDecoders();

        setDasher();

        setResamplersEncodersPathsAndSegments();

        getState();

        $("#state").html('');

        addAlertSuccess('DASHER SUCCESSFULLY CONFIGURED! Running...');

        $("#player").attr("src", "http://localhost/shaka-player/");
        $("#player").removeClass("hidden");

    }; 
     
    ////////////////////////////////////////////
    // SPECIFIC API METHODS
    ////////////////////////////////////////////
    function getState() {
        $.ajax({
            type: 'GET',
            url: apiURI+'/state',
            dataType: 'json',
            async: false,
            success : function(msg) {
                if(!msg.error){
                    lmsState = msg.message;
                    console.log(lmsState);
                    return true;
                } else {
                    lmsState = null;
                    addAlertError(msg.error);
                    return false;
                }
            },
            error : function(xhr, msg) {
                lmsState = null;
                addAlertError('ERROR: \
                ' + msg + ' - ' + xhr.responseText+ ' - No API available');
                return false;
            }
        })        
    }; 

    function setReceiverAndDecoders() {
        createFilter(receiverId, 'receiver');
        configReceiverAndCreateDecoders();
    };

    function setDasher(){
        createFilter(dashId,'dasher');
        configureFilter(dashId, 'configure', lmsDash);
    };

    function setResamplersEncodersPathsAndSegments(){
        var i = 0;
        for(i = 0; i < lmsVideos.length; i++){
            createFilter(lmsVideos[i].id, 'videoResampler');
            createFilter(lmsVideos[i].id + 1, 'videoEncoder');
            configureFilter(lmsVideos[i].id, 'configure', { "width" : lmsVideos[i].width, "height" : lmsVideos[i].height, "discartPeriod" : 0, "pixelFormat" : 2 });
            configureFilter(lmsVideos[i].id + 1, 'configure', { "bitrate" : parseInt( lmsVideos[i].bitRate / 1000 ), "fps" : 25, "gop" : 25, "lookahead" : 25,
                                                        "threads" : 4, "annexb" : true, "preset" : "superfast" });
            if(i === 0){
                if(lmsInput.medium == 'video'){
                    createPath(vMasterPathId, receiverId, dashId, lmsInput.params.subsessions[0].port, vDstReaderId, [vDecoderId, lmsVideos[i].id, lmsVideos[i].id + 1]);
                    configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                    vDstReaderId++;
                } else {
                    createPath(vMasterPathId, receiverId, dashId, lmsInput.videoParams.subsessions[0].port, vDstReaderId, [vDecoderId, lmsVideos[i].id, lmsVideos[i].id + 1]);                    
                    configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                    vDstReaderId++;
                }
            } else {
                createPath(vMasterPathId + i, vDecoderId, dashId, -1, vDstReaderId, [lmsVideos[i].id, lmsVideos[i].id + 1]);
                configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                vDstReaderId++;                
            }   
        }
        for(i = 0; i < lmsAudios.length; i++){
            createFilter(lmsAudios[i].id, 'audioEncoder');
            configureFilter(lmsAudios[i].id, 'configure', { "codec" : 'aac', "sampleRate" : parseInt(lmsAudios[i].sampleRate / 1000), 
                                                            "channels" : lmsAudios[i].channels, "bitrate" : lmsAudios[i].bitRate });
            if(i === 0){
                if(lmsInput.medium == 'audio'){
                    createPath(aMasterPathId, receiverId, dashId, lmsInput.params.subsessions[0].port, aDstReaderId++, [aDecoderId, lmsAudios[i].id]);
                    configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                    aDstReaderId++; 
                } else {
                    createPath(aMasterPathId, receiverId, dashId, lmsInput.audioParams.subsessions[0].port, aDstReaderId++, [aDecoderId, lmsAudios[i].id]);                    
                    configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                    aDstReaderId++; 
                }
            } else {
                createPath(aMasterPathId + i, aDecoderId, dashId, -1, aDstReaderId++, [lmsAudios[i].id]);
                configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                aDstReaderId++; 
            }   
        }
    };

    function configReceiverAndCreateDecoders(){
        var okmsg = false;
        switch(lmsInput.type){
            case 'rtmp':
                break;
            case 'rtsp':
                break;
            case 'rtp':
                switch(lmsInput.medium){
                    case 'video':
                        if (configureFilter(receiverId, 'addSession', lmsInput.params) && createFilter(vDecoderId,'videoDecoder')){
                            okmsg = true;
                        }
                        break;
                    case 'audio':
                        if (configureFilter(receiverId, 'addSession', lmsInput.params) && createFilter(aDecoderId,'audioDecoder')){
                            okmsg = true;
                        }
                        break;
                    case 'both':
                        if(configureFilter(receiverId, 'addSession', lmsInput.audioParams) && createFilter(aDecoderId,'audioDecoder')){ 
                            if(configureFilter(receiverId, 'addSession', lmsInput.videoParams) && createFilter(vDecoderId,'videoDecoder')){
                            okmsg = true;
                        }}
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
        if(okmsg){
            addAlertSuccess('Input and decoding steps configured!');
        } else {
            addAlertError('ERROR configuring, please disconnect and try again...');
        }
    }; 

    function configureFilter(filterId, action, params) {
        var okmsg = false;
        var message = [{
                        "action":action,
                        "params":params
                    }];
        $.ajax({
            type: 'PUT',
            async: false,
            url: apiURI+'/filter/'+filterId,
            data: JSON.stringify(message),
            contentType: "application/json; charset=utf-8",
            traditional: true,
            success : function(msg) {
                if(!msg.error){
                    console.log(msg.message);
                    $("#state").append('<p>'+msg.message+'</p>');
                    okmsg = true;
                } else {
                    console.log(msg.error);
                }
            },
            error : function(xhr, msg) {
                console.log('ERROR: \
                ' + msg + ' - ' + xhr.responseText+ ' - No API available');
            }
        })         
        return okmsg;
    };  

    function createFilter(filterId, type) {
        var okmsg = false;
        var message = {'id' : Number(filterId), 'type' : type};
        $.ajax({
            type: 'POST',
            async: false,
            url: apiURI+'/createFilter',
            data: JSON.stringify(message),
            contentType: "application/json; charset=utf-8",
            traditional: true,
            success : function(msg) {
                if(!msg.error){
                    console.log(msg.message);
                    $("#state").append('<p>'+msg.message+'</p>');
                    okmsg = true;
                } else {
                    console.log(msg.error);
                }
            },
            error : function(xhr, msg) {
                console.log('ERROR: \
                ' + msg + ' - ' + xhr.responseText+ ' - No API available');
            }
        })         
        return okmsg;
    };       

    function createPath(pathId, orgFilterId, dstFilterId, orgWriterId, dstReaderId, midFiltersIds) {
        var okmsg = false;
        var message = { 'id' : pathId, 'orgFilterId' : orgFilterId, 'dstFilterId' : dstFilterId, 
                        'orgWriterId' : orgWriterId, 'dstReaderId' : dstReaderId, 'midFiltersIds' : midFiltersIds };
        lmsPaths.push(message);
        $.ajax({
            type: 'POST',
            async: false,
            url: apiURI+'/createPath',
            data: JSON.stringify(message),
            contentType: "application/json; charset=utf-8",
            traditional: true,
            success : function(msg) {
                if(!msg.error){
                    console.log(msg.message);
                    $("#state").append('<p>'+msg.message+'</p>');
                    okmsg = true;
                } else {
                    console.log(msg.error);
                }
            },
            error : function(xhr, msg) {
                console.log('ERROR: \
                ' + msg + ' - ' + xhr.responseText+ ' - No API available');
            }
        })         
        return okmsg;
    };     

    ////////////////////////////////////////////
    // ALERTS METHODS
    ////////////////////////////////////////////
    function addAlertError(message) {
        var id = 'lmsError';
        var JQueryId = "#" + id;
        $('#error').append(
            '<div style="display:none;" class="alert alert-warning" id="' + id + '">' +
                '<button type="button" class="close" data-dismiss="alert">' +
                '×</button><span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> ' + message + '</div>');

        $(JQueryId).fadeIn(500);

        window.setTimeout(function () {
            // closing the popup
            $(JQueryId).fadeTo(300, 0.5).slideUp(1000, function () {
                $(JQueryId).alert('close');
            });
        }, 2000);
        return true;
    };
    function addAlertSuccess(message) {
        var id = 'lmsSuccess';
        var JQueryId = "#" + id;
        $('#success').append(
            '<div style="display:none;" class="alert alert-success" id="' + id + '">' +
                '<button type="button" class="close" data-dismiss="alert">' +
                '×</button><span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> ' + message + '</div>');

        $(JQueryId).fadeIn(500);

        window.setTimeout(function () {
            // closing the popup
            $(JQueryId).fadeTo(300, 0.5).slideUp(1000, function () {
                $(JQueryId).alert('close');
            });
        }, 2000);
        return true;
    };

});

