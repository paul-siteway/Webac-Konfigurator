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
		filteredProducts = MapApp.initialProductsCollection.query({title: {$likeI: query}})
		MapApp.productsCollection.reset(filteredProducts);
	})

	$('.reset').on('click', function (e) {
		e.preventDefault();
		MapApp.resetFilters();
	})
	

	MapApp.filterList = [];
    MapApp.anwendungsgebiete= {};



	// ########################################
	// ########## CUSTOM FUNCTIONS ############
	// ########################################
	MapApp.addProductToMap = function (id, lat, lon, title){
		MapApp.map.addMarker({
			lat			: lat,
			lng			: lon,
			title		: title,
			html		: "",
			click: function(e) {
			//alert('You clicked in this marker '+title);
			},
			infoWindow: {
				content: $('#productsView #product'+id).html()
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
			MapApp.vents.trigger('product:show', id);
		},
		showAll: function (id) {
			MapApp.vents.trigger('product:showAll', id);
		},
		add: function (id,title) {
			//console.log('add id:'+id+' title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		search: function (title) {
			//console.log('search title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		Default: function (other) {
			//console.log('Not sure wht you tying to do: you acessed:'+other) ;
			//EVENT SHOULD FIRE HERE
		} 
	});

	MapApp.router = new MapApp.Router;
	Backbone.history.start();


	// ################################
	// ########  LOCATION M O D E L  #######
	// ################################
	MapApp.Models.Products = Backbone.DeepModel.extend({

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
	// #####  SINGLE Product V I E W   ####
	// ################################

	 
	MapApp.Views.Product = Backbone.View.extend({
		tagName : "div", 
		className: 'product',
		events: {
			'click' : 'showProductInMap',
			'click strong': 'showAlert',
			'click button': 'destroy'
		},
		template: template('productTemplate'),
		initialize: function(){
			this.model.on('change', this.render, this );
			this.model.on('destroy', this.remove, this );
		},
		render: function(){
			var id = this.model.get('id');
			this.$el.html( this.template(this.model.toJSON()) ).attr('id', 'product'+id);
			MapApp.vents.trigger('productAdded');
			return this;
		}, 
		showAlert: function () {
			var newProductTitle = prompt('edit the Title:',this.model.get('title') );
			if(!newProductTitle) return;
			this.model.set('title', newProductTitle);
		},
		destroy: function () {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		},
		showProductInMap: function () {
			// console.log(this.model.get('id'));
			var lat = this.model.get('lat');
			var lon = this.model.get('lon');
			MapApp.map.setCenter(lat, lon);
			MapApp.map.setZoom(6);
		}
	});



	// ################################
	// ########## LOCATIONS VIEW  ########## - View for all Products
	// ################################

	MapApp.Views.Products = Backbone.View.extend({
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
		renderFiltered : function(products){

		$("#productsView").html("");
		products.each(function(product){
			var view = new MapApp.Views.Product({
				model: product,
				collection: this.collection
			});
			$("#productsView").append(view.render().el);
		});
		return this;
		},
		addOne: function (product) {
			var productView = new MapApp.Views.Product({model: product});
			this.$el.append(productView.render().el);
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
		className: 'multiselect',
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
		className: 'filters',
		initialize: function () {
			MapApp.vents.on('selectChanged', this.updateQueryObject, this);
			// this.collection.on('add', this.update, this);
			//this.collection.on('remove', this.update, this);
			this.collection.on('reset', this.update, this);
            MapApp.vents.on('updateFilter', this.update, this);
			this.create();
		},
		create: function () {
			this.createFilterList();
            this.createAnwendungsgebietList();
			this.createOptionsLists();
			this.render();
			MapApp.activateMultiselect();
		},
		update: function () {
            //console.log('update Filters');
			this.createOptionsLists();
			// this.render();
			// MapApp.activateMultiselect();
		},
        createAnwendungsgebietList: function(){
            MapApp.anwendungsgebiete = {};
            
            //go trough each locaction
            this.collection.each(function (product) {
                var name = product.get('Anwendungsgebiet');
                MapApp.anwendungsgebiete[name] = {};
            });
            
            //go trough each locaction
            this.collection.each(function (product) {
                var anwendungsgebietsName = product.get('Anwendungsgebiet');
                var filter = product.get('filterable');
                //go trough each filter of product
                _.each(filter,function(filterArray, filterGroupName){
                    console.log(filterGroupName);
                    MapApp.anwendungsgebiete[anwendungsgebietsName][filterGroupName] = filterArray; 
                    
                });
            });
        },
		createFilterList: function () {
			// console.log('creatingFilterList');
			//Empty the Filter list
			MapApp.filterList = [];
			//Lopp over all Products in collection
			this.collection.each(function (product) {
				//get only the Filterable Attributes
				var filterableList = product.get('filterable');
				//Push each Attribute to List
				for (var key in filterableList) {
					MapApp.filterList.push(key);
				}
			});
			//Remove all duplicates
			MapApp.filterList = _.uniq(MapApp.filterList);			
		},
        createOptionsLists: function () {
            //console.log('createOptionsLists');
			//MapApp.optionsLists = {};
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
					//Go trough all Products and get each FIltername
					MapApp.productsCollection.each(function (product) {
                      //  console.log(    'product:'+product.get('title')  );
						var option = product.get('filterable')[filtername];
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
				//for each create a new View.
				MapApp.filterView = new MapApp.Views.Filter({index:index}); 
				MapApp.filterView.render();
				this.$el.append(  MapApp.filterView.el );
			},this);
			return this;
		},  
        updateQueryObject: function() {
			MapApp.queryObject = {};
			$('select.multiselect').each(function () {
				filtername = 'filterable.'+$(this).attr('data-name');
				selected = {$all: $(this).val() };
				if($(this).val() == null) return;
				MapApp.queryObject[filtername] = selected;
			});

			filteredProducts = MapApp.initialProductsCollection.query(MapApp.queryObject)
			//console.log('THE RESULT IS: ');
			//console.log(filteredProducts);
			MapApp.productsCollection.reset(filteredProducts);
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
			// vents.on('product:show', this.addProduct, this);
			MapApp.vents.on('product:showAll', this.showAll, this);
			MapApp.vents.on('productAdded', this.showAll, this);
			this.collection.on('add', this.showAll, this);
			this.collection.on('remove', this.showAll, this);
			this.collection.on('reset', this.showAll, this);
			this.showAll();
			
		},
		showAll: function() {
			//console.log('Showing Markers')
			this.removeAll();
			this.collection.each(this.addProduct, this);
			if(this.collection.length!=0){
				MapApp.map.fitZoom();
			}else{
				MapApp.mapInit();
			}
		},
		removeAll: function () {
			MapApp.removeMarkers();
		},
		addProduct: function(product){
			// console.log('show LOCATION In MAP VIEW');			
			var lat = product.get('lat');
			var lon = product.get('lon');
			var title = product.get('title');
			var logo = product.get('logo');
			var id = product.get('id');
			var nationalCLC = product.get('nationalCLC');
			var actionLines = product.get('actionLines');
			var eLLType = product.get('eLLType');
			var link = product.get('link');
			MapApp.addProductToMap(id, lat, lon, title);
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
	

	MapApp.Views.CreateProduct = Backbone.View.extend({
		el: '#addProduct',
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
			var product = new MapApp.Models.Products();
			product.set({title: newTitle, lat: newLat, lon: newLon});
			this.collection.add(product);
			//console.log('newTitle is:'+newTitle+' isValid:'+$.trim(newTitle));
		}
	});


	// #############################
	// ########  COLLCTIONS ######## 
	// #############################



	MapApp.Collections.Products = Backbone.QueryCollection.extend({
		model: MapApp.Models.Products
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

	MapApp.productsCollection = new MapApp.Collections.Products(data);


	MapApp.initialProductsCollection = new MapApp.Collections.Products(MapApp.productsCollection.toJSON());

	MapApp.filterView = new MapApp.Views.Filter({model:MapApp.Models.Products});

	
	MapApp.filtersView = new MapApp.Views.Filters({collection: MapApp.productsCollection});
	$('#filterProducts').append( MapApp.filtersView.el);

	MapApp.productsView = new MapApp.Views.Products({collection: MapApp.productsCollection});
	$('#productsView').append(MapApp.productsView.render().el);
	
	//MapApp.filtersView = new MapApp.Views.Filter({collection: MapApp.productsCollection});
	//$('#controls').append(MapApp.filtersView.render().el);

	MapApp.createProductView = new MapApp.Views.CreateProduct({collection: MapApp.productsCollection});
	new MapApp.Views.Map({collection: MapApp.productsCollection});

	MapApp.activateMultiselect();

})();//siaf
