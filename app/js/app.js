$(document).ready( function() {
    ////////////////////////////////////////////
    // APP. CONFIG. PARAMETERS
    //////////////////////////////////////////// 
    var apiURI = null;
    var sHost = null, sPort = null;
	var lmsInstance = null, 
        lmsState = null,
		lmsInput = null,
		lmsDash = null,
        lmsVideos = [],
        lmsAudios = [],
        lmsPaths = [];
    var receiverId = 1000
    var dashId = 1001;
    var vDecoderId = 2000;
    var aDecoderId = 3000;
    var vId = 4000;
    var vCount = 0;
    var aId = 5000;
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
        console.log(form.context.id);
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
            case 'addVideoModalDynForm':
                addDynVideo(form);
                break;
            case 'addAudioModalDynForm':
                addDynAudio(form);
                break;  
            case 'editVideoDashForm':
                editVideo(form);
                break;
            case 'editAudioDashForm':
                editAudio(form);
                break;       
            case 'editDashVideoModalForm':
                setEditVideo(form);
                break;
            case 'editDashAudioModalForm':
                setEditAudio(form);
                break;   
            default:
                addAlertError('ERROR: no form available');
        }
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
                            sHost = null;
                            sPort = null;
                            $("#disconnectButton").addClass("hidden");
                            $("#state").html('');
                            unloadDasherState();
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
            'host' : form.find( "input[id='server-host']" ).val(),
            'port' : 7777
        };
        var apiHost = form.find( "input[id='api-host']" ).val();
        var apiPort = form.find( "input[id='api-port']" ).val();

        sHost = form.find( "input[id='server-host']" ).val();
        sPort = form.find( "input[id='server-port']" ).val();

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
                'type'      : 'rtmp',
                'medium'    : '',
                'params'    : {
                    'uri' : uri,
                    'subsessions' : [ {} ] 
                },
                'videoParams' : { 'subsessions' : [ { } ] },
                'audioParams' : { 'subsessions' : [ { } ] }
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
                'medium'    : '',
                'params'    : {
                    "subsessions":[ {} ],
                    "progName"  : "LiveMediaStreamer",
                    "id"        : "1985",
                    "uri"       : uri
                },
                'videoParams' : { 'subsessions' : [ { } ] },
                'audioParams' : { 'subsessions' : [ { } ] }
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
                "<div class=\"col-sm-3\">Bitrate: "+bitRate+" bps</div>"+
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
                "<div class=\"col-sm-3\">Samplerate: "+sampleRate+" Hz </div>"+
                "<div class=\"col-sm-3\">Channels: "+channels+" </div>"+
                "<div class=\"col-sm-3\">Bitrate: "+bitRate+" bps </div>"+
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

        if(lmsAudios.length == 0 && lmsVideos.length == 0){
            addAlertError('Please: add representations!');
        } else {
            lmsDash = {
                "folder":dashFolder,
                "baseName":baseName,
                "segDurInSec":parseInt(segDurInSec)
            };
            $("#view").html('');

            setReceiverAndDecoders();

            setDasher();

            setResamplersEncodersPathsAndSegments();

            addAlertSuccess('DASHER SUCCESSFULLY CONFIGURED!');

            setTimeout(loadDasherState(),5000);
        }
    }; 

    function editVideo (form) {
        console.log("EDIT VIDEO FORM")
        var id = form.find( "div[id='vidid']" ).text();
        var width = form.find( "div[id='vidw']" ).text();
        var height = form.find( "div[id='vidh']" ).text();
        var bitrate = form.find( "div[id='vidb']" ).text();
        console.log(lmsVideos[id].id);
        console.log(width);
        console.log(height);
        console.log(bitrate);
        addEditVideoModal(id,width,height,bitrate);
        $('#editDashVideoModal').modal({show:true});
    };

    function editAudio (form) {
        console.log("EDIT AUDIO FORM")
        var id = form.find( "div[id='audid']" ).text();
        var samplerate = form.find( "div[id='auds']" ).text();
        var channels = form.find( "div[id='audc']" ).text();
        var bitrate = form.find( "div[id='audb']" ).text();
        console.log(lmsAudios[id].id);
        console.log(samplerate);
        console.log(channels);
        console.log(bitrate);    
        addEditAudioModal(id,samplerate,channels,bitrate);
        $('#editDashAudioModal').modal({show:true});
    }

    function setEditVideo (form) {
        console.log("SET EDIT VIDEO");
        var idinternal = form.find( "input[name='videoidinternal']" ).val();
        var id = form.find( "input[name='videoid']" ).val();
        var width = form.find( "input[name='width']" ).val();
        var height = form.find( "input[name='height']" ).val();
        var bitrate = form.find( "input[name='bitRate']" ).val();
        console.log(id);
        console.log(idinternal);
        console.log(width);
        console.log(height);
        console.log(bitrate);
        console.log(lmsVideos[idinternal].dstR);

        configureFilter(parseInt(id), 'configure', { "width" : parseInt(width), "height" : parseInt(height), "discartPeriod" : 0, "pixelFormat" : 2 });
        configureFilter(parseInt(id) + 1, 'configure', { "bitrate" : parseInt( bitrate / 1000 ), "fps" : 25, "gop" : 25, "lookahead" : 0,
                                                        "threads" : 4, "annexb" : true, "preset" : "superfast" });
        configureFilter(dashId, 'setBitrate', { "id" : lmsVideos[idinternal].dstR, "bitrate" : parseInt(bitrate) });

        lmsVideos[idinternal].width = width;
        lmsVideos[idinternal].height = height;
        lmsVideos[idinternal].bitRate = bitrate;

        loadCurrentRepresentations();
    };

    function setEditAudio (form) {
        console.log("SET EDIT AUDIO");
        var idinternal = form.find( "input[name='audioidinternal']" ).val();
        var id = form.find( "input[name='audioid']" ).val();
        var samplerate = form.find( "input[name='sampleRate']" ).val();
        var channels = form.find( "input[name='channels']" ).val();
        var bitrate = form.find( "input[name='bitRate']" ).val();
        console.log(id);
        console.log(idinternal);
        console.log(samplerate);
        console.log(channels);
        console.log(bitrate);    
        console.log(lmsAudios[idinternal].dstR);

        configureFilter(parseInt(id), 'configure', { "codec" : 'aac', "sampleRate" : parseInt(samplerate), 
                                                            "channels" : parseInt(channels), "bitrate" : parseInt(bitrate) });
        configureFilter(dashId, 'setBitrate', { "id" : lmsAudios[idinternal].dstR, "bitrate" : parseInt(bitrate) });

        lmsAudios[idinternal].sampleRate = samplerate;
        lmsAudios[idinternal].channels = channels;
        lmsAudios[idinternal].bitRate = bitrate;

        loadCurrentRepresentations();
    }
    ////////////////////////////////////////////
    // SPECIFIC SCENARIO/UI METHODS
    ////////////////////////////////////////////
    function loadDasherState() {
        $("#state").html('');
        $("#dasherState").load("./app/views/dasherState.html", function(res, stat, xhr) {
            console.log("DASHER STATE");
            console.log('DASHer URI for MPEG-DASH players<br> http://'+sHost+':'+(sPort == '' ? '80': sPort)+'/lmsDasher/'+lmsDash.baseName+'.mpd');
            $("#segmentsURI").html('DASHer URI for MPEG-DASH players<br> http://'+sHost+':'+(sPort == '' ? '80': sPort)+'/lmsDasher/'+lmsDash.baseName+'.mpd <br>');
            loadCurrentRepresentations();
        });
    };

    function loadCurrentRepresentations(){            
        $("#stateAudRep").html('');
        $("#stateVidRep").html('');
        if(lmsVideos.length > 0) {
            for(var i = 0; i < lmsVideos.length; i++){
                $("#stateVidRep").append( 
                  "<form class=\"form-inline\ role=\"form\" id=\"editVideoDashForm\">"+
                    "<div class=\"col-sm-2\" id=\"vidid\">"+i+"</div>" +
                    "<div class=\"col-sm-3\" id=\"vidw\">"+lmsVideos[i].width+"</div>"+
                    "<div class=\"col-sm-3\" id=\"vidh\">"+lmsVideos[i].height+"</div>"+
                    "<div class=\"col-sm-3\" id=\"vidb\">"+lmsVideos[i].bitRate+"</div>"+
                    "<div class=\"col-sm-1\">"+
                        "<button type=\"submit\" class=\"btn btn-warning btn-xs\">"+
                            "<span class=\"glyphicon glyphicon-pencil\" aria-hidden=\"true\"></span>"+
                        "</button>"+
                    "</div>"+
                  "</form>" 
                );
            };
        } else {
            $("#dashVideosRep").addClass("hidden");
        }
        if(lmsAudios.length > 0) {
            for(var i = 0; i < lmsAudios.length; i++){
                $("#stateAudRep").append( 
                  "<form class=\"form-inline\" role=\"form\" id=\"editAudioDashForm\">"+
                    "<div class=\"col-sm-2\" id=\"audid\">"+i+"</div>"+
                    "<div class=\"col-sm-3\" id=\"auds\">"+lmsAudios[i].sampleRate+"</div>"+
                    "<div class=\"col-sm-3\" id=\"audc\">"+lmsAudios[i].channels+"</div>"+
                    "<div class=\"col-sm-3\" id=\"audb\">"+lmsAudios[i].bitRate+"</div>"+
                    "<div class=\"col-sm-1\">"+
                        "<button type=\"submit\" class=\"btn btn-warning btn-xs\">"+
                            "<span class=\"glyphicon glyphicon-pencil\" aria-hidden=\"true\"></span>"+
                        "</button>"+
                    "</div>"+
                  "</form>" 
                );
            };    
        } else {
            $("#dashAudiosRep").addClass("hidden");           
        }    
    }

    function unloadDasherState(){
        $("#dasherState").html('');
        document.getElementById("segmentsURI").innerHTML = '';
    }

    function setReceiverAndDecoders() {
        createFilter(receiverId, (lmsInput.type == 'rtmp' ? 'demuxer' : 'receiver'));
        configReceiverAndCreateDecoders();
    };


    function configReceiverAndCreateDecoders(){
        var okmsg = false;
        switch(lmsInput.type){
            case 'rtmp':
                if (configureFilter(receiverId, 'configure', lmsInput.params)){
                    getState();
                    for(var k = 0; k < lmsState.filters.length; k++){
                        if(lmsState.filters[k].type == "demuxer"){
                            for(var j = 0; j < lmsState.filters[k].streams.length; j++){
                                switch (lmsState.filters[k].streams[j].type){
                                    case 1:
                                        createFilter(vDecoderId,'videoDecoder');
                                        if ( lmsState.filters[k].streams.length > 1) {
                                            lmsInput.medium = 'both';
                                            lmsInput.videoParams.subsessions[0].port = lmsState.filters[k].streams[j].wId;
                                        }
                                        else  {
                                            lmsInput.medium = 'video';
                                            lmsInput.params.subsessions[0].port = lmsState.filters[k].streams[j].wId;
                                        }
                                        okmsg = true;
                                        break;
                                    case 0:
                                        createFilter(aDecoderId,'audioDecoder');
                                        if ( lmsState.filters[k].streams.length > 1) {
                                            lmsInput.medium = 'both';
                                            lmsInput.audioParams.subsessions[0].port = lmsState.filters[k].streams[j].wId;
                                        }
                                        else  {
                                            lmsInput.medium = 'audio';
                                            lmsInput.params.subsessions[0].port = lmsState.filters[k].streams[j].wId;
                                        }
                                        okmsg = true;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        } else {
                            addAlertError("No demuxer found");
                        }
                    }
                }
                break;
            case 'rtsp':
                if (configureFilter(receiverId, 'addSession', lmsInput.params)){
                    getState();
                    for(var k = 0; k < lmsState.filters.length; k++){
                        if(lmsState.filters[k].type == "receiver"){
                            var num = lmsState.filters[k].sessions[0].subsessions.length;
                            for(var j = 0; j < num; j++){
                                switch (lmsState.filters[k].sessions[0].subsessions[j].medium){
                                    case "video":
                                        createFilter(vDecoderId,'videoDecoder');
                                        if ( num > 1) {
                                            lmsInput.medium = 'both';
                                            lmsInput.videoParams.subsessions[0].port = lmsState.filters[k].sessions[0].subsessions[j].port;    
                                        }
                                        else  {
                                            lmsInput.medium = 'video';
                                            lmsInput.params.subsessions[0].port = lmsState.filters[k].sessions[0].subsessions[j].port;
                                        }
                                        okmsg = true;
                                        break;
                                    case "audio":
                                        createFilter(aDecoderId,'audioDecoder');
                                        if ( num > 1) {
                                            lmsInput.medium = 'both';
                                            lmsInput.audioParams.subsessions[0].port = lmsState.filters[k].sessions[0].subsessions[j].port;
                                        }
                                        else  {
                                            lmsInput.medium = 'audio';
                                            lmsInput.params.subsessions[0].port = lmsState.filters[k].sessions[0].subsessions[j].port;
                                        }
                                        okmsg = true;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        } else {
                            addAlertError("No receiver found");
                        }
                    }
                }
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
            console.log('Input and decoding steps configured!');
        } else {
            console.log('ERROR configuring, please disconnect and try again...');
        }
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
            configureFilter(lmsVideos[i].id + 1, 'configure', { "bitrate" : parseInt( lmsVideos[i].bitRate / 1000 ), "fps" : 25, "gop" : 25, "lookahead" : 0,
                                                        "threads" : 4, "annexb" : true, "preset" : "superfast" });
            if(i === 0){
                console.log("VIDEO MASTER PATH")
                if(lmsInput.medium == 'video'){
                    console.log("VIDEO")
                    createPath(lmsInput.params.subsessions[0].port, receiverId, dashId, lmsInput.params.subsessions[0].port, vDstReaderId, [vDecoderId, lmsVideos[i].id, lmsVideos[i].id + 1]);
                    configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                    lmsVideos[i].dstR = vDstReaderId;
                    vDstReaderId++;
                } else if (lmsInput.medium == 'both') {
                    console.log("BOTHv")
                    createPath(lmsInput.videoParams.subsessions[0].port, receiverId, dashId, lmsInput.videoParams.subsessions[0].port, vDstReaderId, [vDecoderId, lmsVideos[i].id, lmsVideos[i].id + 1]);                    
                    configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                    lmsVideos[i].dstR = vDstReaderId;
                    vDstReaderId++;
                }
            } else {
                console.log("VIDEO SLAVE PATH")
                createPath(vMasterPathId + i, vDecoderId, dashId, -1, vDstReaderId, [lmsVideos[i].id, lmsVideos[i].id + 1]);
                configureFilter(dashId, 'addSegmenter', { "id" : vDstReaderId});
                configureFilter(dashId, 'setBitrate', { "id" : vDstReaderId, "bitrate": lmsVideos[i].bitRate });
                lmsVideos[i].dstR = vDstReaderId;
                vDstReaderId++;                
            }   
        }
        for(i = 0; i < lmsAudios.length; i++){
            createFilter(lmsAudios[i].id, 'audioEncoder');
            configureFilter(lmsAudios[i].id, 'configure', { "codec" : 'aac', "sampleRate" : parseInt(lmsAudios[i].sampleRate), 
                                                            "channels" : lmsAudios[i].channels, "bitrate" : lmsAudios[i].bitRate });
            if(i === 0){
                console.log("AUDIO MASTER PATH")
                if(lmsInput.medium == 'audio'){
                    console.log("AUDIO")
                    createPath(lmsInput.params.subsessions[0].port, receiverId, dashId, lmsInput.params.subsessions[0].port, aDstReaderId, [aDecoderId, lmsAudios[i].id]);
                    configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                    lmsAudios[i].dstR = aDstReaderId;
                    aDstReaderId++; 
                } else if (lmsInput.medium == 'both') {
                    console.log("BOTHa")
                    createPath(lmsInput.audioParams.subsessions[0].port, receiverId, dashId, lmsInput.audioParams.subsessions[0].port, aDstReaderId, [aDecoderId, lmsAudios[i].id]);                    
                    configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                    configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                    lmsAudios[i].dstR = aDstReaderId;
                    aDstReaderId++; 
                }
            } else {
                console.log("AUDIO SLAVE PATH")
                createPath(aMasterPathId + i, aDecoderId, dashId, -1, aDstReaderId, [lmsAudios[i].id]);
                configureFilter(dashId, 'addSegmenter', { "id" : aDstReaderId});
                configureFilter(dashId, 'setBitrate', { "id" : aDstReaderId, "bitrate": lmsAudios[i].bitRate });
                lmsAudios[i].dstR = aDstReaderId;
                aDstReaderId++; 
            }   
        }
    };

    function addEditVideoModal(id,width,height,bitrate){
        $("#editModals").html('<!-- Modal window - form: addVideoModal -->'+
        '<div class=\"modal fade\" id=\"editDashVideoModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">'+
          '<div class=\"modal-dialog\">'+
            '<div class=\"modal-content well\">'+
              '<div class=\"modal-header\">'+
                '<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>'+
                '<h4 class=\"modal-title\">Edit video representation '+ id +'</h4>'+
              '</div>'+
              '<div class=\"modal-body\">'+
              '<!-- The form is placed inside the body of modal -->'+
                '<div class=\"row\">'+
                  '<div class=\"col-sm-12\">'+
                    '<form class=\"form-horizontal\" data-async role=\"form\" data-target=\"#editDashVideoModal\" id=\"editDashVideoModalForm\">'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Height (px)</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"width\" placeholder=\"e.g.: 1920\" required=\"true\" value=\"'+width+'\">'+
                          '<input type=\"hidden\" name=\"videoid\" value=\"'+lmsVideos[id].id+'\">'+   
                          '<input type=\"hidden\" name=\"videoidinternal\" value=\"'+id+'\">'+   
                        '</div>'+
                      '</div>'+
                      '<div class=\"row\">&nbsp;</div>'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Width (px)</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"height\" placeholder=\"e.g.: 1080\" required=\"true\" value=\"'+height+'\">'+
                        '</div>'+
                      '</div>'+
                      '<div class=\"row\">&nbsp;</div>'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Bitrate (bps)</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"bitRate\" placeholder=\"e.g.: 2000000\" required=\"true\" value=\"'+bitrate+'\">'+
                        '</div>'+
                      '</div> '+
                      '<div class=\"row\">&nbsp;</div>'+
                    '</form>'+
                  '</div>'+
                '</div>'+
              '</div>'+
              '<div class=\"modal-footer\">'+
                '<button class=\"btn\" data-dismiss=\"modal\">Cancel</button>'+
                '<button form=\"editDashVideoModalForm\" class=\"btn btn-default\" type=\"submit\">Edit</button>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'
        );  
    }

    function addEditAudioModal(id,samplerate,channels,bitrate){
        $("#editModals").html('<!-- Modal window - form: addAudioModal -->'+
        '<div class=\"modal fade\" id=\"editDashAudioModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">'+
          '<div class=\"modal-dialog\">'+
            '<div class=\"modal-content well\">'+
              '<div class=\"modal-header\">'+
                '<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>'+
                '<h4 class=\"modal-title\">Edit audio representation '+ id +'</h4>'+
              '</div>'+
              '<div class=\"modal-body\">'+
              '<!-- The form is placed inside the body of modal -->'+
                '<div class=\"row\">'+
                  '<div class=\"col-sm-12\">'+
                    '<form class=\"form-horizontal\" data-async role=\"form\" data-target=\"#editDashAudioModal\" id=\"editDashAudioModalForm\">'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Samplerate (Hz)</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"sampleRate\" placeholder=\"e.g.: 48000\" required=\"true\" value=\"'+samplerate+'\">'+
                          '<input type=\"hidden\" name=\"audioid\" value=\"'+lmsAudios[id].id+'\">'+   
                          '<input type=\"hidden\" name=\"audioidinternal\" value=\"'+id+'\">'+   
                        '</div>'+
                      '</div>'+
                      '<div class=\"row\">&nbsp;</div>'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Channels</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"channels\" placeholder=\"e.g.: 2\" required=\"true\" value=\"'+channels+'\">'+
                        '</div>'+
                      '</div>'+
                      '<div class=\"row\">&nbsp;</div>'+
                      '<div class=\"form-group\">'+
                        '<div class=\"col-sm-3\">'+
                          '<h5>Bitrate (bps)</h5>'+
                        '</div>'+
                        '<div class=\"col-sm-9\">'+
                          '<input type=\"numeric\" class=\"form-control input-sm\" name=\"bitRate\" placeholder=\"e.g.: 192000\" required=\"true\" value=\"'+bitrate+'\">'+
                        '</div>'+
                      '</div> '+
                      '<div class=\"row\">&nbsp;</div>'+
                    '</form>'+
                  '</div>'+
                '</div>'+
              '</div>'+
              '<div class=\"modal-footer\">'+
                '<button class=\"btn\" data-dismiss=\"modal\">Cancel</button>'+
                '<button form=\"editDashAudioModalForm\" class=\"btn btn-default\" type=\"submit\">Edit</button>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'
        );  
    }


    ////////////////////////////////////////////
    // SPECIFIC API METHODS
    ////////////////////////////////////////////
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
                    console.log("CONFIGURE FILTER");
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
                    console.log("CREATE FILTER");
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
        console.log("NEW PATH")
        console.log(message)
        $.ajax({
            type: 'POST',
            async: false,
            url: apiURI+'/createPath',
            data: JSON.stringify(message),
            contentType: "application/json; charset=utf-8",
            traditional: true,
            success : function(msg) {
                if(!msg.error){
                    console.log("CREATE PATH");
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

    function getState() {
        $.ajax({
            type: 'GET',
            url: apiURI+'/state',
            dataType: 'json',
            async: false,
            success : function(msg) {
                if(!msg.error){
                    lmsState = msg.message;
                    console.log("STATE");
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
