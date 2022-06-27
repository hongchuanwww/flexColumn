sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
], function (JSONModel, Controller, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Create", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this._DatePipe = this.oOwnerComponent.DatePipe;
			this._deepCopy = this.oOwnerComponent.deepCopy;
			this.oCreateModel =  this.oOwnerComponent.getModel('new');
			this._initCreateModel();
			var settingModel = new JSONModel({
				minDate: new Date(),
			});
			this.getView().setModel(settingModel, 'setting');
		},

		_initCreateModel: function() {
			var oData = this.oCreateModel.getData();
			[
				'ToGroup',
				'ToPrice',
				'ToMessage'
			].forEach(prop => {
				oData[prop] = [];
			});
			oData.Qty = "1";
			[
				'SortCode',
				'BdDesc',
				'BdPromType',
				'ValidFrom',
				'ValidTo',
				'Delivery',
				'Eqip'
			].forEach(prop => {
				oData[prop] = null;
			});
			this.oCreateModel.setData(oData);
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
			this._initCreateModel();
			this.oRouter.navTo("master", {layout: sNextLayout});
		},

		addGroup: function () {
			var groups = this.oCreateModel.getProperty('/ToGroup');
			var GrpCode = 'GRP' + (groups.length + 1).toString().padStart(2,'0');
			groups.push({GrpCode, ToItem:[]});
			this.oCreateModel.setProperty('/ToGroup',groups);
		},
		deleteGroup : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				groups = this.oCreateModel.getProperty('/ToGroup');
			groups.splice(index,1);

			this.oCreateModel.setProperty('/ToGroup',groups);
		},
		addPrice: function () {
			var groups = this.oCreateModel.getProperty('/ToPrice');
			groups.push({});
			this.oCreateModel.setProperty('/ToPrice',groups);
		},
		deletePrice: function (e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				prices = this.oCreateModel.getProperty('/ToPrice');
			prices.splice(index,1);
			this.oCreateModel.setProperty('/ToPrice',prices);
		},
		_naviToDetail: function(HeadId) {
			if(HeadId) {
				this.getOwnerComponent().getHelper().then(function (oHelper) {
					// oNextUIState = oHelper.getNextUIState(1);
					this.oRouter.navTo("detail", {
						layout: 'TwoColumnsMidExpanded',
						bundle: `BundleHeadSet('${HeadId}')`
					});
				}.bind(this));
			}
		},
		onSave:  function (data) {
			var oDataModel = this.getView().getModel('invoice');
			var fnSuccess = function (e) {
				MessageToast.show('success');
				this.handleClose();
				oDataModel.refresh();
				this._initCreateModel();
				this._naviToDetail(e.HeadId);
			}.bind(this);

			var fnError = function (oError) {
				// MessageBox.error(oError.message);
				MessageBox.error(JSON.parse(oError.response.body).error.message.value);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this._deepCopy(this.oCreateModel.getData());

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');

			data.Qty = data.Qty.toString();
			[data.BuId, data.BuDesc] = data.BuId?.split(' ') || [];
			[data.BdPromType, data.BdPromTypeDesc] = data.BdPromType?.split(' ') || [];
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "C";
			});
			data.ToGroup.forEach(group => {
				group.Changeflag = "C";
				[group.GrpScope, group.GrpScopeDesc] = group.GrpScope?.split(' ') || [];
				group.GrpQty = group.GrpQty === undefined ? '' : group.GrpQty.toString();
				group.ToItem.forEach(item => {
					this._DatePipe(item,'ValidFrom');
					this._DatePipe(item,'ValidTo');
					item.Changeflag = "C";
					delete item.ProductDescZh;
				});
			});
			oDataModel.create(sPath, data, mParameters);
		},
	});
});
