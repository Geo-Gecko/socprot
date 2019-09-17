$(window).on('load', function () {
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
		} else {
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
		;
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
			}
			// function capitalizeFirstLetter(string) {
			//   return string.charAt(0).toUpperCase() + string.slice(1);
			// }
			var _selectedDataset;
			var dataset;
			queue()
				// .defer(d3.json, "./UgandaDistricts.geojson")//DNAME_06
				.defer(d3.json, "./data/healthFacility.geojson")
				.defer(d3.json, "./data/education.geojson")
				.defer(d3.json, "./data/protection.geojson")
				.defer(d3.json, "./data/water.geojson")
				.defer(d3.csv, "./data/mapValues.csv")
				.defer(d3.csv, "./data/mapValuesInfrastructure.csv")
				.await(ready);





			var global = {};
			global.selectedDistrict = []; // name
			global.selectedEducation = []; // ID
			global.selectedProtection = []; // ID
			global.selectedDonor = []; // Type Donor
			global.selectedHealth = []; // Type Actor
			global.selectedWater = []; // Type Water
			global.currentEvent;
			// global.needRefreshDistrict;


			function refreshCounts() {
				global.selectedDistrict = [];
				global.selectedEducation = [];
				global.selectedProtection = [];
				global.selectedWater = [];
				global.selectedHealth = [];
				global.selectedDonor = [];
				_selectedDataset = dataset;
			}

			function refreshCountsHealth() {
				global.selectedHealth = [];
				_selectedDataset = dataset;
			}
			function refreshCountsEducation() {
				global.selectedEducation = [];
				_selectedDataset = dataset;
			}
			function refreshCountsProtection() {
				global.selectedProtection = [];
				_selectedDataset = dataset;
			}
			function refreshCountsWater() {
				global.selectedWater = [];
				_selectedDataset = dataset;
			}
			function refreshCountsDistrict() {
				global.selectedDistrict = [];
				_selectedDataset = dataset;
			}
			function refreshCountsDonor() {
				global.selectedDonor = [];
				_selectedDataset = dataset;
			}

			function ready(error, health, education, protection, water, sector, relationship) {
				//standard for if data is missing, the map shouldnt start.
				if (error) {
					throw error;
				};


				$(".custom-list-header").click(function () {
					$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
					$(this).siblings(".custom-list").toggleClass('collapsed');
					$(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
				});

				// Collapses all the boxes apart from subCounty
				$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
				$("#protection-list.custom-list").removeClass('collapsed');

				//need join all data
				var nameAbbKays = d3.keys(relationship[0]);
				var sectorKays = d3.keys(sector[0]);

				dataset = relationship.map(function (d) {
					var i;

					for (i = 0; i < sector.length; i++) {
						if (sector[i].typeTextSchools === d.typeTextSchools) {
							sectorKays.map(function (k) {
								d[k] = sector[i][k];
							});
							break;
						}
					}
					return d;
				});



				var datasetCat = {}

				var datasetNest = d3.nest().key(function (d) {
					return d.PNAME2014;
				}).entries(dataset);


				function updateTable(data) {

					d3.select('#page-wrap').select('table').remove();
					var sortAscending = true;
					var table = d3.select('#page-wrap').append('table');
					var titles = d3.keys(data[0]);
					var titlesText = ["Parish Name", "No. of Facilities"]
					var headers = table.append('thead').append('tr')
						.selectAll('th')
						.data(titlesText).enter()
						.append('th')
						.text(function (d) {
							return d
						})
						.on('click', function (d) {
							headers.attr('class', 'header');
							if (sortAscending) {
								rows.sort(function (a, b) {
									return d3.descending(a.key, b.key)
								});
								sortAscending = false;
								this.className = 'aes';
							} else {
								rows.sort(function (a, b) {
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
									return { 'value': +(d[k].length), 'name': k };
								} else {
									return { 'value': d[k], 'name': k };
								}

							});
						}).enter()
						.append('td')
						.attr('data-th', function (d) {
							return d.name;
						})
						.text(function (d) {
							return d.value;
						});
				}

				var top5Values = datasetNest.sort(function (a, b) {
					return d3.ascending(a.key, b.key)
				});
				updateTable(top5Values);



				var districtList = d3.nest().key(function (d) {
					return d.ownershipText;
				}).sortKeys(d3.ascending).entries(relationship);

				var educationList = d3.nest().key(function (d) {
					return d.typeTextSchools;
				}).sortKeys(d3.ascending).entries(relationship);

				var protectionList = d3.nest().key(function (d) {
					return d.typeTextProtection;
				}).sortKeys(d3.ascending).entries(relationship);

				var waterList = d3.nest().key(function (d) {
					return d.typeTextWater;
				}).sortKeys(d3.ascending).entries(relationship);


				var donorList = d3.nest().key(function (d) {
					return d.ownershipText;
				}).sortKeys(d3.ascending).entries(relationship);

				var healthList = d3.nest().key(function (d) {
					return d.typeTextHealth;
				}).sortKeys(d3.ascending).entries(relationship);





				refreshCounts();
				updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);



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
					position: 'topright'
				}).addTo(map);

				var sidebar = L.control.sidebar('sidebar-left').addTo(map);

				sidebar.open("health");

				//				var sidebar1 = L.control.sidebar('sidebar-right', {position: "right"}).addTo(map);

				//				map.bounds = [],
				//					map.setMaxBounds([
				//					[4.5,29.5],
				//					[-1.5,34.5]
				//				]);
				map.options.maxZoom = 22;
				map.options.minZoom = 12;


				map.createPane('healthPane');
				map.createPane('educationPane');
				map.createPane('protectionPane');
				map.createPane('waterPane');
				map.createPane('parishLayer');

				map.getPane('healthPane').style.zIndex = 100
				map.getPane('educationPane').style.zIndex = 100
				map.getPane('protectionPane').style.zIndex = 100
				map.getPane('waterPane').style.zIndex = 100


				var healthPoints = L.geoJson(health, {
					pointToLayer: function (feature, latlng) {
						function shape(feature) {

							if (feature.properties.Deliveries === "Yes" && feature.properties.ANC === "Yes") {
								return "circle"
							} else if (feature.properties.Deliveries === "Yes" && feature.properties.ANC === "No") {
								return "square"
							} else if (feature.properties.Deliveries === "No" && feature.properties.ANC === "Yes") {
								return "triangle-up"
							} else if (feature.properties.Deliveries === "No" && feature.properties.ANC === "No") {
								return "x"
							}
						}
						var geojsonMarkerOptions = {
							radius: 5,
							fillColor: "#8b0000",
							color: "#000",
							weight: 1,
							pane: "healthPane",
							opacity: 1,
							shape: shape(feature),
							fillOpacity: 0.8,
							className: "health health-" + feature.properties.identifier + " " + feature.properties.class
						};

						return L.shapeMarker(latlng, geojsonMarkerOptions);
					}
				}).bindPopup(function (layer) {
					return "<b>" + layer.feature.properties.Type + ".</b></br>" +
						"<b>Name: </b>" + layer.feature.properties.Name + "</br>" +
						"<b>Located in: </b>" + layer.feature.properties.PNAME2014 + " Parish</br>" +
						"<b>Ownership: </b>" + layer.feature.properties.ownershipText + "</br></br></br>"
				}).addTo(map);

				var educationPoints = L.geoJson(education, {
					pointToLayer: function (feature, latlng) {
						function shape(feature) {
							if (feature.properties.typeText === "Pre-Primary Schools") {
								return "circle"
							} else if (feature.properties.typeText === "Primary Schools") {
								return "square"
							} else if (feature.properties.typeText === "Post Primary Schools") {
								return "triangle-up"
							} else if (feature.properties.typeText === "Secondary Schools") {
								return "diamond"
							} else if (feature.properties.typeText === "Tertiary Educational Institutions") {
								return "triangle-down"
							} else if (feature.properties.typeText === "Non Formal Schools") {
								return "x"
							}
						}


						var geojsonMarkerOptions = {
							radius: 5,
							fillColor: "#008000",
							color: "#000",
							weight: 1,
							pane: "educationPane",
							opacity: 1,
							shape: shape(feature),
							fillOpacity: 0.8,
							className: "education education-" + feature.properties.identifier + " " + feature.properties.class
						};
						return L.shapeMarker(latlng, geojsonMarkerOptions);
					}
				}).bindPopup(function (layer) {
					return "<b>" + layer.feature.properties.Type + ".</b></br>" +
						"<b>Name: </b>" + layer.feature.properties.Name + "</br>" +
						"<b>Located in: </b>" + layer.feature.properties.PNAME2014 + " Parish</br>" +
						"<b>Ownership: </b>" + layer.feature.properties.ownershipText + "</br></br></br>"
				}).addTo(map);

				var protectionPoints = L.geoJson(protection, {
					pointToLayer: function (feature, latlng) {
						function shape(feature) {
							if (feature.properties.typeText === "Police Post") {
								return "circle"
							} else if (feature.properties.typeText === "Police Station") {
								return "square"
							}
						}
						var geojsonMarkerOptions = {
							radius: 5,
							fillColor: "#ee8f25",
							color: "#000",
							weight: 1,
							pane: "protectionPane",
							opacity: 1,
							shape: shape(feature),
							fillOpacity: 0.8,
							className: "protection protection-" + feature.properties.identifier + " " + feature.properties.class
						};
						return L.shapeMarker(latlng, geojsonMarkerOptions);
					}
				}).bindPopup(function (layer) {
					return "<b>" + layer.feature.properties.Type + ".</b></br>" +
						"<b>Name: </b>" + layer.feature.properties.Name + "</br>" +
						"<b>Located in: </b>" + layer.feature.properties.PNAME2014 + " Parish</br>" +
						"<b>Ownership: </b>" + layer.feature.properties.ownershipText + "</br></br></br>"
				}).addTo(map);

				var waterPoints = L.geoJson(water, {
					pointToLayer: function (feature, latlng) {
						function shape(feature) {
							if (feature.properties.Type === "Protected Springs") {
								return "circle"
							} else if (feature.properties.Type === "Public Toilet") {
								return "square"
							} else if (feature.properties.Type === "Water Reservoirs") {
								return "triangle-up"
							}
						}
						var geojsonMarkerOptions = {
							radius: 5,
							fillColor: "#1e90ff",
							color: "#000",
							weight: 1,
							pane: "waterPane",
							opacity: 1,
							shape: shape(feature),
							fillOpacity: 0.8,
							className: "water water-" + feature.properties.identifier + " " + feature.properties.class
						};
						return L.shapeMarker(latlng, geojsonMarkerOptions);
					}
				}).bindPopup(function (layer) {
					return "<b>" + layer.feature.properties.Type + ".</b></br>" +
						"<b>Name: </b>" + layer.feature.properties.Name + "</br>" +
						"<b>Located in: </b>" + layer.feature.properties.PNAME2014 + " Parish</br>" +
						"<b>Ownership: </b>" + layer.feature.properties.ownershipText + "</br></br></br>"
				}).addTo(map);


				var waterIcon1 = d3.selectAll(".waterIcon1").append('svg')
					.attr("width", 25)
					.attr("height", 25);

				waterIcon1.append('path')
					.attr("style", "pointer-events:all!important")
					.style("fill", "#1e90ff")
					.style("opacity", 0.7)
					.style("stroke-width", "0.5px")
					.attr("d", 'M 0,0 m 0.575,19.167 L 8.25,3.417 L 16.075,19.167 Z');

				var healthIcon1 = d3.selectAll(".healthIcon1").append('svg')
					.attr("width", 25)
					.attr("height", 25);

				healthIcon1.append('path')
					.attr("style", "pointer-events:all!important")
					.style("fill", "#8b0000")
					.style("opacity", 0.7)
					.style("stroke-width", "0.5px")
					.attr("d", 'M 0,0 m 0.575,19.167 L 8.25,3.417 L 16.075,19.167 Z');

				var educationIcon1 = d3.selectAll(".educationIcon1").append('svg')
					.attr("width", 25)
					.attr("height", 25);

				educationIcon1.append('path')
					.attr("style", "pointer-events:all!important")
					.style("fill", "#008000")
					.style("opacity", 0.7)
					.style("stroke-width", "0.5px")
					.attr("d", 'M 0,0 m 0.575,19.167 L 8.25,3.417 L 16.075,19.167 Z');

				var educationIcon2 = d3.selectAll(".educationIcon2").append('svg')
					.attr("width", 25)
					.attr("height", 25);

				educationIcon2.append('path')
					.attr("style", "pointer-events:all!important")
					.style("fill", "#008000")
					.style("opacity", 0.7)
					.style("stroke-width", "0.5px")
					.attr("d", 'M 0.5 8.5 L 8 0 L 16.5 8.5 L 8.5 17 Z');

				var educationIcon3 = d3.selectAll(".educationIcon3").append('svg')
					.attr("width", 25)
					.attr("height", 25);

				educationIcon3.append('path')
					.attr("style", "pointer-events:all!important")
					.style("fill", "#008000")
					.style("opacity", 0.7)
					.style("stroke-width", "0.5px")
					.attr("d", 'M 0 0 L 15 0 L 7 15 Z');



				var healthButton = d3.select("#healthButton"),
					educationButton = d3.select("#educationButton"),
					protectionButton = d3.select("#protectionButton"),
					waterButton = d3.select("#waterButton");



				var opacity = 0.3;
				var wrapper = d3.select("#d3-map-wrapper");
				var width = wrapper.node().offsetWidth || 960;
				var height = wrapper.node().offsetHeight || 480;
				var tooltip = d3.select(map.getPanes().overlayPane)
					.append("div")
					.attr("class", "d3-tooltip d3-hide");
				var datasetNest = d3.nest().key(function (d) {
					return d.layer;
				}).entries(dataset);



				function refreshMap() {
					refreshCounts();
					d3.selectAll(".health").style("opacity", 1);
					d3.selectAll(".education").style("opacity", 1);
					d3.selectAll(".protection").style("opacity", 1);
					d3.selectAll(".water").style("opacity", 1);

					d3.select("#district-list").selectAll("p").style("background", "transparent");
					d3.select("#sector-list").selectAll("p").style("background", "transparent");
					d3.select("#health-list").selectAll("p").style("background", "transparent");
					d3.select("#protection-list").selectAll("p").style("background", "transparent");
					d3.select("#donor-list").selectAll("p").style("background", "transparent");
					d3.select("#water-list").selectAll("p").style("background", "transparent");

					updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);
					var domain = [+Infinity, -Infinity];

				}

				function refreshMapHealth() {
					refreshCountsHealth();
					refreshCountsDonor();
					map.getPane('healthPane').style.zIndex = 100;
					d3.select("#health-list").selectAll("p").style("background", "transparent");
					d3.select("#donor-list").selectAll("p").style("background", "transparent");

					updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);
					var domain = [+Infinity, -Infinity];
				}
				d3.select("#d3-map-refresh-health").on("click", refreshMapHealth);

				function refreshMapEducation() {
					refreshCountsEducation();
					refreshCountsDistrict();
					map.getPane('educationPane').style.zIndex = 100;
					d3.select("#education-list").selectAll("p").style("background", "transparent");
					d3.select("#district-list").selectAll("p").style("background", "transparent");

					updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);
					var domain = [+Infinity, -Infinity];
				}
				d3.select("#d3-map-refresh-education").on("click", refreshMapEducation);

				function refreshMapProtection() {
					refreshCountsProtection();
					map.getPane('protectionPane').style.zIndex = 100;
					d3.select("#protection-list").selectAll("p").style("background", "transparent");

					updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);
					var domain = [+Infinity, -Infinity];
				}
				d3.select("#d3-map-refresh-protection").on("click", refreshMapProtection);

				function refreshMapWater() {
					refreshCountsWater();
					map.getPane('waterPane').style.zIndex = 100;
					d3.select("#water-list").selectAll("p").style("background", "transparent");



					updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);
					var domain = [+Infinity, -Infinity];
				}
				d3.select("#d3-map-refresh-water").on("click", refreshMapWater);




				function onlyUniqueObject(data) {
					data = data.filter(function (d, index, self) {
						return self.findIndex(function (t) {
							return t.key === d.key;
						}) === index;
					});
					return data;
				}

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
					if (flag === "education") {
						filterSelectedItem("selectedEducation", c, needRemove);
					}
					if (flag === "protection") {
						filterSelectedItem("selectedProtection", c, needRemove);
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
					if (flag === "health") {
						filterSelectedItem("selectedHealth", c, needRemove);
					}
					if (flag === "water") {
						filterSelectedItem("selectedWater", c, needRemove);
					}

					var selectedDataset = dataset.filter(function (d) { //global.selectedDataset
						var isDistrict = false; //global.selectedDistrict ? global.selectedDistrict.key === d.District : true;
						if (global.selectedDistrict.length > 0) {
							map.getPane('educationPane').style.zIndex = 400
							global.selectedDistrict.map(function (c) {
								if (c.values[0].ownershipText === d.ownershipText) {
									isDistrict = true;
								}
							});
						} else {
							isDistrict = true;
						}
						// var isSector = global.selectedEducation ? global.selectedEducation.values[0].Sector_ID === d.Sector_ID : true;
						var isEducation = false;
						if (global.selectedEducation.length > 0) {
							map.getPane('educationPane').style.zIndex = 400
							global.selectedEducation.map(function (c) {
								if (c.values[0].typeTextSchools === d.typeTextSchools) {
									isEducation = true;
								}
							});
						} else {
							isEducation = true;
						}
						// var isAgency = global.selectedProtection ? global.selectedProtection.values[0].Actor_ID === d.Actor_ID : true;

						var isProtection = false;
						if (global.selectedProtection.length > 0) {
							map.getPane('protectionPane').style.zIndex = 400
							global.selectedProtection.map(function (c) {
								if (c.values[0].typeTextProtection === d.typeTextProtection) {
									isProtection = true;
								}
							});
						} else {
							isProtection = true;
						}

						var isDonor = false;
						if (global.selectedDonor.length > 0) {
							map.getPane('healthPane').style.zIndex = 400
							global.selectedDonor.map(function (c) {
								if (c.values[0].ownershipText === d.ownershipText) {
									isDonor = true;
								}
							});
						} else {
							isDonor = true;
						}

						var isHealth = false;
						if (global.selectedHealth.length > 0) {
							map.getPane('healthPane').style.zIndex = 400
							global.selectedHealth.map(function (c) {
								if (c.values[0].typeTextHealth === d.typeTextHealth) {
									isHealth = true;
								}
							});
						} else {
							isHealth = true;
						}

						var isWater = false;
						if (global.selectedWater.length > 0) {
							map.getPane('waterPane').style.zIndex = 400
							global.selectedWater.map(function (c) {
								if (c.values[0].typeTextWater === d.typeTextWater) {
									isWater = true;
								}
							});
						} else {
							isWater = true;
						}

						return isDistrict && isEducation && isProtection && isDonor && isHealth && isWater;
					});

					_selectedDataset = selectedDataset;



					var selectedDatasetNest = d3.nest()
						.key(function (d) {
							return d.layer;
						}).entries(selectedDataset);



					var districtList = null;
					if (flag !== "district") {
						districtList = d3.nest().key(function (d) {
							return d.ownershipText;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					var waterList = null;
					if (flag !== "water") {
						waterList = d3.nest().key(function (d) {
							return d.typeTextWater;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					var educationList = null;
					if (flag !== "education") {
						educationList = d3.nest().key(function (d) {
							return d.typeTextSchools;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					var protectionList = null;
					if (flag !== "protection") {
						protectionList = d3.nest().key(function (d) {
							return d.typeTextProtection;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}
					var donorList = null;
					if (flag !== "donor") {
						donorList = d3.nest().key(function (d) {
							return d.ownershipText;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}
					var healthList = null;
					if (flag !== "health") {
						healthList = d3.nest().key(function (d) {
							return d.typeTextHealth;
						}).sortKeys(d3.ascending).entries(selectedDataset);
					}

					// global.selectedDistrict = districtList;
					updateLeftPanelNext(districtList, educationList, protectionList, donorList, healthList, waterList, dataset);


				}



				function updateLeftPanel(districtList, educationList, protectionList, donorList, healthList, waterList, dataset) {
					if (global.currentEvent !== "district") {
						districtList.map(function (a) {
							d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
							d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
						});
					}

					if (districtList) {
						var _districtList = d3.select("#district-list").selectAll("p")
							.data(districtList);
						_districtList.enter().append("p")
							.text(function (d) {
								return d.layer;
							})
							.on("click", function (c) {
								d3.selectAll(".labels").style("opacity", opacity);
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "district";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".education").style("opacity", 0);
								d3.selectAll(".education").style("pointer-events", 'none');

								global.selectedDistrict.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedEducation.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
										} else {
											for (var j = 0; j < global.selectedEducation.length; j++) {
												if (a.values[i].typeTextSchools === global.selectedEducation[j].key) {
													d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
													d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
												}
											}
										}

									}
								});
								global.selectedEducation.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDistrict.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var j = 0; j < global.selectedDistrict.length; j++) {
													if (a.values[i].ownershipText === global.selectedDistrict[j].key) {
														d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
														d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
													}
												}
											}
										}

									}
								});
								if (global.selectedDistrict.length === 0 && global.selectedEducation.length === 0) {
									map.getPane('educationPane').style.zIndex = 100
								} else {
									map.getPane('educationPane').style.zIndex = 400
								}
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

					if (waterList) {
						var _waterList = d3.select("#water-list").selectAll("p")
							.data(waterList);
						_waterList.enter().append("p")
							.text(function (d) {
								return d.typeTextWater;
							})
							.on("click", function (c) {
								d3.selectAll(".labels").style("opacity", opacity);
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "water";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".water").style("opacity", 0);
								d3.selectAll(".water").style("pointer-events", 'none');


								global.selectedWater.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										d3.selectAll(".water-" + a.values[i].identifier).style("opacity", 1);
										d3.selectAll(".water-" + a.values[i].identifier).style("pointer-events", 'auto');
									}
								});
								if (global.selectedWater.length === 0) {
									map.getPane('waterPane').style.zIndex = 100
								}
							});
						_waterList
							.attr("class", function (d) {
								return "water-list-" + d.key.replaceAll('[ ]', "_");
							})
							.text(function (d) {
								return d.key;
							});
						_waterList.exit().remove();
					}

					if (educationList) {
						var _educationList = d3.select("#education-list").selectAll("p")
							.data(educationList);
						_educationList.enter().append("p")
							.attr("class", function (d) {
								return d.key.replace(/\s/g, '');
							})
							.text(function (d) {
								//return d.key;
							})
							// .style("background", "transparent")
							.on("click", function (c) {
								// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
								// d3.select(this).style("background", "#8cc4d3");
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "education";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".education").style("opacity", 0);
								d3.selectAll(".education").style("pointer-events", 'none');
								// myFilterBySector(c, needRemove);
								global.selectedEducation.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDistrict.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var j = 0; j < global.selectedDistrict.length; j++) {
													if (a.values[i].ownershipText === global.selectedDistrict[j].key) {
														d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
														d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
													}
												}
											}
										}

									}
								});
								global.selectedDistrict.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedEducation.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var j = 0; j < global.selectedEducation.length; j++) {
												if (a.values[i].typeTextSchools === global.selectedEducation[j].key) {
													d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
													d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
												}
											}
										}

									}
								});
								if (global.selectedEducation.length === 0 && global.selectedDistrict.length === 0) {
									map.getPane('educationPane').style.zIndex = 100

								} else {
									map.getPane('educationPane').style.zIndex = 400
								}
							});
						_educationList //.transition().duration(duration)
							.attr("class", function (d) {
								return d.key.replace(/\s/g, '');
							})
							.text(function (d) {
								return d.key;
							});
						_educationList.exit().remove();
					}

					if (protectionList) {
						var _protectionList = d3.select("#protection-list").selectAll("p")
							.data(protectionList);
						_protectionList.enter().append("p")
							// .style("background", "transparent")
							.on("click", function (c) {

								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "protection"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".protection").style("opacity", 0);
								d3.selectAll(".protection").style("pointer-events", 'none');

								global.selectedProtection.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										d3.selectAll(".protection-" + a.values[i].identifier).style("opacity", 1);
										d3.selectAll(".protection-" + a.values[i].identifier).style("pointer-events", 'auto');
									}
								});
								if (global.selectedProtection.length === 0) {
									map.getPane('protectionPane').style.zIndex = 100
								}
							});
						_protectionList
							.attr("class", function (d) {
								return d.key.replace(/\s/g, '');
							})
							.text(function (d) {
								return d.key;
							});
						_protectionList.exit().remove();
					}

					if (donorList) {
						var _donorList = d3.select("#donor-list").selectAll("p")
							.data(donorList);
						_donorList.enter().append("p")
							.text(function (d) {
								return d.key;
							})
							.on("click", function (c) {
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "donor"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".health").style("opacity", 0);
								d3.selectAll(".health").style("pointer-events", 'none');

								global.selectedDonor.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedHealth.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedHealth.length; j++) {
														if (a.values[i].typeTextHealth === global.selectedHealth[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								global.selectedHealth.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDonor.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedDonor.length; j++) {
														if (a.values[i].ownershipText === global.selectedDonor[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});

								if (global.selectedDonor.length === 0 && global.selectedHealth.length === 0) {
									map.getPane('healthPane').style.zIndex = 100
								} else {
									map.getPane('healthPane').style.zIndex = 400
								}
							});
						_donorList
							.attr("class", function (d) {
								return d.key.replace(/\s/g, '');
							})
							.text(function (d) {
								return d.key;
							});
						_donorList.exit().remove();
					}

					if (healthList) {
						var _healthList = d3.select("#health-list").selectAll("p")
							.data(healthList);
						_healthList.enter().append("p")
							.text(function (d) {
								return d.key;
							})
							// .style("background", "transparent")
							.on("click", function (c) {
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "health"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".health").style("opacity", 0);
								d3.selectAll(".health").style("pointer-events", 'none');

								global.selectedHealth.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDonor.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedDonor.length; j++) {
														if (a.values[i].ownershipText === global.selectedDonor[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								global.selectedDonor.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedHealth.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedHealth.length; j++) {
														if (a.values[i].typeTextHealth === global.selectedHealth[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								if (global.selectedHealth.length === 0 && global.selectedDonor.length === 0) {
									map.getPane('healthPane').style.zIndex = 100
								} else {
									map.getPane('healthPane').style.zIndex = 400
								}
							});
						_healthList
							.attr("class", function (d) {
								return d.key.replace(/\s/g, '');
							})
							.text(function (d) {
								return d.key;
							});
						_healthList.exit().remove();
					}

				}

				function updateLeftPanelNext(districtList, educationList, protectionList, donorList, healthList, waterList, dataset) {
					if (global.currentEvent !== "district") {
						districtList.map(function (a) {
							d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
							d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
						});
					}

					if (districtList) {
						var _districtList = d3.select("#district-list").selectAll("p")
							.each(function (d) { })
							.on("click", function (c) {
								d3.selectAll(".labels").style("opacity", opacity);
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "district";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".education").style("opacity", 0);
								d3.selectAll(".education").style("pointer-events", 'none');

								global.selectedDistrict.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedEducation.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var j = 0; j < global.selectedEducation.length; j++) {
												if (a.values[i].typeTextSchools === global.selectedEducation[j].key) {
													d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
													d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
												}
											}
										}

									}
								});
								global.selectedEducation.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDistrict.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var j = 0; j < global.selectedDistrict.length; j++) {
													if (a.values[i].ownershipText === global.selectedDistrict[j].key) {
														d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
														d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
													}
												}
											}
										}

									}
								});
								if (global.selectedDistrict.length === 0 && global.selectedEducation.length === 0) {
									map.getPane('educationPane').style.zIndex = 100
								} else {
									map.getPane('educationPane').style.zIndex = 400
								}
							});
						_districtList
							.text(function (d) {
								return d.key;
							});
					}

					if (waterList) {
						var _waterList = d3.select("#water-list").selectAll("p")
							.each(function (d) { })
							.on("click", function (c) {
								d3.selectAll(".labels").style("opacity", opacity);
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "water";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".water").style("opacity", 0);
								d3.selectAll(".water").style("pointer-events", 'none');


								global.selectedWater.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										d3.selectAll(".water-" + a.values[i].identifier).style("opacity", 1);
										d3.selectAll(".water-" + a.values[i].identifier).style("pointer-events", 'auto');
									}
								});
								if (global.selectedWater.length === 0) {
									map.getPane('waterPane').style.zIndex = 100
								}
							});
						_waterList
							.text(function (d) {
								return d.key;
							});
					}

					if (educationList) {
						var _educationList = d3.select("#education-list").selectAll("p")
							.each(function (d) { })
							// .style("background", "transparent")
							.on("click", function (c) {
								// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
								// d3.select(this).style("background", "#8cc4d3");
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								global.currentEvent = "education";
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".education").style("opacity", 0);
								d3.selectAll(".education").style("pointer-events", 'none');
								// myFilterBySector(c, needRemove);
								global.selectedEducation.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDistrict.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var j = 0; j < global.selectedDistrict.length; j++) {
													if (a.values[i].ownershipText === global.selectedDistrict[j].key) {
														d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
														d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
													}
												}
											}
										}

									}
								});
								global.selectedDistrict.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedEducation.length === 0) {
											d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var j = 0; j < global.selectedEducation.length; j++) {
												if (a.values[i].typeTextSchools === global.selectedEducation[j].key) {
													d3.selectAll(".education-" + a.values[i].identifier).style("opacity", 1);
													d3.selectAll(".education-" + a.values[i].identifier).style("pointer-events", 'auto');
												}
											}
										}

									}
								});
								if (global.selectedEducation.length === 0 && global.selectedDistrict.length === 0) {
									map.getPane('educationPane').style.zIndex = 100
								} else {
									map.getPane('educationPane').style.zIndex = 400
								}
							});
						_educationList
							.text(function (d) {
								return d.key;
							});
					}

					if (protectionList) {
						var _protectionList = d3.select("#protection-list").selectAll("p")
							.each(function (d) { })
							// .style("background", "transparent")
							.on("click", function (c) {

								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "protection"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".protection").style("opacity", 0);
								d3.selectAll(".protection").style("pointer-events", 'none');

								global.selectedProtection.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										d3.selectAll(".protection-" + a.values[i].identifier).style("opacity", 1);
										d3.selectAll(".protection-" + a.values[i].identifier).style("pointer-events", 'auto');
									}
								});
								if (global.selectedProtection.length === 0) {
									map.getPane('protectionPane').style.zIndex = 100
								}
							});
						_protectionList
							.text(function (d) {
								return d.key;
							});
					}

					if (donorList) {
						var _donorList = d3.select("#donor-list").selectAll("p")
							.each(function (d) { })
							.on("click", function (c) {
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "donor"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".health").style("opacity", 0);
								d3.selectAll(".health").style("pointer-events", 'none');

								global.selectedDonor.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedHealth.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedHealth.length; j++) {
														if (a.values[i].typeTextHealth === global.selectedHealth[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								global.selectedHealth.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDonor.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedDonor.length; j++) {
														if (a.values[i].ownershipText === global.selectedDonor[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});

								if (global.selectedDonor.length === 0 && global.selectedHealth.length === 0) {
									map.getPane('healthPane').style.zIndex = 100
								} else {
									map.getPane('healthPane').style.zIndex = 400
								}
							});
						_donorList
							.text(function (d) {
								return d.key;
							});
					}

					if (healthList) {
						var _healthList = d3.select("#health-list").selectAll("p")
							.each(function (d) { })
							// .style("background", "transparent")
							.on("click", function (c) {
								var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
								d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#808080");
								// myFilterByAgency(c, needRemove);
								global.currentEvent = "health"
								myFilter(c, global.currentEvent, needRemove);
								d3.selectAll(".health").style("opacity", 0);
								d3.selectAll(".health").style("pointer-events", 'none');

								global.selectedHealth.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedDonor.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedDonor.length; j++) {
														if (a.values[i].ownershipText === global.selectedDonor[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								global.selectedDonor.map(function (a) {
									for (var i = 0; i < a.values.length; i++) {
										if (global.selectedHealth.length === 0) {
											d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
											d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
										} else {
											for (var i = 0; i < a.values.length; i++) {
												for (var i = 0; i < a.values.length; i++) {
													for (var j = 0; j < global.selectedHealth.length; j++) {
														if (a.values[i].typeTextHealth === global.selectedHealth[j].key) {
															d3.selectAll(".health-" + a.values[i].identifier).style("opacity", 1);
															d3.selectAll(".health-" + a.values[i].identifier).style("pointer-events", 'auto');
														}
													}
												}
											}
										}

									}
								});
								if (global.selectedHealth.length === 0 && global.selectedDonor.length === 0) {
									map.getPane('healthPane').style.zIndex = 100
								} else {
									map.getPane('healthPane').style.zIndex = 400
								}
							});
						_healthList
							.text(function (d) {
								return d.key;
							});
					}

				}

				var datalayer;
				var datalayer1;
				var datalayerPoverty;
				var datalayerChildPoverty;
				var datalayerDensity;
				var datalayerPoverty12;
				var datalayerChildPoverty12;

				$.getJSON('data/kampalaParishes__.geojson', function (data) {
					function getColorPoverty12(d) {
						return d > 0.565 ? 'rgb(23,78,105)' :
							d > 0.042 ? 'rgb(46,95,120)' :
								d > 0.023 ? 'rgb(115,148,165)' :
									d > 0.016 ? 'rgb(162,184,195)' :
										'rgb(231,237,240)';
					}

					function getColorChildPoverty12(d) {
						return d > 0.565 ? 'rgb(23,78,105)' :
							d > 0.042 ? 'rgb(46,95,120)' :
								d > 0.023 ? 'rgb(115,148,165)' :
									d > 0.016 ? 'rgb(162,184,195)' :
										'rgb(231,237,240)';
					}

					function getColorPoverty(d) {
						return d > 0.565 ? 'rgb(23,78,105)' :
							d > 0.041 ? 'rgb(46,95,120)' :
								d > 0.023 ? 'rgb(115,148,165)' :
									d > 0.017 ? 'rgb(162,184,195)' :
										'rgb(231,237,240)';
					}

					function getColorChildPoverty(d) {
						return d > 0.565 ? 'rgb(23,78,105)' :
							d > 0.041 ? 'rgb(46,95,120)' :
								d > 0.023 ? 'rgb(115,148,165)' :
									d > 0.017 ? 'rgb(162,184,195)' :
										'rgb(231,237,240)';
					}

					function getColorPopDensity(d) {
						return d > 36087 ? 'rgb(23,78,105)' :
							d > 15935 ? 'rgb(46,95,120)' :
								d > 10934 ? 'rgb(115,148,165)' :
									d > 6229.64 ? 'rgb(162,184,195)' :
										'rgb(231,237,240)';
					}

					function stylePoverty12(feature) {
						return {
							color: getColorPoverty12(feature.properties.povertyHH / 100),
							fillOpacity: 0.6,
							weight: 0.2
						};
					}

					function stylePopChildPoverty12(feature) {
						return {
							color: getColorChildPoverty12(feature.properties.povertyChild / 100),
							fillOpacity: 0.6,
							weight: 0.2
						};
					}

					function stylePoverty(feature) {
						return {
							color: getColorPoverty(feature.properties.HH_Pov),
							fillOpacity: 0.6,
							weight: 0.2
						};
					}
					function stylePopDensity(feature) {
						return {
							color: getColorPopDensity(feature.properties.populationDensity),
							fillOpacity: 0.6,
							weight: 0.2
						};
					}

					function stylePopChildPoverty(feature) {
						return {
							color: getColorChildPoverty(feature.properties.childpov),
							fillOpacity: 0.6,
							weight: 0.2
						};
					}
					function style(feature) {
						return {
							color: '#00c5ff',
							fillOpacity: 0,
							pane: "parishLayer",
							opacity: 1,
							weight: 0.8
						};
					}



					function selectedStyle(feature) {
						return {
							color: '#ff5500',
							fillOpacity: 0,
							zIndex: 10000,
							opacity: 1,
							weight: 2
						};
					}
					var selected;
					function parishOnEachFeature(feature, featureLayer) {

						var popup = L.popup()
							.setContent("<b>" + feature.properties.SNAME2014 + " Division</b></br>" +
								"<b>Parish: </b>" + feature.properties.dist + "</br>");


						featureLayer.on({
							mouseover: highlightFeature,
							mouseout: resetHighlight
						});

					}
					datalayer = L.geoJson(data, {
						style: style,
						onEachFeature: parishOnEachFeature

					}).addTo(map);

					datalayerPoverty = L.geoJson(data, {
						style: stylePoverty
					});
					datalayerDensity = L.geoJson(data, {
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

					map.getPane('parishLayer').style.zIndex = 300;
					map.getPanes().overlayPane.style.zIndex = 200;

					$.getJSON('data/kampala_slum_settlement.geojson', function (data) {
						function style1(feature) {
							return {
								color: 'green',
								fillOpacity: 0.4,
								opacity: 1,
								weight: 0.8
							};
						}

						datalayer1 = L.geoJson(data, {
							style: style1
						});


						var overlaymaps = {
							"Slum Boundaries": datalayer1,
							"Child Poverty ('12-'13)": datalayerChildPoverty12,
							"Household Poverty ('12-'13)": datalayerPoverty12,
							"Child Poverty ('16-'17)": datalayerChildPoverty,
							"Household Poverty ('16-'17)": datalayerPoverty,
							"Population Density": datalayerDensity
						};



						L.control.layers(overlaymaps, null, { autoZIndex: false, collapsed: true, position: 'topleft' }).addTo(map);



						$(".leaflet-control-layers-toggle").text("Change Layers");


						var layerRemover = L.control({ position: 'topleft' });

						layerRemover.onAdd = function (map) {

							var div = L.DomUtil.create('div', '');
							div.innerHTML = '<p class="nav nav-tabs" role="tablist">' +
								'<a class="nav-item"><a id="removeLayers" class="nav-link mbr-fonts-style show display-7" role="tab" data-toggle="tab" aria-selected="true">Remove Layers</a></a>' +
								'</p>'

							return div;
						};

						layerRemover.addTo(map);

						var removeLayers = d3.select("#removeLayers");

						removeLayers.on('click', function () {

							if (map.hasLayer(datalayer1)) {
								map.removeControl(slumLegend);
							} else if (map.hasLayer(datalayerPoverty) || map.hasLayer(datalayerPoverty12)) {
								map.removeControl(householdPovertyLegend);
							} else if (map.hasLayer(datalayerDensity)) {
								map.removeControl(populationDensityLegend);
							} else if (map.hasLayer(datalayerChildPoverty) || map.hasLayer(datalayerChildPoverty12)) {
								map.removeControl(childPovertyLegend);
							}

							map.removeLayer(datalayer1);
							map.removeLayer(datalayerChildPoverty);
							map.removeLayer(datalayerPoverty);
							map.removeLayer(datalayerDensity);
							map.removeLayer(datalayerPoverty12);
							map.removeLayer(datalayerChildPoverty12);

						})

						var resetMap = L.control({ position: 'topleft' });

						resetMap.onAdd = function (map) {

							var div = L.DomUtil.create('div', '');
							div.innerHTML = '<p class="nav nav-tabs" role="tablist">' +
								'<a class="nav-item"><a id="resetMap" class="nav-link mbr-fonts-style show display-7" role="tab" data-toggle="tab" aria-selected="true">Reset Map</a></a>' +
								'</p>'

							return div;
						};

						resetMap.addTo(map);

						var resetMapButton = d3.select("#resetMap");

						resetMapButton.on('click', function () {
							refreshMapHealth();
							refreshMapEducation();
							refreshMapProtection();
							refreshMapWater();

							map.setView([0.3233, 32.5025], 12);
						})

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
						'Health facilities: <b>' + props.healthCount + '</b><br/>' +
						'Education facilities: <b>' + props.educationCount + '</b><br/>' +
						'Protection facilities: <b>' + props.protectionCount + '</b><br/>' +
						'Water facilities: <b>' + props.waterCount + '</b><br/>'
						: 'Hover over a parish');
				};

				info.addTo(map);

				function highlightFeature(e) {
					var layer = e.target;

					layer.setStyle({
						weight: 3,
						color: '#666',
						dashArray: '',
						fillOpacity: 0
					});

					if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
						layer.bringToFront();
					}
					info.update(layer.feature.properties);
				}


				function resetHighlight(e) {
					datalayer.resetStyle(e.target);
					info.update();
				}

				var populationDensityLegend = L.control({ position: 'bottomleft' });
				var childPovertyLegend = L.control({ position: 'bottomleft' });
				var slumLegend = L.control({ position: 'bottomleft' });
				var householdPovertyLegend = L.control({ position: 'bottomleft' });

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

				map.on('baselayerchange', function (eventLayer) {
					// Switch to the Population legend...
					if (eventLayer.name === "Household Poverty ('16-'17)" || eventLayer.name === "Household Poverty ('12-'13)") {
						this.removeControl(populationDensityLegend);
						this.removeControl(childPovertyLegend);
						this.removeControl(slumLegend);
						householdPovertyLegend.addTo(this);
					} else if (eventLayer.name === "Population Density") { // Or switch to the Population Density legend...
						this.removeControl(householdPovertyLegend);
						this.removeControl(childPovertyLegend);
						this.removeControl(slumLegend);
						populationDensityLegend.addTo(this);
					} else if (eventLayer.name === "Child Poverty ('16-'17)" || eventLayer.name === "Child Poverty ('12-'13)") { // Or switch to the Child Poverty legend...
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
		//		document.getElementById('sidebar-right').style.display = "block";
		$('#map').css('visibility', 'visible');
		$('.loader').hide();

	}



	/**
	   * Here all data processing from the spreadsheet happens
	   */
	function onMapDataLoad() {
		var options = mapData.sheets(constants.optionsSheetName).elements;
		createDocumentSettings(options);

		document.title = 'Interactive Map'
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
			maxZoom: 22
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
		url: 'csv/Options.csv',
		type: 'HEAD',
		error: function () {
			// Options.csv does not exist, so use Tabletop to fetch data from
			// the Google sheet
			mapData = Tabletop.init({
				key: googleDocURL,
				callback: function (data, mapData) { onMapDataLoad(); }
			});
		},
		success: function () {
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
