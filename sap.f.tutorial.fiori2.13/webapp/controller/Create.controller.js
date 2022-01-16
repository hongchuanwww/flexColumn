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
			['PROM_TYPE','PROD_SCOPE'].forEach(key => this._getOptions(key));
		},

		_getOptions: function(key) {
			var that = this;
			this.oOwnerComponent.getModel('invoice').read('/SHConfigSet?$filter=SubName%20eq%20%27'+key+'%27', {
				success: function (oData) {
					var oModel = new JSONModel();
					oModel.setData(oData.results);
					that.getView().setModel(oModel,key);
				}
			});
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
			groups.push({GrpCode, ToItem:[]});
			this.oCreateModel.setProperty('/ToGroup',groups);
		},

		addPrice: function () {
			var groups = this.oCreateModel.getProperty('/ToPrice');
			groups.push({});
			this.oCreateModel.setProperty('/ToPrice',groups);
		},
		
		_DatePipe: function(obj, prop) {
			if(obj[prop]) {
				obj[prop] = new Date(obj[prop]);
			}
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
			var sPath = 'BundleListSet';
			var data = this.oCreateModel.getData();
			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
			});
			data.ToGroup.forEach(group => {
				group.ToItem.forEach(item => {
					this._DatePipe(item,'ValidFrom');
					this._DatePipe(item,'ValidTo');
				});
			});
			var oDataModel = this.getView().getModel('invoice');
			oDataModel.create(sPath, data, mParameters);
		},
	});
});
