function offlineMemData()
{
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", "offlineMembers.txt", false);
	rawFile.send(null);
	return JSON.parse(rawFile.responseText);
}

function loadMemData()
{
	var data = getMemData(offlineMemData());
	if (navigator.onLine && !forceOffline)
	{
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", "https://dashboard.moneylover.me/member/getOnlyActiveMember", false);
		xhttp.send();
		data = getMemData(JSON.parse(xhttp.responseText));
	}
	createChartFromData(data);
	return data;
}

function getMemData(json)
{
	var data = [];
	for (var i = 0; i < json.d.length; i++)
	{
		var mem = json.d[i];
		mem.id = mem._id;
		mem.name = mem.fullName;

		var startWork = mem.timeFrame.from.hours + mem.timeFrame.from.minutes / 60;
		var toNoon = 12 - startWork;
		var endWork = mem.timeFrame.to.hours + mem.timeFrame.to.minutes / 60;
		var fromNoon = endWork - 13.5;
		var workTotal = Math.max(0, toNoon) + Math.max(0, fromNoon);
		var workSpan = Math.round(workTotal * 100) / 100;
		if (startWork > 12 || endWork < 13.5)
		{
			workSpan = endWork - startWork;
		}

		data.push({
			name: mem.name,
			id: mem.id,
			startWork: startWork,
			workSpan: workSpan,
			fullTime: workSpan >= 7 ? true : false
		});
	}
	data.sort(function (a, b)
	{
		if (a.workSpan === b.workSpan)
		{
			var aname = a.name.split(" ");
			aname = aname[aname.length - 1].toLowerCase();
			var bname = b.name.split(" ");
			bname = bname[bname.length - 1].toLowerCase();
			return aname.localeCompare(bname);
		}
		else return b.workSpan - a.workSpan;
	});
	return data
}

function createChartFromData(data)
{
	var mems = [];
	var works = [];
	var colors = [];
	data.forEach(function (obj)
	{
		mems.push(obj.name);
		works.push(obj.workSpan);
		if (obj.fullTime) colors.push("#70CEE2");
		else colors.push("#F06543");
	});

	var ctx = "chart_workspan";
	Chart.defaults.global.defaultColor = '#4CAF50';
	var theChart = new Chart(ctx,
		{
			type: 'horizontalBar',
			data:
				{
					labels: mems,
					datasets:
						[{
							label: "Registered workspan",
							data: works,
							backgroundColor: colors,
						}],
				},
			options:
				{
					title:
						{
							display: false,
							text: "Registered workspan",
							fontColor: '#000',
							fontSize: 15
						},
					legend: {display: false},
					maintainAspectRatio: false,
					layout: {padding: 5},
					scales: {xAxes: [{ticks: {beginAtZero: true, stepSize: 0.5}}]},
				}
		});
}