    var polygons = [];
    var now = new Date();
    var start_lat = 39.298333; 
    var start_lon = -105.041667;
    var start_zoom = 7;
    var map;
    var this_data;
    var timeout;
    var date_num = 0;
    var data_type = 2;
    var current_date;
    var reanimate = false;
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(draw_map);
    jQuery(document).ready( function() {
        jQuery( "#slider" ).slider({
          value:0,
          min: 0,
          max: 9,
          slide: handle_slide,
          change: handle_slide
        });
    });
    var handle_slide = function( event, ui ) {
        reanimate = false;
        date_num = ui.value;
        jQuery('#the-date').text(dates[ui.value]);
        make_poly_colors(dates[ui.value]);
    }
    function draw_map() {

        var myLatLng = new google.maps.LatLng(start_lat, start_lon);
           
        var mapOptions = {
                zoom: start_zoom,
                center: myLatLng,
                styles: gmap_styles,
                mapTypeId: google.maps.MapTypeId.ROADMAP
                };
        map = new google.maps.Map(document.getElementById("dfm_rain_map_div"),
              mapOptions);
        var source   = $('#map-legend-template').html();
        var template = Handlebars.compile(source);
        var context = {};

        var legend_text = template(context);
        
        var legend_div = document.createElement('div');
        legend_div.className = 'legend';
        legend_div.innerHTML = legend_text;
        legend_div.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend_div);        
        var start_date = dates[date_num];
        current_date = start_date;
        jQuery('#the-date').text(start_date);
        this_data = data[start_date];
        make_cum();
        jQuery.each(this_data,function(county,day_data) {
            var label = county; 
            var poly_color = how_much_rain(day_data[data_type]);
            polygons[county] = add_polygon(counties[county],poly_color, '#000',1,0.6,map,label);
            polygons[county].setMap(map);
            
        });
    }
    var make_cum = function() {
        jQuery.each(this_data, function(county,day_data) {
            if(this_data[county].length < 3) {
                this_data[county].push(0);
            }
            else {
                this_data[county][2] = 0;
            }
        });
        if(date_num === 0) { return; }
        for(i=0;i <= date_num; i++) {
            var date = dates[i];
            var date_data = data[date];
            jQuery.each(date_data, function (county, date_data) {
                if(date_data != -1) {
                    this_data[county][2] += date_data[1];
                    this_data[county][2] = parseFloat( this_data[county][2].toFixed(2));
                }
            });
        }
    
    }
    function add_polygon(poly_coords,fill_color, stroke_color,weight,opacity,map,label) {
        var marker = new MarkerWithLabel({
            position: new google.maps.LatLng(0,0),
            draggable: false,
            raiseOnDrag: false,
            map: map,
            labelContent: label,
            labelAnchor: new google.maps.Point(30, 20),
            labelStyle: {'opacity': 1.0,'background-color': 'white',width:'80px',border:'1pt solid black',padding:'2px','font-family': 'Arial','font-size':'10pt'},
            icon: "http://placehold.it/1x1",
            labelInBackground: false,
            visible: false
        });
        var polygon = new google.maps.Polygon({
        paths: poly_coords,
        strokeColor: stroke_color,
        strokeOpacity: 1,
        strokeWeight: weight,
        fillColor: fill_color,
        fillOpacity: opacity
      });
        google.maps.event.addListener(polygon, "mousemove", function(event) {
            var lat = event.latLng.lat();
            lat += lat * 0.0115;
            var lon = event.latLng.lng();
            lon -= lon * 0.004;
            marker.setPosition(new google.maps.LatLng(lat,lon));
            if(/^<br.*/.test(marker.labelContent)) {
                marker.labelContent.replace(/^<br.*/,'');
            }
            var rainfall = this_data[label];
            var ave = rainfall[0];
            var max = rainfall[1];
            var cumulative = rainfall[2];
            if(ave == -1) { ave = 'N/A'; }
            if(max == -1) { max = 'N/A'; }
            var source   = $('#map-rollover-template').html();
            var template = Handlebars.compile(source);
            var context = {'label':label,'max':max,'ave':ave,'cumulative':cumulative};

            var content = template(context);
            marker.setOptions({labelContent:content});
            marker.setVisible(true);
        });
        google.maps.event.addListener(polygon, "mouseout", function(event) {
            marker.setVisible(false);
        });
        return polygon;
    }
    var how_much_rain = function(amount) {
        //hey, don't blame use for these ugly colors. the paper insisted on it.
        if ( amount == -1) { return '#4d4d4b'; }
        if (amount > 20) { return '#A23622'; }
        if (amount > 10) { return '#D8472A'; }
        if (amount > 5) { return '#ECA395'; }
        if (amount > 2) { return '#EEC534'; }
        if (amount > 1) { return '#F6E39A'; }
        return '#92BD7E';    
    }

    var make_poly_colors = function(this_date) {
        current_date = this_date;
        this_data = data[this_date];
        make_cum();
        jQuery.each(this_data, function(county,day_data) {
            var color = how_much_rain(day_data[data_type]);
            polygons[county].setOptions({fillColor:color});
        
        });
    
    }
    var switch_data_type = function(number) {
        data_type=number;
        make_poly_colors(current_date);
    }
    
    var slider_switch = function() {
        var text = jQuery('a.animate').text();
        if(text == 'Animate') {
            jQuery('a.animate').text('Pause');
            scroll_slider()
        }
        else {
            clearTimeout(timeout);
            jQuery('a.animate').text('Animate');
        
        }
    
    
    }
    
    var scroll_slider = function() {
        var slide_value;
        slide_value = jQuery('#slider').slider('value');
        if(slide_value < 9 ){
              jQuery('#slider').slider('value', slide_value + 1);
               timeout = setTimeout(scroll_slider, 1000);
        }
        else {
            if (jQuery('a.animate').html() == 'Pause' && !reanimate) {
                jQuery('a.animate').text('Animate');
                reanimate = true;
            }
            else {
               jQuery('#slider').slider('value',0);
               reanimate = false;
               jQuery('a.animate').text('Pause');
               timeout = setTimeout(scroll_slider, 1000);
            }
        }
}
