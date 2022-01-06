sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/plugins/PasteProvider"
], function (JSONModel, Controller, PasteProvider) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Create", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();

			this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("create").attachPatternMatched(this._onProductMatched, this);
			var oNewModel = new JSONModel([]);
			this.getView().setModel(oNewModel, "new");
			// var pasteButton = this.getView().byId('editButton');
			// var oTable = this.getView().byId('table');
			// pasteButton.addDependent(new PasteProvider({
			// 	pasteFor: oTable.getId() // Reference to the control the paste is associated with, e.g. a sap.m.Table
			// }));
		},

		// onPaste: function(oEvent) {
		// 	if (!oEvent.getSource().getBindingContext().getProperty("READONLY")) {
		// 		var oItems = oEvent.getParameter("data");
		// 		oItems.forEach(function(item) {
		// 			var _oData = {};
		// 			_oData.PRODUCT_ID = item[0];
		// 			_oData.QUANTITY = item[1];
		// 			this.addItemCust(_oData);
		// 		}.bind(this));
		// 	}
		// },
		firePaste: function(oEvent) {
			// var oTable1 = this.getView().byId("__table1");
			navigator.clipboard.readText();
			// navigator.clipboard.readText().then(
			// 	function(text) {
			// 		var _arr = text.split('\r\n');
			// 		_arr.pop();
			// 		for (var i in _arr) {
			// 			_arr[i] = _arr[i].split('\t');
			// 		}
			// 		oTable1.firePaste({
			// 			"data": _arr
			// 		});
			// 	}.bind(this)
			// );
		},

		onSupplierPress: function (oEvent) {
		},

		_onProductMatched: function (oEvent) {
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("create", {layout: sNextLayout});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("create", {layout: sNextLayout});
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("master", {layout: sNextLayout});
		},

		onExit: function () {
			this.oRouter.getRoute("master").detachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("create").detachPatternMatched(this._onProductMatched, this);
		},

		handleAddPress: function () {
			var data = this.getView().getModel('new').getData();
			data.push({});
			this.getView().getModel('new').setData(data);
		},

		// onPaste: function (e) {
		// 	var data = e.getParameters().data;
		// 	this.getView().getModel('new').setData(data.map(row => {
		// 		var obj = {};
		// 		for(var i = 0; i < row.length; i++) {
		// 			obj['col' + i] = row[i];
		// 		}
		// 		return obj;
		// 	}));
		// },
		
		onSave:  function () {
			var fnSuccess = function () {
				MessageToast.show('success');
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(oError.message);
			}.bind(this);
			var sPath = 'BundleListSet';
			var items = [];// intializing an array

			// var aTableData = oTable.getModel().getData();// getting table data

			for (var i = 0; i < 10; i++) {

			items.push( {

				"ItemKey": "ItemKey",

				"ItempartGrp": "ItemKey"

				});

			};

			var oEntry = {

				"ItemKey": "ItemKey",

				"ItempartGrp": "ItemKey",
			  
				"Itempart": JSON.parse(JSON.stringify(items)),
			  
				//  converting data into json format
			  
			  // string type will converted into json object by parsing it.
			  
			  };

			  

			var mParameters = {
				properties:  oEntry,

				error: fnError,
				success: fnSuccess
			};
			
			var oDataModel = this.getView().getModel('invoice');
			oDataModel.create(sPath, oEntry, mParameters);
		},
	});
});
