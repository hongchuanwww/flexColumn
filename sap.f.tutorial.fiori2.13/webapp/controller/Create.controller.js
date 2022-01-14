sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox"
], function (JSONModel, Controller, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Create", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oCreateModel =  this.oOwnerComponent.getModel('new');
			this._initCreateModel();
		},

		_initCreateModel: function() {
			this.oCreateModel.setData({
				ToGroup: [],
				ToPrice: []
			});
		},

		onGroupPress: function (oEvent) {
			var	oNextUIState, 
				group = oEvent.getSource().getBindingContextPath().split('/').pop();
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("createDetail", {
					layout: oNextUIState.layout,
					group
				});
			}.bind(this));
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

		addGroup: function () {
			var groups = this.oCreateModel.getProperty('/ToGroup');
			var GrpCode = 'GRP' + (groups.length + 1).toString().padStart(2,'0');
			groups.push({GrpCode});
			this.oCreateModel.setProperty('/ToGroup',groups);
		},

		addPrice: function () {
			var groups = this.oCreateModel.getProperty('/ToPrice');
			groups.push({});
			this.oCreateModel.setProperty('/ToPrice',groups);
		},
		
		onSave:  function () {
			var fnSuccess = function () {
				MessageToast.show('success');
				this._initCreateModel();
				this.handleClose();
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(oError.message);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this.oCreateModel.getData();
			data.ValidFrom = new Date(date.ValidFrom);
			data.ValidTo = new Date(data.ValidTo);

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			
			var oDataModel = this.getView().getModel('invoice');
			oDataModel.create(sPath, data, mParameters);
		},
	});
});
