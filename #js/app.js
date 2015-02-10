// @codekit-prepend 'lib/underscore.js'
// @codekit-prepend 'lib/backbone.js'
// @codekit-prepend 'lib/deep-model.min.js'
// @codekit-prepend 'lib/backbone-query.min.js'
// @codekit-prepend 'lib/bootstrap.js'
// @codekit-prepend 'lib/bootstrap-multiselect.js'
// @codekit-prepend 'lib/TweenMax.js'

(function() {
  console.log('WEBAC KONFIGURATOR: V5.5 - 28.01');
  //create a namespace
  window.Webac = {
    Models: {},
    Collections: {},
    Views: {},
    queryObject: {},
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
  Webac.lastSelectionBox1 = "";
  Webac.lastSelectionBox2 = "";
  Webac.lastSelectionBox3 = "";

    
 Webac.exceptions = {
    1: {
        ifAnwenungsgebiet: "Mauerwerksabdichtung",
        ifStep: 1,
        ifOption: " Horizontalsperre",
        inStep: 2,
        allowText:  [' Durchfeuchtungsgrad (DFG) bis 100%', ' DFG bis 95%',' DFG bis 80%',' DFG bis 60%']
    },
    2: {
        ifAnwenungsgebiet: "Mauerwerksabdichtung",
        ifStep: 1,
        ifOption: " Mauerwerksabdichtung",
        inStep: 2,
        allowText:  [' Vertikalabdichtung',' Hohlraumverfüllung',' Abdichtung gegen von außen einwirkendes Wasser']
    },
    3: {
        ifAnwenungsgebiet: "Risssanierung",
        ifStep: 2,
        ifOption: " trocken, feucht, nass",
        inStep: 3,
        allowText:  ['']
    },
    4: {
        ifAnwenungsgebiet: "Fugenabdichtung",
        ifStep: 1,
        ifOption: " Arbeitsfugen",
        inStep: 2,
        allowText:  [' Injektion: ja',' Injektion: nein']
    },
    5: {
        ifAnwenungsgebiet: "Fugenabdichtung",
        ifStep: 1,
        ifOption: " Dehnfugen",
        inStep: 2,
        allowText:  [' Fugeninjektion',' Fugenverguss', ' Quelldichtungen Dichtbänder']
    },
    6: {
        ifAnwenungsgebiet: "Kanalsanierung",
        ifStep: 1,
        ifOption: " drückendes Wasser: Ja",
        inStep: 2,
        allowText:  ['']
    }
     
};

  // #####################################
  // ######### GLOBAL FUNCTIONS   ########
  // #####################################
  
  Webac.resetApp = function(){
      //console.log('reset');
      $('.selections').removeClass('active');
      Webac.productsCollection.reset(Webac.initialProductsCollection.toJSON());
        $('.anwendungsgebiete .anwendungsgebiet').slideUp(0);
        $('#productsView .product').hide();
        Webac.queryObject = {};
        Webac.lastSelectionBox1 = "";
        Webac.lastSelectionBox2 = "";
        Webac.lastSelectionBox3 = "";
        Webac.currentAntwenungsgebiet = "";
  }

  Webac.showSteps = function() {
    $('.multiselect-container').each(function(index) {
        var hasActive = $(this).find('.active').length;
        next = index+1;
        if(hasActive){
          console.log(index+' has '+hasActive+'  (Next is '+next+')');
          $('.btn-group').removeClass('active');
          $('.btn-group:eq('+index+')').addClass('done');
          
          if( $('.btn-group:eq('+next+')').find('li').length == 0){
              $('.btn-group:eq('+next+') ul').append('<li class="active"><a href="javascript:void(0);"><label class="checkbox skip">&nbsp;</label></a></li>');
              $('.btn-group:eq('+next+')').addClass('done');
              next++
              Webac.showHint(next)
          }
          $('.btn-group:eq('+next+')').addClass('active');
        }
    });
  }        
  
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
          return select.attr('data-name') + '(' + options.length + ')';
        } else {
          return select.attr('data-name');
        } //buttontext
      },
      onChange: function(element, checked) {
        console.log('C H A N G E');
        
            if( element.parents('.multiselect').attr('data-name') == "1" ){
                Webac.lastSelectionBox1 = element.val();
                //console.log(Webac.lastSelectionBox1+'+++++++++++++');
                Webac.showHint(2);
            }
            if( element.parents('.multiselect').attr('data-name') == "2" ){
                Webac.lastSelectionBox2 = element.val();
                //console.log(Webac.lastSelectionBox1+'+++++++++++++');
                Webac.showHint(3);
            }
            if( element.parents('.multiselect').attr('data-name') == "3" ){
                Webac.lastSelectionBox3 = element.val();
                //console.log(Webac.lastSelectionBox1+'+++++++++++++');
                Webac.showHint(4);
            }
        
        Webac.vents.trigger('selectChanged');
      }
    });
      
      //reselect the last selection
     $('input[value="'+Webac.lastSelectionBox1+'"]').attr('checked', true).parents('li').addClass('active');
     $('input[value="'+Webac.lastSelectionBox2+'"]').attr('checked', true).parents('li').addClass('active');
     $('input[value="'+Webac.lastSelectionBox3+'"]').attr('checked', true).parents('li').addClass('active');
      
  }; //activateMultiselect


  Webac.resetFilters = function() {
    $('#searchTitle').val('');
    $("select.multiselect").val([]);
    $("select.multiselect").multiselect('refresh')
    Webac.vents.trigger('selectChanged');
  }
  
  Webac.showHint = function(num,delay){
      //console.log('showHint: '+num)
      all = $('.hint');
      el = $('.hint').eq(num);
      if(delay == undefined){
          delay = 0.5;
      }
      
      TweenLite.to(all, 0, {marginTop:-10, opacity: 0,  overwrite:"all"});//reset all
      TweenLite.to(el, 2, {marginTop:0, opacity: 1, delay: delay, ease:Elastic.easeOut});//show 
  }

    Webac.checkExceptions = function(products, object){
        
   
        
        //Go Trough Exeptions
        _.each(Webac.exceptions, function(exeption){
             
            var ifAnwenungsgebiet = exeption.ifAnwenungsgebiet
            var ifStep = exeption.ifStep-1;
            var ifOption = exeption.ifOption
            
            var inStep = exeption.inStep-1;
            var allowText = exeption.allowText
            
            console.log(ifAnwenungsgebiet);
            console.log(ifStep);
            console.log(inStep);
            console.log(ifOption);
            console.log(allowText);
            
             
            curAnwengunsgebiet = $('.selection h3').text();
            curOption = $('.anwendungsgebiet .btn-group').eq(ifStep).find('li.active').text();
             
            console.log('curAnwengunsgebiet:'+curAnwengunsgebiet);
            console.log('curOption:'+curOption);
            
            if( ifAnwenungsgebiet == curAnwengunsgebiet && ifOption == curOption){
                //alert('AUSNAHME');
                var LIs = $('.anwendungsgebiet .btn-group:eq('+inStep+') ul li');
                //go trhough each LI
                LIs.each(function(){
                    li = $(this);
                    var liText  = li.text();
                    console.log('checking LI'+liText);
                    //if liTEst is not in allowedTexts
                    if( !_.contains(exeption.allowText, liText) ){
                        li.remove();
                    }        
                });//each LI  
            }//if
            
            
        });
  }//checkExceptions


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
     // console.log('++render View: Products++');
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
  // #####  SINGLE ANWENUNGSSELECTION VIEW ##########################
  // ################################################################
    
  Webac.Views.Selection = Backbone.View.extend({
    tagName: "div",
    className: 'selection',
    events: {
      'click a': 'showSelect',
      'click .close': 'reset',
    },
    template: template('anwendungsSelectTemplate'),
    initialize: function() {
       
    },
    render: function() {
      var name =  this.options.anwendungsgebietName;
      var image = this.options.image;
      this.$el.append(this.template({name: name, image:image}));
      return this;
        
    },
    reset: function(){
          $('.selections').removeClass('active');
          Webac.resetApp();
          Webac.showHint(0,2);
          
    },
    showSelect: function() {

      Webac.resetApp();
      var name = this.options.anwendungsgebietName;      
        
      Webac.queryObject = { Anwendungsgebiet:name};  
      filteredProducts = Webac.initialProductsCollection.query(Webac.queryObject)
      Webac.productsCollection.reset(filteredProducts);
      Webac.currentAntwenungsgebiet = name;
      var id = this.options.id;
      Webac.showHint(1,1.5);  
      $('.selections').addClass('active');
      $('.product').hide();
      $('.anwendungsgebiete .anwendungsgebiet').slideUp(0).slideDown();
      
    }
  });

  // ################################################################
  // #######  ANWENUNGSSELECTIONS  VIEW   ############################
  // ################################################################

 Webac.Views.Selections = Backbone.View.extend({
    tagName: 'div',
    className: 'selections',
    initialize: function() {
        this.collection.on('reset', this.render, this);
    },
    render: function() {
      //console.log('++render View: Selcections++');
      this.$el.html('');
      var i = 0;
      _.each(Webac.anwendungsgebiete, function(object, name){
        //console.log('redering anwendungsauswahl');
        var image = object.image;
        var anwendungsgebietName = name;
        var selectView = new Webac.Views.Selection({
            anwendungsgebietName: anwendungsgebietName,
            id:i,
            image: image
        });
        this.$el.append(selectView.render().el);
          
          i++;
          
      }, this);
      TweenMax.fromTo($('.selections').not('.active'), 1.5, {opacity: 0}, {opacity: 1, delay:0.5});
      return this;
        
    }//render
  });
    

    
    

  // ################################################################
  // #######  SINGLE ANWENUNGSGEBIET  VIEW   ########################
  // ################################################################


  Webac.Views.Anwendungsgebiet = Backbone.View.extend({
    tagName: 'div',
    className: 'anwendungsgebiet',
    template: template('anwendungsgebietTemplate'),
    initialize: function() {
      
    },
    render: function() {
      var anwendungsgebietName = this.options.name;
      //Renders the H1
      this.$el.append(this.template({name: anwendungsgebietName}));
      _.each(Webac.anwendungsgebiete[anwendungsgebietName], function(object, name) {
        if(name != "image"){
            Webac.newfilterView = new Webac.Views.FilterNew({
              anwendungsgebietName: anwendungsgebietName,
              spalte: name,
              optionsArray: object
            });
            Webac.newfilterView.render();
            this.$el.append(Webac.newfilterView.el);
        }
      }, this);//each
    }//render
  });



  // ################################################################
  // ##########   ANWENUNGSGEBIETE   VIEW   #########################
  // ################################################################

  Webac.Views.Anwendungsgebiete = Backbone.View.extend({
    tagName: 'div',
    className: 'anwendungsgebiete',
    initialize: function() {
        this.create();
        Webac.vents.on('selectChanged', this.updateQueryObject, this);
        this.collection.on('reset', this.createAnwendungsgebietList, this);
        Webac.showHint(0, 3)
      
    },
    create: function() {
      this.createAnwendungsgebietList();
    },
    createAnwendungsgebietList: function() {
      Webac.anwendungsgebiete = {};
      //console.log('++create Anwendungsgebiet Liste++');
      this.collection.each(function(product) {
        var name = product.get('Anwendungsgebiet');
        if(!Webac.anwendungsgebiete[name]){
            Webac.anwendungsgebiete[name] = {};
        }
      });

      //go trough each product
      Webac.productsCollection.each(function(product) {
        var anwendungsgebietsName = product.get('Anwendungsgebiet');
        var filter = product.get('filterable');
        var image = product.get('image');
        var name = product.get('title');
        //console.log('name'+name);
        //go trough each filter of product
        _.each(filter, function(filterArray, filterGroupName) {
            
            if(!Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName]){
                Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName] = [];
            }
            Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName] = _.uniq(Webac.anwendungsgebiete[anwendungsgebietsName][filterGroupName].concat(filterArray));
        });
          
        Webac.anwendungsgebiete[anwendungsgebietsName].image = image;
          
      });
      this.render();
      Webac.activateMultiselect();
      $('.btn-group:eq(0)').addClass('active');
      Webac.showSteps();
    },
    render: function() {
      ////Filter trough all ITEMS
      this.$el.html('');
      //console.log('++render View: Anwendungsgebiete++');
      _.each(Webac.anwendungsgebiete, function(anwendungsgebiet, name) {
        //console.log('render Anwendungsgebiete:'+name);
        Webac.anwendungsgebietView = new Webac.Views.Anwendungsgebiet({
          collection: Webac.productsCollection,
          name: name
        });
        Webac.anwendungsgebietView.render();
        this.$el.append(Webac.anwendungsgebietView.el);
      }, this);
      //each
      return this;
    },
    updateQueryObject: function() {
      //Webac.queryObject = {};
      $('select.multiselect').each(function() {
        filtername = 'filterable.' + $(this).attr('data-name');
        selected = {
          $all: $(this).val()
        };
        Webac.queryObject["Anwendungsgebiet"] =  Webac.currentAntwenungsgebiet;
        if ($(this).val() == null) return;
        Webac.queryObject[filtername] = selected;
        
      });
      console.log('Construct new Query:');
      console.log(JSON.stringify(Webac.queryObject));
      
      filteredProducts = Webac.initialProductsCollection.query(Webac.queryObject)
      console.log('THE RESULT IS: ');
      //console.log(JSON.stringify(filteredProducts));
      console.log(filteredProducts);
        
      //filteredProducts1 = Webac.checkExeptions(filteredProducts, Webac.queryObject); //CHECK FOR EXCEPTIONS
      Webac.productsCollection.reset(filteredProducts);
      Webac.checkExceptions(filteredProducts, Webac.queryObject);
      Webac.showSteps();
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

  Webac.productsCollection =            new Webac.Collections.Products(data);
  Webac.preInitialProductsCollection =  new Webac.Collections.Products(Webac.productsCollection.toJSON());  
  //remove Products with no Filters from List
  Webac.initialProductsCollection =     new Webac.Collections.Products( Webac.preInitialProductsCollection.query({ $not: { "filterable.1": [], "filterable.2": [], "filterable.3": []}}));


  // ################################################################
  // ######################## CREATE VIEWS ##########################
  // ################################################################

  //Webac.anwendungsgebietView = new  Webac.Views.Anwendungsgebiet({model:Webac.Models.Products});
  Webac.anwendungsgebieteView = new Webac.Views.Anwendungsgebiete({
    collection: Webac.productsCollection
  });
  $('#anwendungsgebiete').append(Webac.anwendungsgebieteView.el);


    
  
  Webac.anwendungsSelectionsView = new Webac.Views.Selections({
    collection: Webac.productsCollection
  });
  $('#anwendungsSelections').append(Webac.anwendungsSelectionsView.render().el);

    
  Webac.productsView = new Webac.Views.Products({
    collection: Webac.productsCollection
  });
    
  $('#productsView').append(Webac.productsView.render().el);

    
  Webac.activateMultiselect();
  $('.anwendungsgebiete .anwendungsgebiet').hide();
  $('.product').hide();
  $('.innerapp').show();
  TweenMax.to($('.innerapp'), 0, {opacity: 0});//reset all  
  
  TweenMax.to($('.loader'), 0.5, {scale: 2.5, delay: 2, ease:"easeInOutQuad"});//reset all  
  TweenMax.to($('.loader'), 1, {scale: 0,opacity: 0, delay: 2.5, ease:"easeInOutQuad"});//reset all  
  
  TweenMax.fromTo($('.innerapp'), 1, {opacity: 0}, {opacity: 1, delay: 3.5});//reset all


  $('.restart').click(function(e) {
    e.preventDefault();
    Webac.resetApp();
    Webac.showHint(0);
  });

})(); //IIFE Imediately Iinvoked Function Expression





