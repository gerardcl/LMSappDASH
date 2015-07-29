$(document).ready( function() {
    var apiURI = 'http://127.0.0.1:8080/api';
	var lmsInstance = null, 
		lmsInput = null,
		lmsDashRepresentation = null,
		lmsDashRepresentationList = null;

    $("#view").load("./app/views/instance.html");

    $( '#view, #form, #connectForm' ).submit(function(event) {
	  	var $form = $( '#connectForm' );
		var	message = { 
			'host' : $form.find( "input[id='host']" ).val(),
			'port' : $form.find( "input[id='port']" ).val()
		};
	    var	uri = apiURI + $form .attr('action');
        $.ajax({
            type: 'POST',
            url: uri,
            data: message,
            dataType: 'json',
        	success : function(msg) {
				if(!msg.error){
					lmsInstance = message;
                    addAlertSuccess(msg.message);
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
        console.log('lmsInstance:')
        console.log(lmsInstance)        
        return false;
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
            console.log('lmsInstance: '+lmsInstance)        
        });
    });

    // ALERTS MANAGEMENT
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

