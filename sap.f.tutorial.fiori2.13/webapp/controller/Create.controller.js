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
			var pasteButton = this.getView().byId('editButton');
			var oTable = this.getView().byId('table');
			pasteButton.addDependent(new PasteProvider({
				pasteFor: oTable.getId() // Reference to the control the paste is associated with, e.g. a sap.m.Table
			}));
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

		onPaste: function (e) {
			var data = e.getParameters().data;
			this.getView().getModel('new').setData(data.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj['col' + i] = row[i];
				}
				return obj;
			}));
		}
		
		// onSave:  function () {
		// 	var fnSuccess = function () {
		// 		this._setBusy(false);
		// 		MessageToast.show(this._getText("changesSentMessage"));
		// 		this._setUIChanges(false);
		// 	}.bind(this);

		// 	var fnError = function (oError) {
		// 		this._setBusy(false);
		// 		this._setUIChanges(false);
		// 		MessageBox.error(oError.message);
		// 	}.bind(this);
		// 	// this.getView().getModel().submitBatch("peopleGroup").then(fnSuccess, fnError);
		// 	var sPath = '/BundleListSet';
		// 	var mParameters = {
		// 		context:  {},
		// 		created: function(a,b,c,d) {
		// 			console.log(a,b,c,d);
		// 		},
		// 		error: fnError,
		// 		success: fnSuccess
		// 	};
		// 	this.getView().getModel('invoice').createEntry(sPath,mParameters);
		// },
	});
});
