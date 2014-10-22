// @codekit-prepend 'underscore.js'
// @codekit-prepend 'jquery.js'

// @codekit-prepend 'backbone.js'
// @codekit-prepend 'deep-model.min.js'
// @codekit-prepend 'backbone-query.min.js'

// @codekit-prepend 'bootstrap.js'
// @codekit-prepend 'bootstrap-multiselect.js'

(function() {
	//create a namespace
	window.Webac = {
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
	Webac.vents = _.extend({}, Backbone.Events);
	
	// ################################
	// ######### GLOBAL VARS   ########
	// ################################


	$('#searchTitle').on('keyup', function () {
		query = $(this).val();
		console.log(query);
		filteredProducts = Webac.initialProductsCollection.query({title: {$likeI: query}})
		Webac.productsCollection.reset(filteredProducts);
	})

	$('.reset').on('click', function (e) {
		e.preventDefault();
		Webac.resetFilters();
	})
	

	Webac.filterList = [];
    Webac.anwendungsgebiete= {};

	Webac.readProp = function (obj, prop) {
		return obj[prop];
	};

	Webac.activateMultiselect = function () {
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
				Webac.vents.trigger('selectChanged', element,filtername,checked);
			}
		});

		//Webac.resetFilters();
	};//activateMultiselect
	

	Webac.resetFilters = function () {
		// $('.multiselect option').each(function() {
		// 	item = $(this).val().toString();
		// 	$(this).parent().multiselect('deselect', item);
		// });
		$('#searchTitle').val('');
		$("select.multiselect").val([]);
		$("select.multiselect").multiselect('refresh')
		Webac.vents.trigger('selectChanged');
	}



	// ################################
	// ########## BB ROUTES ##########
	// ################################

	Webac.Router = Backbone.Router.extend({
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
			Webac.vents.trigger('product:show', id);
		},
		showAll: function (id) {
			Webac.vents.trigger('product:showAll', id);
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

	Webac.router = new Webac.Router;
	Backbone.history.start();


	// ################################
	// ########  PRODUCTS MODEL  #######
	// ################################
	Webac.Models.Products = Backbone.DeepModel.extend({
		defaults: {
			title: 'im am the default Title',
			link: 'http://www.google.de'
		},
		sync: function () { return false; },
		display: function(){
			return this.get('title') +' is displaying';
		}

	});
    






	// ################################
	// #####  SINGLE Product V I E W   ####
	// ################################

	 
	Webac.Views.Product = Backbone.View.extend({
		tagName : "div", 
		className: 'product',
		events: {
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
			Webac.vents.trigger('productAdded');
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
		}
	});



	// ################################
	// ########## Products VIEW  ########## - View for all Products
	// ################################

	Webac.Views.Products = Backbone.View.extend({
		tagName: 'div' ,
		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.on('reset', this.render, this);
			Webac.vents.on('startSearch', this.search, this);
		},
		render: function(){
			// console.log('redering PRODUCTS VIEW');
			this.$el.html('');
			this.collection.each(this.addOne, this);
			return this;
		},
		renderFiltered : function(products){

		$("#productsView").html("");
		products.each(function(product){
			var view = new Webac.Views.Product({
				model: product,
				collection: this.collection
			});
			$("#productsView").append(view.render().el);
		});
		return this;
		},
		addOne: function (product) {
			var productView = new Webac.Views.Product({model: product});
			this.$el.append(productView.render().el);
		}
	});


	// ################################################ 
	// #######  SILNGLE ANWENUNGSGEBIET  VIEW   ####### 
	// ################################################    
    
    
    Webac.Views.Anwendungsgebiet = Backbone.View.extend({
        tagName: 'div',
		className: 'anwendungsgebiet',
		template: template('anwendungsgebietTemplate'),
		initialize: function () {
            //none
		},
		render: function () {		
            var anwendungsgebietName = this.options.name;
            this.$el.append(this.template( {name: anwendungsgebietName}) );	
            
            _.each(Webac.anwendungsgebiete[anwendungsgebietName], function (object, name) {
				this.$el.find('.inner').append(name);
			},this);
		},
        
    }); 

    
    // ################################################## 
	// ##########   ANWENUNGSGEBIETE   VIEW   ########### 
	// ################################################## 
    
    Webac.Views.Anwendungsgebiete = Backbone.View.extend({
        tagName: 'div', 
		className: 'anwendungsgebiete',
        initialize: function () {
            this.create()
        },
        create: function () {
            this.createAnwendungsgebietList();
            this.render();
        },
        createAnwendungsgebietList: function(){
            Webac.anwendungsgebiete = {};
            //go trough each product
            this.collection.each(function (product) {
                var name = product.get('Anwendungsgebiet');
                Webac.anwendungsgebiete[name] = {};
            });

            //go trough each product
            this.collection.each(function (product) {
                var anwendungsgebietsName = product.get('Anwendungsgebiet');
                var filter = product.get('filterable');
                //go trough each filter of product
                _.each(filter,function(filterArray, filterGroupName){
                    console.log(filterGroupName);
                    Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName] = filterArray; 
                });
            });
        },
        render: function () {
            ////Filter trough all ITEMS
            this.$el.html('');
            console.log('render Anwendungsgebiete');
            _.each(Webac.anwendungsgebiete, function (anwendungsgebiet,name) {
                //for each create a new View.
				Webac.anwendungsgebietView = new Webac.Views.Anwendungsgebiet({name:name}); 
				Webac.anwendungsgebietView.render();
				this.$el.append(  Webac.anwendungsgebietView.el );                
            },this);
            //each
            return this;
        }  
    });
    
    

        
        
    // ########################################
	// #######  SILNGLE FILTER  VIEW   ######## 
	// ########################################
	
	

	Webac.Views.Filter = Backbone.View.extend({
		tagName: 'select',
		className: 'multiselect',
		template: template('filterTemplate'),
		initialize: function () {
			// console.log('initialized Single Filter View');
			this.$el.attr( "data-name", Webac.filterList[this.options.index] );
            this.$el.attr( 'multiple', 'multiple');
		},
		render: function () {
            
			this.renderFilters();
			this.renderallOptions();
		},
		renderFilters: function () {
			var optionName = Webac.filterList[this.options.index];
			//this.$el.html('<option value="'+optionName+'">'+optionName+'</option>' );
			//this.$el.html( this.template( {optionName: optionName} ));	
		},
		renderallOptions: function () {
			// console.log('Rendering Options');
			var arrayHolder = Webac.optionsCollection.at(this.options.index).get('filteroptions');
			
			//create an Array for all Filtersoptions
			Webac["filterOptionsArray"+this.options.index] = [];

			// Go through all filters
			_.each(arrayHolder, function (option,index) {
				_.each(option, function (inhalt,index){
					//console.log('der Inhalt des '+index+' items ist: '+inhalt);
					//add each array content to the corresponding filter Array
					Webac["filterOptionsArray"+this.options.index].push(inhalt);
				},this);
			},this);
            
			//make the FilterArray Unique
			Webac["filterOptionsArray"+this.options.index] = _.uniq(Webac["filterOptionsArray"+this.options.index]);
			
            //Finally go trough all the items in the Filtersoptions array and add them to the Select
            _.each(Webac["filterOptionsArray"+this.options.index], function (name) {
				this.$el.append( this.template( {optionName: name} ));	
			},this);
		}
	});

        
        
    
	// ########################################
	// ##########   FILTERS  VIEW   ########### 
	// ########################################

	Webac.Views.Filters = Backbone.View.extend({
		tagName: 'div', 
		className: 'filters',
		initialize: function () {
			Webac.vents.on('selectChanged', this.updateQueryObject, this);
			// this.collection.on('add', this.update, this);
			//this.collection.on('remove', this.update, this);
			this.collection.on('reset', this.update, this);
            Webac.vents.on('updateFilter', this.update, this);
			this.create();
		},
		create: function () {
			this.createFilterList();
			this.createOptionsLists();
			this.render();
			Webac.activateMultiselect();
		},
		update: function () {
			this.createOptionsLists();
		},
		createFilterList: function () {
			// console.log('creatingFilterList');
			//Empty the Filter list
			Webac.filterList = [];
			//Lopp over all Products in collection
			this.collection.each(function (product) {
				//get only the Filterable Attributes
				var filterableList = product.get('filterable');
				//Push each Attribute to List
				for (var key in filterableList) {
					Webac.filterList.push(key);
				}
			});
			//Remove all duplicates
			Webac.filterList = _.uniq(Webac.filterList);			
		},
        createOptionsLists: function () {
            //console.log('createOptionsLists');
			//Webac.optionsLists = {};
			// reset the optionen Collection 
			Webac.optionsCollection.reset();
			//Go trough each Filter in the Filterlist
			_.each(Webac.filterList,function (filtername, index){
					//Add a empty Model to ne optionen Collection
					Webac.optionsCollection.add({});
					//Set the Filtername to the Model in Collection
					Webac.optionsCollection.at(index).set('filtername',filtername);
					
					//Temp array for all Options
					var tempArray = [];
					//Go trough all Products and get each FIltername
					Webac.productsCollection.each(function (product) {
                      //  console.log(    'product:'+product.get('title')  );
						var option = product.get('filterable')[filtername];
						tempArray.push(option);
				});
					// console.xlog('####'+tempArray);
				Webac.optionsCollection.at(index).set('filteroptions', tempArray);
			});
		},
		render: function () {
			////Filter trough all ITEMS
			this.$el.html('');
			_.each(Webac.filterList, function (filter,index) {
				//for each create a new View.
				Webac.filterView = new Webac.Views.Filter({index:index}); 
				Webac.filterView.render();
				this.$el.append(  Webac.filterView.el );
			},this);
			return this;
		},  
        updateQueryObject: function() {
			Webac.queryObject = {};
			$('select.multiselect').each(function () {
				filtername = 'filterable.'+$(this).attr('data-name');
				selected = {$all: $(this).val() };
				if($(this).val() == null) return;
				Webac.queryObject[filtername] = selected;
			});

			filteredProducts = Webac.initialProductsCollection.query(Webac.queryObject)
			//console.log('THE RESULT IS: ');
			//console.log(filteredProducts);
			Webac.productsCollection.reset(filteredProducts);
		}
	});

	


	// #############################
	// ########  COLLCTIONS ######## 
	// #############################



	Webac.Collections.Products = Backbone.QueryCollection.extend({
		model: Webac.Models.Products
	});


	Webac.Models.option = Backbone.Model.extend({
		defaults: {
			filtername: 'Filtername',
			filteroptions: '[1,2,3,4]'
		}
	});

	Webac.Collections.Options = Backbone.QueryCollection.extend({
		model: Webac.Models.option
	});
    
	Webac.optionsCollection = new Webac.Collections.Options([]);



	//########################################
	//########## CREATE VIEWS AND COLLECTIONS
	//########################################

	Webac.productsCollection = new Webac.Collections.Products(data);


	Webac.initialProductsCollection = new Webac.Collections.Products(Webac.productsCollection.toJSON());

	Webac.filterView = new Webac.Views.Filter({model:Webac.Models.Products});

	
	Webac.filtersView = new Webac.Views.Filters({collection: Webac.productsCollection});
	$('#filterProducts').append( Webac.filtersView.el);
    
    

	Webac.productsView = new Webac.Views.Products({collection: Webac.productsCollection});
	$('#productsView').append(Webac.productsView.render().el);
	
	//Webac.filtersView = new Webac.Views.Filter({collection: Webac.productsCollection});
	//$('#controls').append(Webac.filtersView.render().el);


    
    
//    Webac.anwendungsgebietView = new Webac.Views.Anwenungsgebiet({model:Webac.Models.Products});
    Webac.anwendungsgebieteView = new Webac.Views.Anwendungsgebiete({collection: Webac.productsCollection});
	$('#anwendungsgebiete').append( Webac.anwendungsgebieteView.el);

    
    
	Webac.activateMultiselect();

})();//siaf
