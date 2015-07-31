$(document).ready( function() {
    var apiURI = null;
	var lmsInstance = null, 
		lmsInput = null,
		lmsDashRepresentation = null,
		lmsDashRepresentationList = null;

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
                            $("#disconnectButton").addClass("hidden");
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
                        'codec'     : form.find( "select[name='codec']" ).val(),
                        'port'      : vport,
                        'bandwidth' : 5000,
                        'timeStampFrequency'   : 90000,
                        'channels'  : null
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
                        'codec'     : form.find( "select[name='codec']" ).val(),
                        'port'      : aport,
                        'bandwidth' : 5000,
                        'timeStampFrequency'   : form.find( "select[name='sampleRate']" ).val(),
                        'channels'  : form.find( "select[name='channels']" ).val()
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
                        'audio'     : {
                            'medium'    : 'audio',
                            'codec'     : form.find( "select[name='audio-codec']" ).val(),
                            'port'      : aport,
                            'bandwidth' : 5000,
                            'timeStampFrequency'   : form.find( "select[name='sampleRate']" ).val(),
                            'channels'  : form.find( "select[name='channels']" ).val()
                        },
                        'video'     : {
                            'medium'    : 'video',
                            'codec'     : form.find( "select[name='video-codec']" ).val(),
                            'port'      : vport,
                            'bandwidth' : 5000,
                            'timeStampFrequency'   : 90000,
                            'channels'  : null
                        }
                    };
                    addAlertSuccess('Success setting network input params');
                    $("#view").load("./app/views/dasher.html");
                }
                break;
            default:
                lmsInput = null;
                addAlertError('ERROR: no valid inputs... please check.');
        }
    };

    function addVideoDASH(form) {
        console.log("ADDING NEW VIDEO TO REPRESENTATION LISTS")

    };
 
    function addAudioDASH(form) {
        console.log("ADDING NEW AUDIO TO REPRESENTATION LISTS")

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
    };

});

