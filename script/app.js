// @codekit-prepend 'gmaps.js'
// @codekit-prepend 'underscore.js'
// @codekit-prepend 'jquery.js'

// @codekit-prepend 'backbone.js'
// @codekit-prepend 'deep-model.min.js'
// @codekit-prepend 'backbone-query.min.js'

// @codekit-prepend 'bootstrap.js'
// @codekit-prepend 'bootstrap-multiselect.js'



(function() {
	
	//create a namespace

	window.MapApp = {
		Models: {},
		Collections: {},
		Views: {}
	};
    
	window.template = function (id) {
		return _.template($('#' + id).html());
	};
    
	// ################################
	// ######### GLOBAL EVENTS ########
	// ################################
	MapApp.vents = _.extend({}, Backbone.Events);
	
	// ################################
	// ######### GLOBAL VARS   ########
	// ################################


	$('select#ellType').change(function(){
		MapApp.vents.trigger('filterbyType');	
	});

	$('#searchTitle').on('keyup', function () {
		query = $(this).val();
		console.log(query);
		filteredLocations = MapApp.initialLocationsCollection.query({title: {$likeI: query}})
		MapApp.locationsCollection.reset(filteredLocations);
	})

	$('.reset').on('click', function (e) {
		e.preventDefault();
		MapApp.resetFilters();
	})
	

	MapApp.filterList = [];



	// ########################################
	// ########## CUSTOM FUNCTIONS ############
	// ########################################
	MapApp.addLocationToMap = function (id, lat, lon, title){
		MapApp.map.addMarker({
			lat			: lat,
			lng			: lon,
			title		: title,
			html		: "",
			click: function(e) {
			//alert('You clicked in this marker '+title);
			},
			infoWindow: {
				content: $('#locationsView #location'+id).html()
			}
		});
		return 'marker added';
	};

	MapApp.removeMarkers = function () {
		MapApp.map.removeMarkers();
	};

	MapApp.mapInit = function() {
		//Initialize the Google Map
		MapApp.map = new GMaps({
	        div: '#map',
	        lat: 53.571148,
	        lng: 10.024898,
	        zoom: 3
	      });
	};
	MapApp.mapInit();

	MapApp.readProp = function (obj, prop) {
		return obj[prop];
	};

	MapApp.activateMultiselect = function () {
		$("select.multiselect").val([]);
        
        
		$('.multiselect').multiselect({
			buttonClass: 'btn',
			buttonWidth: 'auto',
			maxHeight: false,
			buttonText: function(options, select) {
				//console.log(select.attr('data-name'));
				//console.log('OptionsLength'+options.length );
				if (options.length === 0) {
					return  select.attr('data-name')+'<b class="caret"></b>';
				}
				else if (options.length > 0) {
					return  select.attr('data-name')+' ('+options.length + ') <b class="caret"></b>';
				}
				else {
					return  select.attr('data-name')+'<b class="caret"></b>';
				}//buttontext
			},
			onChange: function(element, checked) {
				// console.log('change');
				filtername = element.parent().attr('data-name');
				MapApp.vents.trigger('selectChanged', element,filtername,checked);
			}
		});

		//MapApp.resetFilters();
	};//activateMultiselect
	

	MapApp.resetFilters = function () {
		// $('.multiselect option').each(function() {
		// 	item = $(this).val().toString();
		// 	$(this).parent().multiselect('deselect', item);
		// });
		$('#searchTitle').val('');
		$("select.multiselect").val([]);
		$("select.multiselect").multiselect('refresh')
		MapApp.vents.trigger('selectChanged');
	}



	// ################################
	// ########## BB ROUTES ##########
	// ################################

	MapApp.Router = Backbone.Router.extend({
		routes: {
			'': 'index',
			'show/:id': 'show',
			'showAll': 'showAll',
			'add/:id/*title': 'add',
			'search/*title': 'search',
			'*other': 'Default'
		},
		index: function () {
			//console.log('index');
		},
		show: function (id) {
			console.log('show:'+id) ;
			MapApp.vents.trigger('location:show', id);
		},
		showAll: function (id) {
			MapApp.vents.trigger('location:showAll', id);
		},
		add: function (id,title) {
			console.log('add id:'+id+' title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		search: function (title) {
			console.log('search title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		Default: function (other) {
			console.log('Not sure wht you tying to do: you acessed:'+other) ;
			//EVENT SHOULD FIRE HERE
		} 
	});

	MapApp.router = new MapApp.Router;
	Backbone.history.start();


	// ################################
	// ########  LOCATION M O D E L  #######
	// ################################
	MapApp.Models.Locations = Backbone.DeepModel.extend({

		defaults: {
			lat: 51.511214,
			lon: -0.119824,
			title: 'im am the default Title',
			link: 'http://www.google.de'
		},
		sync: function () { return false; },
		validate: function(attrs){
			if(	! _.isNumber(attrs.lat)	){
				return 'lat Must not be empty';
			}
			if(	! _.isNumber(attrs.lon) ){
				return 'lon Must not be empty';
			}
			if(	!$.trim(attrs.title) ){
				return 'title Must not be empty';
			}
		},

		display: function(){
			return this.get('title') +' is displaying';
		}

	});





	// ################################
	// #####  SINGLE Location V I E W   ####
	// ################################

	 
	MapApp.Views.Location = Backbone.View.extend({
		tagName : "div", 
		className: 'location',
		events: {
			'click' : 'showLocationInMap',
			'click strong': 'showAlert',
			'click button': 'destroy'
		},
		template: template('locationTemplate'),
		initialize: function(){
			this.model.on('change', this.render, this );
			this.model.on('destroy', this.remove, this );

			
		},
		render: function(){
			var id = this.model.get('id');
			this.$el.html( this.template(this.model.toJSON()) ).attr('id', 'location'+id);
			MapApp.vents.trigger('locationAdded');
			return this;
		}, 
		showAlert: function () {
			var newLocationTitle = prompt('edit the Title:',this.model.get('title') );
			if(!newLocationTitle) return;
			this.model.set('title', newLocationTitle);
		},
		destroy: function () {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		},
		showLocationInMap: function () {
			// console.log(this.model.get('id'));
			var lat = this.model.get('lat');
			var lon = this.model.get('lon');
			MapApp.map.setCenter(lat, lon);
			MapApp.map.setZoom(6);
		}
	});



	// ################################
	// ########## LOCATIONS VIEW  ########## - View for all Locations
	// ################################

	MapApp.Views.Locations = Backbone.View.extend({
		tagName: 'div' ,
		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.on('reset', this.render, this);
			MapApp.vents.on('filterbyType', this.startFilterType, this);
			MapApp.vents.on('startSearch', this.search, this);
		},
		render: function(){
			// console.log('redering LOCATIONS VIEW');
			this.$el.html('');
			this.collection.each(this.addOne, this);
			return this;
		},
		renderFiltered : function(locations){

		$("#locationsView").html("");
		locations.each(function(location){
			var view = new MapApp.Views.Location({
				model: location,
				collection: this.collection
			});
			$("#locationsView").append(view.render().el);
		});
		return this;
		},
		addOne: function (location) {
			var locationView = new MapApp.Views.Location({model: location});
			this.$el.append(locationView.render().el);
		},
		startFilterType: function(){
			
			var type = $('#ellType').find('option:selected').val();
			// console.log('startFilterType:' +type);
			//this.collection.reset(this.collection.query({ eLLType: {$like: type}}) );

		}
	});
	

	// ########################################
	// #######  SILNGLE FILTER  VIEW   ######## 
	// ########################################
	
	

	MapApp.Views.Filter = Backbone.View.extend({
		tagName: 'select',
		className: 'col-md-2 multiselect',
		template: template('filterTemplate'),
		initialize: function () {
			// console.log('initialized Single Filter View');
			this.$el.attr( "data-name", MapApp.filterList[this.options.index] );
            this.$el.attr( 'multiple', 'multiple');
		},
		render: function () {
            
			this.renderFilters();
			this.renderallOptions();
		},
		renderFilters: function () {
			var optionName = MapApp.filterList[this.options.index];
			//this.$el.html('<option value="'+optionName+'">'+optionName+'</option>' );
			//this.$el.html( this.template( {optionName: optionName} ));	
		},
		renderallOptions: function () {
			// console.log('Rendering Options');
			var arrayHolder = MapApp.optionsCollection.at(this.options.index).get('filteroptions');
			
			//create an Array for all Filtersoptions
			MapApp["filterOptionsArray"+this.options.index] = [];

			// Go through all filters
			_.each(arrayHolder, function (option,index) {
				_.each(option, function (inhalt,index){
					//console.log('der Inhalt des '+index+' items ist: '+inhalt);
					//add each array content to the corresponding filter Array
					MapApp["filterOptionsArray"+this.options.index].push(inhalt);
				},this);
			},this);
			//make the FilterArray Unique
			MapApp["filterOptionsArray"+this.options.index] = _.uniq(MapApp["filterOptionsArray"+this.options.index]);
			//Finally go trough all the items in the Filtersoptions array and add them to the Select
			_.each(MapApp["filterOptionsArray"+this.options.index], function (name) {
				this.$el.append( this.template( {optionName: name} ));	
			},this);
		}
	});


	// ########################################
	// ##########   FILTERS  VIEW   ########### 
	// ########################################
	
	MapApp.Views.Filters = Backbone.View.extend({
		tagName: 'div', 
		className: 'filters col-md-6',
		initialize: function () {
			MapApp.vents.on('selectChanged', this.updateQueryObject, this);
			// this.collection.on('add', this.update, this);
			//this.collection.on('remove', this.update, this);
			this.collection.on('reset', this.update, this);
			this.create();
		},
		create: function () {
			this.createFilterList();
			this.createOptionsLists();
			this.render();
			MapApp.activateMultiselect();
		},
		update: function () {
			this.createOptionsLists();
			// this.render();
			// MapApp.activateMultiselect();
		},
		createFilterList: function () {
			// console.log('creatingFilterList');
			//Empty the Filter list
			MapApp.filterList = [];
			//Lopp over all Locations in collection
			this.collection.each(function (location) {
				//get only the Filterable Attributes
				var filterableList = location.get('filterable');
				//Push each Attribute to List
				for (var key in filterableList) {
					MapApp.filterList.push(key);
				}
			});
			//Remove all duplicates
			MapApp.filterList = _.uniq(MapApp.filterList);			
		},
		createOptionsLists: function () {
			MapApp.optionsLists = {};
			// reset the optionen Collection 
			MapApp.optionsCollection.reset();
			//Go trough each Filter in the Filterlist
			_.each(MapApp.filterList,function (filtername, index){
					//Add a empty Model to ne optionen Collection
					MapApp.optionsCollection.add({});
					//Set the Filtername to the Model in Collection
					MapApp.optionsCollection.at(index).set('filtername',filtername);
					
					//Temp array for all Options
					var tempArray = [];
					//Go trough all Locations and get each FIltername
					MapApp.locationsCollection.each(function (location) {
						var option = location.get('filterable')[filtername];
						tempArray.push(option);
				});
					// console.xlog('####'+tempArray);
				MapApp.optionsCollection.at(index).set('filteroptions', tempArray);
			});

		},
		render: function () {
			////Filter trough all ITEMS
			this.$el.html('');
			_.each(MapApp.filterList, function (filter,index) {
				//for each vreate a new View.
				MapApp.filterView = new MapApp.Views.Filter({index:index}); 
				MapApp.filterView.render();
				this.$el.append(  MapApp.filterView.el );
			},this);
			return this;
		},	updateQueryObject: function() {
			MapApp.queryObject = {};
			$('select.multiselect').each(function () {
				filtername = 'filterable.'+$(this).attr('data-name');
				selected = {$all: $(this).val() };
				if($(this).val() == null) return;
				MapApp.queryObject[filtername] = selected;
			});
			console.log('##################');
			console.log('THE COLLECTION IS:');
			console.log(MapApp.locationsCollection);
			console.log('THE QUERY OBJECT IS: ');
			console.log(MapApp.queryObject);

			filteredLocations = MapApp.initialLocationsCollection.query(MapApp.queryObject)
			console.log('THE RESULT IS: ');
			console.log(filteredLocations);
			MapApp.locationsCollection.reset(filteredLocations);
		}
	});

	// ########################################
	// ##########  M A P ++ V I E W   ######### 
	// ########################################
	 

	MapApp.Views.Map = Backbone.View.extend({
		el: '#mapActions',
		events: {
			'click #showAll' : 'showAll',
			'click #removeAll' : 'removeAll'
		},
		initialize: function(){
			// vents.on('location:show', this.addLocation, this);
			MapApp.vents.on('location:showAll', this.showAll, this);
			MapApp.vents.on('locationAdded', this.showAll, this);
			this.collection.on('add', this.showAll, this);
			this.collection.on('remove', this.showAll, this);
			this.collection.on('reset', this.showAll, this);
			this.showAll();
			
		},
		showAll: function() {
			console.log('Showing Markers')
			this.removeAll();
			this.collection.each(this.addLocation, this);
			if(this.collection.length!=0){
				MapApp.map.fitZoom();
			}else{
				MapApp.mapInit();
			}
		},
		removeAll: function () {
			MapApp.removeMarkers();
		},
		addLocation: function(location){
			// console.log('show LOCATION In MAP VIEW');			
			var lat = location.get('lat');
			var lon = location.get('lon');
			var title = location.get('title');
			var logo = location.get('logo');
			var id = location.get('id');
			var nationalCLC = location.get('nationalCLC');
			var actionLines = location.get('actionLines');
			var eLLType = location.get('eLLType');
			var link = location.get('link');
			MapApp.addLocationToMap(id, lat, lon, title);
		},
		destroyMarker: function (id) {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		}
	});


	// ########################################
	// ##########  ADD LOCATION V I E W  ########## 
	// ########################################
	

	MapApp.Views.CreateLocation = Backbone.View.extend({
		el: '#addLocation',
		events: {
			'submit': 'submit'
		},
		initialize: function(){
		}, 
		submit: function(e){
			e.preventDefault();
			var newTitle = $(e.currentTarget).find('input.title').val();
			var newLat = $(e.currentTarget).find('input.lat').val();
			var newLon = $(e.currentTarget).find('input.lon').val();
			if(! $.trim(newTitle) ) return "title must not be empty!";
			var location = new MapApp.Models.Locations();
			location.set({title: newTitle, lat: newLat, lon: newLon});
			this.collection.add(location);
			//console.log('newTitle is:'+newTitle+' isValid:'+$.trim(newTitle));
		}
	});


	// #############################
	// ########  COLLCTIONS ######## 
	// #############################



	MapApp.Collections.Locations = Backbone.QueryCollection.extend({
		model: MapApp.Models.Locations
	});


	//##



	MapApp.Models.option = Backbone.Model.extend({
		defaults: {
			filtername: 'Filtername',
			filteroptions: '[1,2,3,4]'
		}
	});

	MapApp.Collections.Options = Backbone.QueryCollection.extend({
		model: MapApp.Models.option
	});

	MapApp.optionsCollection = new MapApp.Collections.Options([]);



	//########################################
	//########## CREATE VIEWS AND COLLECTIONS
	//########################################

	MapApp.locationsCollection = new MapApp.Collections.Locations(data);


	MapApp.initialLocationsCollection = new MapApp.Collections.Locations(MapApp.locationsCollection.toJSON());
	
	

	MapApp.filterView = new MapApp.Views.Filter({model:MapApp.Models.Locations});

	
	MapApp.filtersView = new MapApp.Views.Filters({collection: MapApp.locationsCollection});
	$('#filterLocations').append( MapApp.filtersView.el);

	MapApp.locationsView = new MapApp.Views.Locations({collection: MapApp.locationsCollection});
	$('#locationsView').append(MapApp.locationsView.render().el);
	
	//MapApp.filtersView = new MapApp.Views.Filter({collection: MapApp.locationsCollection});
	//$('#controls').append(MapApp.filtersView.render().el);

	MapApp.createLocationView = new MapApp.Views.CreateLocation({collection: MapApp.locationsCollection});
	new MapApp.Views.Map({collection: MapApp.locationsCollection});

	MapApp.activateMultiselect();

})();//siaf
