console.log(d3);

// d3.select('body').datum(0).on('click', function(d) {
// 	console.log(d);
// 	console.log(d3.event);
// 	console.log(this); //DOM element, not the selection == the node
// 	console.log(d3.select(this).attr('height')); //a selection of the node, has attributes
// })


// var dis = d3.dispatch('customEvent1');

// dis.on('customEvent1', function(name){
// 	console.log('Hello ', name);
// });

// dis.call('customEvent1', 'this is a context object,' 'siqi');

d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){
	
	//Data model
	var cf = crossfilter(trips);
	var tripsByStartTime = cf.dimension(function(d){return d.startTime}),
		tripsByStartStation = cf.dimension(function(d){return d.startStn}),
		tripsByEndStation = cf.dimension(function(d){return d.endStn});

	//Time series module
	var timeseries = Timeseries();
	d3.select('#plot1').datum(tripsByStartTime.top(Infinity))
		.call(timeseries);

	//Pie chart module: showing user type breakdown
	var piechartByUserType = Piechart().value(function(d){return d.userType});
	d3.select('#plot2').datum(tripsByStartTime.top(Infinity))
		.call(piechartByUserType);

	//Pie chart module: showing user gender breakdown
	var piechartByUserGender = Piechart().value(function(d){return d.userGender});
	d3.select('#plot3').datum(tripsByStartTime.top(Infinity).filter(function(d){return d.userGender}))
		.call(piechartByUserGender);

	//UI module
	var startStationList = StationList()
		.on('station:select', function(id){
			console.log('start station selected ', id);
		});

	var endStationList = StationList();
		.on('station:select', function(id){
			console.log('end station selected ', id);
		});

	d3.select('#start-station').datum(stations).call(startStationList);
	d3.select('#end-station').datum(stations).call(endStationList);

	//Listen to global dispatcher
	dispatcher.on('timerange:select', function(range){
		tripsByStartTime.filter(range);

	// d3.select('#plot1').datum(tripsByStartTime.top(Infinity))
	// 	.call(timeseries);

	d3.select('#plot2').datum(tripsByStartTime.top(Infinity))
		.call(piechartByUserType);

	d3.select('#plot3').datum(tripsByStartTime.top(Infinity).filter(function(d){return d.userGender}))
		.call(piechartByUserGender);
	});
}

function parseTrips(d){
	return {
		bike_nr:d.bike_nr,
		duration:+d.duration,
		startStn:d.strt_statn,
		startTime:parseTime(d.start_date),
		endStn:d.end_statn,
		endTime:parseTime(d.end_date),
		userType:d.subsc_type,
		userGender:d.gender?d.gender:undefined,
		userBirthdate:d.birth_date?+d.birth_date:undefined
	}
}

function parseStations(d){
	return {
		id:d.id,
		lngLat:[+d.lng,+d.lat],
		city:d.municipal,
		name:d.station,
		status:d.status,
		terminal:d.terminal
	}
}

function parseTime(timeStr){
	var time = timeStr.split(' ')[1].split(':'),
		hour = +time[0],
		min = +time[1],
		sec = +time[2];

	var	date = timeStr.split(' ')[0].split('/'),
		year = date[2],
		month = date[0],
		day = date[1];

	return new Date(year,month-1,day,hour,min,sec);
}