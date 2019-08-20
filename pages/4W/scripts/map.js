//function that load the map on when the window loads 
$(window).on('load', function() {
	var documentSettings = {};
	var markerColors = [];

	var polygonSettings = [];
	var polygonSheets = 1;
	var polygonsLegend;

	var completePoints = false;
	var completePolygons = false;
	var completePolylines = false;

	/**
	   * Returns an Awesome marker with specified parameters
	   */
	function createMarkerIcon(icon, prefix, markerColor, iconColor) {
		return L.AwesomeMarkers.icon({
			icon: icon,
			prefix: prefix,
			markerColor: markerColor,
			iconColor: iconColor
		});
	}


	/**
	   * Sets the map view so that all markers are visible, or
	   * to specified (lat, lon) and zoom if all three are specified
	   */
	function centerAndZoomMap(points) {
		var lat = map.getCenter().lat, latSet = false;
		var lon = map.getCenter().lng, lonSet = false;
		var zoom = 12, zoomSet = false;
		var center;

		if (getSetting('_initLat') !== '') {
			lat = getSetting('_initLat');
			latSet = true;
		}

		if (getSetting('_initLon') !== '') {
			lon = getSetting('_initLon');
			lonSet = true;
		}

		if (getSetting('_initZoom') !== '') {
			zoom = parseInt(getSetting('_initZoom'));
			zoomSet = true;
		}

		if ((latSet && lonSet) || !points) {
			center = L.latLng(lat, lon);
		}
		 else {

			center = points.getBounds().getCenter();
		}

		if (!zoomSet && points) {
			zoom = map.getBoundsZoom(points.getBounds());
		}

		map.setView(center, zoom);
	}


	/**
	   * Given a collection of points, determines the layers based on 'Group'
	   * column in the spreadsheet.
	   */
	function determineLayers(points) {
		
		(function (d3, $, queue, window) {
			'use strict';
			// https://www.humanitarianresponse.info/en/operations/afghanistan/cvwg-3w
			// https://public.tableau.com/profile/geo.gecko#!/vizhome/Districtpolygon/v1?publish=yes
			'use strict';
			String.prototype.replaceAll = function (search, replacement) {
				var target = this;
				return target.replace(new RegExp(search, 'g'), replacement);
			};
			String.prototype.capitalize = function () {
				return this.charAt(0).toUpperCase() + this.slice(1);
			};
			// function capitalizeFirstLetter(string) {
			//   return string.charAt(0).toUpperCase() + string.slice(1);
			// }
			var _selectedDataset;
			var dataset;
			queue()
			// .defer(d3.json, "./UgandaDistricts.geojson")//DNAME_06
				.defer(d3.json, "./data/povertyAndPopulationDensity.geojson")
				.defer(d3.csv, "./data/mapValues.csv")
				.defer(d3.csv, "./data/dataset2.csv")
				.await(ready);





			var global = {};
			global.selectedDistrict = []; // name
			global.selectedSector = []; // ID
			global.selectedAgency = []; // ID
			global.selectedUn = []; // Type UN
			global.selectedIp = []; // Type IP
			global.selectedOp = []; // Type OP
			global.selectedDonor = []; // Type Donor
			global.selectedActorType = []; // Type Actor
			global.districtCount;
			global.parishCount;
			global.sectorCount;
			global.agencyCount;
			global.donorCount;
			global.actorTypeCount;
			global.beneficiaryCount;
			global.unCount;
			global.ipCount;
			global.opCount;
			global.currentEvent;
			// global.needRefreshDistrict;

//function tha refresh the counts on load 
			function refreshCounts() {
				d3.select("#district-count").text(global.districtCount);
				d3.select("#sector-count").text(global.sectorCount);
				d3.select("#agency-count").text(global.agencyCount);
				d3.select("#beneficiary-count").text(global.beneficiaryCount);
				d3.select("#agencyUN-count").text(global.unCount);
				d3.select("#agencyIP-count").text(global.ipCount);
				d3.select("#agencyOP-count").text(global.opCount);
				global.selectedDistrict = [];
				global.selectedSector = [];
				global.selectedAgency = [];
				global.beneficiaryCount = [];
				global.selectedUn = [];
				global.selectedIp = [];
				global.selectedOp = [];

				d3.select("#partner-list-count").text(0);
				d3.select("#sector-list-count").text(0);
				d3.select("#parish-list-count").text(0);
				d3.select("#donor-list-count").text(0);
				d3.select("#actor-type-list-count").text(0);
				d3.select("#partner-header-total").text(global.agencyCount);
				d3.select("#sector-header-total").text(global.sectorCount);
				d3.select("#parish-header-total").text(global.parishCount);
				d3.select("#donor-header-total").text(global.donorCount);
				d3.select("#actor-type-header-total").text(global.actorTypeCount);


				_selectedDataset = dataset;
			}
		//function that check error, the Json files sector and relationship
			function ready(error, ugandaGeoJson, sector, relationship) {
				//standard for if data is missing, the map shouldnt start.
				if (error) {
					throw error;
				}
				ugandaGeoJson.features.map(function (d) {
					d.properties.DNAME_06 = d.properties.dist;
				});

				$(".custom-list-header").click(function () {
					$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
					$(this).siblings(".custom-list").toggleClass('collapsed');
					$(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
				});

				// Collapses all the boxes apart from subCounty
				$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
				$("#agency-list.custom-list").removeClass('collapsed');

				//need join all data
				var nameAbbKays = d3.keys(points[0]);
				var sectorKays = d3.keys(sector[0]);

				dataset = points.map(function (d) {
					var i;

					for (i = 0; i < sector.length; i++) {
						if (sector[i].Sector_Other === d.Sector_Other) {
							sectorKays.map(function (k) {
								d[k] = sector[i][k];
							});
							break;
						}
					}
					return d;
				});
				var districtList = d3.nest().key(function (d) {
					return d.Parish;
				}).sortKeys(d3.ascending).entries(points);

				var sectorList = d3.nest().key(function (d) {
					return d.Sector_Other;
				}).sortKeys(d3.ascending).entries(points);

				var agencyList = d3.nest().key(function (d) {
					return d["Agency name"];
				}).sortKeys(d3.ascending).entries(points);


				var donorList = d3.nest().key(function (d) {
					return d["Donor"];
				}).sortKeys(d3.ascending).entries(points);

				var actorTypeList = d3.nest().key(function (d) {
					return d["Actor type"];
				}).sortKeys(d3.ascending).entries(points);

				var beneficiaries = d3.sum(points, function(d){return parseFloat(d.Beneficiaries)});

				// Get the modal
				var modal = document.getElementById('myModal');

				// Get the <span> element that closes the modal
				var span = document.getElementsByClassName("close")[0];

				// When the user clicks on <span> (x), close the modal
				span.onclick = function() {
					modal.style.display = "none";
				};

				// When the user clicks anywhere outside of the modal, close it
				window.onclick = function(event) {
					if (event.target == modal) {
						modal.style.display = "none";
					}
				};

				$('.modal-content').resizable({
					alsoResize: ".modal-dialog",
					minHeight: 150
				});
				$('.modal-content').draggable();

				$('#myModal').on('show.bs.modal', function () {
					$(this).find('.modal-body').css({
						'max-height':'100%'
					});
				});



				global.districtCount = districtList.length;
				global.parishCount = ugandaGeoJson.features.length;
				global.sectorCount = sectorList.length;
				global.agencyCount = agencyList.length;
				global.donorCount = donorList.length;
				global.actorTypeCount = actorTypeList.length;
				global.beneficiaryCount = beneficiaries;

				d3.select("#partner-header-total").text(global.agencyCount);
				d3.select("#sector-header-total").text(global.sectorCount);
				d3.select("#parish-header-total").text(global.parishCount);
				d3.select("#donor-header-total").text(global.donorCount);
				d3.select("#actor-type-header-total").text(global.actorTypeCount);

				refreshCounts();
				updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);


				// varaible that control the visualization of the map, the zoom level and the sidebar
				var h = (window.innerHeight ||
						 document.documentElement.clientHeight ||
						 document.body.clientHeight);
				if (h > 540) {
					d3.select(".list-container").style("height", h + "px");
					d3.select("#d3-map-wrapper").style("height", h + "px");
				}
				var w = (window.innerWidth ||
						 document.documentElement.clientWidth ||
						 document.body.clientWidth);
				d3.select(".list-container").style("height", h - 0 + "px")

				L.control.zoom({
					position:'topright'
				}).addTo(map);

				var sidebar = L.control.sidebar('sidebar-left').addTo(map);

				sidebar.open("home");

				var sidebar1 = L.control.sidebar('sidebar-right', {position: "right"}).addTo(map);

				sidebar1.open("home1");
				//the map bound and setting the max bounds
				map.bounds = [],
					map.setMaxBounds([
					[4.5,29.5],
					[-1.5,34.5]
				])
				map.options.maxZoom=12;
				map.options.minZoom=7;

				var ugandaPath;
				var domain = [+Infinity, -Infinity];
				var opacity = 0.3;
				var wrapper = d3.select("#d3-map-wrapper");
				var width = wrapper.node().offsetWidth || 960;
				var height = wrapper.node().offsetHeight || 480;
				var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
				.interpolate(d3.interpolateHcl)
				.range([d3.rgb("#66f1c1"), d3.rgb('#172031')]); //#f597aa #a02842
				//				var tooltip = d3.select(map.getPanes().overlayPane)
				//				.append("div")
				//				.attr("class", "d3-tooltip d3-hide");
				var datasetNest = d3.nest().key(function (d) {
					return d.Parish;
				}).entries(dataset);

				var datasetAgency = d3.nest().key(function (d) {
					return d["Agency name"];
				}).entries(dataset);
				//function that update the table data 
				function updateTable(data) {

					d3.select('#page-wrap').select('table').remove();
					var sortAscending = true;
					var table = d3.select('#page-wrap').append('table');
					var titles = d3.keys(data[0]);
					var titlesText = ["Parish Name", "Number of agencies"]
					var headers = table.append('thead').append('tr')
					.selectAll('th')
					.data(titlesText).enter()
					.append('th')
					.text(function (d) {
						return d;
					})
					.on('click', function (d) {
						headers.attr('class', 'header');
						if (sortAscending) {
							rows.sort(function(a, b) { 
								return d3.descending(a.key, b.key);
							});
							sortAscending = false;
							this.className = 'aes';
						} 

						else {
							rows.sort(function(a,b){
								return d3.ascending(a.key, b.key)
							});
						}

					});
					var rows = table.append('tbody').selectAll('tr')
					.data(data).enter()
					.append('tr');
					rows.selectAll('td')
						.data(function (d) {
						return titles.map(function (k) {
							if (k === 'values') {
								return { 'value': +(d[k].length), 'name': k};
							} 

							else {
								return { 'value': d[k], 'name': k};
							}

						});
					})
					//append data into the table 
					.enter()
						.append('td')
						.attr('data-th', function (d) {
						return d.name;
					})
						.text(function (d) {
						return d.value;
					}).on("click", function (d) {
						//checking if the parish data filter is equal to the district list filter
						if (d.name === "key") {
							var parishDataFilter = districtList.filter(function (k) {
								if (d.value === k.key) {
									var str = "<thead><tr><th style='border: 1px solid #ccc!important; width: 15%; text-decoration: none !important; text-align: left;'>Agency Name</th> <th style='border: 1px solid #ccc!important; width: 65%; text-decoration: none !important; text-align: left;'>Project Title</th><th style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; border: 1px solid #ccc!important; text-align: left;'>Project Start</th><th style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; border: 1px solid #ccc!important; text-align: left;'>Project End</th></tr></thead>";
									//looping through the tool tip list 
									var tooltipList = "";
									var i = 0;
									while (i < k.values.length) {
										tooltipList = tooltipList + ("<tr><td style='border: 1px solid #ccc!important; width: 15%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Agency name"] + "</td> <td style='border: 1px solid #ccc!important; width: 65%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Detailed Activity description"] + "</td><td style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Start (month)"] + "</td><td style='border: 1px solid #ccc!important; text-decoration: none !important; width: 10%; text-align: left;'>" + k.values[i]["End (month)"] + "</td></tr>");
										i++;
									}
									//getting the elements from the html page				
									document.getElementById('tbl-title').innerHTML = d.value;
									document.getElementById('tbl-header').innerHTML = str;
									document.getElementById('tbl-content').innerHTML = tooltipList;
									modal.style.display = "block";	
								}
							});
							}	
					})

						.on("mouseover", function (d){
						if(d.name === "key") {
							d3.select(this).style("cursor", "pointer");
						}
					});
				}

				var top5Values = datasetNest.sort(function(a,b){
					return d3.ascending(a.key, b.key);
				}).slice(1);
				updateTable(top5Values);

				//function to update the table 
				function updateTable1(data) {

					d3.select('#page-wrap1').select('table').remove();
					var sortAscending = true;
					var table = d3.select('#page-wrap1').append('table');
					var titles = d3.keys(data[0]);
					var titlesText = ["Name of Agency", "Number of activities"]
					var headers = table.append('thead').append('tr')
					.selectAll('th')
					.data(titlesText).enter()
					.append('th')
					.text(function (d) {
						return d;
					})
					.on('click', function (d) {
						headers.attr('class', 'header');
						if (sortAscending) {
							rows.sort(function(a,b){						
								return d3.descending(a.key, b.key)
							});
							sortAscending = false;
							this.className = 'aes';
						} 

						else {
							rows.sort(function(a,b){
								return d3.ascending(a.key, b.key)
							});
							sortAscending = true;
							this.className = 'des';
						}

					});
					var rows = table.append('tbody').selectAll('tr')
					.data(data).enter()
					.append('tr');
					rows.selectAll('td')
						.data(function (d) {
						return titles.map(function (k) {
							if (k === 'values') {
								return { 'value': +(d[k].length), 'name': k};
							} 

							else {
								return { 'value': d[k], 'name': k};
							}

						});
					}).enter()
						.append('td')
						.attr('data-th', function (d) {
						return d.name;
					})
						.text(function (d) {
						return d.value;
					}).on("click", function (d) {

						if (d.name === "key") {
							var agencyDataFilter = agencyList.filter(function (k) {
								if (d.value === k.key) {
									var str = "<thead><tr><th style='border: 1px solid #ccc!important; width: 15%; text-decoration: none !important; text-align: left;'>Parish</th> <th style='border: 1px solid #ccc!important; width: 65%; text-decoration: none !important; text-align: left;'>Project Title</th><th style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; border: 1px solid #ccc!important; text-align: left;'>Project Start</th><th style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; border: 1px solid #ccc!important; text-align: left;'>Project End</th></tr></thead>";

									var tooltipList = "";
									var i = 0;
									while (i < k.values.length) {
										tooltipList = tooltipList + ("<tr><td style='border: 1px solid #ccc!important; width: 15%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Parish"] + "</td> <td style='border: 1px solid #ccc!important; width: 65%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Detailed Activity description"] + "</td><td style='border: 1px solid #ccc!important; width: 10%; text-decoration: none !important; text-align: left;'>" + k.values[i]["Start (month)"] + "</td><td style='border: 1px solid #ccc!important; text-decoration: none !important; width: 10%; text-align: left;'>" + k.values[i]["End (month)"] + "</td></tr>");
										i++;
									}					
									document.getElementById('tbl-title').innerHTML = d.value;
									document.getElementById('tbl-header').innerHTML = str;
									document.getElementById('tbl-content').innerHTML = tooltipList;
									modal.style.display = "block";	
								}
							});
							}	
					})
						.on("mouseover", function (d){
						if(d.name === "key") {
							d3.select(this).style("cursor", "pointer");
						}
					});
				}

				var top5Values = datasetAgency.sort(function(a,b){
					return d3.ascending(a.key, b.key);
				}).slice(1);
				updateTable1(top5Values);

// defining the counties in an empty array
				var countries = [];
				var countriesOverlay = L.d3SvgOverlay(function (sel, proj) {
					var projection = proj.pathFromGeojson.projection;
					var path = d3.geo.path().projection(projection);

					ugandaPath = sel.selectAll('.district').data(countries);
					ugandaPath.enter()
						.append('path')
						.attr('d', proj.pathFromGeojson)
						.attr("z-index", "600")
						.attr("style", "pointer-events:all!important")
						.style("cursor", "pointer")
						.each(function (d) {
						d.properties.centroid = projection(d3.geo.centroid(d));
						datasetNest.map(function (c) {
							if (c.key === d.properties.DNAME_06) {
								d.properties._sectorList = d3.nest().key(function (a) {
									return a.Sector_Other;
								}).entries(c.values);
								d.properties._agencyList = d3.nest().key(function (a) {
									return a["Agency name"];
								}).entries(c.values);
								d.properties._unAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
									//return a.Actor_Type;
								})
								.entries(c.values);
								d.properties._ipAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
								}).entries(c.values);
								d.properties._opAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
								}).entries(c.values);
								domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
								domain[
									0];
								domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
								domain[
									1];
								color.domain(domain);
							}
						});
					})
						.style("stroke", function (d) {
						return d.properties._agencyList ? "#f00" : "#00000000"; //#3CB371
					})
					//						.on("click", function (d) {
					//						var svg = d3.select(this.parentNode.parentNode.parentNode);
					//						var mouse = d3.mouse(svg.node()).map(function (d) {
					//							return parseInt(d);
					//						});
					//						var str = "<tr><button type='button' class='close' onclick='$(this).parent().hide();'>×</button></tr>" +
					//							"<th><br/></th><tr><th>Parish:</th> <th style='right: 0;'><b>" + d.properties.DNAME_06 + "</b></th></tr>";
					//						if (d.properties._sectorList && d.properties._agencyList) {
					//
					//							var agencyListAbb = d3.values(d.properties._agencyList).map(function (d) {
					//								return d.values.map(function (v) {
					//									return v.Abbreviation;
					//								});
					//							});
					//
					//							var tooltipList = "";
					//							var i = 0;
					//							while (i < agencyListAbb.length) {
					//								tooltipList = tooltipList + ("<p>" + agencyListAbb[i][0] + "</p>");
					//								i++
					//							}
					//
					//							str = str + "<br><tr><th>Number of Agencies:</th> <th><b>" + d.properties._agencyList.length + "</b></th></tr>" +
					//								"<br><br>List of Agencies:<br><th><b>" + 
					//								"</b></th></tr><th></th><div><tr> <th style='text-align: right;'>" + tooltipList + "</th></tr></div>";
					//						}
					//						tooltip.html(str);
					//
					//						var box = tooltip.node().getBoundingClientRect() || {
					//							height: 0
					//						};
					//
					//
					//						tooltip
					//							.classed("d3-hide", false)
					//							.attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[
					//							1] - box.height) + "px; min-width: 200px; max-width: 400px; max-height: 300px; overflow-y: auto;");
					//						tooltip
					//					})
						.on("mouseover", highlightFeature)
						.on("mouseout", resetHighlight)
						.style("fill", function (d) {
						return d.properties._agencyList ? "#00000000" : "#00000000"; //#3CB371
					})
						.attr("class", function (d) {
						return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
					});

					//			ugandaPath.on("mouseover", function (d) {
					//
					//				var popup = L.popup()
					//				.setContent("<b>" + d.properties.s + " Division</b></br>" +
					//							"<b>Parish: </b>" + d.properties.pname + "</br>");
					//
					//				d.bindPopup(popup);
					//
					//				d.on("mouseover", function(e){
					//					this.openPopup();	
					//				})
					//
					//				d.on("mouseout", function(e){
					//					this.closePopup();	
					//				})
					//
					//			})

					ugandaPath.attr('stroke-width', proj.scale*1.5)
						.each(function (d) {
						d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
						datasetNest.map(function (c) {
							if (c.key === d.properties.DNAME_06) {
								d.properties._sectorList = d3.nest().key(function (a) {
									return a.Sector_Other;
								}).entries(c.values);
								d.properties._agencyList = d3.nest().key(function (a) {
									return a["Agency name"];
								}).entries(c.values);
								d.properties._unAgencyList = d3.nest().key(function (a) {
									return a.Name;
								}).entries(c.values);
								d.properties._ipAgencyList = d3.nest().key(function (a) {
									return a.Name;
								}).entries(c.values);
								d.properties._opAgencyList = d3.nest().key(function (a) {
									return a.Name;
								}).entries(c.values);
								domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
								domain[
									0];
								domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
								domain[
									1];
								color.domain(domain);
							}
						});
					})
						.style("stroke", function (d) {
						return d.properties._agencyList ? "#f00" : "#00000000"; //#3CB371
					})
						.style("fill", function (d) {
						return d.properties._agencyList ? "#00000000" : "#00000000"; //#3CB371
					})
						.attr("class", function (d) {
						return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
					});
					ugandaPath.exit().remove();
				});

				countries = ugandaGeoJson.features;
				countriesOverlay.addTo(map);


				function refreshMap() {
					refreshCounts();
					ugandaPath.style("opacity", function (a) {
						a.properties._selected = false;
						return 1;
					});

					d3.select("#district-list").selectAll("p").style("background", "transparent");
					d3.select("#sector-list").selectAll("p").style("background", "transparent");
					d3.select("#actor-type-list").selectAll("p").style("background", "transparent");
					d3.select("#agency-list").selectAll("p").style("background", "transparent");
					d3.select("#donor-list").selectAll("p").style("background", "transparent");

					updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);
					var domain = [+Infinity, -Infinity];
					ugandaPath.each(function (d) {
						datasetNest.map(function (c) {
							if (c.key === d.properties.DNAME_06) {
								d.properties._sectorList = d3.nest().key(function (a) {
									return a.Sector_Other;
								}).entries(c.values);
								d.properties._agencyList = d3.nest().key(function (a) {
									return a["Agency name"];
								}).entries(c.values);
								d.properties._unAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
									//return a.Actor_Type;
								}).entries(c.values);
								d.properties._ipAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
								}).entries(c.values);
								d.properties._opAgencyList = d3.nest().key(function (a) {
									return a.Actor_Type;
								}).entries(c.values);
								domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
								domain[
									0];
								domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
								domain[
									1];
								color.domain(domain);
							}
						});
					})
						.style("stroke", function (d) {
						return d.properties._agencyList ? "#f00" : "#00000000"; //#3CB371
					})
						.style("fill", function (d) {
						if(d.properties._agencyList){
							return d.properties._agencyList.length ? "#00000000" : "#00000000"; //#3CB371
						}
						return "#00000000";
					});
					var top5Values = datasetNest.sort(function(a,b){
						return d3.ascending(a.key, b.key)
					}).slice(1);
					updateTable(top5Values);

					var top5Values = datasetAgency.sort(function(a,b){
						return d3.ascending(a.key, b.key)
					}).slice(1);
					updateTable1(top5Values);

					var beneficiaries = d3.sum(points, function(d){return parseFloat(d.Beneficiaries)});

					global.beneficiaryCount = beneficiaries;

					d3.select("#beneficiary-count").text(beneficiaries);
				}
				d3.select("#d3-map-refresh").on("click", refreshMap);


				//function that update the object 
				function onlyUniqueObject(data) {
					data = data.filter(function (d, index, self) {
						return self.findIndex(function (t) {
							return t.key === d.key;
						}) === index;
					});
					return data;
				}
				//filters the selected Item
				function filterSelectedItem(item, c, needRemove) {
					if (needRemove) {
						global[item] = global[item].filter(function (a) {
							return a !== c;
						});
					} else {
						global[item].push(c);
					}
					global[item] = onlyUniqueObject(global[item]); //global[item].filter(onlyUnique);;
				}




				function myFilter(c, flag, needRemove) {
					if (flag === "district") {
						filterSelectedItem("selectedDistrict", c, needRemove);
					}
					if (flag === "sector") {
						filterSelectedItem("selectedSector", c, needRemove);
					}
					if (flag === "agency") {
						filterSelectedItem("selectedAgency", c, needRemove);
					}
					if (flag === "unAgency") {
						filterSelectedItem("selectedUn", c, needRemove);
					}
					if (flag === "ipAgency") {
						filterSelectedItem("selectedIp", c, needRemove);
					}
					if (flag === "opAgency") {
						filterSelectedItem("selectedOp", c, needRemove);
					}
					if (flag === "donor") {
						filterSelectedItem("selectedDonor", c, needRemove);
					}
					if (flag === "actor-type") {
						filterSelectedItem("selectedActorType", c, needRemove);
					}

					var selectedDataset = dataset.filter(function (d) { //global.selectedDataset
						var isDistrict = false; //global.selectedDistrict ? global.selectedDistrict.key === d.District : true;
						if (global.selectedDistrict.length > 0) {
							global.selectedDistrict.map(function (c) {
								if (c.key === d.Parish) {
									isDistrict = true;
								}
							});
						} else {
							isDistrict = true;
						}
						// var isSector = global.selectedSector ? global.selectedSector.values[0].Sector_ID === d.Sector_ID : true;
						var isSector = false;
						if (global.selectedSector.length > 0) {
							global.selectedSector.map(function (c) {
								if (c.values[0].Sector_Other === d.Sector_Other) {
									isSector = true;
								}
							});
						} else {
							isSector = true;
						}
						// var isAgency = global.selectedAgency ? global.selectedAgency.values[0].Actor_ID === d.Actor_ID : true;

						var isAgency = false;
						if (global.selectedAgency.length > 0) {
							global.selectedAgency.map(function (c) {
								if (c.values[0]["Agency name"] === d["Agency name"]) {
									isAgency = true;
								}
							});
						} else {
							isAgency = true;
						}

						var isDonor = false;
						if (global.selectedDonor.length > 0) {
							global.selectedDonor.map(function (c) {
								if (c.values[0]["Donor"] === d["Donor"]) {
									isDonor = true;
								}
							});
						} else {
							isDonor = true;
						}

						var isActorType = false;
						if (global.selectedActorType.length > 0) {
							global.selectedActorType.map(function (c) {
								if (c.values[0]["Actor type"] === d["Actor type"]) {
									isActorType = true;
								}
							});
						} else {
							isActorType = true;
						}

						return isDistrict && isSector && isAgency && isDonor && isActorType;
					});

					_selectedDataset = selectedDataset;

					domain = [+Infinity, -Infinity];

					ugandaPath.each(function (d) {
						d.properties._numberOfAgencies = 0
						selectedDataset.map(function(c) {
							if (c.Parish === d.properties.DNAME_06) {
								d.properties._numberOfAgencies = d.properties._numberOfAgencies + 1;
								domain[0] = d.properties._numberOfAgencies < domain[0] ? d.properties._numberOfAgencies :
								domain[
									0];
								domain[1] = d.properties._numberOfAgencies > domain[1] ? d.properties._numberOfAgencies :
								domain[
									1];
								color.domain(domain);
							}
						});
					})
						.style("stroke", function (d) {
						return d.properties._numberOfAgencies ? "#f00" : "#00000000"; //#3CB371
					})
						.style("fill", function (d) {
						return d.properties._numberOfAgencies ? "#00000000" : "#00000000"; //#3CB371
					});

					var selectedDatasetNest = d3.nest()
					.key(function(d){
						return d.Parish; 
					}).entries(selectedDataset);

					var selectedDatasetAgency = d3.nest()
					.key(function(d){
						return d["Agency name"]; 
					}).entries(selectedDataset);

					var top5Values = selectedDatasetNest.sort(function(a,b){
						return d3.ascending(a.key, b.key)
					});
					updateTable(top5Values);

					var top5Values = selectedDatasetAgency.sort(function(a,b){
						return d3.ascending(a.key, b.key)
					});
					updateTable1(top5Values);


					beneficiaries = d3.sum(selectedDataset, function(d){return parseFloat(d.Beneficiaries)});

					d3.select("#beneficiary-count").text(beneficiaries);

					var unExtract = selectedDataset.filter(function (d) {
						if (d.Actor_Type === "UN") {
							return d.Actor_Type; //return d.Actor_Type["UN"];
						}
					});
					var ipExtract = selectedDataset.filter(function (d) {
						if (d.Actor_Type === "IP") {
							return d.Actor_Type;
						}
					});
					var opExtract = selectedDataset.filter(function (d) {
						if (d.Actor_Type === "OP") {
							return d.Actor_Type;
						}
					});

					var districtList = null;
					if (flag !== "district") {
						districtList = d3.nest().key(function (d) {
							return d.Parish;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					var sectorList = null;
					if (flag !== "sector") {
						sectorList = d3.nest().key(function (d) {
							return d.Sector_Other;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					var agencyList = null;
					if (flag !== "agency") {
						agencyList = d3.nest().key(function (d) {
							return d["Agency name"];
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}
					var donorList = null;
					if (flag !== "donor") {
						donorList = d3.nest().key(function (d) {
							return d["Donor"];
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}
					var actorTypeList = null;
					if (flag !== "actor-type") {
						actorTypeList = d3.nest().key(function (d) {
							return d["Actor type"];
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}
					var unAgencyList = null;
					if (flag !== "unAgency") {
						unAgencyList = d3.nest().key(function (d) {
							return d.Actor_Type; //return d.Actor_Type["UN"];
						}).sortKeys(d3.ascending).entries(unExtract);
					}

					var ipAgencyList = null;
					if (flag !== "ipAgency") {
						ipAgencyList = d3.nest().key(function (d) {
							return d.Actor_Type; //return d.Actor_Type["UN"];
						}).sortKeys(d3.ascending).entries(ipExtract);
					}

					var opAgencyList = null;
					if (flag !== "opAgency") {
						opAgencyList = d3.nest().key(function (d) {
							return d.Actor_Type; //return d.Actor_Type["UN"];
						}).sortKeys(d3.ascending).entries(opExtract);
					}

					// global.selectedDistrict = districtList;
					updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);

					if (flag === "district") {
						d3.select("#district-count").text(global.selectedDistrict.length);
						d3.select("#parish-list-count").text(global.selectedDistrict.length);
					} else {
						// global.selectedDistrict = districtList;
						d3.select("#district-count").text(districtList.length);
						d3.select("#parish-list-count").text(global.selectedDistrict.length);
						d3.select("#parish-header-total").text(districtList.length);
					}
					if (flag === "sector") {
						d3.select("#sector-count").text(global.selectedSector.length);
						d3.select("#sector-list-count").text(global.selectedSector.length);
					} else {
						d3.select("#sector-count").text(sectorList.length);
						d3.select("#sector-list-count").text(global.selectedSector.length);
						d3.select("#sector-header-total").text(sectorList.length);
						//				d3.select("#sector-list-count").text(sectorList.length);
					}
					if (flag === "agency") {
						d3.select("#agency-count").text(global.selectedAgency.length);
						d3.select("#partner-list-count").text(global.selectedAgency.length);
					} else {
						d3.select("#agency-count").text(agencyList.length);
						d3.select("#partner-header-total").text(agencyList.length);
						d3.select("#partner-list-count").text(global.selectedAgency.length);
					}
					if (flag === "unAgency") {
						d3.select("#unAgency-count").text(global.selectedUn.length);
					} else {
						d3.select("#unAgency-count").text(unAgencyList.length);
					}
					if (flag === "ipAgency") {
						d3.select("#ipAgency-count").text(global.selectedIp.length);
					} else {
						d3.select("#ipAgency-count").text(ipAgencyList.length);
					}
					if (flag === "opAgency") {
						d3.select("#opAgency-count").text(global.selectedOp.length);
					} else {
						d3.select("#opAgency-count").text(opAgencyList.length);
					}
					if (flag === "donor") {
						d3.select("#donor-count").text(global.selectedDonor.length);
						d3.select("#donor-list-count").text(global.selectedDonor.length);
					} else {
						d3.select("#donor-count").text(donorList.length);
						d3.select("#donor-header-total").text(donorList.length);
						d3.select("#donor-list-count").text(global.selectedDonor.length);
					}
					if (flag === "actor-type") {
						d3.select("#actor-type-count").text(global.selectedActorType.length);
						d3.select("#actor-type-list-count").text(global.selectedActorType.length);
					} else {
						d3.select("#actor-type-count").text(actorTypeList.length);
						d3.select("#actor-type-header-total").text(actorTypeList.length);
						d3.select("#actor-type-list-count").text(global.selectedActorType.length);
					}



				}


				//update on the left panel where district list sector list and check if they match 
				function updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset) {
					if (global.currentEvent !== "district") {
						districtList.map(function (a) {
							d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
							d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
						});
					}

					if (districtList) {
						d3.select("#district-count").text(districtList.length);
						var _districtList = d3.select("#district-list").selectAll("p")
						.data(districtList);
						_districtList.enter().append("p")	
							.text(function (d) {
							return d.Parish;
						})
							.on("click", function (c) {
							d3.selectAll(".labels").style("opacity", opacity);
							var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
							d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#13988e");
							global.currentEvent = "district";
							myFilter(c, global.currentEvent, needRemove);

							global.selectedDistrict.map(function (a) {
								d3.selectAll(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
							});
							if(global.selectedDistrict.length === 0){
								refreshMap();}
						});
						_districtList
							.attr("class", function (d) {
							return "district-list-" + d.key.replaceAll('[ ]', "_");
						})
							.text(function (d) {
							return d.key;
						});
						_districtList.exit().remove();
					}

					if (sectorList) {
						d3.select("#sector-count").text(sectorList.length);
						var _sectorList = d3.select("#sector-list").selectAll("p")
						.data(sectorList);
						_sectorList.enter().append("p")
							.attr("class", function(d){
							return d.key.replace(/\s/g,'');
						})
							.text(function (d) {
							//return d.key;
						})
						// .style("background", "transparent")
							.on("click", function (c) {
							// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
							// d3.select(this).style("background", "#8cc4d3");
							var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
							d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#13988e");
							global.currentEvent = "sector";
							myFilter(c, global.currentEvent, needRemove);
							// myFilterBySector(c, needRemove);
							if(global.selectedSector.length === 0){
								refreshMap();}
						});
						_sectorList //.transition().duration(duration)
							.attr("class", function(d){
							return d.key.replace(/\s/g,'');
						})
							.text(function (d) {
							return d.key;
						});
						_sectorList.exit().remove();
					}

					if (agencyList) {
						d3.select("#agency-count").text(agencyList.length);
						var _agencyList = d3.select("#agency-list").selectAll("p")
						.data(agencyList);
						_agencyList.enter().append("p")
						// .style("background", "transparent")
							.on("click", function (c) {

							var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
							d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#13988e");
							// myFilterByAgency(c, needRemove);
							global.currentEvent = "agency"
							myFilter(c, global.currentEvent, needRemove);
							if(global.selectedAgency.length === 0){
								refreshMap();}


						});
						_agencyList
							.html(function(d) {
							return d.key;
						});
						_agencyList.exit().remove();
					}

					if (donorList) {
						d3.select("#donor-count").text(donorList.length);
						var _donorList = d3.select("#donor-list").selectAll("p")
						.data(donorList);
						_donorList.enter().append("p")
							.text(function (d) {
							return d.key;
						})
							.on("click", function (c) {
							var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
							d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#13988e");
							// myFilterByAgency(c, needRemove);
							global.currentEvent = "donor";
							myFilter(c, global.currentEvent, needRemove);
							if(global.selectedDonor.length === 0){
								refreshMap();}
						});
						_donorList
							.text(function (d) {
							return d.key;
						});
						_donorList.exit().remove();
					}

					if (actorTypeList) {
						d3.select("#actor-type-count").text(actorTypeList.length);
						var _actorTypeList = d3.select("#actor-type-list").selectAll("p")
						.data(actorTypeList);
						_actorTypeList.enter().append("p")
							.text(function (d) {
							return d.key;
						})
						// .style("background", "transparent")
							.on("click", function (c) {
							var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
							d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :"#13988e");
							// myFilterByAgency(c, needRemove);
							global.currentEvent = "actor-type"
							myFilter(c, global.currentEvent, needRemove);
							if(global.selectedActorType.length === 0){
								refreshMap();}
						});
						_actorTypeList
							.text(function (d) {
							return d.key;
						});
						_actorTypeList.exit().remove();
					}

				}

				map.createPane("lowerlayers");

				map.getPane('lowerlayers').style.zIndex = 250;

				$.getJSON('data/kampalaOutline.geojson', function(data){

					function styleOutline(feature) {
						return {
							color: "#FF0000",
							fillOpacity: 0,
							pane: "lowerlayers",
							weight: 0.3
						};
					}
					var outline = L.geoJson(data, {
						style: styleOutline
					}).addTo(map);
				});

				var datalayer;
				var datalayer1;
				var datalayer2;
				var datalayerChildPoverty;
				var datalayerPoverty12;
				var datalayerChildPoverty12;
				//functio that set the colors on the layers on the map 
				$.getJSON('data/kampalaParishes__.geojson', function(data){
					function getColorPoverty12(d) {
						return d > 0.565  ? 'rgb(23,78,105)' :
						d > 0.042  ? 'rgb(46,95,120)' :
						d > 0.023  ? 'rgb(115,148,165)' :
						d > 0.016   ? 'rgb(162,184,195)' :
						'rgb(231,237,240)';
					}
					
					function getColorChildPoverty12(d) {
						return d > 0.565  ? 'rgb(23,78,105)' :
						d > 0.042  ? 'rgb(46,95,120)' :
						d > 0.023  ? 'rgb(115,148,165)' :
						d > 0.016   ? 'rgb(162,184,195)' :
						'rgb(231,237,240)';
					}

					function getColorPoverty(d) {
						return d > 0.565  ? 'rgb(23,78,105)' :
						d > 0.042  ? 'rgb(46,95,120)' :
						d > 0.023  ? 'rgb(115,148,165)' :
						d > 0.016   ? 'rgb(162,184,195)' :
						'rgb(231,237,240)';
					}
					
					function getColorChildPoverty(d) {
						return d > 0.565  ? 'rgb(23,78,105)' :
						d > 0.042  ? 'rgb(46,95,120)' :
						d > 0.023  ? 'rgb(115,148,165)' :
						d > 0.016   ? 'rgb(162,184,195)' :
						'rgb(231,237,240)';
					}

					function getColorPopDensity(d) {
						return d > 36087  ? 'rgb(23,78,105)' :
						d > 15935  ? 'rgb(46,95,120)' :
						d > 10934  ? 'rgb(115,148,165)' :
						d > 6229.64   ? 'rgb(162,184,195)' :
						'rgb(231,237,240)';
					}

					function stylePoverty12(feature) {
						return {
							color: getColorPoverty12(feature.properties.povertyHH / 100),
							fillOpacity: 0.6,
							pane: "lowerlayers",
							weight: 0.2
						};
					}

					function stylePopChildPoverty12(feature) {
						return {
							color: getColorChildPoverty12(feature.properties.povertyChild / 100),
							fillOpacity: 0.6,
							pane: "lowerlayers",
							weight: 0.2
						};
					}

					function stylePoverty(feature) {
						return {
							color: getColorPoverty(feature.properties.HH_Pov),
							fillOpacity: 0.6,
							pane: "lowerlayers",
							weight: 0.2
						};
					}
					function stylePopDensity(feature) {
						return {
							color: getColorPopDensity(feature.properties.populationDensity),
							fillOpacity: 0.6,
							pane: "lowerlayers",
							weight: 0.2
						};
					}
					
					function stylePopChildPoverty(feature) {
						return {
							color: getColorChildPoverty(feature.properties.childpov),
							fillOpacity: 0.6,
							pane: "lowerlayers",
							weight: 0.2
						};
					}

					var selected;
					datalayer = L.geoJson(data, {
						style: stylePoverty
					}).addTo(map);
					datalayer1 = L.geoJson(data, {
						style: stylePopDensity
					});
					datalayerChildPoverty = L.geoJson(data, {
						style: stylePopChildPoverty						
					});

					datalayerPoverty12 = L.geoJson(data, {
						style: stylePoverty12						
					});
					datalayerChildPoverty12 = L.geoJson(data, {
						style: stylePopChildPoverty12						
					});

					$.getJSON('data/kampala_slum_settlement.geojson', function(data){
						function style1(feature) {
							return {
								color: 'green',
								fillOpacity: 0.4,
								pane: "lowerlayers",
								opacity: 1,
								weight: 0.8
							};
						}

						datalayer2 = L.geoJson(data, {
							style: style1
						});
						var overlaymaps = {
							"Slum Boundaries" : datalayer2,
							"Child Poverty ('12-'13)" : datalayerChildPoverty12,
							"Household Poverty ('12-'13)" : datalayerPoverty12,
							"Child Poverty ('16-'17)" : datalayerChildPoverty,
							"Household Poverty ('16-'17)" : datalayer,
							"Population Density" : datalayer1
						}
						L.control.layers(overlaymaps, null, {autoZIndex: false,collapsed: true, position: 'topleft'}).addTo(map);

						var layerRemover = L.control({position: 'topleft'});

						layerRemover.onAdd = function (map) {

							var div = L.DomUtil.create('div', '');
							div.innerHTML = '<p class="nav nav-tabs" role="tablist">' +
								'<a class="nav-item"><a id="removeLayers" class="nav-link mbr-fonts-style show display-7" role="tab" data-toggle="tab" >Remove Layers</a></a>' +
								'</p>'

							return div;
						};

						layerRemover.addTo(map);


						var removeLayers = d3.select("#removeLayers");

						removeLayers.on('click', function(){
							if(map.hasLayer(datalayer2)){
								map.removeControl(slumLegend);	
							} else if(map.hasLayer(datalayer) || map.hasLayer(datalayerPoverty12) ){
								map.removeControl(householdPovertyLegend);	
							} else if(map.hasLayer(datalayer1)){
								map.removeControl(populationDensityLegend);	
							} else if(map.hasLayer(datalayerChildPoverty) || map.hasLayer(datalayerChildPoverty12) ){
								map.removeControl(childPovertyLegend);	
							}
							
							map.removeLayer(datalayer);
							map.removeLayer(datalayer1);
							map.removeLayer(datalayer2);
							map.removeLayer(datalayerChildPoverty);
							map.removeLayer(datalayerPoverty12);
							map.removeLayer(datalayerChildPoverty12);

						});

					});


				});

				var info = L.control();

				info.onAdd = function (map) {
					this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
					this.update();
					return this._div;
				};

				// method that we will use to update the control based on feature properties passed
				info.update = function (props) {
					this._div.innerHTML = (props ? 'Sub County: <b>' + props.SNAME2014 + '</b><br/>' + 
										   'Parish: <b>' + props.dist + '</b><br/><br/>' +
										   'Number of Organisations: <b>' + props._agencyList.length  + '</b><br/>' +
										   'Number of Sectors: <b>' + props._sectorList.length + '</b>'
										   : 'Hover over a parish with data');
				};

				info.addTo(map);


				function highlightFeature(e) {
					if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
						//						layer.bringToFront();
					}
					info.update(e.properties);
				}


				function resetHighlight(e) {
					info.update();
				}

				var populationDensityLegend = L.control({position: 'bottomright'});
				var childPovertyLegend = L.control({position: 'bottomright'});
				var slumLegend = L.control({position: 'bottomright'});
				var householdPovertyLegend = L.control({position: 'bottomright'});

				householdPovertyLegend.onAdd = function (map) {
					var div = L.DomUtil.create('div', 'info legend');
					div.innerHTML +=
						'<img src="images/povertyLegend.jpeg" alt="legend" width="302" height="215">';
					return div;
				};

				populationDensityLegend.onAdd = function (map) {
					var div = L.DomUtil.create('div', 'info legend');
					div.innerHTML +=
						'<img src="images/popDensityLegend.jpeg" alt="legend" width="396" height="222">';
					return div;
				};

				childPovertyLegend.onAdd = function (map) {
					var div = L.DomUtil.create('div', 'info legend');
					div.innerHTML +=
						'<img src="images/povertyChildLegend.jpeg" alt="legend" width="302" height="237">';
					return div;
				};

				slumLegend.onAdd = function (map) {
					var div = L.DomUtil.create('div', 'info legend');
					div.innerHTML +=
						'<img src="images/slumSettlement.jpeg" alt="legend" width="182" height="78">';
					return div;
				};

				// Add this one (only) for now, as the Population layer is on by default
				householdPovertyLegend.addTo(map);

				map.on('baselayerchange', function (eventLayer) {
					// Switch to the Population legend...
					if (eventLayer.name === "Household Poverty ('16-'17)" || eventLayer.name === "Household Poverty ('12-'13)" ) {
						this.removeControl(populationDensityLegend);
						this.removeControl(childPovertyLegend);
						this.removeControl(slumLegend);
						householdPovertyLegend.addTo(this);
					} else if (eventLayer.name === "Population Density") { // Or switch to the Population Density legend...
						this.removeControl(householdPovertyLegend);
						this.removeControl(childPovertyLegend);
						this.removeControl(slumLegend);
						populationDensityLegend.addTo(this);
					} else if (eventLayer.name === "Child Poverty ('16-'17)" || eventLayer.name === "Child Poverty ('12-'13)" ) { // Or switch to the Child Poverty legend...
						this.removeControl(householdPovertyLegend);
						this.removeControl(populationDensityLegend);
						this.removeControl(slumLegend);
						childPovertyLegend.addTo(this);
					} else if (eventLayer.name === 'Slum Boundaries') { // Or switch to the Slum Boundaries legend...
						this.removeControl(householdPovertyLegend);
						this.removeControl(populationDensityLegend);
						this.removeControl(childPovertyLegend);
						slumLegend.addTo(this);
					}
				});


				window.addEventListener("resize", function () {
					var wrapper = d3.select("#d3-map-wrapper");
					var width = wrapper.node().offsetWidth || 960;
					var height = wrapper.node().offsetHeight || 480;
					if (width) {
						d3.select("#d3-map-wrapper").select("svg")
							.attr("viewBox", "0 0 " + width + " " + height)
							.attr("width", width)
							.attr("height", height);
					}
				});
			} // ready



		})(d3, $, queue, window);


		document.getElementById('sidebar-left').style.display = "block";
		document.getElementById('sidebar-right').style.display = "block";
		$('#map').css('visibility', 'visible');
		$('.loader').hide();

	}



	/**
	   * Here all data processing from the spreadsheet happens
	   */
	function onMapDataLoad() {
		var options = mapData.sheets(constants.optionsSheetName).elements;
		createDocumentSettings(options);

		document.title = getSetting('_mapTitle');
		addBaseMap();

		// Add point markers to the map
		var points = mapData.sheets(constants.pointsSheetName);
		var layers;
		var group = '';
		if (points && points.elements.length > 0) {
			layers = determineLayers(points.elements);
		} else {
			completePoints = true;
		}

		centerAndZoomMap(group);


		// Change Map attribution to include author's info + urls
		changeAttribution();


	}

	/**
	   * Changes map attribution (author, GitHub repo, email etc.) in bottom-right
	   */
	function changeAttribution() {
		var attributionHTML = $('.leaflet-control-attribution')[0].innerHTML;
		var credit = 'Data from <a href="https://www.kcca.go.ug/" target="_blank">KCCA</a>, Vizualisation by <a href="https://www.geogecko.com/" target="_blank">GeoGecko</a>';
		var name = getSetting('_authorName');
		var url = getSetting('_authorURL');

		if (name && url) {
			if (url.indexOf('@') > 0) { url = 'mailto:' + url; }
			credit += ' by <a href="' + url + '">' + name + '</a> | ';
		} else if (name) {
			credit += ' by ' + name + ' | ';
		} else {
			credit += ' | ';
		}

		//		credit += 'View <a href="' + getSetting('_githubRepo') + '">code</a>';
		//		if (getSetting('_codeCredit')) credit += ' by ' + getSetting('_codeCredit');
		//		credit += ' with ';
		$('.leaflet-control-attribution')[0].innerHTML = credit + attributionHTML;
	}


	/**
	   * Loads the basemap and adds it to the map
	   */
	function addBaseMap() {
		var basemap = trySetting('_tileProvider', 'CartoDB.Positron');
		L.tileLayer.provider(basemap, {
			maxZoom: 18
		}).addTo(map);
		L.control.attribution({
			position: trySetting('_mapAttribution', 'bottomright')
		}).addTo(map);
	}

	/**
	   * Returns the value of a setting s
	   * getSetting(s) is equivalent to documentSettings[constants.s]
	   */
	function getSetting(s) {
		return documentSettings[constants[s]];
	}

	/**
	   * Returns the value of setting named s from constants.js
	   * or def if setting is either not set or does not exist
	   * Both arguments are strings
	   * e.g. trySetting('_authorName', 'No Author')
	   */
	function trySetting(s, def) {
		s = getSetting(s);
		if (!s || s.trim() === '') { return def; }
		return s;
	}

	function tryPolygonSetting(p, s, def) {
		s = getPolygonSetting(p, s);
		if (!s || s.trim() === '') { return def; }
		return s;
	}

	/**
	   * Triggers the load of the spreadsheet and map creation
	   */
	var mapData;

	$.ajax({
		url:'csv/Options.csv',
		type:'HEAD',
		error: function() {
			// Options.csv does not exist, so use Tabletop to fetch data from
			// the Google sheet
			mapData = Tabletop.init({
				key: googleDocURL,
				callback: function(data, mapData) { onMapDataLoad(); }
			});
		},
		success: function() {
			// Get all data from .csv files
			mapData = Procsv;
			mapData.load({
				self: mapData,
				tabs: ['Options', 'Points', 'Polygons', 'Polylines'],
				callback: onMapDataLoad
			});
		}
	});

	/**
	   * Reformulates documentSettings as a dictionary, e.g.
	   * {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"}
	   */
	function createDocumentSettings(settings) {
		for (var i in settings) {
			var setting = settings[i];
			documentSettings[setting.Setting] = setting.Customize;
		}
	}

	// Returns a string that contains digits of val split by comma evey 3 positions
	// Example: 12345678 -> "12,345,678"
	function comma(val) {
		while (/(\d+)(\d{3})/.test(val.toString())) {
			val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
		}
		return val;
	}

});
