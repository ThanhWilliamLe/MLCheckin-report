function offlineCheckInData()
{
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", "offlineCheckIn.txt", false);
	rawFile.send(null);
	return JSON.parse(rawFile.responseText);
}

function offlineCheckOutData()
{
	return offlineCheckInData();
}

function checkInTableInit()
{
	var table = $("#table_checkin");
	table.DataTable({
		paging: false,
		columns: [
			{title: "Rank", data: "rank"},
			{title: "Name", data: "name", width: "20%"},
			{title: "Fulltime", data: "fullTime"},
			{title: "Checkins", data: "checkIns"},
			{title: "Days off", data: "offDays"},
			{title: "Late days", data: "lateDays"},
			{
				title: "Late total", data: "lateSum", render: function (data, type, row)
			{
				return data + 'm';
			}
			},
			{title: "Score", data: "score"}
		],
		order: [[7, 'desc']],
	});
	table.css('width', '100%');

	var tableFilter = document.getElementById('table_checkin_filter');
	tableFilter.style.width = '100%';
	tableFilter.style['margin-top'] = '1em';
	tableFilter.style['margin-bottom'] = '1em';
	tableFilter.firstChild.style.width = '100%';
	tableFilter.firstChild.style.margin = '0';
	tableFilter.firstChild.style.color = 'white';
	tableFilter.firstChild.getElementsByTagName('input')[0].style.width = '33%';

	document.getElementById('table_checkin_info').style.display = 'none';
}

function loadCheckInData(data, from, to)
{
	var result = processCheckin(data, offlineCheckInData())
	if (navigator.onLine && !forceOffline)
	{
		var xhttp = new XMLHttpRequest();
		xhttp.open("POST", "https://dashboard.moneylover.me/checkin/exportCsv", false);
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify({
			"idMember": "",
			"startDate": from,
			"endDate": to
		}));
		result = processCheckin(data, JSON.parse(xhttp.responseText));
	}
	loadDataToTable(result);
	return result;
}

function processCheckin(data, json)
{
	var result = {};
	var jsonData = json.d;

	data.forEach(function (eachMem)
	{
		result[eachMem.id] = {
			id: eachMem.id,
			name: eachMem.name,
			fullTime: eachMem.fullTime,
			startWork: eachMem.startWork,
			workSpan: eachMem.workSpan,
			offDays: {},
			checkIns: [],
			lateDays: 0,
			lateSum: 0,
			score: 0
		};
	});

	jsonData.forEach(function (checkIn)
	{
		if (checkIn != null && checkIn.memberKey.active)
		{
			var day = checkIn.timeCheckIn.substring(0, 11);
			var hour = checkIn.timeCheckIn.substring(11, 19);
			hour = 7 + parseFloat(hour.substring(0, 2)) + parseFloat(hour.substring(3, 5)) / 60 + parseFloat(hour.substring(6, 8)) / 3600;

			var memData = result[checkIn.memberKey._id];
			if (memData != null)
			{
				if (checkIn.reason != null && checkIn.reason.length > 0)
				{
					if (checkIn.isAbsent) memData.offDays[day] = true;
				}
				else
				{
					if (memData.checkIns[day] == null)
					{
						memData.score += 12.5 * memData.workSpan;
						memData.checkIns[day] = true;
						var lateMins = (hour - memData.startWork) * 60;
						if (lateMins > 0)
						{
							memData.lateDays++;
							memData.lateSum += lateMins;
							memData.score -= 10 + lateMins;
						}
					}
				}
			}
		}
	});

	data.forEach(function (eachMem)
	{
		var memData = result[eachMem.id];
		if (memData != null)
		{
			memData.offDays = Object.keys(memData.offDays).length;
			memData.checkIns = Object.keys(memData.checkIns).length;
			memData.score = Math.round(memData.score);
		}
	});
	return result;
}

function loadDataToTable(data)
{
	var tableData = [];
	Object.keys(data).forEach(function (mem)
	{
		var memData = data[mem];
		memData.fullTime = memData.fullTime ? 'Yes' : 'No';
		memData.lateSum = Math.round(memData.lateSum);
		tableData.push(memData);
	});

	tableData.sort(function (a, b)
	{
		return b.score - a.score;
	});
	for (var i = 0; i < tableData.length; i++)
	{
		tableData[i].rank = i + 1;
	}

	var table = $("#table_checkin").DataTable();
	table.clear();
	table.rows.add(tableData);
	table.draw();
}
