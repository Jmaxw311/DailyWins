"strict"

const initDailyWins = function(onDailyWinsApiReady) {

    var apiUrl = 'https://ddby5gvlcj.execute-api.us-east-2.amazonaws.com/prod/';

    const getCookie = function(name) {
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    };
    
    const getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    };

    // var apiKey = getUrlParameter('x-api-key');
    // if(apiKey === null || typeof apiKey === 'undefined')
    //     apiKey = getCookie('dwapikey');

    var onSuccess = function(data) {
        var apiKey = data['apiKey'];
        var apiGet = function(resource, callback) {
            $.ajax({
                url: apiUrl + resource,
                type: 'get',
                headers: {
                    "x-api-key": apiKey
                },
                beforeSend: function(xhr){xhr.setRequestHeader("x-api-key", apiKey);},
                //dataType: 'json',
                success: callback,
                error: function(xhr,status,error){console.log("%s %s %s",xhr,status,error);}
            });
        };

        var apiPost = function(resource, payload, callback) {
            $.ajax({
                url: apiUrl + resource,
                type: 'post',
                headers: {
                    "x-api-key": apiKey
                },
                data: JSON.stringify(payload),
                beforeSend: function(xhr){xhr.setRequestHeader("x-api-key", apiKey);},
                dataType: 'json',
                success: callback,
                error: function(xhr,status,error){console.log("%s %s %s",xhr,status,error);}
            });
        };

        onDailyWinsApiReady(apiGet, apiPost); // run code that uses the api
    };

    var failAuth = function(xhr,status,error) {
        console.log("%s %s %s",xhr,status,error);
        onSuccess({ "apiKey": getUrlParameter('api') });
    }
    
    var code = getUrlParameter('code');
    $.ajax({
        url: apiUrl + 'users/token',
        type: 'post',
        data: JSON.stringify({"code": code }),
        dataType: 'json',
        success: onSuccess,
        error: failAuth
    });
};

const requestAuthorization = function() {
    window.location.replace("http://dailywinsapi.zapto.org");
}
