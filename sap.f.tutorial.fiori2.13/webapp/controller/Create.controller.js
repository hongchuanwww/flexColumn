sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
], function (JSONModel, Controller, MessageToast, MessageBox, Fragment) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Create", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oCreateModel =  this.oOwnerComponent.getModel('new');
			this._initCreateModel();
			['PROM_TYPE','PROD_SCOPE'].forEach(key => this._getOptions(key));
			var settingModel = new JSONModel({
				minDate: new Date(),
			});
			this.getView().setModel(new JSONModel([]), 'check');
			this.getView().setModel(settingModel, 'setting');
			this.DIC = [
				'Rate',
				'RateUnit',
				'RateUnit',
				'Cap',
				'BpCodeInAgree',
				'Province',
				'AgreeId',
				'ValidFrom',
				'ValidTo',
			];
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
				Changeflag: "C",
				Qty: "1",
				ToGroup: [],
				ToPrice: [],
				ToMessage: []
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
		_DatePipe: function(obj, prop) {
			if(obj[prop]) {
				obj[prop] = new Date(obj[prop]);
			}
		},

		onSave:  function () {
			var oDataModel = this.getView().getModel('invoice');
			var fnSuccess = function () {
				MessageToast.show('success');
				this._initCreateModel();
				this.handleClose();
				oDataModel.refresh();
			}.bind(this);

			var fnError = function (oError) {
				// MessageBox.error(oError.message);
				MessageBox.error(oError.response.body);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this.oCreateModel.getData();

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');

			data.BdPromTypeDesc = data.BdPromType.split(' ')[1];
			data.BdPromType = data.BdPromType.split(' ')[0];

			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "C";
			});
			data.ToGroup.forEach(group => {
				group.Changeflag = "C";
				group.GrpScopeDesc = group.GrpScope.split(' ')[1];
				group.GrpScope = group.GrpScope.split(' ')[0];
				group.ToItem.forEach(item => {
					this._DatePipe(item,'ValidFrom');
					this._DatePipe(item,'ValidTo');
					item.Changeflag = "C";
				});
			});
			oDataModel.create(sPath, data, mParameters);
		},
		openDialog: function () {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("checkDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "zychcn.zbundle01.view.CheckDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("checkDialog").open();
			}
		}, 
		onCloseDialog: function () {
			var that = this;
			that.getView().getModel('check').setData([]);
			this.byId("checkDialog").close();
		},
		onConfirmDialog: function () {
			var prices = this.oCreateModel.getProperty('/ToPrice'),
				newPrices = this.getView().getModel('check').getData();
			this.oCreateModel.setProperty('/ToPrice', prices.concat(newPrices));
			this.onCloseDialog();
		},
		check: function () {
			var oDataModel = this.getView().getModel('invoice');
			var fnSuccess = function (data) {
				MessageToast.show('success');
				oDataModel.refresh();
				// this.getView().getModel('check').setData(data);
			}.bind(this);

			var fnError = function (oError) {
				// MessageBox.error(oError.message);
				MessageBox.error(oError.response.body);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this.oCreateModel.getData();
			var prices = this.getView().getModel('check').getData();
			data.ToPrice = prices;

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			data.Changeflag = "M";
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "M";
			});
			data.ToGroup.forEach(group => {
				group.Changeflag = "M";
				group.ToItem.forEach(item => {
					this._DatePipe(item,'ValidFrom');
					this._DatePipe(item,'ValidTo');
					item.Changeflag = "M";
				});
			});
			oDataModel.create(sPath, data, mParameters);
		},
		firePaste: function(oEvent) {
			var oTable = this.getView().byId("checkTable");
			navigator.clipboard.readText().then(
				function(text) {
					var _arr = text.split('\r\n');
					for (var i in _arr) {
						_arr[i] = _arr[i].split('\t');
					}
					oTable.firePaste({
						"data": _arr
					});
				}.bind(this)
			);
		},

        onPaste: function (e) {
			var pasteData = e.getParameters().data;
            var data = pasteData.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj[this.DIC[i]] = row[i];
				}
				return obj;
			});
			this.getView().getModel('check').setData(data);
		},
	});
});
