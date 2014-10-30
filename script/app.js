// @codekit-prepend 'lib/underscore.js'
// @codekit-prepend 'lib/jquery.js'

// @codekit-prepend 'lib/backbone.js'
// @codekit-prepend 'lib/deep-model.min.js'
// @codekit-prepend 'lib/backbone-query.min.js'

// @codekit-prepend 'lib/bootstrap.js'
// @codekit-prepend 'lib/bootstrap-multiselect.js'


(function() {

  //create a namespace
  window.Webac = {
    Models: {},
    Collections: {},
    Views: {},
    queryObject: {}
  };


  //TEMPLATE FUNCTION
  window.template = function(id) {
    return _.template($('#' + id).html());
  };


  // ################################
  // ######### GLOBAL EVENTS ########
  // ################################
  Webac.vents = _.extend({}, Backbone.Events);



  // ################################
  // ######### GLOBAL VARS   ########
  // ###############################


  Webac.filterList = [];
  Webac.anwendungsgebiete = {};
  Webac.currentAntwenungsgebiet = "";



  // #####################################
  // ######### GLOBAL FUNCTIONS   ########
  // #####################################

  //Activate Bootstrap MultiselectPlugin on created Selects
  Webac.activateMultiselect = function() {
    $("select.multiselect").val([]);
    $('.multiselect').multiselect("destroy");
    $('.multiselect').multiselect({
      buttonClass: 'btn',
      buttonWidth: 'auto',
      maxHeight: false,
      buttonText: function(options, select) {
        //console.log(select.attr('data-name'));
        //console.log('OptionsLength'+options.length );
        if (options.length === 0) {
          return select.attr('data-name');
        } else if (options.length > 0) {
          return select.attr('data-name') + ' (' + options.length + ')';
        } else {
          return select.attr('data-name');
        } //buttontext
      },
      onChange: function(element, checked) {
        console.log('change');
        filtername = element.parent().attr('data-name');
        Webac.vents.trigger('selectChanged', element, filtername, checked);
      }
    });
  }; //activateMultiselect


  Webac.resetFilters = function() {
    $('#searchTitle').val('');
    $("select.multiselect").val([]);
    $("select.multiselect").multiselect('refresh')
    Webac.vents.trigger('selectChanged');
  }



  // ################################################################
  // ########  PRODUCTS MODEL  ######################################
  // ################################################################

  Webac.Models.Products = Backbone.DeepModel.extend({
    defaults: {
      title: 'im am the default Title',
      link: 'http://www.google.de'
    },
    sync: function() {
      return false;
    },
    display: function() {
      return this.get('title') + ' is displaying';
    }
  });



  // ################################################################
  // #####  SINGLE Product V I E W   ################################
  // ################################################################


  Webac.Views.Product = Backbone.View.extend({
    tagName: "div",
    className: 'product',
    events: {
      'click strong': 'showAlert',
      'click button': 'destroy'
    },
    template: template('productTemplate'),
    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.remove, this);
    },
    render: function() {
      var id = this.model.get('id');
      this.$el.html(this.template(this.model.toJSON())).attr('id', 'product' + id);
      Webac.vents.trigger('productAdded');
      return this;
    },
    showAlert: function() {
      var newProductTitle = prompt('edit the Title:', this.model.get('title'));
      if (!newProductTitle) return;
      this.model.set('title', newProductTitle);
    },
    destroy: function() {
      this.model.destroy();
    },
    remove: function() {
      this.$el.remove();
    }
  });



  // ################################################################
  // ########## Products VIEW  ########## - View for all Products ###
  // ################################################################

  Webac.Views.Products = Backbone.View.extend({
    tagName: 'div',
    initialize: function() {
      this.collection.on('add', this.addOne, this);
      this.collection.on('reset', this.render, this);
      Webac.vents.on('startSearch', this.search, this);
    },
    render: function() {
      // console.log('redering PRODUCTS VIEW');
      this.$el.html('');
      this.collection.each(this.addOne, this);
      return this;
    },
    renderFiltered: function(products) {

      $("#productsView").html("");
      products.each(function(product) {
        var view = new Webac.Views.Product({
          model: product,
          collection: this.collection
        });
        $("#productsView").append(view.render().el);
      });
      return this;
    },
    addOne: function(product) {
      var productView = new Webac.Views.Product({
        model: product
      });
      this.$el.append(productView.render().el);
    }
  });
    
    
  
    
    
  // ################################################################
  // #####  SINGLE ANWENUNGSSELECTION VIEW   ########################
  // ################################################################
  Webac.Views.Selection = Backbone.View.extend({
    tagName: "div",
    className: 'selection',
    events: {
      'click a': 'showSelect',
      'click .close': 'reset'
    },
    template: template('anwendungsSelectTemplate'),
    initialize: function() {
    },
    render: function() {
      var name =  this.options.anwendungsgebietName;
      this.$el.append(this.template({name: name}));
      return this;
    },
    reset: function(){
        Webac.productsCollection.reset(Webac.initialProductsCollection.toJSON());
        // $('.anwendungsgebiete .anwendungsgebiet').slideUp();
        //$('.anwendungsgebiete .anwendungsgebiet').slideUp();
        Webac.activateMultiselect();
        Webac.currentAntwenungsgebiet = "";
        
    },
    showSelect: function() {
      var name = this.options.anwendungsgebietName;
      
      Webac.queryObject = { Anwendungsgebiet:name};  
      filteredProducts = Webac.initialProductsCollection.query(Webac.queryObject)
      Webac.productsCollection.reset(filteredProducts);
      Webac.currentAntwenungsgebiet = name;
      
      var id = this.options.id;
      $('.anwendungsgebiete .anwendungsgebiet').slideUp();
      $('.anwendungsgebiete .anwendungsgebiet').eq(id).slideDown();        
      $('.selection').eq(id).removeClass('active');
      $('.selection').eq(id).addClass('active');
    },
    remove: function() {
      //this.$el.remove();
    }
  });

  // ################################################################
  // #######  ANWENUNGSSELECTIONS  VIEW   ############################
  // ################################################################

 Webac.Views.Selections = Backbone.View.extend({
    tagName: 'div',
    className: 'selections',

    initialize: function() {
      this.collection.on('add', this.addOne, this);
      this.collection.on('reset', this.render, this);
    },
    render: function() {
      
      this.$el.html('');
      var i = 0;
      _.each(Webac.anwendungsgebiete, function(object, name){
          console.log('redering anwendungsauswahl');
        
        var anwendungsgebietName = name;
        var selectView = new Webac.Views.Selection({
            anwendungsgebietName: anwendungsgebietName,
            id:i
        });
        this.$el.append(selectView.render().el);
          
          i++;
          
      }, this);
        
      return this;
    }
  });
    

    
    

  // ################################################################
  // #######  SINGLE ANWENUNGSGEBIET  VIEW   ########################
  // ################################################################


  Webac.Views.Anwendungsgebiet = Backbone.View.extend({
    tagName: 'div',
    className: 'anwendungsgebiet',
    template: template('anwendungsgebietTemplate'),
    initialize: function() {
      //none
    },
    render: function() {
      var anwendungsgebietName = this.options.name;
      this.$el.append(this.template({
        name: anwendungsgebietName
      }));
      _.each(Webac.anwendungsgebiete[anwendungsgebietName], function(object, name) {
      Webac.newfilterView = new Webac.Views.FilterNew({
          anwendungsgebietName: anwendungsgebietName,
          spalte: name,
          optionsArray: object
        });
        Webac.newfilterView.render();
        this.$el.append(Webac.newfilterView.el);
      }, this);
    },
  });



  // ################################################################
  // ##########   ANWENUNGSGEBIETE   VIEW   #########################
  // ################################################################

  Webac.Views.Anwendungsgebiete = Backbone.View.extend({
    tagName: 'div',
    className: 'anwendungsgebiete',
    initialize: function() {
      this.create()
      Webac.vents.on('selectChanged', this.updateQueryObject, this);
    },
    create: function() {
      this.createAnwendungsgebietList();
      this.render();
    },
    createAnwendungsgebietList: function() {
      Webac.anwendungsgebiete = {};
      //go trough each product
      this.collection.each(function(product) {
        var name = product.get('Anwendungsgebiet');
        Webac.anwendungsgebiete[name] = {};
      });

      //go trough each product
      this.collection.each(function(product) {
        var anwendungsgebietsName = product.get('Anwendungsgebiet');
        var filter = product.get('filterable');
        //go trough each filter of product
        _.each(filter, function(filterArray, filterGroupName) {
          //console.log(filterGroupName);
          Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName] = filterArray;
        });
      });
    },
    render: function() {
      ////Filter trough all ITEMS
      this.$el.html('');
      console.log('render Anwendungsgebiete');
      _.each(Webac.anwendungsgebiete, function(anwendungsgebiet, name) {
        console.log('render Anwendungsgebiete:'+name);
        Webac.anwendungsgebietView = new Webac.Views.Anwendungsgebiet({
          name: name
        });
        Webac.anwendungsgebietView.render();
        this.$el.append(Webac.anwendungsgebietView.el);
      }, this);
      //each
      return this;
    },
    updateQueryObject: function() {
      Webac.queryObject = {};
      $('select.multiselect').each(function() {
        filtername = 'filterable.' + $(this).attr('data-name');
        selected = {
          $all: $(this).val()
        };
        Webac.queryObject["Anwendungsgebiet"] =  Webac.currentAntwenungsgebiet;
        if ($(this).val() == null) return;
        Webac.queryObject[filtername] = selected;
        
      });
      filteredProducts = Webac.initialProductsCollection.query(Webac.queryObject)
      //			console.log('THE RESULT IS: ');
      //			console.log(filteredProducts);
      Webac.productsCollection.reset(filteredProducts);
    }
  });



  // ################################################################
  // ###################### NEW SIGNLE FILTER VIEW ##################
  // ################################################################



  Webac.Views.FilterNew = Backbone.View.extend({
    tagName: 'select',
    className: 'multiselect',
    template: template('filterTemplate'),
    initialize: function() {

      // console.log('anwendungsgebietName:'+this.options.anwendungsgebietName);
      // console.log('spalte:'+this.options.spalte);
      // console.log('optionsArray:'+this.options.optionsArray);

      this.$el.attr("data-name", this.options.spalte);
      this.$el.attr('multiple', 'multiple');
    },
    render: function(name) {
      
      _.each(this.options.optionsArray, function(name, index) {
        this.$el.append(this.template({
          optionName: name
        }));
      }, this);
    }
  });



  // ################################################################
  // ########################  COLLECTION ###########################
  // ################################################################

  Webac.Collections.Products = Backbone.QueryCollection.extend({
    model: Webac.Models.Products
  });

  Webac.productsCollection = new Webac.Collections.Products(data);
  Webac.initialProductsCollection = new Webac.Collections.Products(Webac.productsCollection.toJSON());


  // ################################################################
  // ######################## CREATE VIEWS ##########################
  // ################################################################


  Webac.productsView = new Webac.Views.Products({
    collection: Webac.productsCollection
  });
    
  $('#productsView').append(Webac.productsView.render().el);

    
  //Webac.anwendungsgebietView = new  Webac.Views.Anwendungsgebiet({model:Webac.Models.Products});
  Webac.anwendungsgebieteView = new Webac.Views.Anwendungsgebiete({
    collection: Webac.productsCollection
  });
  $('#anwendungsgebiete').append(Webac.anwendungsgebieteView.el);


    
  
  Webac.anwendungsSelectionsView = new Webac.Views.Selections({
    collection: Webac.productsCollection
  });
  $('#anwendungsSelections').append(Webac.anwendungsSelectionsView.render().el);
    
    
  Webac.activateMultiselect();
    
})(); //IIFE Imediately Iinvoked Function Expression



